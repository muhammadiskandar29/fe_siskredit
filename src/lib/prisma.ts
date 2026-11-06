import { PrismaClient } from '@prisma/client';

// Fallback koneksi Neon PostgreSQL langsung di kode,
// agar aplikasi tetap jalan walaupun Environment Variables di hosting tidak di-set.
const NEON_DATABASE_URL =
  'postgresql://neondb_owner:npg_CupYO5eAX4gk@ep-orange-scene-bb16eze3-pooler.c-15.us-east-1.aws.neon.tech/neondb?channel_binding=require&connect_timeout=15&sslmode=require';

const databaseUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL || NEON_DATABASE_URL;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasourceUrl: databaseUrl,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
