import "server-only";
import type { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { normalizeBDPhone } from "@/lib/phone";
import { dhakaDay } from "@/modules/reports/form-data";

export type OrderFilters = { q?: string; status?: string; payment?: string; method?: string; from?: string; to?: string; page?: string };

export function orderWhere(f: OrderFilters): Prisma.OrderWhereInput {
  const and: Prisma.OrderWhereInput[] = [];
  if (f.q?.trim()) {
    const q = f.q.trim();
    const phone = normalizeBDPhone(q);
    and.push({
      OR: [
        { orderNumber: { contains: q.toUpperCase() } },
        { customerName: { contains: q, mode: "insensitive" } },
        { phone: { contains: phone ?? (q.replace(/\D/g, "") || q) } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (f.status) and.push({ status: f.status as OrderStatus });
  if (f.payment) and.push({ paymentStatus: f.payment as PaymentStatus });
  if (f.method) and.push({ paymentMethod: f.method as PaymentMethod });
  const from = dhakaDay(f.from);
  const to = dhakaDay(f.to, true);
  if (from || to) and.push({ placedAt: { gte: from, lte: to } });
  return and.length ? { AND: and } : {};
}

export async function listOrders(f: OrderFilters, pageSize = 25) {
  const where = orderWhere(f);
  const total = await db.order.count({ where });
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, Number(f.page) || 1), pages);
  const orders = await db.order.findMany({
    where,
    orderBy: { placedAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: { _count: { select: { items: true } }, shipment: { select: { courier: true, trackingCode: true } } },
  });
  return { orders, total, page, pages };
}

export async function getOrderForAdmin(id: string) {
  return db.order.findUnique({
    where: { id },
    include: {
      items: { include: { variant: { select: { product: { select: { id: true } } } } } },
      history: { orderBy: { createdAt: "asc" }, include: { changedBy: { select: { name: true } } } },
      payments: { orderBy: { createdAt: "desc" } },
      shipment: true,
      user: { select: { id: true, name: true, email: true } },
      redemption: true,
    },
  });
}

export async function orderStatusCounts() {
  const rows = await db.order.groupBy({ by: ["status"], _count: { _all: true } });
  return Object.fromEntries(rows.map((r) => [r.status, r._count._all])) as Partial<Record<OrderStatus, number>>;
}
