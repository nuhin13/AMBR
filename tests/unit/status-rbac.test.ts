import { describe, expect, it } from "vitest";
import { canTransition, transitionBlocker } from "@/modules/orders/status";
import { can } from "@/modules/auth/rbac";
import { checkoutSchema } from "@/modules/checkout/schema";
import { parseFilters } from "@/modules/catalog/params";

describe("order status machine", () => {
  it("allows the normal flow", () => {
    expect(canTransition("PENDING", "CONFIRMED")).toBe(true);
    expect(canTransition("CONFIRMED", "SHIPPED")).toBe(true);
    expect(canTransition("SHIPPED", "DELIVERED")).toBe(true);
  });
  it("blocks illegal moves", () => {
    expect(canTransition("DELIVERED", "PENDING")).toBe(false);
    expect(canTransition("CANCELLED", "CONFIRMED")).toBe(false);
    expect(canTransition("SHIPPED", "CANCELLED")).toBe(false);
  });
  it("won't confirm unpaid online orders", () => {
    expect(transitionBlocker({ status: "PENDING", paymentMethod: "BKASH", paymentStatus: "PENDING" }, "CONFIRMED")).toMatch(/hasn't been paid/);
    expect(transitionBlocker({ status: "PENDING", paymentMethod: "BKASH", paymentStatus: "PAID" }, "CONFIRMED")).toBeNull();
    expect(transitionBlocker({ status: "PENDING", paymentMethod: "COD", paymentStatus: "UNPAID" }, "CONFIRMED")).toBeNull();
  });
});

describe("RBAC", () => {
  it("restricts staff to their area", () => {
    expect(can("STAFF_ORDERS", "orders:manage")).toBe(true);
    expect(can("STAFF_ORDERS", "catalog:manage")).toBe(false);
    expect(can("STAFF_CATALOG", "orders:manage")).toBe(false);
    expect(can("ADMIN", "staff:manage")).toBe(false);
    expect(can("OWNER", "staff:manage")).toBe(true);
    expect(can("CUSTOMER", "dashboard:view")).toBe(false);
  });
});

describe("checkout validation", () => {
  const valid = {
    customerName: "Rahim Ahmed",
    phone: "01712345678",
    email: "",
    districtId: 1,
    upazilaId: 2,
    addressLine: "House 1, Road 2, Dhanmondi",
    paymentMethod: "COD",
    acceptTerms: true,
    idempotencyKey: "6f1c1c6e-3a8e-4c3b-9a1f-2b9f6f0d2c11",
  };
  it("accepts a valid guest checkout", () => expect(checkoutSchema.safeParse(valid).success).toBe(true));
  it("rejects a bad phone, short address and unaccepted terms", () => {
    const r = checkoutSchema.safeParse({ ...valid, phone: "12345", addressLine: "x", acceptTerms: false });
    expect(r.success).toBe(false);
    expect(r.error!.issues.map((i) => i.path[0]).sort()).toEqual(["acceptTerms", "addressLine", "phone"]);
  });
});

describe("catalogue URL filters", () => {
  it("parses and sanitises params", () => {
    const f = parseFilters({ family: "woody,fresh,<script>", min: "300", max: "abc", sort: "price-asc", season: "all-year", page: "2" });
    expect(f.families).toEqual(["woody", "fresh"]);
    expect(f.minPrice).toBe(30000);
    expect(f.maxPrice).toBeUndefined();
    expect(f.sort).toBe("price-asc");
    expect(f.seasons).toEqual(["ALL_YEAR"]);
    expect(f.page).toBe(2);
  });
  it("falls back to safe defaults", () => expect(parseFilters({ sort: "drop table" }).sort).toBe("popular"));
});
