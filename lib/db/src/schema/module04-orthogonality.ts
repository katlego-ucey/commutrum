import {
  pgTable,
  serial,
  text,
  date,
  real,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const signalCorrelationMatrix = pgTable(
  "signal_correlation_matrix",
  {
    id: serial("id").primaryKey(),
    computedAt: timestamp("computed_at").notNull(),
    asOfDate: date("as_of_date").notNull(),
    factorIdA: text("factor_id_a").notNull(),
    factorIdB: text("factor_id_b").notNull(),
    pearsonCorrelation: real("pearson_correlation").notNull(),
    vif: real("vif"),
    windowDays: real("window_days"),
  },
  (t) => [
    index("signal_corr_matrix_date_idx").on(t.asOfDate),
    index("signal_corr_matrix_factors_idx").on(t.factorIdA, t.factorIdB),
  ]
);

export const signalClusters = pgTable(
  "signal_clusters",
  {
    id: serial("id").primaryKey(),
    computedAt: timestamp("computed_at").notNull(),
    asOfDate: date("as_of_date").notNull(),
    clusterId: text("cluster_id").notNull(),
    factorId: text("factor_id").notNull(),
    isRepresentative: boolean("is_representative").notNull().default(false),
    reductionMethod: text("reduction_method"),
    notes: text("notes"),
  },
  (t) => [
    index("signal_clusters_date_idx").on(t.asOfDate),
    index("signal_clusters_cluster_idx").on(t.clusterId),
  ]
);

export const orthogonalizedSignals = pgTable(
  "orthogonalized_signals",
  {
    id: serial("id").primaryKey(),
    ticker: text("ticker").notNull(),
    factorId: text("factor_id").notNull(),
    signalDate: date("signal_date").notNull(),
    publicationDate: date("publication_date").notNull(),
    orthogonalizedValue: real("orthogonalized_value"),
    computedAt: timestamp("computed_at").notNull().defaultNow(),
  },
  (t) => [
    index("orthogonalized_signals_ticker_date_idx").on(t.ticker, t.signalDate),
    index("orthogonalized_signals_factor_date_idx").on(t.factorId, t.signalDate),
  ]
);

export const insertSignalCorrelationMatrixSchema = createInsertSchema(signalCorrelationMatrix).omit({ id: true });
export const insertSignalClusterSchema = createInsertSchema(signalClusters).omit({ id: true });
export const insertOrthogonalizedSignalSchema = createInsertSchema(orthogonalizedSignals).omit({ id: true, computedAt: true });

export type SignalCorrelationMatrix = typeof signalCorrelationMatrix.$inferSelect;
export type SignalCluster = typeof signalClusters.$inferSelect;
export type OrthogonalizedSignal = typeof orthogonalizedSignals.$inferSelect;
export type InsertSignalCorrelationMatrix = z.infer<typeof insertSignalCorrelationMatrixSchema>;
export type InsertSignalCluster = z.infer<typeof insertSignalClusterSchema>;
export type InsertOrthogonalizedSignal = z.infer<typeof insertOrthogonalizedSignalSchema>;
