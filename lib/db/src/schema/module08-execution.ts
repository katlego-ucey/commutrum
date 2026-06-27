import {
  pgTable,
  serial,
  text,
  date,
  real,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const costModelParameters = pgTable(
  "cost_model_parameters",
  {
    id: serial("id").primaryKey(),
    paramName: text("param_name").notNull(),
    component: text("component").notNull(),
    value: real("value").notNull(),
    unit: text("unit"),
    effectiveFrom: date("effective_from").notNull(),
    effectiveTo: date("effective_to"),
    source: text("source"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("cost_model_params_effective_idx").on(t.effectiveFrom),
  ]
);

export const executionAssumptions = pgTable("execution_assumptions", {
  id: serial("id").primaryKey(),
  assumptionName: text("assumption_name").notNull(),
  description: text("description"),
  value: real("value"),
  unit: text("unit"),
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const implementationShortfallLog = pgTable(
  "implementation_shortfall_log",
  {
    id: serial("id").primaryKey(),
    ticker: text("ticker").notNull(),
    tradeDate: date("trade_date").notNull(),
    signalDate: date("signal_date").notNull(),
    side: text("side").notNull(),
    executionDelayCost: real("execution_delay_cost"),
    marketImpactCost: real("market_impact_cost"),
    brokerageFeeCost: real("brokerage_fee_cost"),
    spreadCost: real("spread_cost"),
    taxCost: real("tax_cost"),
    totalShortfallBps: real("total_shortfall_bps"),
    orderSizeZar: real("order_size_zar"),
    adtv: real("adtv"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("impl_shortfall_ticker_date_idx").on(t.ticker, t.tradeDate),
  ]
);

export const insertCostModelParameterSchema = createInsertSchema(costModelParameters).omit({ id: true, createdAt: true });
export const insertImplementationShortfallSchema = createInsertSchema(implementationShortfallLog).omit({ id: true, createdAt: true });

export type CostModelParameter = typeof costModelParameters.$inferSelect;
export type ExecutionAssumption = typeof executionAssumptions.$inferSelect;
export type ImplementationShortfall = typeof implementationShortfallLog.$inferSelect;
export type InsertCostModelParameter = z.infer<typeof insertCostModelParameterSchema>;
export type InsertImplementationShortfall = z.infer<typeof insertImplementationShortfallSchema>;
