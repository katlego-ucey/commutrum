import { pgTable, text, date, boolean, numeric, timestamp, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tickers = pgTable("tickers", {
  ticker: text("ticker").primaryKey(),
  name: text("name").notNull(),
  isin: text("isin"),
  sector: text("sector"),
  subSector: text("sub_sector"),
  listedDate: date("listed_date"),
  delistedDate: date("delisted_date"),
  isCurrentlyListed: boolean("is_currently_listed").notNull().default(true),
  dualListed: boolean("dual_listed").notNull().default(false),
  offshoreRevenuePct: numeric("offshore_revenue_pct", { precision: 5, scale: 2 }),
  sharesOutstanding: numeric("shares_outstanding", { precision: 20, scale: 0 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const universeSnapshot = pgTable(
  "universe_snapshot",
  {
    ticker: text("ticker").notNull().references(() => tickers.ticker),
    snapshotDate: date("snapshot_date").notNull(),
    passFail: boolean("pass_fail").notNull(),
    exclusionReason: text("exclusion_reason"),
    adtv20d: numeric("adtv_20d", { precision: 20, scale: 2 }),
    marketCapZar: numeric("market_cap_zar", { precision: 20, scale: 2 }),
    yearsAuditedHistory: numeric("years_audited_history", { precision: 5, scale: 2 }),
    lastAuditOpinion: text("last_audit_opinion"),
    dataCompletenessScore: numeric("data_completeness_score", { precision: 5, scale: 4 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("universe_snapshot_date_idx").on(t.snapshotDate),
    index("universe_snapshot_ticker_date_idx").on(t.ticker, t.snapshotDate),
  ],
);

export const screeningRules = pgTable("screening_rules", {
  ruleId: text("rule_id").primaryKey(),
  ruleName: text("rule_name").notNull(),
  threshold: numeric("threshold", { precision: 20, scale: 6 }).notNull(),
  unit: text("unit").notNull(),
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
  rationale: text("rationale"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const exclusionsLog = pgTable(
  "exclusions_log",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    ticker: text("ticker").notNull().references(() => tickers.ticker),
    exclusionDate: date("exclusion_date").notNull(),
    reason: text("reason").notNull(),
    detail: text("detail"),
    ruleId: text("rule_id").references(() => screeningRules.ruleId),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("exclusions_log_ticker_idx").on(t.ticker)],
);

export const insertTickerSchema = createInsertSchema(tickers);
export const selectTickerSchema = createSelectSchema(tickers);
export type Ticker = typeof tickers.$inferSelect;
export type InsertTicker = typeof tickers.$inferInsert;

export const insertUniverseSnapshotSchema = createInsertSchema(universeSnapshot);
export type UniverseSnapshot = typeof universeSnapshot.$inferSelect;
export type InsertUniverseSnapshot = typeof universeSnapshot.$inferInsert;
