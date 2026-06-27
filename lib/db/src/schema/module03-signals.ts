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

export const sectorMapping = pgTable(
  "sector_mapping",
  {
    id: serial("id").primaryKey(),
    ticker: text("ticker").notNull(),
    sector: text("sector").notNull(),
    subSector: text("sub_sector"),
    effectiveFrom: date("effective_from").notNull(),
    effectiveTo: date("effective_to"),
    source: text("source"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("sector_mapping_ticker_idx").on(t.ticker, t.effectiveFrom),
  ]
);

export const factorSignals = pgTable(
  "factor_signals",
  {
    id: serial("id").primaryKey(),
    ticker: text("ticker").notNull(),
    factorId: text("factor_id").notNull(),
    signalDate: date("signal_date").notNull(),
    publicationDate: date("publication_date").notNull(),
    rawValue: real("raw_value"),
    sectorRelative: real("sector_relative"),
    zScore: real("z_score"),
    zScoreWinsorized: real("z_score_winsorized"),
    sector: text("sector"),
    computedAt: timestamp("computed_at").notNull().defaultNow(),
  },
  (t) => [
    index("factor_signals_ticker_date_idx").on(t.ticker, t.signalDate),
    index("factor_signals_factor_date_idx").on(t.factorId, t.signalDate),
    index("factor_signals_publication_date_idx").on(t.publicationDate),
  ]
);

export const insertSectorMappingSchema = createInsertSchema(sectorMapping).omit({ id: true, createdAt: true });
export const insertFactorSignalSchema = createInsertSchema(factorSignals).omit({ id: true, computedAt: true });

export type SectorMapping = typeof sectorMapping.$inferSelect;
export type FactorSignal = typeof factorSignals.$inferSelect;
export type InsertSectorMapping = z.infer<typeof insertSectorMappingSchema>;
export type InsertFactorSignal = z.infer<typeof insertFactorSignalSchema>;
