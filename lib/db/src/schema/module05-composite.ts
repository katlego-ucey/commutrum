import {
  pgTable,
  serial,
  text,
  date,
  real,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const regimeClassifications = pgTable(
  "regime_classifications",
  {
    id: serial("id").primaryKey(),
    classificationDate: date("classification_date").notNull(),
    regime: text("regime").notNull(),
    trailing180dReturn: real("trailing_180d_return"),
    trailing60dVolatility: real("trailing_60d_volatility"),
    yieldCurveSlope: real("yield_curve_slope"),
    computedAt: timestamp("computed_at").notNull().defaultNow(),
  },
  (t) => [
    index("regime_classifications_date_idx").on(t.classificationDate),
  ]
);

export const regimeWeightProfiles = pgTable(
  "regime_weight_profiles",
  {
    id: serial("id").primaryKey(),
    regime: text("regime").notNull(),
    factorId: text("factor_id").notNull(),
    weight: real("weight").notNull(),
    effectiveFrom: date("effective_from").notNull(),
    effectiveTo: date("effective_to"),
    rationale: text("rationale"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("regime_weight_profiles_regime_idx").on(t.regime, t.effectiveFrom),
  ]
);

export const compositeScores = pgTable(
  "composite_scores",
  {
    id: serial("id").primaryKey(),
    ticker: text("ticker").notNull(),
    scoreDate: date("score_date").notNull(),
    publicationDate: date("publication_date").notNull(),
    compositeScore: real("composite_score"),
    regime: text("regime"),
    factorAttribution: jsonb("factor_attribution"),
    currencySensitivityFlag: boolean("currency_sensitivity_flag").notNull().default(false),
    computedAt: timestamp("computed_at").notNull().defaultNow(),
  },
  (t) => [
    index("composite_scores_ticker_date_idx").on(t.ticker, t.scoreDate),
    index("composite_scores_publication_date_idx").on(t.publicationDate),
  ]
);

export const interactionTerms = pgTable(
  "interaction_terms",
  {
    id: serial("id").primaryKey(),
    termName: text("term_name").notNull(),
    factorIdA: text("factor_id_a").notNull(),
    factorIdB: text("factor_id_b").notNull(),
    hypothesisRegistryId: text("hypothesis_registry_id"),
    effectiveFrom: date("effective_from").notNull(),
    effectiveTo: date("effective_to"),
    rationale: text("rationale"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  }
);

export const insertRegimeClassificationSchema = createInsertSchema(regimeClassifications).omit({ id: true, computedAt: true });
export const insertCompositeScoreSchema = createInsertSchema(compositeScores).omit({ id: true, computedAt: true });

export type RegimeClassification = typeof regimeClassifications.$inferSelect;
export type RegimeWeightProfile = typeof regimeWeightProfiles.$inferSelect;
export type CompositeScore = typeof compositeScores.$inferSelect;
export type InteractionTerm = typeof interactionTerms.$inferSelect;
export type InsertRegimeClassification = z.infer<typeof insertRegimeClassificationSchema>;
export type InsertCompositeScore = z.infer<typeof insertCompositeScoreSchema>;
