import { pgTable, text, date, boolean, numeric, timestamp, integer, index, unique, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { tickers } from "./00-universe";

export const portfolioHoldings = pgTable(
  "portfolio_holdings",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    portfolioId: text("portfolio_id").notNull(),
    ticker: text("ticker").notNull().references(() => tickers.ticker),
    holdingDate: date("holding_date").notNull(),
    weight: numeric("weight", { precision: 8, scale: 6 }).notNull(),
    positionSizeZar: numeric("position_size_zar", { precision: 20, scale: 2 }),
    shares: numeric("shares", { precision: 20, scale: 6 }),
    entryPriceZar: numeric("entry_price_zar", { precision: 20, scale: 6 }),
    brokerConfigId: text("broker_config_id"),
    capitalTier: text("capital_tier").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("portfolio_holdings_portfolio_date_idx").on(t.portfolioId, t.holdingDate),
    unique("portfolio_holdings_portfolio_ticker_date_uniq").on(t.portfolioId, t.ticker, t.holdingDate),
  ],
);

export const positionSizingRules = pgTable("position_sizing_rules", {
  ruleId: text("rule_id").primaryKey(),
  capitalTier: text("capital_tier").notNull(),
  minCapitalZar: numeric("min_capital_zar", { precision: 20, scale: 2 }).notNull(),
  maxCapitalZar: numeric("max_capital_zar", { precision: 20, scale: 2 }),
  sizingMethod: text("sizing_method").notNull(),
  maxPositions: integer("max_positions").notNull(),
  minPositions: integer("min_positions").notNull(),
  rebalanceFrequency: text("rebalance_frequency").notNull(),
  defaultBrokerConfigId: text("default_broker_config_id"),
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const portfolioConstraints = pgTable("portfolio_constraints", {
  constraintId: text("constraint_id").primaryKey(),
  constraintType: text("constraint_type").notNull(),
  scope: text("scope").notNull(),
  maxWeight: numeric("max_weight", { precision: 6, scale: 4 }),
  minWeight: numeric("min_weight", { precision: 6, scale: 4 }),
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
  rationale: text("rationale"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const brokerConfig = pgTable("broker_config", {
  brokerId: text("broker_id").primaryKey(),
  displayName: text("display_name").notNull(),
  commissionPct: numeric("commission_pct", { precision: 8, scale: 6 }).notNull(),
  commissionMinZar: numeric("commission_min_zar", { precision: 10, scale: 2 }),
  hasMonthlyFlatFee: boolean("has_monthly_flat_fee").notNull().default(false),
  monthlyFlatFeeZar: numeric("monthly_flat_fee_zar", { precision: 10, scale: 2 }),
  thriveWaiverUnderAge: integer("thrive_waiver_under_age"),
  thriveWaiverOverAge: integer("thrive_waiver_over_age"),
  fractionalShares: boolean("fractional_shares").notNull().default(false),
  minTradeZar: numeric("min_trade_zar", { precision: 10, scale: 2 }).notNull(),
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const costModelParameters = pgTable("cost_model_parameters", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  parameter: text("parameter").notNull(),
  value: numeric("value", { precision: 20, scale: 8 }).notNull(),
  unit: text("unit").notNull(),
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
  rationale: text("rationale"),
  source: text("source"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const executionAssumptions = pgTable("execution_assumptions", {
  scenarioId: text("scenario_id").primaryKey(),
  description: text("description").notNull(),
  parametersUsed: jsonb("parameters_used").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const implementationShortfallLog = pgTable(
  "implementation_shortfall_log",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    ticker: text("ticker").notNull().references(() => tickers.ticker),
    tradeDate: date("trade_date").notNull(),
    decisionPriceZar: numeric("decision_price_zar", { precision: 20, scale: 6 }).notNull(),
    modeledExecutionPriceZar: numeric("modeled_execution_price_zar", { precision: 20, scale: 6 }).notNull(),
    totalCostBps: numeric("total_cost_bps", { precision: 10, scale: 4 }).notNull(),
    marketImpactBps: numeric("market_impact_bps", { precision: 10, scale: 4 }),
    spreadCostBps: numeric("spread_cost_bps", { precision: 10, scale: 4 }),
    brokerageBps: numeric("brokerage_bps", { precision: 10, scale: 4 }),
    taxDragBps: numeric("tax_drag_bps", { precision: 10, scale: 4 }),
    tradeValueZar: numeric("trade_value_zar", { precision: 20, scale: 2 }),
    scenarioId: text("scenario_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("impl_shortfall_log_ticker_date_idx").on(t.ticker, t.tradeDate)],
);

export type BrokerConfig = typeof brokerConfig.$inferSelect;
export type InsertBrokerConfig = typeof brokerConfig.$inferInsert;
export const insertBrokerConfigSchema = createInsertSchema(brokerConfig);
export const selectBrokerConfigSchema = createSelectSchema(brokerConfig);

export type CostModelParameter = typeof costModelParameters.$inferSelect;
export type PortfolioHolding = typeof portfolioHoldings.$inferSelect;
