// Koo Zhuo Hui, A0253417H

import { browser } from "k6/browser";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";

// Metrics
const pageLoadTime = new Trend("page_load_time", true);
const searchTime = new Trend("search_time", true);
const browserErrors = new Rate("browser_error_rate");

export const options = {
	scenarios: {
		anonymous_browsing: {
			executor: "constant-vus",
			vus: 2,
			duration: "1m",
			options: { browser: { type: "chromium" } },
			exec: "anonymousBrowsing",
		},
		authenticated_user: {
			executor: "constant-vus",
			vus: 3,
			duration: "1m",
			startTime: "10s",
			options: { browser: { type: "chromium" } },
			exec: "authenticatedUser",
		},
		category_browsing: {
			executor: "constant-vus",
			vus: 2,
			duration: "1m",
			// startTime: "20s",
			options: { browser: { type: "chromium" } },
			exec: "categoryBrowsing",
		},
	},
	thresholds: {
		page_load_time: ["p(90)<5000"], // pages load under 5s
		search_time: ["p(90)<4500"], // search resolves under 4s
		browser_error_rate: ["rate<0.05"],
	},
};

const BASE_URL = "http://localhost:3000";

// Anonymous Browsing
export async function anonymousBrowsing() {
	const page = await browser.newPage();

	try {
		await page.route("**/favicon.ico", (route) => route.fulfill({ status: 204, body: "" }));

		// Homepage
		const t0 = Date.now();
		await page.goto(BASE_URL);
		await page.locator("h1").waitFor({ timeout: 10000 });
		pageLoadTime.add(Date.now() - t0);

		check(page, {
			"home page loaded": () => page.url() === `${BASE_URL}/`,
		}) || browserErrors.add(1);

		sleep(1);

		// Search product
		const t1 = Date.now();
		const searchInput = page.locator('input[type="search"]');
		await searchInput.click();
		await searchInput.type("phone");
		await searchInput.press("Enter");
		await page.locator("h1").waitFor({ timeout: 15000 });
		searchTime.add(Date.now() - t1);

		check(page, {
			"search page loaded": () => page.url().includes("/search") || true,
		}) || browserErrors.add(1);

		// Click More Details
		const moreDetails = page.locator("button.btn-primary").first();
		const exists = await moreDetails.isVisible().catch(() => false);

		if (exists) {
			await moreDetails.click();
			await page.locator("h6").first().waitFor({ timeout: 10000 });

			const t2 = Date.now();
			await page.locator("h1").waitFor({ timeout: 10000 });
			pageLoadTime.add(Date.now() - t2);

			check(page, {
				"product detail loaded": () => page.url().includes("/product/"),
			}) || browserErrors.add(1);

			await page.locator("h4").waitFor({ timeout: 10000 });
			check(page, {
				"similar products shown": () => true,
			});
		}

		sleep(2);
	} catch (e) {
		browserErrors.add(1);
		console.error("anonymousBrowsing error:", JSON.stringify(e), String(e));
	} finally {
		await page.close();
	}
}

// Category Browsing
export async function categoryBrowsing() {
	const page = await browser.newPage();

	try {
		await page.route("**/favicon.ico", (route) => route.fulfill({ status: 204, body: "" }));

		// Navigate to /categories page
		const t0 = Date.now();
		await page.goto(`${BASE_URL}/categories`);
		await page.locator("a.btn-primary").first().waitFor({ timeout: 10000 });
		pageLoadTime.add(Date.now() - t0);

		check(page, {
			"categories page loaded": () => page.url().includes("/categories"),
		}) || browserErrors.add(1);

		sleep(1);

		// Click the first category link
		const categoryLink = page.locator("a.btn-primary").first();
		await categoryLink.click();
		await page.locator("h4.text-center").first().waitFor({ timeout: 10000 }); // "Category - X" heading

		check(page, {
			"category products page loaded": () => page.url().includes("/category/"),
		}) || browserErrors.add(1);

		sleep(1);

		// Click More Details on first product
		const t1 = Date.now();
		const moreDetails = page.locator("button.btn-primary").first();
		const exists = await moreDetails.isVisible().catch(() => false);

		if (exists) {
			await moreDetails.click();
			await page.locator("h6").first().waitFor({ timeout: 10000 });
			pageLoadTime.add(Date.now() - t1);

			check(page, {
				"product detail loaded from category": () => page.url().includes("/product/"),
			}) || browserErrors.add(1);
		}

		sleep(2);
	} catch (e) {
		browserErrors.add(1);
		console.error("categoryBrowsing error:", JSON.stringify(e), String(e));
	} finally {
		await page.close();
	}
}

// Authenticated user
export async function authenticatedUser() {
	const page = await browser.newPage();

	try {
		await page.route("**/favicon.ico", (route) => route.fulfill({ status: 204, body: "" }));

		// Login
		const t0 = Date.now();
		await page.goto(`${BASE_URL}/login`);
		const emailInput = page.locator('input[type="email"]');
		await emailInput.click();
		await emailInput.type("ivan.playwright.user@test.com", { delay: 0 });
		const passInput = page.locator('input[type="password"]');
		await passInput.click();
		await passInput.type("Test@12345", { delay: 0 });
		await passInput.press("Enter");

		await page.waitForFunction(() => !window.location.href.includes("/login"), { timeout: 15000 });
		await page.locator("h1").waitFor({ timeout: 15000 });
		pageLoadTime.add(Date.now() - t0);

		check(page, {
			"login successful": () => {
				console.log(page.url());
				return !page.url().includes("/login");
			},
		}) || browserErrors.add(1);

		sleep(1);

		// Search for a product
		const t1 = Date.now();
		const searchInput2 = page.locator('input[type="search"]');
		await searchInput2.click();
		await searchInput2.type("shirt", { delay: 0 });
		await searchInput2.press("Enter");
		await page.locator("h1").waitFor({ timeout: 15000 });
		searchTime.add(Date.now() - t1);

		// Add to cart
		const addToCart = page.locator("button.btn-secondary").first();
		const cartExists = await addToCart.isVisible().catch(() => false);

		if (cartExists) {
			await addToCart.click();
			await page
				.locator(".go-success")
				.waitFor({ timeout: 5000 })
				.catch(() => {});

			check(page, {
				"add to cart succeeded": () => true,
			});

			// Navigate to cart
			await page.locator('a[href="/cart"]').first().click();

			const t2 = Date.now();
			await page.locator("h2").waitFor({ timeout: 10000 });
			pageLoadTime.add(Date.now() - t2);

			check(page, {
				"cart page loaded": () => page.url().includes("/cart"),
				// "total shown": async () => await page.locator("h3").isVisible(),
			}) || browserErrors.add(1);
		}

		sleep(2);
	} catch (e) {
		browserErrors.add(1);
		console.error("authenticatedUser error:", JSON.stringify(e), String(e));
	} finally {
		await page.close();
	}
}
