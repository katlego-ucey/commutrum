import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

const queryClient = postgres(process.env.DATABASE_URL || 'postgres://localhost:5432/commutrum');

export const db = drizzle(queryClient, { schema });
export { schema };
export * from './schema/index.js';

export async function testConnection(): Promise<boolean> {
  try {
    await queryClient`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function closeConnection(): Promise<void> {
  await queryClient.end();
}