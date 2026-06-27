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

export const decayAlerts = pgTable(
  "decay_alerts",
  {
    id: serial("id").primaryKey(),
    alertDate: date("alert_date").notNull(),
    factorId: text("factor_id").notNull(),
    decayRule: text("decay_rule").notNull(),
    observedValue: real("observed_value"),
    thresholdValue: real("threshold_value"),
    consecutivePeriods: real("consecutive_periods"),
    status: text("status").notNull().default("open"),
    resolution: text("resolution"),
    resolvedAt: timestamp("resolved_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("decay_alerts_factor_date_idx").on(t.factorId, t.alertDate),
    index("decay_alerts_status_idx").on(t.status),
  ]
);

export const decayInvestigationLog = pgTable(
  "decay_investigation_log",
  {
    id: serial("id").primaryKey(),
    alertId: serial("alert_id")
      .notNull()
      .references(() => decayAlerts.id),
    investigatedAt: timestamp("investigated_at").notNull().defaultNow(),
    investigator: text("investigator"),
    rootCauseCategory: text("root_cause_category"),
    findings: text("findings"),
    decision: text("decision"),
    decisionRationale: text("decision_rationale"),
  },
  (t) => [
    index("decay_investigation_alert_idx").on(t.alertId),
  ]
);

export const insertDecayAlertSchema = createInsertSchema(decayAlerts).omit({ id: true, createdAt: true });
export const insertDecayInvestigationSchema = createInsertSchema(decayInvestigationLog).omit({ id: true, investigatedAt: true });

export type DecayAlert = typeof decayAlerts.$inferSelect;
export type DecayInvestigationLog = typeof decayInvestigationLog.$inferSelect;
export type InsertDecayAlert = z.infer<typeof insertDecayAlertSchema>;
export type InsertDecayInvestigation = z.infer<typeof insertDecayInvestigationSchema>;
