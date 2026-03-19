//Koo Zhuo Hui, A0253417H
import { test, expect } from "@playwright/test";

test("Search No Results", async ({ page }) => {
	await page.goto("http://localhost:3000/");
	await page.getByRole("searchbox", { name: "Search" }).click();
	await page.getByRole("button", { name: "Search" }).click();

	await page.getByRole("searchbox", { name: "Search" }).fill("wergfpowef");
	await page.getByRole("button", { name: "Search" }).click();
	await expect(page.locator("h1")).toContainText("Search Resuts");
	await expect(page.locator("h6")).toContainText("No Products Found");
	await expect(page.getByRole("searchbox", { name: "Search" })).toHaveValue("wergfpowef");

	await page.getByRole("searchbox", { name: "Search" }).press("ControlOrMeta+a");
	await page.getByRole("searchbox", { name: "Search" }).fill("NUS T-Shirt");
	await page.getByRole("searchbox", { name: "Search" }).press("Enter");
	await page.getByRole("button", { name: "Search" }).click();
	await page.waitForURL("**/search**");
	await page.getByRole("button", { name: "More Details" }).click();

	await page.waitForURL("**/product/nus-tshirt");
	await expect(page.getByRole("heading", { name: "Name : NUS T-shirt" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Description : Plain NUS T-" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Price :$" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Category : Clothing" })).toBeVisible();

	await expect(page.getByText("No Similar Products found")).toBeVisible();
	const text = page.getByText("No Similar Products found");
	expect(text).toHaveClass("text-center");

	await expect(page.getByRole("searchbox", { name: "Search" })).toHaveValue("NUS T-Shirt");

	await page.getByRole("link", { name: "🛒 Virtual Vault" }).click();

	await expect(page.getByRole("searchbox", { name: "Search" })).toHaveValue("NUS T-Shirt");
	await expect(page.getByRole("img", { name: "bannerimage" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "All Products" })).toBeVisible();
});
