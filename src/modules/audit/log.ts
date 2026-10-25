import "server-only";
import type { Prisma } from "@prisma/client";
import { db, type Tx } from "@/lib/db";
import { requestMeta } from "@/lib/request";

type AuditInput = {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
};

const json = (v: unknown) => (v === undefined ? undefined : (JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue));

/** Append-only admin activity log. Pass `tx` to record inside the same transaction as the change. */
export async function audit(input: AuditInput, tx: Tx | typeof db = db) {
  let ip: string | null = null;
  try {
    ip = (await requestMeta()).ip;
  } catch {
    // outside a request (scripts/cron)
  }
  await tx.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      before: json(input.before),
      after: json(input.after),
      ip,
    },
  });
}
