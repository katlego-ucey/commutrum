/**
 * Database seed — run after initial schema push.
 * Usage: pnpm --filter @workspace/db run seed
 */
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { generateTradingCalendar } from "./seeds/trading-calendar";
import { BROKER_SEEDS } from "./seeds/broker-config";
import { COST_MODEL_PARAMETER_SEEDS } from "./seeds/cost-model-parameters";
import { tradingCalendar, brokerConfig, costModelParameters } from "./schema";

const { Pool } = pg;

if (!process.env["DATABASE_URL"]) {
  throw new Error("DATABASE_URL environment variable required");
}

const pool = new Pool({ connectionString: process.env["DATABASE_URL"] });
const db = drizzle(pool);

async function seed() {
  console.log("Seeding trading_calendar (2025-01-01 to 2027-12-31)...");
  const calRows = generateTradingCalendar("2025-01-01", "2027-12-31");
  await db.insert(tradingCalendar).values(calRows).onConflictDoNothing();
  console.log(`  Inserted ${calRows.length} calendar rows`);

  console.log("Seeding broker_config...");
  await db.insert(brokerConfig).values(BROKER_SEEDS).onConflictDoNothing();
  console.log(`  Inserted ${BROKER_SEEDS.length} broker rows`);

  console.log("Seeding cost_model_parameters...");
  const paramRows = COST_MODEL_PARAMETER_SEEDS.map((p) => ({
    ...p,
    id: crypto.randomUUID(),
  }));
  await db.insert(costModelParameters).values(paramRows).onConflictDoNothing();
  console.log(`  Inserted ${paramRows.length} cost parameter rows`);

  await pool.end();
  console.log("Seed complete.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
