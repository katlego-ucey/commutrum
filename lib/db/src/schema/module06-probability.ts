import {
  pgTable,
  serial,
  text,
  date,
  real,
  integer,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const calibrationModels = pgTable(
  "calibration_models",
  {
    id: serial("id").primaryKey(),
    modelVersion: integer("model_version").notNull(),
    method: text("method").notNull(),
    fitDate: date("fit_date").notNull(),
    paramA: real("param_a"),
    paramB: real("param_b"),
    isotronicSteps: jsonb("isotropic_steps"),
    validationMetric: real("validation_metric"),
    sampleSize: integer("sample_size"),
    effectiveFrom: date("effective_from").notNull(),
    effectiveTo: date("effective_to"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("calibration_models_effective_idx").on(t.effectiveFrom),
  ]
);

export const calibrationCurves = pgTable(
  "calibration_curves",
  {
    id: serial("id").primaryKey(),
    modelId: integer("model_id")
      .notNull()
      .references(() => calibrationModels.id),
    scoreBin: real("score_bin").notNull(),
    observedFrequency: real("observed_frequency").notNull(),
    sampleCount: integer("sample_count"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("calibration_curves_model_idx").on(t.modelId),
  ]
);

export const probabilityOutputs = pgTable(
  "probability_outputs",
  {
    id: serial("id").primaryKey(),
    ticker: text("ticker").notNull(),
    outputDate: date("output_date").notNull(),
    publicationDate: date("publication_date").notNull(),
    compositeScore: real("composite_score"),
    probabilityPositiveReturn1m: real("probability_positive_return_1m"),
    expectedReturn1m: real("expected_return_1m"),
    confidenceIntervalLow90: real("confidence_interval_low_90"),
    confidenceIntervalHigh90: real("confidence_interval_high_90"),
    historicalWinRate: real("historical_win_rate"),
    calibrationSampleSize: integer("calibration_sample_size"),
    riskLevel: text("risk_level"),
    modelId: integer("model_id").references(() => calibrationModels.id),
    computedAt: timestamp("computed_at").notNull().defaultNow(),
  },
  (t) => [
    index("probability_outputs_ticker_date_idx").on(t.ticker, t.outputDate),
    index("probability_outputs_publication_date_idx").on(t.publicationDate),
  ]
);

export const insertCalibrationModelSchema = createInsertSchema(calibrationModels).omit({ id: true, createdAt: true });
export const insertProbabilityOutputSchema = createInsertSchema(probabilityOutputs).omit({ id: true, computedAt: true });

export type CalibrationModel = typeof calibrationModels.$inferSelect;
export type CalibrationCurve = typeof calibrationCurves.$inferSelect;
export type ProbabilityOutput = typeof probabilityOutputs.$inferSelect;
export type InsertCalibrationModel = z.infer<typeof insertCalibrationModelSchema>;
export type InsertProbabilityOutput = z.infer<typeof insertProbabilityOutputSchema>;
