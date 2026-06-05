// Client Prisma (singleton). Prisma 7 : la connexion runtime passe par un
// driver adapter (@prisma/adapter-pg) ; l'URL CLI vit dans prisma.config.ts.
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Évite de multiplier les connexions lors du hot-reload Next.js en dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
