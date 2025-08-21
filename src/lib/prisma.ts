import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // log: ["error", "query],
    // errorFormat: "pretty",
  });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
// to prevent duplication of prisma client in development due to hot reloading

export default prisma;