import { pgTable, serial, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const lifecycleStatusEnum = pgEnum("lifecycle_status", [
  "R&D", "Validation", "Paper Portfolio", "Production", "Watch", "Under Review", "Suspended", "Retired",
]);

export const hypothesisRegistry = pgTable("hypothesis_registry", {
  id:            serial("id").primaryKey(),
  factorName:    text("factor_name").notNull(),
  mechanismType: text("mechanism_type").notNull(),
  rationale:     text("rationale"),
  status:        lifecycleStatusEnum("status").notNull().default("R&D"),
  registeredAt:  timestamp("registered_at", { withTimezone: true }).defaultNow(),
  updatedAt:     timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertHypothesisSchema = createInsertSchema(hypothesisRegistry).omit({ id: true, registeredAt: true, updatedAt: true });
export type InsertHypothesis = z.infer<typeof insertHypothesisSchema>;
export type Hypothesis = typeof hypothesisRegistry.$inferSelect;
