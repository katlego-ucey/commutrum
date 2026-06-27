import {
  pgTable,
  serial,
  text,
  date,
  real,
  boolean,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const positionSizingRules = pgTable("position_sizing_rules", {
  id: serial("id").primaryKey(),
  ruleName: text("rule_name").notNull(),
  method: text("method").notNull(),
  maxSinglePositionPct: real("max_single_position_pct").notNull(),
  maxSectorExposurePct: real("max_sector_exposure_pct").notNull(),
  minProbabilityThreshold: real("min_probability_threshold").notNull(),
  targetPortfolioSize: integer("target_portfolio_size").notNull(),
  rebalanceFrequency: text("rebalance_frequency").notNull(),
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const portfolioConstraints = pgTable("portfolio_constraints", {
  id: serial("id").primaryKey(),
  constraintType: text("constraint_type").notNull(),
  parameter: text("parameter").notNull(),
  value: real("value").notNull(),
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const portfolioHoldings = pgTable(
  "portfolio_holdings",
  {
    id: serial("id").primaryKey(),
    portfolioDate: date("portfolio_date").notNull(),
    rebalanceDate: date("rebalance_date").notNull(),
    ticker: text("ticker").notNull(),
    weight: real("weight").notNull(),
    sector: text("sector"),
    selectionProbability: real("selection_probability"),
    targetWeightPct: real("target_weight_pct"),
    isCash: boolean("is_cash").notNull().default(false),
    rulesVersionId: integer("rules_version_id").references(() => positionSizingRules.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("portfolio_holdings_date_idx").on(t.portfolioDate),
    index("portfolio_holdings_ticker_date_idx").on(t.ticker, t.portfolioDate),
  ]
);

export const insertPortfolioHoldingSchema = createInsertSchema(portfolioHoldings).omit({ id: true, createdAt: true });

export type PortfolioHolding = typeof portfolioHoldings.$inferSelect;
export type PositionSizingRule = typeof positionSizingRules.$inferSelect;
export type PortfolioConstraint = typeof portfolioConstraints.$inferSelect;
export type InsertPortfolioHolding = z.infer<typeof insertPortfolioHoldingSchema>;
