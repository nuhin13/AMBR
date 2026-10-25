import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { testDb, resetDb, makeVariant, makeOrder } from "../support/factory";
import { reserveStock, adjustStock } from "@/modules/inventory/service";
import { db } from "@/lib/db";

beforeEach(resetDb);
afterAll(async () => {
  await testDb.$disconnect();
  await db.$disconnect();
});

describe("inventory", () => {
  it("never oversells under concurrent checkouts", async () => {
    const { variant, product } = await makeVariant({ onHand: 5 });
    const orders = await Promise.all(Array.from({ length: 12 }, () => makeOrder(variant.id, product.id, 1)));
    const results = await Promise.allSettled(orders.map((o) => db.$transaction((tx) => reserveStock(tx, variant.id, 1, o.id, "Product"))));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(5);
    const inv = await testDb.inventory.findUniqueOrThrow({ where: { variantId: variant.id } });
    expect(inv).toMatchObject({ onHand: 5, reserved: 5 });
    expect(await testDb.inventoryMovement.count({ where: { variantId: variant.id, type: "ORDER_RESERVE" } })).toBe(5);
  });

  it("rolls back the reservation when the transaction fails", async () => {
    const { variant, product } = await makeVariant({ onHand: 3 });
    const o = await makeOrder(variant.id, product.id, 2);
    await expect(
      db.$transaction(async (tx) => {
        await reserveStock(tx, variant.id, 2, o.id, "P");
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(await testDb.inventory.findUniqueOrThrow({ where: { variantId: variant.id } })).toMatchObject({ reserved: 0 });
  });

  it("won't let an adjustment take stock below what is reserved", async () => {
    const { variant, product } = await makeVariant({ onHand: 4 });
    const o = await makeOrder(variant.id, product.id, 3);
    await db.$transaction((tx) => reserveStock(tx, variant.id, 3, o.id, "P"));
    const user = await testDb.user.create({ data: { email: "s@x.com", name: "Staff", role: "ADMIN" } });
    await expect(db.$transaction((tx) => adjustStock(tx, variant.id, -2, "DAMAGE", user.id, "broken"))).rejects.toThrow(/reserved/);
    await db.$transaction((tx) => adjustStock(tx, variant.id, 10, "PURCHASE_IN", user.id, "restock"));
    expect(await testDb.inventory.findUniqueOrThrow({ where: { variantId: variant.id } })).toMatchObject({ onHand: 14, reserved: 3 });
  });
});
