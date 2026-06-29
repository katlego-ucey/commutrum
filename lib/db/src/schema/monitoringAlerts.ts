import { pgTable, serial, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const alertSeverityEnum = pgEnum("alert_severity", ["info", "warning", "critical"]);

export const monitoringAlerts = pgTable("monitoring_alerts", {
  id:             serial("id").primaryKey(),
  alertDate:      timestamp("alert_date", { withTimezone: true }).defaultNow(),
  alertType:      text("alert_type").notNull(),
  factorId:       text("factor_id"),
  severity:       alertSeverityEnum("severity").notNull().default("info"),
  message:        text("message").notNull(),
  acknowledged:   boolean("acknowledged").notNull().default(false),
  acknowledgedBy: text("acknowledged_by"),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertMonitoringAlertSchema = createInsertSchema(monitoringAlerts).omit({ id: true, createdAt: true });
export type InsertMonitoringAlert = z.infer<typeof insertMonitoringAlertSchema>;
export type MonitoringAlert = typeof monitoringAlerts.$inferSelect;
