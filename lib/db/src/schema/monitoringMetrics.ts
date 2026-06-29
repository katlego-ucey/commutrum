import { pgTable, serial, text, real, date, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const monitoringMetrics = pgTable("monitoring_metrics_daily", {
  id:                 serial("id").primaryKey(),
  metricDate:         date("metric_date").notNull(),
  factorId:           text("factor_id").notNull(),
  metricName:         text("metric_name").notNull(),
  value:              real("value").notNull(),
  validatedBandLow:   real("validated_band_low"),
  validatedBandHigh:  real("validated_band_high"),
  isWithinBand:       boolean("is_within_band"),
  computedAt:         timestamp("computed_at", { withTimezone: true }).defaultNow(),
});

export const insertMonitoringMetricSchema = createInsertSchema(monitoringMetrics).omit({ id: true, computedAt: true });
export type InsertMonitoringMetric = z.infer<typeof insertMonitoringMetricSchema>;
export type MonitoringMetric = typeof monitoringMetrics.$inferSelect;
