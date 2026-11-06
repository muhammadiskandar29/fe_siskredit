import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    DATABASE_URL: "postgresql://neondb_owner:npg_CupYO5eAX4gk@ep-orange-scene-bb16eze3-pooler.c-15.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
    DATABASE_URL_UNPOOLED: "postgresql://neondb_owner:npg_CupYO5eAX4gk@ep-orange-scene-bb16eze3.c-15.us-east-1.aws.neon.tech/neondb?sslmode=require",
    POSTGRES_PRISMA_URL: "postgresql://neondb_owner:npg_CupYO5eAX4gk@ep-orange-scene-bb16eze3-pooler.c-15.us-east-1.aws.neon.tech/neondb?channel_binding=require&connect_timeout=15&sslmode=require",
    POSTGRES_URL_NON_POOLING: "postgresql://neondb_owner:npg_CupYO5eAX4gk@ep-orange-scene-bb16eze3.c-15.us-east-1.aws.neon.tech/neondb?sslmode=require",
    JWT_SECRET: "spk-koperasi-secret-key-2026-alazhar-bsd",
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
