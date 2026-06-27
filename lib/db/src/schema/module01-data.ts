import {
  pgTable,
  serial,
  text,
  date,
  real,
  boolean,
  timestamp,
  integer,
  bigint,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rawMarketData = pgTable(
  "raw_market_data",
  {
    id: serial("id").primaryKey(),
    ticker: text("ticker").notNull(),
    tradeDate: date("trade_date").notNull(),
    open: real("open"),
    high: real("high"),
    low: real("low"),
    close: real("close").notNull(),
    volume: bigint("volume", { mode: "number" }),
    vwap: real("vwap"),
    ingestionTs: timestamp("ingestion_ts").notNull().defaultNow(),
  },
  (t) => [
    index("raw_market_data_ticker_date_idx").on(t.ticker, t.tradeDate),
  ]
);

export const rawCorporateActions = pgTable(
  "raw_corporate_actions",
  {
    id: serial("id").primaryKey(),
    ticker: text("ticker").notNull(),
    actionType: text("action_type").notNull(),
    exDate: date("ex_date").notNull(),
    recordDate: date("record_date"),
    paymentDate: date("payment_date"),
    factor: real("factor"),
    details: text("details"),
    publicationDate: date("publication_date").notNull(),
    ingestionTs: timestamp("ingestion_ts").notNull().defaultNow(),
  },
  (t) => [
    index("raw_corporate_actions_ticker_date_idx").on(t.ticker, t.exDate),
  ]
);

export const rawDividends = pgTable(
  "raw_dividends",
  {
    id: serial("id").primaryKey(),
    ticker: text("ticker").notNull(),
    exDate: date("ex_date").notNull(),
    paymentDate: date("payment_date"),
    dividendZar: real("dividend_zar"),
    dividendType: text("dividend_type"),
    publicationDate: date("publication_date").notNull(),
    ingestionTs: timestamp("ingestion_ts").notNull().defaultNow(),
  },
  (t) => [
    index("raw_dividends_ticker_date_idx").on(t.ticker, t.exDate),
  ]
);

export const rawFundamentals = pgTable(
  "raw_fundamentals",
  {
    id: serial("id").primaryKey(),
    ticker: text("ticker").notNull(),
    periodEndDate: date("period_end_date").notNull(),
    publicationDate: date("publication_date").notNull(),
    periodType: text("period_type").notNull(),
    revenue: real("revenue"),
    ebit: real("ebit"),
    netIncome: real("net_income"),
    totalAssets: real("total_assets"),
    totalLiabilities: real("total_liabilities"),
    equity: real("equity"),
    operatingCashFlow: real("operating_cash_flow"),
    capex: real("capex"),
    longTermDebt: real("long_term_debt"),
    sharesOutstanding: bigint("shares_outstanding", { mode: "number" }),
    eps: real("eps"),
    dps: real("dps"),
    bookValuePerShare: real("book_value_per_share"),
    roa: real("roa"),
    roe: real("roe"),
    currentRatio: real("current_ratio"),
    debtToEquity: real("debt_to_equity"),
    grossMargin: real("gross_margin"),
    operatingMargin: real("operating_margin"),
    ingestionTs: timestamp("ingestion_ts").notNull().defaultNow(),
  },
  (t) => [
    index("raw_fundamentals_ticker_period_idx").on(t.ticker, t.periodEndDate),
    index("raw_fundamentals_publication_date_idx").on(t.publicationDate),
  ]
);

export const rawSensAnnouncements = pgTable(
  "raw_sens_announcements",
  {
    id: serial("id").primaryKey(),
    ticker: text("ticker").notNull(),
    announcementDate: date("announcement_date").notNull(),
    publicationDate: date("publication_date").notNull(),
    category: text("category"),
    headline: text("headline"),
    body: text("body"),
    ingestionTs: timestamp("ingestion_ts").notNull().defaultNow(),
  },
  (t) => [
    index("raw_sens_ticker_date_idx").on(t.ticker, t.announcementDate),
  ]
);

export const rawAnalystEstimates = pgTable(
  "raw_analyst_estimates",
  {
    id: serial("id").primaryKey(),
    ticker: text("ticker").notNull(),
    fiscalPeriodEnd: date("fiscal_period_end").notNull(),
    publicationDate: date("publication_date").notNull(),
    analystFirm: text("analyst_firm"),
    epsEstimate: real("eps_estimate"),
    revenueEstimate: real("revenue_estimate"),
    ebitdaEstimate: real("ebitda_estimate"),
    priceTarget: real("price_target"),
    rating: text("rating"),
    ingestionTs: timestamp("ingestion_ts").notNull().defaultNow(),
  },
  (t) => [
    index("raw_analyst_estimates_ticker_date_idx").on(t.ticker, t.publicationDate),
  ]
);

export const rawEstimateRevisions = pgTable(
  "raw_estimate_revisions",
  {
    id: serial("id").primaryKey(),
    ticker: text("ticker").notNull(),
    revisionDate: date("revision_date").notNull(),
    publicationDate: date("publication_date").notNull(),
    metric: text("metric").notNull(),
    priorEstimate: real("prior_estimate"),
    revisedEstimate: real("revised_estimate"),
    revisionPct: real("revision_pct"),
    analystFirm: text("analyst_firm"),
    ingestionTs: timestamp("ingestion_ts").notNull().defaultNow(),
  },
  (t) => [
    index("raw_estimate_revisions_ticker_date_idx").on(t.ticker, t.revisionDate),
  ]
);

export const macroSeries = pgTable(
  "macro_series",
  {
    id: serial("id").primaryKey(),
    seriesName: text("series_name").notNull(),
    observationDate: date("observation_date").notNull(),
    publicationDate: date("publication_date").notNull(),
    value: real("value").notNull(),
    unit: text("unit"),
    source: text("source"),
    ingestionTs: timestamp("ingestion_ts").notNull().defaultNow(),
  },
  (t) => [
    index("macro_series_name_date_idx").on(t.seriesName, t.observationDate),
  ]
);

export const dataQualityLog = pgTable(
  "data_quality_log",
  {
    id: serial("id").primaryKey(),
    ticker: text("ticker"),
    checkDate: date("check_date").notNull(),
    checkType: text("check_type").notNull(),
    passed: boolean("passed").notNull(),
    severity: text("severity"),
    message: text("message"),
    affectedField: text("affected_field"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("data_quality_log_ticker_date_idx").on(t.ticker, t.checkDate),
  ]
);

export const insertRawMarketDataSchema = createInsertSchema(rawMarketData).omit({ id: true, ingestionTs: true });
export const insertRawFundamentalsSchema = createInsertSchema(rawFundamentals).omit({ id: true, ingestionTs: true });

export type RawMarketData = typeof rawMarketData.$inferSelect;
export type RawFundamentals = typeof rawFundamentals.$inferSelect;
export type RawCorporateAction = typeof rawCorporateActions.$inferSelect;
export type RawDividend = typeof rawDividends.$inferSelect;
export type RawSensAnnouncement = typeof rawSensAnnouncements.$inferSelect;
export type RawAnalystEstimate = typeof rawAnalystEstimates.$inferSelect;
export type RawEstimateRevision = typeof rawEstimateRevisions.$inferSelect;
export type MacroSeries = typeof macroSeries.$inferSelect;
export type DataQualityLog = typeof dataQualityLog.$inferSelect;
export type InsertRawMarketData = z.infer<typeof insertRawMarketDataSchema>;
export type InsertRawFundamentals = z.infer<typeof insertRawFundamentalsSchema>;
