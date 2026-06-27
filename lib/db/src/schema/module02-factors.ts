import {
  pgTable,
  serial,
  text,
  date,
  real,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const factorDefinitions = pgTable("factor_definitions", {
  id: serial("id").primaryKey(),
  factorId: text("factor_id").notNull().unique(),
  factorName: text("factor_name").notNull(),
  formulaVersion: integer("formula_version").notNull().default(1),
  description: text("description"),
  mechanism: text("mechanism"),
  decayHorizon: text("decay_horizon"),
  dataRequirements: text("data_requirements"),
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
  hypothesisRegistryId: integer("hypothesis_registry_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const factorRawValues = pgTable(
  "factor_raw_values",
  {
    id: serial("id").primaryKey(),
    ticker: text("ticker").notNull(),
    factorId: text("factor_id")
      .notNull()
      .references(() => factorDefinitions.factorId),
    computedAt: timestamp("computed_at").notNull(),
    asOfDate: date("as_of_date").notNull(),
    publicationDate: date("publication_date").notNull(),
    rawValue: real("raw_value"),
    formulaVersion: integer("formula_version").notNull(),
  },
  (t) => [
    index("factor_raw_values_ticker_date_idx").on(t.ticker, t.asOfDate),
    index("factor_raw_values_factor_id_idx").on(t.factorId),
    index("factor_raw_values_publication_date_idx").on(t.publicationDate),
  ]
);

export const insertFactorDefinitionSchema = createInsertSchema(factorDefinitions).omit({ id: true, createdAt: true });
export const insertFactorRawValueSchema = createInsertSchema(factorRawValues).omit({ id: true });

export type FactorDefinition = typeof factorDefinitions.$inferSelect;
export type FactorRawValue = typeof factorRawValues.$inferSelect;
export type InsertFactorDefinition = z.infer<typeof insertFactorDefinitionSchema>;
export type InsertFactorRawValue = z.infer<typeof insertFactorRawValueSchema>;
