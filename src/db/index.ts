import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function sqliteFilePathFromUrl(databaseUrl: string) {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error(
      `Unsupported DATABASE_URL (expected file:...): ${databaseUrl}`
    );
  }

  let filePath = databaseUrl.slice("file:".length);
  filePath = (filePath.split("?")[0] ?? "").trim();

  if (!filePath) {
    throw new Error(`Invalid DATABASE_URL (empty file path): ${databaseUrl}`);
  }

  // Handle Windows file:/C:/... form
  if (/^\/[A-Za-z]:\//.test(filePath)) {
    filePath = filePath.slice(1);
  }

  return path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaBetterSqlite3({
      url: sqliteFilePathFromUrl(process.env.DATABASE_URL ?? "file:./data/dev.db")
    }),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

