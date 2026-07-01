/**
 * Module 02 — Baseline Factors computation service.
 * Issue #25: Piotroski F-score, price momentum, earnings revisions.
 *
 * All calculations use publication_date-filtered data only (point-in-time).
 * Momentum uses adjusted_close — NOT raw close (dividends distort momentum).
 */

import { db } from "@workspace/db";
import {
  rawFundamentals,
  rawMarketData,
  rawAnalystEstimates,
  rawEstimateRevisions,
  factorRawValues,
  factorDefinitions,
} from "@workspace/db";
import { eq, and, lte, gte, desc } from "drizzle-orm";
import { todaySast } from "../lib/sast";
import { logger } from "../lib/logger";

/** Get the two most recent annual fundamental periods for a ticker as-of date. */
async function getAnnualPeriods(ticker: string, asOfDate: string) {
  return db
    .select()
    .from(rawFundamentals)
    .where(
      and(
        eq(rawFundamentals.ticker, ticker),
        lte(rawFundamentals.publicationDate, asOfDate),
        eq(rawFundamentals.periodType, "annual"),
      ),
    )
    .orderBy(desc(rawFundamentals.publicationDate))
    .limit(2);
}

/** 9-point Piotroski F-score. Returns 0–9 or null if insufficient data. */
export async function computePiotroski(
  ticker: string,
  asOfDate: string,
): Promise<number | null> {
  const periods = await getAnnualPeriods(ticker, asOfDate);
  if (periods.length < 2) return null;

  const curr = periods[0]!;
  const prev = periods[1]!;

  const n = (v: string | null | undefined) => (v ? Number(v) : null);

  const currROA =
    n(curr.netIncome) && n(curr.totalAssets)
      ? n(curr.netIncome)! / n(curr.totalAssets)!
      : null;
  const prevROA =
    n(prev.netIncome) && n(prev.totalAssets)
      ? n(prev.netIncome)! / n(prev.totalAssets)!
      : null;
  const cfo = n(curr.operatingCashFlow);
  const netInc = n(curr.netIncome);
  const totalAssets = n(curr.totalAssets);

  const currLeverage =
    n(curr.totalDebt) && n(curr.totalAssets)
      ? n(curr.totalDebt)! / n(curr.totalAssets)!
      : null;
  const prevLeverage =
    n(prev.totalDebt) && n(prev.totalAssets)
      ? n(prev.totalDebt)! / n(prev.totalAssets)!
      : null;

  const currCurrentRatio =
    n(curr.currentAssets) && n(curr.currentLiabilities)
      ? n(curr.currentAssets)! / n(curr.currentLiabilities)!
      : null;
  const prevCurrentRatio =
    n(prev.currentAssets) && n(prev.currentLiabilities)
      ? n(prev.currentAssets)! / n(prev.currentLiabilities)!
      : null;

  const currGrossMargin =
    n(curr.grossProfit) && n(curr.revenue) && n(curr.revenue)! > 0
      ? n(curr.grossProfit)! / n(curr.revenue)!
      : null;
  const prevGrossMargin =
    n(prev.grossProfit) && n(prev.revenue) && n(prev.revenue)! > 0
      ? n(prev.grossProfit)! / n(prev.revenue)!
      : null;

  const currAssetTurnover =
    n(curr.revenue) && n(curr.totalAssets) && n(curr.totalAssets)! > 0
      ? n(curr.revenue)! / n(curr.totalAssets)!
      : null;
  const prevAssetTurnover =
    n(prev.revenue) && n(prev.totalAssets) && n(prev.totalAssets)! > 0
      ? n(prev.revenue)! / n(prev.totalAssets)!
      : null;

  const score = [
    currROA !== null && currROA > 0 ? 1 : 0,
    cfo !== null && cfo > 0 ? 1 : 0,
    currROA !== null && prevROA !== null && currROA > prevROA ? 1 : 0,
    cfo !== null && netInc !== null && totalAssets !== null && totalAssets > 0
      ? cfo / totalAssets > netInc / totalAssets
        ? 1
        : 0
      : 0,
    currLeverage !== null && prevLeverage !== null && currLeverage < prevLeverage ? 1 : 0,
    currCurrentRatio !== null && prevCurrentRatio !== null && currCurrentRatio > prevCurrentRatio
      ? 1
      : 0,
    n(curr.sharesOutstanding) !== null && n(prev.sharesOutstanding) !== null &&
    n(curr.sharesOutstanding)! <= n(prev.sharesOutstanding)!
      ? 1
      : 0,
    currGrossMargin !== null && prevGrossMargin !== null && currGrossMargin > prevGrossMargin
      ? 1
      : 0,
    currAssetTurnover !== null && prevAssetTurnover !== null &&
    currAssetTurnover > prevAssetTurnover
      ? 1
      : 0,
  ].reduce((a, b) => a + b, 0);

  return score;
}

/**
 * 12-1 month price momentum using adjusted_close.
 * adjusted_close corrects for dividends — CRITICAL on JSE where yields are 5–10%.
 */
export async function computeMomentum(
  ticker: string,
  asOfDate: string,
): Promise<number | null> {
  const toDate = asOfDate;
  const oneMonthAgo = addMonths(asOfDate, -1);
  const twelveMonthsAgo = addMonths(asOfDate, -12);

  const [recentRow, yearAgoRow] = await Promise.all([
    db
      .select({ adjustedClose: rawMarketData.adjustedCloseZar })
      .from(rawMarketData)
      .where(and(eq(rawMarketData.ticker, ticker), lte(rawMarketData.tradeDate, oneMonthAgo)))
      .orderBy(desc(rawMarketData.tradeDate))
      .limit(1),
    db
      .select({ adjustedClose: rawMarketData.adjustedCloseZar })
      .from(rawMarketData)
      .where(and(eq(rawMarketData.ticker, ticker), lte(rawMarketData.tradeDate, twelveMonthsAgo)))
      .orderBy(desc(rawMarketData.tradeDate))
      .limit(1),
  ]);

  if (!recentRow[0] || !yearAgoRow[0]) return null;

  const recent = Number(recentRow[0].adjustedClose);
  const yearAgo = Number(yearAgoRow[0].adjustedClose);

  if (yearAgo === 0) return null;

  return recent / yearAgo - 1;
}

/**
 * Earnings estimate revision signal: breadth × magnitude over trailing 30 days.
 */
export async function computeRevisions(
  ticker: string,
  asOfDate: string,
): Promise<number | null> {
  const thirtyDaysAgo = addDays(asOfDate, -30);

  const revisions = await db
    .select()
    .from(rawEstimateRevisions)
    .where(
      and(
        eq(rawEstimateRevisions.ticker, ticker),
        lte(rawEstimateRevisions.publicationDate, asOfDate),
        gte(rawEstimateRevisions.revisionDate, thirtyDaysAgo),
      ),
    );

  if (revisions.length === 0) return null;

  const upgrades = revisions.filter((r) => r.revisionDirection === "up").length;
  const downgrades = revisions.filter((r) => r.revisionDirection === "down").length;
  const total = revisions.length;

  if (total === 0) return null;

  const breadth = (upgrades - downgrades) / total;

  const magnitudeVals = revisions
    .filter((r) => r.previousEstimate && r.newEstimate && Number(r.previousEstimate) !== 0)
    .map(
      (r) =>
        (Number(r.newEstimate) - Number(r.previousEstimate)) /
        Math.abs(Number(r.previousEstimate)),
    );

  const magnitude =
    magnitudeVals.length > 0
      ? magnitudeVals.reduce((a, b) => a + b, 0) / magnitudeVals.length
      : 0;

  return (breadth + magnitude) / 2;
}

export interface FactorResult {
  piotroski: number | null;
  momentum: number | null;
  revisions: number | null;
}

export async function computeAllFactors(
  ticker: string,
  asOfDate?: string,
): Promise<FactorResult> {
  const date = asOfDate ?? todaySast();
  const [piotroski, momentum, revisions] = await Promise.all([
    computePiotroski(ticker, date),
    computeMomentum(ticker, date),
    computeRevisions(ticker, date),
  ]);
  return { piotroski, momentum, revisions };
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
