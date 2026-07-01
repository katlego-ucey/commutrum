import { pgTable, text, date, boolean, numeric, timestamp, integer, index, unique, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { tickers } from "./00-universe";

export const factorDefinitions = pgTable("factor_definitions", {
  factorId: text("factor_id").primaryKey(),
  name: text("name").notNull(),
  mechanism: text("mechanism").notNull(),
  decayHorizon: text("decay_horizon").notNull(),
  formulaVersion: text("formula_version").notNull(),
  requiredData: text("required_data").array(),
  academicReference: text("academic_reference"),
  hypothesisRegistryId: text("hypothesis_registry_id"),
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const factorRawValues = pgTable(
  "factor_raw_values",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    ticker: text("ticker").notNull().references(() => tickers.ticker),
    computeDate: date("compute_date").notNull(),
    factorId: text("factor_id").notNull().references(() => factorDefinitions.factorId),
    rawValue: numeric("raw_value", { precision: 20, scale: 10 }),
    computedFromPublicationDate: date("computed_from_publication_date").notNull(),
    formulaVersion: text("formula_version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("factor_raw_values_ticker_date_factor_uniq").on(t.ticker, t.computeDate, t.factorId),
    index("factor_raw_values_date_factor_idx").on(t.computeDate, t.factorId),
  ],
);

export const sectorMapping = pgTable("sector_mapping", {
  ticker: text("ticker").notNull().references(() => tickers.ticker),
  sector: text("sector").notNull(),
  subSector: text("sub_sector"),
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
  source: text("source").notNull().default("jse"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const factorSignals = pgTable(
  "factor_signals",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    ticker: text("ticker").notNull().references(() => tickers.ticker),
    signalDate: date("signal_date").notNull(),
    factorId: text("factor_id").notNull().references(() => factorDefinitions.factorId),
    rawValue: numeric("raw_value", { precision: 20, scale: 10 }),
    zScore: numeric("z_score", { precision: 10, scale: 6 }),
    winsorizedZScore: numeric("winsorized_z_score", { precision: 10, scale: 6 }),
    sectorRank: integer("sector_rank"),
    sectorPercentile: numeric("sector_percentile", { precision: 5, scale: 4 }),
    sector: text("sector"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("factor_signals_ticker_date_factor_uniq").on(t.ticker, t.signalDate, t.factorId),
    index("factor_signals_date_factor_idx").on(t.signalDate, t.factorId),
  ],
);

export const signalCorrelationMatrix = pgTable(
  "signal_correlation_matrix",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    computeDate: date("compute_date").notNull(),
    factor1Id: text("factor1_id").notNull().references(() => factorDefinitions.factorId),
    factor2Id: text("factor2_id").notNull().references(() => factorDefinitions.factorId),
    correlation: numeric("correlation", { precision: 10, scale: 6 }).notNull(),
    pValue: numeric("p_value", { precision: 10, scale: 8 }),
    sampleSize: integer("sample_size"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("signal_corr_date_idx").on(t.computeDate)],
);

export const signalClusters = pgTable("signal_clusters", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  computeDate: date("compute_date").notNull(),
  clusterLabel: text("cluster_label").notNull(),
  factorIds: text("factor_ids").array().notNull(),
  method: text("method").notNull().default("pca"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orthogonalizedSignals = pgTable(
  "orthogonalized_signals",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    ticker: text("ticker").notNull().references(() => tickers.ticker),
    signalDate: date("signal_date").notNull(),
    factorId: text("factor_id").notNull().references(() => factorDefinitions.factorId),
    orthogonalizedValue: numeric("orthogonalized_value", { precision: 10, scale: 6 }).notNull(),
    varianceInflationFactor: numeric("variance_inflation_factor", { precision: 10, scale: 4 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("orth_signals_ticker_date_factor_uniq").on(t.ticker, t.signalDate, t.factorId),
  ],
);

export const regimeClassifications = pgTable(
  "regime_classifications",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    classificationDate: date("classification_date").notNull(),
    regime: text("regime").notNull(),
    confidence: numeric("confidence", { precision: 5, scale: 4 }),
    jse40Return1m: numeric("jse40_return_1m", { precision: 10, scale: 6 }),
    repoRate: numeric("repo_rate", { precision: 6, scale: 4 }),
    zarUsd: numeric("zar_usd", { precision: 10, scale: 6 }),
    cpiYoy: numeric("cpi_yoy", { precision: 6, scale: 4 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique("regime_class_date_uniq").on(t.classificationDate)],
);

export const regimeWeightProfiles = pgTable("regime_weight_profiles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  profileVersion: text("profile_version").notNull(),
  regime: text("regime").notNull(),
  factorId: text("factor_id").notNull().references(() => factorDefinitions.factorId),
  weight: numeric("weight", { precision: 6, scale: 4 }).notNull(),
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
  rationale: text("rationale"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const compositeScores = pgTable(
  "composite_scores",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    ticker: text("ticker").notNull().references(() => tickers.ticker),
    scoreDate: date("score_date").notNull(),
    compositeScore: numeric("composite_score", { precision: 10, scale: 6 }).notNull(),
    regime: text("regime").notNull(),
    profileVersion: text("profile_version").notNull(),
    componentScores: jsonb("component_scores"),
    universeRank: integer("universe_rank"),
    universePercentile: numeric("universe_percentile", { precision: 5, scale: 4 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("composite_scores_ticker_date_uniq").on(t.ticker, t.scoreDate),
    index("composite_scores_date_rank_idx").on(t.scoreDate, t.universeRank),
  ],
);

export const interactionTerms = pgTable(
  "interaction_terms",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    ticker: text("ticker").notNull().references(() => tickers.ticker),
    computeDate: date("compute_date").notNull(),
    factor1Id: text("factor1_id").notNull(),
    factor2Id: text("factor2_id").notNull(),
    interactionValue: numeric("interaction_value", { precision: 10, scale: 6 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
);

export const calibrationModels = pgTable("calibration_models", {
  modelId: text("model_id").primaryKey(),
  method: text("method").notNull(),
  trainedOn: date("trained_on").notNull(),
  trainingWindowMonths: integer("training_window_months").notNull(),
  binCount: integer("bin_count"),
  brierScore: numeric("brier_score", { precision: 10, scale: 8 }),
  isActive: boolean("is_active").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const calibrationCurves = pgTable(
  "calibration_curves",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    modelId: text("model_id").notNull().references(() => calibrationModels.modelId),
    binLow: numeric("bin_low", { precision: 6, scale: 4 }).notNull(),
    binHigh: numeric("bin_high", { precision: 6, scale: 4 }).notNull(),
    meanPredicted: numeric("mean_predicted", { precision: 6, scale: 4 }).notNull(),
    fractionPositive: numeric("fraction_positive", { precision: 6, scale: 4 }).notNull(),
    sampleCount: integer("sample_count").notNull(),
  },
);

export const probabilityOutputs = pgTable(
  "probability_outputs",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    ticker: text("ticker").notNull().references(() => tickers.ticker),
    outputDate: date("output_date").notNull(),
    calibratedProbability: numeric("calibrated_probability", { precision: 6, scale: 4 }).notNull(),
    rawScore: numeric("raw_score", { precision: 10, scale: 6 }).notNull(),
    modelId: text("model_id").notNull().references(() => calibrationModels.modelId),
    confidenceInterval90Low: numeric("confidence_interval_90_low", { precision: 6, scale: 4 }),
    confidenceInterval90High: numeric("confidence_interval_90_high", { precision: 6, scale: 4 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("prob_outputs_ticker_date_uniq").on(t.ticker, t.outputDate),
    index("prob_outputs_date_prob_idx").on(t.outputDate, t.calibratedProbability),
  ],
);

export type FactorDefinition = typeof factorDefinitions.$inferSelect;
export type CompositeScore = typeof compositeScores.$inferSelect;
export type ProbabilityOutput = typeof probabilityOutputs.$inferSelect;
export type RegimeClassification = typeof regimeClassifications.$inferSelect;
