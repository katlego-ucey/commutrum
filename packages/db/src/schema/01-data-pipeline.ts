import { pgTable, text, date, boolean, numeric, timestamp, integer, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { tickers } from "./00-universe";

export const tradingCalendar = pgTable(
  "trading_calendar",
  {
    calendarDate: date("calendar_date").primaryKey(),
    isTradingDay: boolean("is_trading_day").notNull(),
    holidayName: text("holiday_name"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
);

export const rawMarketData = pgTable(
  "raw_market_data",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    ticker: text("ticker").notNull().references(() => tickers.ticker),
    tradeDate: date("trade_date").notNull(),
    openZar: numeric("open_zar", { precision: 20, scale: 6 }),
    highZar: numeric("high_zar", { precision: 20, scale: 6 }),
    lowZar: numeric("low_zar", { precision: 20, scale: 6 }),
    closeZar: numeric("close_zar", { precision: 20, scale: 6 }).notNull(),
    adjustedCloseZar: numeric("adjusted_close_zar", { precision: 20, scale: 6 }).notNull(),
    volume: numeric("volume", { precision: 20, scale: 0 }),
    tradedValueZar: numeric("traded_value_zar", { precision: 20, scale: 2 }),
    source: text("source").notNull().default("eodhd"),
    ingestedAt: timestamp("ingested_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("raw_market_data_ticker_date_uniq").on(t.ticker, t.tradeDate),
    index("raw_market_data_ticker_idx").on(t.ticker),
    index("raw_market_data_date_idx").on(t.tradeDate),
  ],
);

export const rawCorporateActions = pgTable(
  "raw_corporate_actions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    ticker: text("ticker").notNull().references(() => tickers.ticker),
    actionDate: date("action_date").notNull(),
    publicationDate: date("publication_date").notNull(),
    actionType: text("action_type").notNull(),
    ratio: numeric("ratio", { precision: 20, scale: 10 }),
    description: text("description"),
    source: text("source").notNull().default("eodhd"),
    ingestedAt: timestamp("ingested_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("raw_corporate_actions_ticker_idx").on(t.ticker)],
);

export const rawDividends = pgTable(
  "raw_dividends",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    ticker: text("ticker").notNull().references(() => tickers.ticker),
    exDividendDate: date("ex_dividend_date").notNull(),
    publicationDate: date("publication_date").notNull(),
    dividendZar: numeric("dividend_zar", { precision: 20, scale: 6 }).notNull(),
    dividendType: text("dividend_type").default("ordinary"),
    source: text("source").notNull().default("eodhd"),
    ingestedAt: timestamp("ingested_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("raw_dividends_ticker_exdate_uniq").on(t.ticker, t.exDividendDate),
    index("raw_dividends_ticker_idx").on(t.ticker),
  ],
);

export const rawFundamentals = pgTable(
  "raw_fundamentals",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    ticker: text("ticker").notNull().references(() => tickers.ticker),
    periodEnd: date("period_end").notNull(),
    publicationDate: date("publication_date").notNull(),
    periodType: text("period_type").notNull(),
    revenue: numeric("revenue", { precision: 20, scale: 2 }),
    netIncome: numeric("net_income", { precision: 20, scale: 2 }),
    operatingCashFlow: numeric("operating_cash_flow", { precision: 20, scale: 2 }),
    totalAssets: numeric("total_assets", { precision: 20, scale: 2 }),
    totalDebt: numeric("total_debt", { precision: 20, scale: 2 }),
    currentAssets: numeric("current_assets", { precision: 20, scale: 2 }),
    currentLiabilities: numeric("current_liabilities", { precision: 20, scale: 2 }),
    sharesOutstanding: numeric("shares_outstanding", { precision: 20, scale: 0 }),
    grossProfit: numeric("gross_profit", { precision: 20, scale: 2 }),
    epsBasic: numeric("eps_basic", { precision: 20, scale: 6 }),
    bookValuePerShare: numeric("book_value_per_share", { precision: 20, scale: 6 }),
    auditOpinion: text("audit_opinion"),
    source: text("source").notNull().default("eodhd"),
    ingestedAt: timestamp("ingested_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("raw_fundamentals_ticker_period_pub_uniq").on(t.ticker, t.periodEnd, t.publicationDate),
    index("raw_fundamentals_pub_date_idx").on(t.publicationDate),
  ],
);

export const rawAnalystEstimates = pgTable(
  "raw_analyst_estimates",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    ticker: text("ticker").notNull().references(() => tickers.ticker),
    publicationDate: date("publication_date").notNull(),
    forecastPeriodEnd: date("forecast_period_end").notNull(),
    meanEpsEstimate: numeric("mean_eps_estimate", { precision: 20, scale: 6 }),
    analystCount: integer("analyst_count"),
    source: text("source").notNull().default("eodhd"),
    ingestedAt: timestamp("ingested_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("raw_analyst_estimates_ticker_pub_idx").on(t.ticker, t.publicationDate),
  ],
);

export const rawEstimateRevisions = pgTable(
  "raw_estimate_revisions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    ticker: text("ticker").notNull().references(() => tickers.ticker),
    revisionDate: date("revision_date").notNull(),
    publicationDate: date("publication_date").notNull(),
    forecastPeriodEnd: date("forecast_period_end").notNull(),
    previousEstimate: numeric("previous_estimate", { precision: 20, scale: 6 }),
    newEstimate: numeric("new_estimate", { precision: 20, scale: 6 }),
    revisionDirection: text("revision_direction"),
    source: text("source").notNull().default("eodhd"),
    ingestedAt: timestamp("ingested_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("raw_estimate_revisions_ticker_idx").on(t.ticker, t.revisionDate),
  ],
);

export const macroSeries = pgTable(
  "macro_series",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    seriesCode: text("series_code").notNull(),
    observationDate: date("observation_date").notNull(),
    publicationDate: date("publication_date").notNull(),
    value: numeric("value", { precision: 20, scale: 6 }).notNull(),
    unit: text("unit"),
    source: text("source").notNull(),
    ingestedAt: timestamp("ingested_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("macro_series_code_obs_pub_uniq").on(t.seriesCode, t.observationDate, t.publicationDate),
    index("macro_series_code_date_idx").on(t.seriesCode, t.observationDate),
  ],
);

export const dataQualityLog = pgTable(
  "data_quality_log",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    ticker: text("ticker").references(() => tickers.ticker),
    checkDate: date("check_date").notNull(),
    checkType: text("check_type").notNull(),
    passed: boolean("passed").notNull(),
    detail: text("detail"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("data_quality_log_ticker_date_idx").on(t.ticker, t.checkDate)],
);

export const insertRawMarketDataSchema = createInsertSchema(rawMarketData);
export const selectRawMarketDataSchema = createSelectSchema(rawMarketData);
export type RawMarketData = typeof rawMarketData.$inferSelect;
export type InsertRawMarketData = typeof rawMarketData.$inferInsert;

export const insertRawFundamentalsSchema = createInsertSchema(rawFundamentals);
export type RawFundamentals = typeof rawFundamentals.$inferSelect;
export type InsertRawFundamentals = typeof rawFundamentals.$inferInsert;

export const insertTradingCalendarSchema = createInsertSchema(tradingCalendar);
export type TradingCalendar = typeof tradingCalendar.$inferSelect;
export type InsertTradingCalendar = typeof tradingCalendar.$inferInsert;
