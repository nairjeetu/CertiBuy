import { join } from "path";
import { PrismaClient } from "./generated/client";

if (process.env.VERCEL && !process.env.PRISMA_QUERY_ENGINE_LIBRARY) {
  process.env.PRISMA_QUERY_ENGINE_LIBRARY = join(
    process.cwd(),
    "../../packages/db/src/generated/client/libquery_engine-rhel-openssl-3.0.x.so.node"
  );
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type { PrismaClient } from "./generated/client";
export * from "./generated/client";
