import { pgTable, serial, text, real, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const portfolioTargets = pgTable("portfolio_targets", {
  id:             serial("id").primaryKey(),
  ticker:         text("ticker").notNull(),
  targetWeight:   real("target_weight").notNull(),
  actualWeight:   real("actual_weight"),
  rebalanceDate:  date("rebalance_date").notNull(),
  currencyFlag:   text("currency_flag").notNull().default("ZAR"),
  computedAt:     timestamp("computed_at", { withTimezone: true }).defaultNow(),
});

export const insertPortfolioTargetSchema = createInsertSchema(portfolioTargets).omit({ id: true, computedAt: true });
export type InsertPortfolioTarget = z.infer<typeof insertPortfolioTargetSchema>;
export type PortfolioTarget = typeof portfolioTargets.$inferSelect;
