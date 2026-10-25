import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { normalizeBDPhone } from "@/lib/phone";

export async function listCustomers(f: { q?: string; page?: string }, pageSize = 30) {
  const where: Prisma.UserWhereInput = { role: "CUSTOMER" };
  if (f.q?.trim()) {
    const q = f.q.trim();
    const phone = normalizeBDPhone(q);
    where.OR = [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: phone ?? q } }];
  }
  const total = await db.user.count({ where });
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, Number(f.page) || 1), pages);
  const users = await db.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include: { _count: { select: { orders: true } } } });
  const spend = await db.order.groupBy({ by: ["userId"], where: { userId: { in: users.map((u) => u.id) }, status: "DELIVERED" }, _sum: { total: true } });
  const spent = new Map(spend.map((s) => [s.userId, s._sum.total ?? 0]));
  return { customers: users.map((u) => ({ ...u, spent: spent.get(u.id) ?? 0 })), total, page, pages };
}

export async function getCustomer(id: string) {
  const user = await db.user.findUnique({
    where: { id },
    include: {
      profile: true,
      addresses: { include: { district: true, upazila: true } },
      orders: { orderBy: { placedAt: "desc" }, take: 50 },
      _count: { select: { reviews: true, wishlist: true } },
    },
  });
  if (!user) return null;
  // Guest orders placed with the same phone, not linked to the account.
  const guestOrders = user.phone ? await db.order.findMany({ where: { phone: user.phone, userId: null }, orderBy: { placedAt: "desc" }, take: 20 }) : [];
  const delivered = user.orders.filter((o) => o.status === "DELIVERED");
  return { user, guestOrders, spent: delivered.reduce((s, o) => s + o.total, 0), deliveredCount: delivered.length };
}
