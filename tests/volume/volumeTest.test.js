// Koo Zhuo Hui, A0253417H

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

//  METRICS
const listDuration = new Trend("vol_list_duration", true);
const searchDuration = new Trend("vol_search_duration", true);
const categoryDuration = new Trend("vol_category_duration", true);
const paginationDuration = new Trend("vol_pagination_duration", true);
const filterDuration = new Trend("vol_filter_duration", true);
const relatedDuration = new Trend("vol_related_duration", true);
const errorRate = new Rate("vol_error_rate");
const dataIntegrityErrors = new Counter("data_integrity_errors");

const BASE_URL = "http://localhost:6060";
const SEED_COUNT = parseInt(__ENV.SEED_COUNT) || 1000; // override with: k6 run --env SEED_COUNT=500

export const options = {
	setupTimeout: "15m",
	teardownTimeout: "10m",
	scenarios: {
		listing: { executor: "constant-vus", vus: 3, duration: "1m", startTime: "0m", exec: "listingScenario" },
		pagination: { executor: "constant-vus", vus: 3, duration: "1m", startTime: "1m", exec: "paginationScenario" },
		search: { executor: "constant-vus", vus: 3, duration: "1m", startTime: "2m", exec: "searchScenario" },
		filter: { executor: "constant-vus", vus: 3, duration: "1m", startTime: "3m", exec: "filterScenario" },
		category: { executor: "constant-vus", vus: 3, duration: "1m", startTime: "4m", exec: "categoryScenario" },
		cart: { executor: "constant-vus", vus: 3, duration: "1m", startTime: "5m", exec: "cartScenario" },
		related: { executor: "constant-vus", vus: 3, duration: "1m", startTime: "6m", exec: "relatedScenario" },
	},
	thresholds: {
		vol_list_duration: ["p(90)<3000"],
		vol_search_duration: ["p(90)<3000"],
		vol_category_duration: ["p(90)<3000"],
		vol_pagination_duration: ["p(90)<3000"],
		vol_filter_duration: ["p(90)<3000"],
		vol_related_duration: ["p(90)<3000"],
		vol_error_rate: ["rate<0.02"],
		data_integrity_errors: ["count<1"],
	},
};

function jsonHeaders(token = null) {
	const headers = { "Content-Type": "application/json" };
	if (token) headers["Authorization"] = token;
	return { headers };
}

export function setup() {
	const adminRes = http.post(`${BASE_URL}/api/v1/test/setup-admin`, JSON.stringify({}), jsonHeaders());
	const adminToken = JSON.parse(adminRes.body).token;
	if (!adminToken) throw new Error("Could not obtain admin token — is the server running?");

	const catRes = http.get(`${BASE_URL}/api/v1/category/get-category`);
	const categories = JSON.parse(catRes.body).category;
	if (!categories || categories.length === 0) {
		throw new Error("No categories found — seed categories before running volume test");
	}

	//Take first category
	const testCategory = categories[0];

	const seededIds = [];
	const seedStart = Date.now();

	for (let i = 1; i <= SEED_COUNT; i++) {
		const res = http.post(
			`${BASE_URL}/api/v1/product/create-product`,
			{
				name: `VolumeTest Product ${i}`,
				description: `Volume test product number ${i} used for volume testing purposes only`,
				price: `${((i % 100) + 1).toFixed(2)}`, // prices 1.00 – 100.00
				category: testCategory._id,
				quantity: `${(i % 50) + 1}`,
			},
			{ headers: { Authorization: adminToken } },
		);
		const body = JSON.parse(res.body);
		if (body.products?._id) {
			seededIds.push(body.products._id);
		}

		// Progress log every 100 products
		if (i % 100 === 0) {
			const elapsed = ((Date.now() - seedStart) / 1000).toFixed(1);
			console.log(`Seeding progress: ${i}/${SEED_COUNT} products (${elapsed}s elapsed)`);
		}
	}

	const seedTotal = ((Date.now() - seedStart) / 1000).toFixed(2);
	console.log(
		`Volume setup complete: seeded ${seededIds.length}/${SEED_COUNT} products in ${seedTotal}s (avg ${((seedTotal / seededIds.length) * 1000).toFixed(1)}ms per product)`,
	);
	return { adminToken, seededIds, testCategory };
}

export function listingScenario(_data) {
	const t0 = Date.now();
	const count = http.get(`${BASE_URL}/api/v1/product/product-count`);
	listDuration.add(Date.now() - t0);

	const countBody = JSON.parse(count.body);
	check(count, {
		"product-count 200": (r) => r.status === 200,
		"total reflects seeded volume": () => countBody.total >= SEED_COUNT,
	}) || errorRate.add(1);

	sleep(1);
}

export function paginationScenario(_data) {
	const t0 = Date.now();
	const page1 = http.get(`${BASE_URL}/api/v1/product/product-list/1`);
	paginationDuration.add(Date.now() - t0);

	const page1Body = JSON.parse(page1.body);
	check(page1, {
		"page 1 returns 200": (r) => r.status === 200,
		"page 1 returns exactly 6 products": () => page1Body.products?.length === 6,
	}) || errorRate.add(1);

	const t1 = Date.now();
	const page2 = http.get(`${BASE_URL}/api/v1/product/product-list/2`);
	paginationDuration.add(Date.now() - t1);

	const page2Body = JSON.parse(page2.body);
	check(page2, {
		"page 2 returns 200": (r) => r.status === 200,
		"page 2 returns exactly 6 products": () => page2Body.products?.length === 6,
	}) || errorRate.add(1);

	// Data integrity: no product should appear on both pages
	const page1Ids = new Set(page1Body.products?.map((p) => p._id) || []);
	const overlap = page2Body.products?.filter((p) => page1Ids.has(p._id)).length || 0;
	if (overlap > 0) {
		dataIntegrityErrors.add(overlap);
		console.error(`Data integrity violation: ${overlap} duplicate products across page 1 and page 2`);
	}

	sleep(1);
}

export function searchScenario(_data) {
	const t0 = Date.now();
	const search = http.get(`${BASE_URL}/api/v1/product/search/VolumeTest`);
	searchDuration.add(Date.now() - t0);

	const body = JSON.parse(search.body);
	check(search, {
		"search 200": (r) => r.status === 200,
		"search returns large result set": () => Array.isArray(body) && body.length > 0,
		"result count matches seeded volume": () => body.length >= SEED_COUNT,
		"no data truncation — all results have name field": () => Array.isArray(body) && body.every((p) => p.name !== undefined),
	}) || errorRate.add(1);

	sleep(1);
}

export function filterScenario(_data) {
	// Broad price filter
	const t0 = Date.now();
	const broadFilter = http.post(
		`${BASE_URL}/api/v1/product/product-filters`,
		JSON.stringify({ checked: [], radio: [[0, 100]] }),
		jsonHeaders(),
	);
	filterDuration.add(Date.now() - t0);

	const broadBody = JSON.parse(broadFilter.body);
	check(broadFilter, {
		"broad filter 200": (r) => r.status === 200,
		"broad filter returns products": () => broadBody.products?.length > 0,
		"broad filter covers seeded volume": () => broadBody.products?.length >= SEED_COUNT,
	}) || errorRate.add(1);

	// Narrow price filter
	const t1 = Date.now();
	const narrowFilter = http.post(
		`${BASE_URL}/api/v1/product/product-filters`,
		JSON.stringify({ checked: [], radio: [[1, 1]] }),
		jsonHeaders(),
	);
	filterDuration.add(Date.now() - t1);

	const narrowBody = JSON.parse(narrowFilter.body);
	check(narrowFilter, {
		"narrow filter 200": (r) => r.status === 200,
		"narrow filter returns subset": () => narrowBody.products?.length > 0 && narrowBody.products?.length < SEED_COUNT,
	}) || errorRate.add(1);

	sleep(1);
}

export function categoryScenario(data) {
	const { testCategory } = data;

	const t0 = Date.now();
	const catProducts = http.get(`${BASE_URL}/api/v1/product/product-category/${testCategory.slug}`);
	categoryDuration.add(Date.now() - t0);

	const body = JSON.parse(catProducts.body);
	check(catProducts, {
		"category products 200": (r) => r.status === 200,
		"returns products array": () => Array.isArray(body.products),
		"category contains seeded products": () => body.products?.length >= SEED_COUNT,
	}) || errorRate.add(1);

	sleep(1);
}

export function cartScenario(_data) {
	const ITEM_COUNT = 1000;
	const ITEM_PRICE = 9.99;
	const largeCart = Array.from({ length: ITEM_COUNT }, (_, i) => ({
		_id: `vol-item-${i}`,
		name: `Volume Item ${i}`,
		price: ITEM_PRICE,
	}));

	// Expected total: 1000 × 9.99 = 9990.00
	const res = http.post(
		`${BASE_URL}/api/v1/product/braintree/payment`,
		JSON.stringify({ nonce: "fake-nonce-volume", cart: largeCart }),
		jsonHeaders(),
	);

	check(res, {
		"large cart not rejected by server (reaches gateway)": (r) => r.status !== 400,
		"server handles large payload without crash": (r) => r.status !== 500 || JSON.parse(r.body).error !== undefined,
	}) || errorRate.add(1);

	sleep(1);
}

export function relatedScenario(data) {
	const { testCategory, seededIds } = data;
	const randomId = seededIds[Math.floor(Math.random() * seededIds.length)];

	const t0 = Date.now();
	const related = http.get(
		`${BASE_URL}/api/v1/product/related-product/${randomId}/${testCategory._id}`,
		{ tags: { name: "related-product" } }, // group all URLs under one metric series
	);
	relatedDuration.add(Date.now() - t0);

	const body = JSON.parse(related.body);
	check(related, {
		"related products 200": (r) => r.status === 200,
		"returns at most 3 products": () => Array.isArray(body.products) && body.products.length <= 3,
		"excludes the queried product": () => Array.isArray(body.products) && body.products.every((p) => p._id !== randomId),
	}) || errorRate.add(1);

	sleep(1);
}

export function teardown(data) {
	const { seededIds } = data;

	let deleted = 0;
	const deleteStart = Date.now();

	for (let i = 0; i < seededIds.length; i++) {
		const res = http.del(`${BASE_URL}/api/v1/product/delete-product/${seededIds[i]}`);
		if (res.status === 200) deleted++;

		// Progress log every 100 deletions
		if ((i + 1) % 100 === 0) {
			const elapsed = ((Date.now() - deleteStart) / 1000).toFixed(1);
			console.log(`Teardown progress: ${i + 1}/${seededIds.length} products deleted (${elapsed}s elapsed)`);
		}
	}

	const deleteTotal = ((Date.now() - deleteStart) / 1000).toFixed(2);
	console.log(
		`Volume teardown complete: deleted ${deleted}/${seededIds.length} products in ${deleteTotal}s (avg ${((deleteTotal / deleted) * 1000).toFixed(1)}ms per product)`,
	);
}
