import "server-only";
import { PrismaClient } from "@prisma/client";
import { connection } from "next/server";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function create(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
  // Docker images are built without a database. With SKIP_BUILD_PRERENDER=1 (set only in the
  // Dockerfile build stage) every query first waits for a real request, so pages that read the
  // database render at request time instead of failing the build. No effect at runtime.
  if (process.env.SKIP_BUILD_PRERENDER === "1") {
    return client.$extends({
      query: {
        async $allOperations({ args, query }) {
          await connection();
          return query(args);
        },
      },
    }) as unknown as PrismaClient;
  }
  return client;
}

export const db = globalForPrisma.prisma ?? create();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0];
