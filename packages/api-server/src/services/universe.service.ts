/**
 * Module 00 — Universe Screening service.
 * Issue #23: Universe screening hard filters.
 *
 * Answers: "Is this ticker eligible to be scored on date D?"
 * All filters use only data available as-of the snapshot date (point-in-time).
 */

import { db } from "@commutrum/db";
import {
  tickers,
  universeSnapshot,
  screeningRules,
  rawMarketData,
  rawFundamentals,
} from "@commutrum/db";
import { eq, and, lte, gte, sql, desc } from "drizzle-orm";
import { todaySast } from "../lib/sast.js";
import { isTradingDay } from "./trading-calendar.service.js";

const ADTV_THRESHOLD_ZAR = 500_000;
const MARKET_CAP_MIN_ZAR = 500_000_000;
const MIN_YEARS_HISTORY = 3;
const DATA_COMPLETENESS_MIN = 0.95;

async function compute20dAdtv(ticker: string, asOfDate: string): Promise<number> {
  const rows = await db
    .select({
      tradedValue: rawMarketData.tradedValueZar,
      closeZar: rawMarketData.closeZar,
      volume: rawMarketData.volume,
    })
    .from(rawMarketData)
    .where(
      and(
        eq(rawMarketData.ticker, ticker),
        lte(rawMarketData.tradeDate, asOfDate),
      ),
    )
    .orderBy(desc(rawMarketData.tradeDate))
    .limit(20);

  if (rows.length === 0) return 0;

  const vals = rows.map((r) => {
    if (r.tradedValue) return Number(r.tradedValue);
    const close = Number(r.closeZar ?? 0);
    const vol = Number(r.volume ?? 0);
    return close * vol;
  });

  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

async function getMarketCap(ticker: string, asOfDate: string): Promise<number> {
  const priceRow = await db
    .select({ closeZar: rawMarketData.closeZar })
    .from(rawMarketData)
    .where(and(eq(rawMarketData.ticker, ticker), lte(rawMarketData.tradeDate, asOfDate)))
    .orderBy(desc(rawMarketData.tradeDate))
    .limit(1);

  const tickerRow = await db
    .select({ sharesOutstanding: tickers.sharesOutstanding })
    .from(tickers)
    .where(eq(tickers.ticker, ticker))
    .limit(1);

  if (!priceRow[0] || !tickerRow[0]?.sharesOutstanding) return 0;
  return Number(priceRow[0].closeZar) * Number(tickerRow[0].sharesOutstanding);
}

async function getYearsHistory(ticker: string, asOfDate: string): Promise<number> {
  const rows = await db
    .select({ publicationDate: rawFundamentals.publicationDate })
    .from(rawFundamentals)
    .where(
      and(
        eq(rawFundamentals.ticker, ticker),
        lte(rawFundamentals.publicationDate, asOfDate),
      ),
    )
    .orderBy(rawFundamentals.publicationDate)
    .limit(1);

  if (rows.length === 0) return 0;

  const earliest = new Date(rows[0]!.publicationDate + "T00:00:00Z");
  const asOf = new Date(asOfDate + "T00:00:00Z");
  const diffMs = asOf.getTime() - earliest.getTime();
  return diffMs / (365.25 * 24 * 60 * 60 * 1000);
}

async function getLastAuditOpinion(ticker: string, asOfDate: string): Promise<string> {
  const rows = await db
    .select({ auditOpinion: rawFundamentals.auditOpinion })
    .from(rawFundamentals)
    .where(
      and(
        eq(rawFundamentals.ticker, ticker),
        lte(rawFundamentals.publicationDate, asOfDate),
      ),
    )
    .orderBy(desc(rawFundamentals.publicationDate))
    .limit(1);

  return rows[0]?.auditOpinion ?? "unknown";
}

export interface ScreenResult {
  ticker: string;
  snapshotDate: string;
  passFail: boolean;
  exclusionReason: string | null;
  adtv20d: number;
  marketCapZar: number;
  yearsAuditedHistory: number;
  lastAuditOpinion: string;
  dataCompletenessScore: number;
}

export async function screenTicker(
  ticker: string,
  asOfDate: string,
): Promise<ScreenResult> {
  const [adtv, marketCap, yearsHistory, auditOpinion] = await Promise.all([
    compute20dAdtv(ticker, asOfDate),
    getMarketCap(ticker, asOfDate),
    getYearsHistory(ticker, asOfDate),
    getLastAuditOpinion(ticker, asOfDate),
  ]);

  const dataCompletenessScore = adtv > 0 && marketCap > 0 ? 1.0 : 0.0;

  let exclusionReason: string | null = null;

  if (adtv < ADTV_THRESHOLD_ZAR) {
    exclusionReason = `ADTV R${adtv.toFixed(0)} below R${ADTV_THRESHOLD_ZAR.toLocaleString()} threshold`;
  } else if (marketCap < MARKET_CAP_MIN_ZAR) {
    exclusionReason = `Market cap R${marketCap.toFixed(0)} below R${MARKET_CAP_MIN_ZAR.toLocaleString()} minimum`;
  } else if (yearsHistory < MIN_YEARS_HISTORY) {
    exclusionReason = `Only ${yearsHistory.toFixed(1)} years of history; minimum is ${MIN_YEARS_HISTORY}`;
  } else if (auditOpinion !== "unqualified" && auditOpinion !== "unknown") {
    exclusionReason = `Audit opinion is ${auditOpinion} — only unqualified opinions pass`;
  } else if (dataCompletenessScore < DATA_COMPLETENESS_MIN) {
    exclusionReason = `Data completeness ${(dataCompletenessScore * 100).toFixed(1)}% below ${DATA_COMPLETENESS_MIN * 100}% threshold`;
  }

  return {
    ticker,
    snapshotDate: asOfDate,
    passFail: exclusionReason === null,
    exclusionReason,
    adtv20d: adtv,
    marketCapZar: marketCap,
    yearsAuditedHistory: yearsHistory,
    lastAuditOpinion: auditOpinion,
    dataCompletenessScore,
  };
}

export async function runDailyScreen(date?: string): Promise<ScreenResult[]> {
  const asOfDate = date ?? todaySast();

  const trading = await isTradingDay(asOfDate);
  if (!trading) {
    return [];
  }

  const allTickers = await db
    .select({ ticker: tickers.ticker })
    .from(tickers)
    .where(
      sql`(${tickers.delistedDate} IS NULL OR ${tickers.delistedDate} >= ${asOfDate})`,
    );

  const results = await Promise.all(
    allTickers.map((t) => screenTicker(t.ticker, asOfDate)),
  );

  await db
    .insert(universeSnapshot)
    .values(
      results.map((r) => ({
        ticker: r.ticker,
        snapshotDate: r.snapshotDate,
        passFail: r.passFail,
        exclusionReason: r.exclusionReason,
        adtv20d: r.adtv20d.toFixed(2),
        marketCapZar: r.marketCapZar.toFixed(2),
        yearsAuditedHistory: r.yearsAuditedHistory.toFixed(4),
        lastAuditOpinion: r.lastAuditOpinion,
        dataCompletenessScore: r.dataCompletenessScore.toFixed(4),
      })),
    )
    .onConflictDoNothing();

  return results;
}

export async function getUniverse(date?: string) {
  const d = date ?? todaySast();
  return db
    .select()
    .from(universeSnapshot)
    .where(eq(universeSnapshot.snapshotDate, d));
}
