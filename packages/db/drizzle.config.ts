import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/drizzle-index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://localhost:5432/commutrum',
  },
});