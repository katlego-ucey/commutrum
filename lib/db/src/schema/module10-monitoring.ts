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

export const monitoringMetricsDaily = pgTable(
  "monitoring_metrics_daily",
  {
    id: serial("id").primaryKey(),
    metricDate: date("metric_date").notNull(),
    factorId: text("factor_id"),
    metricName: text("metric_name").notNull(),
    value: real("value").notNull(),
    rollingWindowDays: real("rolling_window_days"),
    validatedBandLow: real("validated_band_low"),
    validatedBandHigh: real("validated_band_high"),
    isWithinBand: boolean("is_within_band"),
    computedAt: timestamp("computed_at").notNull().defaultNow(),
  },
  (t) => [
    index("monitoring_metrics_date_idx").on(t.metricDate),
    index("monitoring_metrics_factor_date_idx").on(t.factorId, t.metricDate),
  ]
);

export const alertLog = pgTable(
  "alert_log",
  {
    id: serial("id").primaryKey(),
    alertDate: date("alert_date").notNull(),
    alertType: text("alert_type").notNull(),
    factorId: text("factor_id"),
    severity: text("severity").notNull(),
    message: text("message").notNull(),
    metricName: text("metric_name"),
    observedValue: real("observed_value"),
    thresholdValue: real("threshold_value"),
    acknowledged: boolean("acknowledged").notNull().default(false),
    acknowledgedAt: timestamp("acknowledged_at"),
    acknowledgedBy: text("acknowledged_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("alert_log_date_idx").on(t.alertDate),
    index("alert_log_acknowledged_idx").on(t.acknowledged),
  ]
);

export const insertMonitoringMetricSchema = createInsertSchema(monitoringMetricsDaily).omit({ id: true, computedAt: true });
export const insertAlertLogSchema = createInsertSchema(alertLog).omit({ id: true, createdAt: true });

export type MonitoringMetricDaily = typeof monitoringMetricsDaily.$inferSelect;
export type AlertLog = typeof alertLog.$inferSelect;
export type InsertMonitoringMetric = z.infer<typeof insertMonitoringMetricSchema>;
export type InsertAlertLog = z.infer<typeof insertAlertLogSchema>;
