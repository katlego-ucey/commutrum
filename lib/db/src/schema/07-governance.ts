import { pgTable, text, date, boolean, numeric, timestamp, integer, index, unique, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { factorDefinitions } from "./02-05-research";

export const backtestRuns = pgTable("backtest_runs", {
  runId: text("run_id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  trainStart: date("train_start").notNull(),
  trainEnd: date("train_end").notNull(),
  testStart: date("test_start").notNull(),
  testEnd: date("test_end").notNull(),
  rollingWindowMonths: integer("rolling_window_months").notNull(),
  factorIds: text("factor_ids").array().notNull(),
  costModelScenarioId: text("cost_model_scenario_id"),
  status: text("status").notNull().default("pending"),
  triggeredBy: text("triggered_by"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const backtestResults = pgTable(
  "backtest_results",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    runId: text("run_id").notNull().references(() => backtestRuns.runId),
    windowStart: date("window_start").notNull(),
    windowEnd: date("window_end").notNull(),
    annualisedReturnPct: numeric("annualised_return_pct", { precision: 8, scale: 4 }),
    benchmarkReturnPct: numeric("benchmark_return_pct", { precision: 8, scale: 4 }),
    sharpeRatio: numeric("sharpe_ratio", { precision: 8, scale: 4 }),
    sortinoRatio: numeric("sortino_ratio", { precision: 8, scale: 4 }),
    informationCoefficient: numeric("information_coefficient", { precision: 8, scale: 6 }),
    icir: numeric("icir", { precision: 8, scale: 6 }),
    maxDrawdownPct: numeric("max_drawdown_pct", { precision: 8, scale: 4 }),
    totalTurnoverPct: numeric("total_turnover_pct", { precision: 8, scale: 4 }),
    netOfCostsReturnPct: numeric("net_of_costs_return_pct", { precision: 8, scale: 4 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("backtest_results_run_id_idx").on(t.runId)],
);

export const validationPeriods = pgTable("validation_periods", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  runId: text("run_id").notNull().references(() => backtestRuns.runId),
  periodType: text("period_type").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isLocked: boolean("is_locked").notNull().default(false),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const monitoringMetricsDaily = pgTable(
  "monitoring_metrics_daily",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    metricDate: date("metric_date").notNull(),
    metricName: text("metric_name").notNull(),
    value: numeric("value", { precision: 20, scale: 8 }).notNull(),
    trailing30d: numeric("trailing_30d", { precision: 20, scale: 8 }),
    trailing90d: numeric("trailing_90d", { precision: 20, scale: 8 }),
    trailing252d: numeric("trailing_252d", { precision: 20, scale: 8 }),
    alertTriggered: boolean("alert_triggered").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("monitoring_metrics_date_name_uniq").on(t.metricDate, t.metricName),
    index("monitoring_metrics_date_idx").on(t.metricDate),
  ],
);

export const alertLog = pgTable(
  "alert_log",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    alertType: text("alert_type").notNull(),
    severity: text("severity").notNull(),
    message: text("message").notNull(),
    metricName: text("metric_name"),
    metricValue: numeric("metric_value", { precision: 20, scale: 8 }),
    threshold: numeric("threshold", { precision: 20, scale: 8 }),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
    acknowledgedBy: text("acknowledged_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("alert_log_created_at_idx").on(t.createdAt)],
);

export const decayAlerts = pgTable(
  "decay_alerts",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    factorId: text("factor_id").notNull().references(() => factorDefinitions.factorId),
    alertDate: date("alert_date").notNull(),
    decayType: text("decay_type").notNull(),
    icTrailing90d: numeric("ic_trailing_90d", { precision: 8, scale: 6 }),
    icTrailing252d: numeric("ic_trailing_252d", { precision: 8, scale: 6 }),
    icirTrailing252d: numeric("icir_trailing_252d", { precision: 8, scale: 6 }),
    status: text("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("decay_alerts_factor_date_idx").on(t.factorId, t.alertDate)],
);

export const decayInvestigationLog = pgTable("decay_investigation_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  alertId: text("alert_id").notNull().references(() => decayAlerts.id),
  investigatedBy: text("investigated_by"),
  finding: text("finding").notNull(),
  verdict: text("verdict").notNull(),
  action: text("action"),
  investigatedAt: timestamp("investigated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const factorCandidates = pgTable("factor_candidates", {
  candidateId: text("candidate_id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  hypothesisSummary: text("hypothesis_summary").notNull(),
  causality: text("causality").notNull(),
  proposedBy: text("proposed_by"),
  proposedDate: date("proposed_date").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const admissionGateResults = pgTable("admission_gate_results", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  candidateId: text("candidate_id").notNull().references(() => factorCandidates.candidateId),
  gateName: text("gate_name").notNull(),
  passed: boolean("passed").notNull(),
  evidenceRef: text("evidence_ref"),
  detail: text("detail"),
  evaluatedDate: date("evaluated_date").notNull(),
  evaluatedBy: text("evaluated_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const admissionDecisions = pgTable("admission_decisions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  candidateId: text("candidate_id").notNull().references(() => factorCandidates.candidateId),
  decision: text("decision").notNull(),
  decisionDate: date("decision_date").notNull(),
  rationale: text("rationale").notNull(),
  decisionBy: text("decision_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const hypothesisRegistry = pgTable("hypothesis_registry", {
  hypothesisId: text("hypothesis_id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  factorName: text("factor_name").notNull(),
  mechanism: text("mechanism").notNull(),
  academicSupport: text("academic_support"),
  expectedHorizon: text("expected_horizon").notNull(),
  requiredData: text("required_data").array(),
  failureCriteria: text("failure_criteria").notNull(),
  status: text("status").notNull().default("active"),
  registeredDate: date("registered_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const modelVersions = pgTable("model_versions", {
  versionId: text("version_id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  hypothesisId: text("hypothesis_id").notNull().references(() => hypothesisRegistry.hypothesisId),
  versionTag: text("version_tag").notNull(),
  formulaHash: text("formula_hash"),
  parameters: jsonb("parameters"),
  trainedOn: date("trained_on"),
  lifecycleStatus: text("lifecycle_status").notNull().default("candidate"),
  promotedAt: timestamp("promoted_at", { withTimezone: true }),
  retiredAt: timestamp("retired_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const registryAuditLog = pgTable(
  "registry_audit_log",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    action: text("action").notNull(),
    previousState: jsonb("previous_state"),
    newState: jsonb("new_state"),
    performedBy: text("performed_by"),
    performedAt: timestamp("performed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("registry_audit_log_entity_idx").on(t.entityType, t.entityId)],
);

export type BacktestRun = typeof backtestRuns.$inferSelect;
export type FactorCandidate = typeof factorCandidates.$inferSelect;
export type HypothesisRegistry = typeof hypothesisRegistry.$inferSelect;
