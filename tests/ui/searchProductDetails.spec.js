//Koo Zhuo Hui, A0253417H
import { test, expect } from "@playwright/test";
import { getSeededRegularUserAuth, SEEDED_USER_PASSWORD } from "./helpers/ms2UserUiHelpers.js";

test("Search then Navigate to Product Details", async ({ page }) => {
	const { user } = getSeededRegularUserAuth();
	await page.goto("http://localhost:3000/");
	await page.getByRole("link", { name: "Login" }).click();
	await page.getByRole("textbox", { name: "Enter Your Email" }).click();
	await page.getByRole("textbox", { name: "Enter Your Email" }).fill(user.email);
	await page.getByRole("textbox", { name: "Enter Your Email" }).press("Tab");
	await page.getByRole("textbox", { name: "Enter Your Password" }).fill(SEEDED_USER_PASSWORD);
	await page.getByRole("button", { name: "LOGIN" }).click();
	await page.waitForURL("**/", { timeout: 15000 });
	await page.getByRole("searchbox", { name: "Search" }).click();
	await page.getByRole("searchbox", { name: "Search" }).fill("phone");
	await page.getByRole("button", { name: "Search" }).click();
	await page.waitForURL("**/search**");

	const smartphoneCard = page.locator(".card").filter({ hasText: "Smartphone" });
	await expect(smartphoneCard.getByRole("button", { name: "More Details" })).toBeVisible();
	const moreDetailsBtn = smartphoneCard.getByRole("button", { name: "More Details" });
	const bgColor = await moreDetailsBtn.evaluate((el) => getComputedStyle(el).backgroundColor);
	expect(bgColor).toBe("rgb(13, 110, 253)");

	await smartphoneCard.getByRole("button", { name: "More Details" }).click();
	await expect(page).toHaveURL("http://localhost:3000/product/smartphone");

	await expect(page.getByRole("img", { name: "Smartphone" })).toBeVisible();
	await expect(page.locator("h1")).toContainText("Product Details");
	await expect(page.getByRole("main")).toContainText("Name : Smartphone");
	await expect(page.getByRole("main")).toContainText("Description : A high-end smartphone");
	await expect(page.getByRole("main")).toContainText("Price :$999.99");
	await expect(page.getByRole("main")).toContainText("Category : Electronics");
	await expect(page.getByRole("main")).toContainText("Similar Products ➡️");
	await expect(page.getByRole("img", { name: "Laptop" })).toBeVisible();
	await expect(page.getByRole("main")).toContainText("Laptop$1,499.99");
	await expect(page.getByRole("main")).toContainText("A powerful laptop...");

	const laptopCard = page.locator(".similar-products .card").filter({ hasText: "Laptop" });
	await expect(laptopCard.getByRole("button", { name: "More Details" })).toBeVisible();
	const pdMoreDetailsBtn = laptopCard.getByRole("button", { name: "More Details" });
	const pdMoreDetailsBgColor = await pdMoreDetailsBtn.evaluate((el) => getComputedStyle(el).backgroundColor);
	expect(pdMoreDetailsBgColor).toBe("rgb(13, 202, 240)");
	expect(pdMoreDetailsBtn).toHaveClass("btn btn-info ms-1");

	const priceColor = await laptopCard.locator(".card-price").evaluate((el) => getComputedStyle(el).color);
	expect(priceColor).toBe("rgb(0, 128, 0)");

	const descText = await laptopCard.locator(".card-text").innerText();
	expect(descText.endsWith("...")).toBe(true);
	expect(descText.length).toBeLessThanOrEqual(63);

	const addToCartBtn = page.getByRole("button", { name: "ADD TO CART" });
	const addToCartBgColor = await addToCartBtn.evaluate((el) => getComputedStyle(el).backgroundColor);
	expect(addToCartBgColor).toBe("rgb(108, 117, 125)");
	expect(addToCartBtn).toHaveClass("btn btn-secondary ms-1");

	await laptopCard.getByRole("button", { name: "More Details" }).click();
	await expect(page).toHaveURL("http://localhost:3000/product/laptop");

	await expect(page.getByRole("img", { name: "Laptop" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Name : Laptop" })).toBeVisible();
	await expect(page.getByRole("main")).toContainText("Description : A powerful laptop");
	await expect(page.getByRole("main")).toContainText("Price :$1,499.99");
	await expect(page.getByRole("main")).toContainText("Category : Electronics");
	await expect(page.getByRole("button", { name: "ADD TO CART" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Similar Products ➡️" })).toBeVisible();
	await expect(page.getByRole("img", { name: "Smartphone" })).toBeVisible();
	await expect(page.getByText("Smartphone$999.99A high-end")).toBeVisible();

	const relatedImg = page.locator(".similar-products .card img").first();
	const transformBefore = await relatedImg.evaluate((el) => getComputedStyle(el).transform);
	await relatedImg.hover();
	const transformAfter = await relatedImg.evaluate((el) => getComputedStyle(el).transform);
	expect(transformBefore).not.toBe(transformAfter);
	expect(transformAfter).toContain("0.9");

	await page.getByRole("button", { name: "ADD TO CART" }).click();
	await expect(page.locator("div").filter({ hasText: "Item Added to cart" }).nth(4)).toBeVisible();
	await expect(page.getByText("Item Added to cart")).toBeVisible();
	await expect(page.getByText("Item Added to cart")).not.toBeVisible({ timeout: 10000 });

	await page.getByRole("button", { name: "ADD TO CART" }).click();
	await expect(page.locator("div").filter({ hasText: "Item Added to cart" }).nth(4)).toBeVisible();
	await expect(page.getByText("Item Added to cart")).toBeVisible();
	await expect(page.getByText("Item Added to cart")).not.toBeVisible({ timeout: 10000 });

	await page.getByRole("button", { name: "ADD TO CART" }).click();
	await expect(page.locator("div").filter({ hasText: "Item Added to cart" }).nth(4)).toBeVisible();
	await expect(page.getByText("Item Added to cart")).toBeVisible();

	await page.getByRole("link", { name: "Cart" }).click();
	await page.getByRole("button", { name: "Remove" }).first().click();
	await page.getByRole("button", { name: "Remove" }).first().click();

	await expect(page.getByRole("heading", { name: /Hello.*You Have 1 items/ })).toBeVisible();
	await expect(page.getByText("LaptopA powerful laptopPrice :")).toBeVisible();

	await page
		.locator("div")
		.filter({ hasText: /^Remove$/ })
		.click();
	await expect(page.getByRole("heading", { name: /Hello.*Your Cart Is Empty/ })).toBeVisible();

	await page.getByRole("link", { name: "Home" }).click();
	await expect(page.getByRole("searchbox", { name: "Search" })).toHaveValue("phone");
});
