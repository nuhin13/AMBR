import { describe, expect, it } from "vitest";
import { en } from "@/i18n/dictionaries/en";
import { bn } from "@/i18n/dictionaries/bn";
import { fmt, localePath, stripLocale, isLocale } from "@/i18n/config";
import { formatPrice, formatSizeLabel, fromBnDigits, toBnDigits } from "@/i18n/format";
import { translateMessage } from "@/i18n/translate";
import { normalizeBDPhone } from "@/lib/phone";
import { parseFilters } from "@/modules/catalog/params";

type Tree = { [k: string]: string | string[] | Tree };
function keys(obj: Tree, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) => (typeof v === "object" && !Array.isArray(v) ? keys(v as Tree, `${prefix}${k}.`) : [`${prefix}${k}`]));
}
function leaves(obj: Tree, prefix = ""): [string, string][] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === "string" ? [[`${prefix}${k}`, v] as [string, string]] : Array.isArray(v) ? [] : leaves(v as Tree, `${prefix}${k}.`),
  );
}

describe("dictionaries", () => {
  it("Bangla has exactly the same keys as English", () => {
    expect(keys(bn as unknown as Tree).sort()).toEqual(keys(en as unknown as Tree).sort());
  });
  it("no Bangla string is left empty or identical to an English sentence", () => {
    const enMap = new Map(leaves(en as unknown as Tree));
    const untranslated = leaves(bn as unknown as Tree).filter(([k, v]) => !v.trim() || (v === enMap.get(k) && /[a-z]{4,}\s[a-z]{3,}/i.test(v)));
    expect(untranslated).toEqual([]);
  });
  it("placeholders match between languages", () => {
    const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
    const enMap = new Map(leaves(en as unknown as Tree));
    const mismatched = leaves(bn as unknown as Tree).filter(([k, v]) => ph(v) !== ph(enMap.get(k) ?? ""));
    expect(mismatched).toEqual([]);
  });
});

describe("locale paths", () => {
  it("prefixes and strips locales", () => {
    expect(localePath("bn", "/shop?for=him")).toBe("/bn/shop?for=him");
    expect(localePath("en", "/")).toBe("/en");
    expect(localePath("bn", "/en/product/velour")).toBe("/bn/product/velour");
    expect(stripLocale("/bn/product/velour")).toBe("/product/velour");
    expect(stripLocale("/bn")).toBe("/");
    expect(stripLocale("/bnx/page")).toBe("/bnx/page");
    expect(isLocale("bn")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });
  it("interpolates placeholders", () => expect(fmt("Only {count} left", { count: 3 })).toBe("Only 3 left"));
});

describe("Bangla formatting", () => {
  it("shows the same price with Bangla digits", () => {
    expect(formatPrice(125000, "en")).toBe("৳1,250");
    expect(formatPrice(125000, "bn")).toBe("৳১,২৫০");
  });
  it("converts digits both ways", () => {
    expect(toBnDigits("01712345678")).toBe("০১৭১২৩৪৫৬৭৮");
    expect(fromBnDigits("০১৭১২৩৪৫৬৭৮")).toBe("01712345678");
  });
  it("localises size labels", () => {
    expect(formatSizeLabel("10 ml", "bn")).toBe("১০ মিলি");
    expect(formatSizeLabel("5 × 3 ml", "bn")).toBe("৫ × ৩ মিলি");
    expect(formatSizeLabel("10 ml", "en")).toBe("10 ml");
  });
  it("accepts phone numbers typed with Bangla digits", () => expect(normalizeBDPhone("০১৭১২-৩৪৫৬৭৮")).toBe("+8801712345678"));
});

describe("localised messages", () => {
  it("translates validation and error keys", () => {
    expect(translateMessage(bn, "validation.phone")).toContain("মোবাইল");
    expect(translateMessage(en, "errors.soldOutName", { name: "Velour" })).toBe("Velour is sold out.");
    expect(translateMessage(bn, "errors.soldOutName", { name: "Velour" })).toContain("Velour");
  });
  it("leaves plain text untouched", () => expect(translateMessage(bn, "Some text")).toBe("Some text"));
});

describe("editorial filters", () => {
  it("parses gender, format and presence", () => {
    const f = parseFilters({ for: "him,her,x", format: "roll-on", presence: "soft,bold" });
    expect(f.genders).toEqual(["MASCULINE", "FEMININE"]);
    expect(f.formats).toEqual(["ROLL_ON"]);
    expect(f.intensities).toEqual(["LIGHT", "STRONG"]);
  });
});
