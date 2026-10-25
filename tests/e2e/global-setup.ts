import { PrismaClient } from "@prisma/client";
import "dotenv/config";

/** E2E runs place real orders; reset the per-IP throttles so repeated runs don't hit them. */
export default async function globalSetup() {
  const db = new PrismaClient();
  await db.rateLimit.deleteMany({});
  await db.$disconnect();
}
