/**
 * Module 01 — Point-in-Time Data Pipeline ingestion service.
 * Issue #22: Survivorship-free data warehouse.
 *
 * Ingests EODHD data into the database. Prices stored in ZAR (÷100 from ZAc).
 * publication_date is set to today (the date the data became known to us).
 */

import { db } from "@workspace/db";
import { rawMarketData, rawDividends, rawFundamentals, tickers } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  fetchEodPrices,
  fetchDividends,
  fetchFundamentals,
  centToRand,
} from "./eodhd.service";
import { todaySast } from "../lib/sast";
import { logger } from "../lib/logger";

export async function ingestPrices(
  ticker: string,
  from: string,
  to: string,
): Promise<number> {
  const prices = await fetchEodPrices(ticker, from, to);

  if (prices.length === 0) return 0;

  const rows = prices.map((p) => ({
    ticker,
    tradeDate: p.date,
    openZar: centToRand(p.open),
    highZar: centToRand(p.high),
    lowZar: centToRand(p.low),
    closeZar: centToRand(p.close),
    adjustedCloseZar: centToRand(p.adjusted_close),
    volume: String(Math.round(p.volume)),
    tradedValueZar: centToRand(p.close * p.volume),
    source: "eodhd",
  }));

  await db.insert(rawMarketData).values(rows).onConflictDoNothing();
  logger.info({ ticker, count: rows.length }, "Ingested price rows");
  return rows.length;
}

export async function ingestDividends(
  ticker: string,
  from: string,
  to: string,
): Promise<number> {
  const dividends = await fetchDividends(ticker, from, to);
  if (dividends.length === 0) return 0;

  const today = todaySast();
  const rows = dividends.map((d) => ({
    ticker,
    exDividendDate: d.date,
    publicationDate: today,
    dividendZar: centToRand(d.value),
    dividendType: d.period ?? "ordinary",
    source: "eodhd",
  }));

  await db.insert(rawDividends).values(rows).onConflictDoNothing();
  logger.info({ ticker, count: rows.length }, "Ingested dividend rows");
  return rows.length;
}

export async function ingestFundamentals(ticker: string): Promise<number> {
  const fundamentals = await fetchFundamentals(ticker);
  const today = todaySast();

  const incomeYearly = fundamentals.Financials?.Income_Statement?.yearly ?? {};
  const balanceYearly = fundamentals.Financials?.Balance_Sheet?.yearly ?? {};
  const cashYearly = fundamentals.Financials?.Cash_Flow?.yearly ?? {};

  const periods = new Set([
    ...Object.keys(incomeYearly),
    ...Object.keys(balanceYearly),
    ...Object.keys(cashYearly),
  ]);

  const rows = [];
  for (const periodKey of periods) {
    const income = incomeYearly[periodKey];
    const balance = balanceYearly[periodKey];
    const cash = cashYearly[periodKey];

    const periodEnd = income?.date ?? balance?.date ?? cash?.date;
    const publicationDate = income?.filing_date ?? balance?.filing_date ?? today;

    if (!periodEnd) continue;

    rows.push({
      ticker,
      periodEnd,
      publicationDate,
      periodType: "annual",
      revenue: income?.totalRevenue ?? null,
      netIncome: income?.netIncome ?? null,
      grossProfit: income?.grossProfit ?? null,
      operatingCashFlow: cash?.totalCashFromOperatingActivities ?? null,
      totalAssets: balance?.totalAssets ?? income?.totalAssets ?? null,
      totalDebt: balance?.longTermDebt ?? null,
      currentAssets: balance?.totalCurrentAssets ?? null,
      currentLiabilities: balance?.totalCurrentLiabilities ?? null,
      sharesOutstanding: fundamentals.General?.SharesOutstanding
        ? String(fundamentals.General.SharesOutstanding)
        : null,
      epsBasic: income?.eps ?? null,
      bookValuePerShare: balance?.bookValuePerShare ?? null,
      auditOpinion: "unqualified",
      source: "eodhd",
    });
  }

  if (rows.length === 0) return 0;

  await db.insert(rawFundamentals).values(rows).onConflictDoNothing();
  logger.info({ ticker, count: rows.length }, "Ingested fundamental rows");
  return rows.length;
}

export async function runNightlyBatch(date?: string): Promise<{
  ticker: string;
  prices: number;
  dividends: number;
  fundamentals: number;
  error?: string;
}[]> {
  const today = date ?? todaySast();
  const yesterday = addDays(today, -1);

  const allTickers = await db
    .select({ ticker: tickers.ticker })
    .from(tickers)
    .where(eq(tickers.isCurrentlyListed, true));

  const results = await Promise.allSettled(
    allTickers.map(async ({ ticker }) => {
      const [prices, divs, funds] = await Promise.allSettled([
        ingestPrices(ticker, yesterday, today),
        ingestDividends(ticker, yesterday, today),
        ingestFundamentals(ticker),
      ]);
      return {
        ticker,
        prices: prices.status === "fulfilled" ? prices.value : 0,
        dividends: divs.status === "fulfilled" ? divs.value : 0,
        fundamentals: funds.status === "fulfilled" ? funds.value : 0,
        error:
          prices.status === "rejected"
            ? String(prices.reason)
            : undefined,
      };
    }),
  );

  return results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : { ticker: "unknown", prices: 0, dividends: 0, fundamentals: 0, error: String(r.reason) },
  );
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
