//Koo Zhuo Hui, A0253417H
import { test, expect } from "@playwright/test";

test("Search -> Add To Cart -> Checkout", async ({ page }) => {
	await page.goto("http://localhost:3000/");
	await expect(page.getByRole("link", { name: "Login" })).toBeVisible();

	await page.getByRole("link", { name: "Login" }).click();

	await expect(page.getByRole("textbox", { name: "Enter Your Email" })).toBeVisible();
	await expect(page.getByRole("textbox", { name: "Enter Your Password" })).toBeVisible();
	await expect(page.getByRole("button", { name: "LOGIN" })).toBeVisible();

	await page.getByRole("textbox", { name: "Enter Your Email" }).click();
	await page.getByRole("textbox", { name: "Enter Your Email" }).fill("zhuohui.koo@gmail.com");
	await page.getByRole("textbox", { name: "Enter Your Email" }).press("Tab");
	await page.getByRole("textbox", { name: "Enter Your Password" }).fill("123456");
	await page.getByRole("button", { name: "LOGIN" }).click();
	await page.waitForURL("**/");

	await expect(page.getByRole("searchbox", { name: "Search" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Search" })).toBeVisible();
	const searchInput = page.getByPlaceholder("Search");

	await expect(searchInput).toHaveAttribute("placeholder", "Search");
	await expect(searchInput).toHaveAttribute("aria-label", "Search");
	await expect(searchInput).toHaveClass("form-control me-2");

	const searchButton = page.getByRole("button", { name: "Search" });
	const searchButtonBorder = await searchButton.evaluate((el) => getComputedStyle(el).border);
	const searchButtonTextColor = await searchButton.evaluate((el) => getComputedStyle(el).color);
	await expect(searchButton).toHaveClass("btn btn-outline-success");
	expect(searchButtonBorder).toBe("1px solid rgb(25, 135, 84)");
	expect(searchButtonTextColor).toBe("rgb(25, 135, 84)");

	await searchButton.hover();
	await expect(async () => {
		const hoverBgColor = await searchButton.evaluate((el) => getComputedStyle(el).backgroundColor);
		expect(hoverBgColor).toBe("rgb(25, 135, 84)");
	}).toPass({ timeout: 3000 });

	await page.getByRole("searchbox", { name: "Search" }).click();
	await page.getByRole("searchbox", { name: "Search" }).click();
	await page.getByRole("searchbox", { name: "Search" }).fill("phone");

	await page.getByRole("button", { name: "Search" }).click();

	await expect(page).toHaveURL("http://localhost:3000/search");
	await expect(page.locator("h6")).toContainText("Found 1");
	await expect(page.locator("h1")).toContainText("Search Resuts");
	await expect(page.getByRole("img", { name: "Smartphone" })).toBeVisible();
	await expect(page.locator("h5")).toContainText("Smartphone");
	await expect(page.getByRole("main")).toContainText("A high-end smartphone...");
	await expect(page.getByRole("main")).toContainText("$ 999.99");
	await expect(page.getByRole("button", { name: "More Details" })).toBeVisible();
	await expect(page.getByRole("button", { name: "ADD TO CART" })).toBeVisible();

	const smartphoneCard = page.locator(".card").filter({ hasText: "Smartphone" });
	await expect(smartphoneCard).toHaveClass("card m-2");

	const cardWidth = await smartphoneCard.evaluate((el) => el.style.width);
	expect(cardWidth).toBe("18rem");

	const productImg = smartphoneCard.locator("img");
	await expect(productImg).toHaveClass("card-img-top");
	await expect(productImg).toHaveAttribute("src", /\/api\/v1\/product\/product-photo\/.+/);
	await expect(productImg).toHaveAttribute("alt", "Smartphone");

	await expect(smartphoneCard.getByRole("button", { name: "More Details" })).toHaveClass("btn btn-primary ms-1");
	await expect(smartphoneCard.getByRole("button", { name: "ADD TO CART" })).toHaveClass("btn btn-secondary ms-1");

	const descText = await smartphoneCard.locator(".card-text").first().innerText();
	expect(descText.length).toBeLessThanOrEqual(33);
	expect(descText.endsWith("...")).toBe(true);

	await page.getByRole("button", { name: "ADD TO CART" }).click();
	await expect(page.getByText("Item Added to cart")).toBeVisible();
	await expect(page.getByText("Item Added to cart")).not.toBeVisible({ timeout: 10000 });

	await expect(page.getByRole("superscript")).toContainText("1");

	await page.getByRole("link", { name: "Cart" }).click();

	await expect(page).toHaveURL("http://localhost:3000/cart");
	await expect(page.getByText("SmartphoneA high-end smartphonePrice : 999.99Remove")).toBeVisible();
	await expect(page.getByRole("heading", { name: "Total : $" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Paying with Card" })).toBeVisible();

	await page.getByRole("button", { name: "Paying with Card" }).click();
	await page
		.locator('iframe[name="braintree-hosted-field-number"]')
		.contentFrame()
		.getByRole("textbox", { name: "Credit Card Number" })
		.click();
	await page
		.locator('iframe[name="braintree-hosted-field-number"]')
		.contentFrame()
		.getByRole("textbox", { name: "Credit Card Number" })
		.fill("4111111111111111");
	await page
		.locator('iframe[name="braintree-hosted-field-number"]')
		.contentFrame()
		.getByRole("textbox", { name: "Credit Card Number" })
		.press("Tab");
	await page
		.locator('iframe[name="braintree-hosted-field-expirationDate"]')
		.contentFrame()
		.getByRole("textbox", { name: "Expiration Date" })
		.fill("1226");
	await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame().getByRole("textbox", { name: "CVV" }).click();
	await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame().getByRole("textbox", { name: "CVV" }).fill("123");
	await page.getByRole("button", { name: "Make Payment" }).click();

	await expect(page).toHaveURL("http://localhost:3000/dashboard/user/orders");
	await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "All Orders" })).toBeVisible({ timeout: 15000 });

	await expect(page.locator("div").filter({ hasText: "#StatusBuyer" }).nth(5)).toBeVisible();
	await page
		.locator("div")
		.filter({ hasText: /^SmartphoneA high-end smartphonePrice : 999\.99$/ })
		.nth(1)
		.click();

	await expect(page.getByRole("columnheader", { name: "Payment" }).first()).toBeVisible();
	await expect(page.getByRole("cell", { name: "Success" }).first()).toBeVisible();
});
