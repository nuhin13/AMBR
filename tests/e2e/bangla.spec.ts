import { expect, test } from "@playwright/test";

test("Bangla homepage: lang attribute, Bangla copy and hreflang alternates", async ({ page }) => {
  await page.goto("/bn");
  await expect(page.locator("html")).toHaveAttribute("lang", "bn-BD");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("অনুভূতি");
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", /\/en$/);
  await expect(page.locator('link[rel="alternate"][hreflang="bn-BD"]')).toHaveAttribute("href", /\/bn$/);
});

test("language switch keeps the same page and filters", async ({ page }) => {
  await page.goto("/en/shop?family=woody");
  await page.getByRole("link", { name: "বাং" }).first().click();
  await expect(page).toHaveURL(/\/bn\/shop\?family=woody/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("সব সুবাস");
});

test("language preference is remembered", async ({ page }) => {
  await page.goto("/bn");
  await page.goto("/shop");
  await expect(page).toHaveURL(/\/bn\/shop/);
});

test("Bangla product page: translated content, Bangla digits, same price", async ({ page }) => {
  await page.goto("/bn/product/velour");
  await expect(page.getByText("নরম ভ্যানিলা আর সিডারে মোড়া উষ্ণ অ্যাম্বার।")).toBeVisible();
  await expect(page.getByText("৳৩৫০").first()).toBeVisible();
  await page.getByRole("radio", { name: /৩০ মিলি/ }).click();
  await expect(page.getByText("৳৮৫০").first()).toBeVisible();
});

test("Bangla search finds products by Bangla family name", async ({ page }) => {
  await page.goto("/bn/search?q=" + encodeURIComponent("উডি"));
  await expect(page.getByRole("heading", { name: "Velour" })).toBeVisible();
});

test("Bangla checkout validation and a full Bangla order", async ({ page }) => {
  await page.goto("/bn/product/oud-noor");
  await page.getByRole("button", { name: "ব্যাগে যোগ করুন" }).first().click();
  await expect(page.getByRole("dialog", { name: "আপনার ব্যাগ" })).toBeVisible();
  await page.goto("/bn/checkout");
  await page.getByLabel("মোবাইল নম্বর").fill("১২৩");
  await page.getByLabel("পুরো নাম").click();
  await expect(page.getByText(/সঠিক বাংলাদেশি মোবাইল নম্বর/)).toBeVisible();
  await page.getByLabel("পুরো নাম").fill("রহিম আহমেদ");
  await page.getByLabel("মোবাইল নম্বর").fill("০১৭১২৩৪৫৬৭৮");
  await page.locator('select[name="districtId"]').selectOption({ index: 3 });
  await page.locator('select[name="upazilaId"]').selectOption({ index: 1 });
  await page.getByLabel("পূর্ণ ঠিকানা").fill("বাসা ১২, রোড ৫, ধানমন্ডি");
  await page.getByLabel(/মেনে নিচ্ছি/).check();
  await page.getByRole("button", { name: /অর্ডার করুন/ }).click();
  await page.waitForURL("**/bn/order/**/confirmation**");
  await expect(page.getByRole("heading", { name: /ধন্যবাদ, রহিম/ })).toBeVisible();
});

test("Bangla 404 is localised", async ({ page }) => {
  const res = await page.goto("/bn/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "পাতাটি হারিয়ে গেছে" })).toBeVisible();
});
