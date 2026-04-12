//Koo Zhuo Hui, A0253417H

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";
import { normalDistributionStages } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

//Metrics
const loginDuration = new Trend("login_duration", true);
const searchDuration = new Trend("search_duration", true);
const productDuration = new Trend("product_duration", true);
const categoryDuration = new Trend("category_duration", true);
const paginationDuration = new Trend("pagination_duration", true);
const errorRate = new Rate("error_rate");

export const options = {
	stages: [
		{ duration: "30s", target: 10 }, // ramp up
		{ duration: "30s", target: 100 }, // normal load
		{ duration: "1m", target: 100 }, // hold
		{ duration: "30s", target: 0 }, // ramp down
	],
	// stages: normalDistributionStages(100, 120, 3),
	thresholds: {
		http_req_duration: ["p(90)<1000"],
		http_req_failed: ["rate<0.05"],
		login_duration: ["p(90)<1000"],
		search_duration: ["p(90)<1000"],
		category_duration: ["p(90)<1200"],
		pagination_duration: ["p(90)<1000"],
		error_rate: ["rate<0.02"],
	},
};

const BASE_URL = "http://localhost:6060";

let authToken = null;

function jsonHeaders(token = null) {
	const headers = { "Content-Type": "application/json" };
	if (token) headers["Authorization"] = token;
	return { headers };
}

//User Journeyts
export default function () {
	group("Home page", () => {
		const categories = http.get(`${BASE_URL}/api/v1/category/get-category`);
		check(categories, {
			"categories 200": (r) => r.status === 200,
			"categories has data": (r) => JSON.parse(r.body).success === true,
		}) || errorRate.add(1);

		const count = http.get(`${BASE_URL}/api/v1/product/product-count`);
		check(count, {
			"product count 200": (r) => r.status === 200,
		}) || errorRate.add(1);

		const products = http.get(`${BASE_URL}/api/v1/product/product-list/1`);
		check(products, {
			"product list 200": (r) => r.status === 200,
			"returns products": (r) => JSON.parse(r.body).products !== undefined,
		}) || errorRate.add(1);

		sleep(1);
	});

	group("Search and product details and related products", () => {
		const keywords = ["phone", "laptop", "book"];
		const keyword = keywords[Math.floor(Math.random() * keywords.length)];

		const start = Date.now();
		const search = http.get(`${BASE_URL}/api/v1/product/search/${keyword}`);
		searchDuration.add(Date.now() - start);

		check(search, {
			"search 200": (r) => r.status === 200,
		}) || errorRate.add(1);

		const results = JSON.parse(search.body);
		if (Array.isArray(results) && results.length > 0) {
			const product = results[0];

			const pStart = Date.now();
			const detail = http.get(`${BASE_URL}/api/v1/product/get-product/${product.slug}`);
			productDuration.add(Date.now() - pStart);

			check(detail, {
				"product detail 200": (r) => r.status === 200,
				"product has name": (r) => JSON.parse(r.body).product?.name !== undefined,
			}) || errorRate.add(1);

			const fullProduct = JSON.parse(detail.body).product;
			if (fullProduct && fullProduct._id && fullProduct.category?._id) {
				const related = http.get(`${BASE_URL}/api/v1/product/related-product/${fullProduct._id}/${fullProduct.category._id}`);
				check(related, {
					"related products 200": (r) => r.status === 200,
				}) || errorRate.add(1);
			}
		}

		sleep(1);
	});

	group("Category browsing", () => {
		const t0 = Date.now();
		const categories = http.get(`${BASE_URL}/api/v1/category/get-category`);
		categoryDuration.add(Date.now() - t0);

		check(categories, {
			"get-category 200": (r) => r.status === 200,
			"categories returned": (r) => JSON.parse(r.body).success === true,
		}) || errorRate.add(1);

		const body = JSON.parse(categories.body);
		if (body.category && body.category.length > 0) {
			const randomCat = body.category[Math.floor(Math.random() * body.category.length)];

			const t1 = Date.now();
			const single = http.get(`${BASE_URL}/api/v1/category/single-category/${randomCat.slug}`);
			categoryDuration.add(Date.now() - t1);

			check(single, {
				"single-category 200": (r) => r.status === 200,
				"category name present": (r) => JSON.parse(r.body).category?.name !== undefined,
			}) || errorRate.add(1);

			const t2 = Date.now();
			const catProducts = http.get(`${BASE_URL}/api/v1/product/product-category/${randomCat.slug}`);
			categoryDuration.add(Date.now() - t2);

			check(catProducts, {
				"product-category 200": (r) => r.status === 200,
				"products array present": (r) => Array.isArray(JSON.parse(r.body).products),
			}) || errorRate.add(1);
		}

		sleep(1);
	});

	group("Product pagination", () => {
		const t0 = Date.now();
		const count = http.get(`${BASE_URL}/api/v1/product/product-count`);
		paginationDuration.add(Date.now() - t0);

		check(count, {
			"product-count 200": (r) => r.status === 200,
			"total is a number": (r) => typeof JSON.parse(r.body).total === "number",
		}) || errorRate.add(1);

		const total = JSON.parse(count.body).total || 0;
		const perPage = 6;
		const totalPages = Math.max(1, Math.ceil(total / perPage));

		const pagesToFetch = Math.min(totalPages, 3);
		for (let page = 1; page <= pagesToFetch; page++) {
			const t1 = Date.now();
			const list = http.get(`${BASE_URL}/api/v1/product/product-list/${page}`);
			paginationDuration.add(Date.now() - t1);

			check(list, {
				[`page ${page} 200`]: (r) => r.status === 200,
				[`page ${page} has products`]: (r) => Array.isArray(JSON.parse(r.body).products),
			}) || errorRate.add(1);

			sleep(0.5);
		}

		sleep(1);
	});

	group("User login", () => {
		const start = Date.now();
		const response = http.post(
			`${BASE_URL}/api/v1/auth/login`,
			JSON.stringify({
				email: "ivan.playwright.user@test.com",
				password: "Test@12345",
			}),
			jsonHeaders(),
		);
		loginDuration.add(Date.now() - start);

		const ok = check(response, {
			"login 200": (r) => r.status === 200,
			"login returns token": (r) => JSON.parse(r.body).token !== undefined,
		});

		if (ok) {
			authToken = JSON.parse(response.body).token;
		} else {
			errorRate.add(1);
		}

		sleep(1);
	});

	group("Authenticated user", () => {
		if (!authToken) return;

		const orders = http.get(`${BASE_URL}/api/v1/auth/orders`, jsonHeaders(authToken));
		check(orders, {
			"orders 200": (r) => r.status === 200,
		}) || errorRate.add(1);

		const token = http.get(`${BASE_URL}/api/v1/product/braintree/token`, jsonHeaders(authToken));
		check(token, {
			"braintree token 200": (r) => r.status === 200,
			"has clientToken": (r) => JSON.parse(r.body).clientToken !== undefined,
		}) || errorRate.add(1);

		sleep(1);
	});
}
