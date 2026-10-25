import { describe, expect, it } from "vitest";
import { formatBDPhone, isValidBDPhone, normalizeBDPhone } from "@/lib/phone";
import { formatBDT, percentOf, toPoisha } from "@/lib/money";

describe("Bangladesh phone numbers", () => {
  it.each(["01712345678", "+8801712345678", "8801712345678", "017-1234-5678", "0131 234 5678"])("accepts %s", (n) => expect(isValidBDPhone(n)).toBe(true));
  it.each(["0171234567", "01212345678", "1712345678", "+911712345678", "abcdefghijk", ""])("rejects %s", (n) => expect(isValidBDPhone(n)).toBe(false));
  it("normalises to E.164", () => expect(normalizeBDPhone("01912-345678")).toBe("+8801912345678"));
  it("formats for display", () => expect(formatBDPhone("+8801712345678")).toBe("01712-345678"));
});

describe("money", () => {
  it("formats BDT with Indian grouping", () => {
    expect(formatBDT(toPoisha(1250))).toBe("৳1,250");
    expect(formatBDT(toPoisha(125000))).toBe("৳1,25,000");
    expect(formatBDT(35050)).toBe("৳350.5");
  });
  it("rounds percentages down to whole taka", () => expect(percentOf(toPoisha(999), 15)).toBe(toPoisha(149)));
});
