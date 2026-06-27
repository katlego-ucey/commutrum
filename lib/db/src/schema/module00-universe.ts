import {
  pgTable,
  serial,
  text,
  date,
  real,
  boolean,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const universeSnapshot = pgTable(
  "universe_snapshot",
  {
    id: serial("id").primaryKey(),
    ticker: text("ticker").notNull(),
    snapshotDate: date("snapshot_date").notNull(),
    companyName: text("company_name"),
    sector: text("sector"),
    marketCapZar: real("market_cap_zar"),
    adtv20d: real("adtv_20d"),
    yearsOfHistory: real("years_of_history"),
    dataQualityScore: real("data_quality_score"),
    isActive: boolean("is_active").notNull().default(true),
    delistedAt: date("delisted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("universe_snapshot_ticker_date_idx").on(t.ticker, t.snapshotDate),
  ]
);

export const screeningRules = pgTable("screening_rules", {
  id: serial("id").primaryKey(),
  ruleName: text("rule_name").notNull(),
  parameter: text("parameter").notNull(),
  thresholdValue: real("threshold_value").notNull(),
  unit: text("unit"),
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const exclusionsLog = pgTable(
  "exclusions_log",
  {
    id: serial("id").primaryKey(),
    ticker: text("ticker").notNull(),
    exclusionDate: date("exclusion_date").notNull(),
    reason: text("reason").notNull(),
    ruleId: integer("rule_id").references(() => screeningRules.id),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("exclusions_log_ticker_date_idx").on(t.ticker, t.exclusionDate),
  ]
);

export const insertUniverseSnapshotSchema = createInsertSchema(universeSnapshot).omit({ id: true, createdAt: true });
export const insertScreeningRulesSchema = createInsertSchema(screeningRules).omit({ id: true, createdAt: true });
export const insertExclusionsLogSchema = createInsertSchema(exclusionsLog).omit({ id: true, createdAt: true });

export type UniverseSnapshot = typeof universeSnapshot.$inferSelect;
export type ScreeningRule = typeof screeningRules.$inferSelect;
export type ExclusionLog = typeof exclusionsLog.$inferSelect;
export type InsertUniverseSnapshot = z.infer<typeof insertUniverseSnapshotSchema>;
export type InsertScreeningRule = z.infer<typeof insertScreeningRulesSchema>;
export type InsertExclusionLog = z.infer<typeof insertExclusionsLogSchema>;
