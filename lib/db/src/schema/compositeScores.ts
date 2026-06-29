import { pgTable, serial, text, real, date, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const compositeScores = pgTable("composite_scores", {
  id:                     serial("id").primaryKey(),
  ticker:                 text("ticker").notNull(),
  scoreDate:              date("score_date").notNull(),
  compositeScore:         real("composite_score").notNull(),
  regime:                 text("regime").notNull().default("neutral"),
  currencySensitivityFlag: boolean("currency_sensitivity_flag").notNull().default(false),
  factorAttribution:      jsonb("factor_attribution"),
  computedAt:             timestamp("computed_at", { withTimezone: true }).defaultNow(),
});

export const insertCompositeScoreSchema = createInsertSchema(compositeScores).omit({ id: true, computedAt: true });
export type InsertCompositeScore = z.infer<typeof insertCompositeScoreSchema>;
export type CompositeScore = typeof compositeScores.$inferSelect;
