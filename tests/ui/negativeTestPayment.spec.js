//Koo Zhuo Hui, A0253417H

import { test, expect } from "@playwright/test";
import { getSeededRegularUserAuth, SEEDED_USER_PASSWORD } from "./helpers/ms2UserUiHelpers.js";

test("Logged Out User Payment And Invalid Payment Credentials", async ({ page }) => {
	const { user } = getSeededRegularUserAuth();
	await page.goto("http://localhost:3000/");

	//Add product to cart
	await page.getByRole("button", { name: "ADD TO CART" }).nth(3).click();
	await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
	await expect(page.getByTitle("1")).toBeVisible();
	await expect(page.getByText("1", { exact: true })).toBeVisible();

	//Click on cart, tries to checkout
	await page.getByRole("link", { name: "Cart" }).click();
	await expect(page.getByText("You Have 1 items in your cart")).toBeVisible();
	await expect(page.getByText("SmartphoneA high-end smartphonePrice : 999.99Remove")).toBeVisible();
	await expect(page.getByRole("main")).toContainText("Total : $999.99");
	await expect(page.getByRole("button", { name: "Please Login to checkout" })).toBeVisible();

	const loginToCheckoutBtn = page.getByRole("button", { name: "Please Login to checkout" });
	const borderColor = await loginToCheckoutBtn.evaluate((el) => getComputedStyle(el).border);
	const textColor = await loginToCheckoutBtn.evaluate((el) => getComputedStyle(el).color);
	expect(borderColor).toBe("1px solid rgb(255, 193, 7)");
	expect(textColor).toBe("rgb(255, 193, 7)");

	await loginToCheckoutBtn.hover();
	await page.waitForTimeout(500);
	const hoverBgColor = await loginToCheckoutBtn.evaluate((el) => getComputedStyle(el).backgroundColor);
	expect(hoverBgColor).toBe("rgb(255, 193, 7)");

	//User logs in
	await page.getByRole("button", { name: "Please Login to checkout" }).click();
	await page.getByRole("textbox", { name: "Enter Your Email" }).click();
	await page.getByRole("textbox", { name: "Enter Your Email" }).fill(user.email);
	await page.getByRole("textbox", { name: "Enter Your Email" }).press("Tab");
	await page.getByRole("textbox", { name: "Enter Your Password" }).fill(SEEDED_USER_PASSWORD);
	await page.getByRole("button", { name: "LOGIN" }).click();

	//Logged In
	await expect(page.getByText("Current Address")).toBeVisible();
	await expect(page.getByText("Choose a way to pay")).toBeVisible();

	//Keys in invalid card details
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
		.fill("4111111212332132");
	await page
		.locator('iframe[name="braintree-hosted-field-expirationDate"]')
		.contentFrame()
		.getByRole("textbox", { name: "Expiration Date" })
		.click();
	await page
		.locator('iframe[name="braintree-hosted-field-expirationDate"]')
		.contentFrame()
		.getByRole("textbox", { name: "Expiration Date" })
		.fill("226");
	await page
		.locator('iframe[name="braintree-hosted-field-expirationDate"]')
		.contentFrame()
		.getByRole("textbox", { name: "Expiration Date" })
		.press("Tab");
	await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame().getByRole("textbox", { name: "CVV" }).click();
	await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame().getByRole("textbox", { name: "CVV" }).fill("123");
	await page.getByRole("button", { name: "Make Payment" }).click();
	await expect(page.getByText("This card number is not valid.")).toBeVisible();
	await expect(page.getByText("This expiration date is not")).toBeVisible();
	await expect(page.getByText("Please check your information")).toBeVisible();
	await page.getByText("Choose another way to pay").click();
	await expect(page.getByRole("button", { name: "Paying with Card" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Paying with PayPal" })).toBeVisible();
});
