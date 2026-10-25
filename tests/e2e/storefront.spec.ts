import { expect, test } from "@playwright/test";

test("homepage renders the brand, hero and best sellers", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("img", { name: /AMBR — Above Ordinary/ }).first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Feeling");
  await expect(page.getByRole("heading", { name: "Loved by our customers" })).toBeVisible();
});

test("hidden future categories are not reachable", async ({ page }) => {
  const res = await page.goto("/category/body-mist");
  expect(res?.status()).toBe(404);
});

test("choosing a size updates the price", async ({ page }) => {
  await page.goto("/product/velour");
  await expect(page.getByText("৳350").first()).toBeVisible();
  await page.getByRole("radio", { name: /30 ml/ }).click();
  await expect(page.getByText("৳850").first()).toBeVisible();
});

test("filters narrow the catalogue via the URL", async ({ page }) => {
  await page.goto("/shop?family=gourmand");
  await expect(page.getByRole("heading", { name: "Vanilla Dusk" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Monsoon Linen" })).toHaveCount(0);
});

test("guest can place a cash-on-delivery order", async ({ page }) => {
  await page.goto("/product/white-musk");
  await page.getByRole("radio", { name: /^5 ml/ }).click();
  await page.getByRole("button", { name: "Add to bag" }).first().click();
  await page.getByRole("link", { name: /Checkout/ }).click();
  await page.waitForURL("**/checkout");
  await page.getByLabel("Full name").fill("E2E Customer");
  await page.getByLabel("Mobile number").fill("01812345678");
  await page.getByLabel("District").selectOption({ label: "Chattogram · চট্টগ্রাম" }).catch(async () => {
    await page.getByLabel("District").selectOption({ index: 10 });
  });
  await page.getByLabel("City / Upazila / Area").selectOption({ index: 1 });
  await page.getByLabel("Full address").fill("House 4, Road 2, Test Area");
  await page.getByLabel(/I agree/).check();
  await page.getByRole("button", { name: /Place order/ }).click();
  await page.waitForURL("**/confirmation**");
  await expect(page.getByRole("heading", { name: /Thank you, E2E/ })).toBeVisible();
});

test("invalid phone is rejected at checkout", async ({ page }) => {
  await page.goto("/product/mitti-sandal");
  await page.getByRole("button", { name: "Add to bag" }).first().click();
  await expect(page.getByRole("dialog", { name: "Your bag" })).toBeVisible();
  await page.goto("/checkout");
  await page.getByLabel("Mobile number").fill("12345");
  await page.getByLabel("Full name").click();
  await expect(page.getByText(/valid Bangladeshi mobile number/)).toBeVisible();
});

test("wrong password shows an error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email or mobile number").fill("owner@ambr.local");
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText(/don't match/)).toBeVisible();
});

test("customers cannot open the admin dashboard", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
});
