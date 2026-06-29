import { pgTable, serial, text, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const factorDefinitions = pgTable("factor_definitions", {
  factorId:       serial("factor_id").primaryKey(),
  factorName:     text("factor_name").notNull().unique(),
  description:    text("description").notNull(),
  mechanism:      text("mechanism").notNull(),
  decayHorizon:   integer("decay_horizon_days"),
  formulaVersion: text("formula_version").notNull().default("1.0"),
  effectiveFrom:  date("effective_from").notNull(),
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertFactorDefinitionSchema = createInsertSchema(factorDefinitions).omit({ factorId: true, createdAt: true });
export type InsertFactorDefinition = z.infer<typeof insertFactorDefinitionSchema>;
export type FactorDefinition = typeof factorDefinitions.$inferSelect;
