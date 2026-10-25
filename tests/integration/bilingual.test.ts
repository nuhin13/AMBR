import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { testDb, resetDb, makeVariant } from "../support/factory";
import { getProductBySlug, listProducts } from "@/modules/catalog/queries";
import { getPage } from "@/modules/content/queries";
import { db } from "@/lib/db";

beforeEach(resetDb);
afterAll(async () => {
  await testDb.$disconnect();
  await db.$disconnect();
});

describe("bilingual content", () => {
  it("uses a PUBLISHED Bangla translation and keeps price/stock identical", async () => {
    const { product } = await makeVariant({ onHand: 4, price: 35000 });
    await testDb.productTranslation.create({ data: { productId: product.id, locale: "bn", status: "PUBLISHED", name: "ভেলুর", shortDescription: "উষ্ণ অ্যাম্বার", description: "<p>বাংলা</p>" } });
    const en = await getProductBySlug(product.slug, "en");
    const bn = await getProductBySlug(product.slug, "bn");
    expect(en!.name).toBe(product.name);
    expect(bn!.name).toBe("ভেলুর");
    expect(bn!.lang).toBe("bn");
    expect(bn!.variants.map((v) => [v.price, v.available])).toEqual(en!.variants.map((v) => [v.price, v.available]));
  });

  it("never shows a DRAFT translation — falls back to English, marked as English", async () => {
    const { product } = await makeVariant({ onHand: 1 });
    await testDb.productTranslation.create({ data: { productId: product.id, locale: "bn", status: "DRAFT", name: "খসড়া", shortDescription: "খসড়া", description: "খসড়া" } });
    const bn = await getProductBySlug(product.slug, "bn");
    expect(bn!.name).toBe(product.name);
    expect(bn!.lang).toBe("en");
  });

  it("finds products by published Bangla names and Bangla family names", async () => {
    const { product } = await makeVariant({ onHand: 2 });
    await testDb.productTranslation.create({ data: { productId: product.id, locale: "bn", status: "PUBLISHED", name: "মিট্টি স্যান্ডেল", shortDescription: "মাটি", description: "x" } });
    const fam = await testDb.fragranceFamily.create({ data: { slug: "woody", name: "Woody", nameBn: "উডি" } });
    await testDb.productFamily.create({ data: { productId: product.id, familyId: fam.id, isPrimary: true } });
    expect((await listProducts({ q: "স্যান্ডেল" }, "bn")).items.map((i) => i.id)).toEqual([product.id]);
    expect((await listProducts({ q: "উডি" }, "bn")).items.map((i) => i.id)).toEqual([product.id]);
    expect((await listProducts({ q: "Woody" }, "bn")).items[0].family).toBe("উডি");
  });

  it("content pages publish each language independently", async () => {
    const page = await testDb.contentPage.create({ data: { slug: "about", title: "About", body: "<p>en</p>" } });
    await testDb.contentPageTranslation.create({ data: { pageId: page.id, locale: "bn", status: "DRAFT", title: "সম্পর্কে", body: "<p>bn</p>" } });
    expect((await getPage("about", "bn"))!.title).toBe("About");
    await testDb.contentPageTranslation.update({ where: { pageId_locale: { pageId: page.id, locale: "bn" } }, data: { status: "PUBLISHED" } });
    expect((await getPage("about", "bn"))!.title).toBe("সম্পর্কে");
    expect((await getPage("about", "en"))!.title).toBe("About");
  });
});
