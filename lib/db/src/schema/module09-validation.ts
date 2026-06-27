import {
  pgTable,
  serial,
  text,
  date,
  real,
  boolean,
  integer,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const backtestRuns = pgTable(
  "backtest_runs",
  {
    id: serial("id").primaryKey(),
    runId: text("run_id").notNull().unique(),
    startedAt: timestamp("started_at").notNull(),
    completedAt: timestamp("completed_at"),
    status: text("status").notNull(),
    description: text("description"),
    parametersSnapshot: jsonb("parameters_snapshot"),
    costsApplied: boolean("costs_applied").notNull().default(true),
    trainWindowYears: integer("train_window_years"),
    testWindowYears: integer("test_window_years"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("backtest_runs_status_idx").on(t.status),
  ]
);

export const validationPeriods = pgTable(
  "validation_periods",
  {
    id: serial("id").primaryKey(),
    runId: text("run_id")
      .notNull()
      .references(() => backtestRuns.runId),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    periodType: text("period_type").notNull(),
    locked: boolean("locked").notNull().default(false),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("validation_periods_run_idx").on(t.runId),
  ]
);

export const backtestResults = pgTable(
  "backtest_results",
  {
    id: serial("id").primaryKey(),
    runId: text("run_id")
      .notNull()
      .references(() => backtestRuns.runId),
    periodId: integer("period_id").references(() => validationPeriods.id),
    ic: real("ic"),
    icir: real("icir"),
    sharpe: real("sharpe"),
    sortino: real("sortino"),
    hitRate: real("hit_rate"),
    maxDrawdown: real("max_drawdown"),
    calmar: real("calmar"),
    annualReturn: real("annual_return"),
    benchmarkReturn: real("benchmark_return"),
    excessReturn: real("excess_return"),
    turnover: real("turnover"),
    computedAt: timestamp("computed_at").notNull().defaultNow(),
  },
  (t) => [
    index("backtest_results_run_idx").on(t.runId),
  ]
);

export const insertBacktestRunSchema = createInsertSchema(backtestRuns).omit({ id: true, createdAt: true });
export const insertBacktestResultSchema = createInsertSchema(backtestResults).omit({ id: true, computedAt: true });
export const insertValidationPeriodSchema = createInsertSchema(validationPeriods).omit({ id: true, createdAt: true });

export type BacktestRun = typeof backtestRuns.$inferSelect;
export type BacktestResult = typeof backtestResults.$inferSelect;
export type ValidationPeriod = typeof validationPeriods.$inferSelect;
export type InsertBacktestRun = z.infer<typeof insertBacktestRunSchema>;
export type InsertBacktestResult = z.infer<typeof insertBacktestResultSchema>;
export type InsertValidationPeriod = z.infer<typeof insertValidationPeriodSchema>;
