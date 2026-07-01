/**
 * EODHD API client for JSE market data.
 * Issue #41: Live JSE data integration.
 *
 * IMPORTANT — EODHD licensing:
 *   Dev/internal use:   personal plan ($19–$79/month) — DO NOT serve derived data to users.
 *   Production/serving: commercial plan ($399–$2,499/month) required before any subscriber
 *                        receives scored or derived data. See ROADMAP.md Decision 1.
 *
 * JSE prices from EODHD are in ZAc (South African cents).
 * ALL values are divided by 100 on ingestion to store in ZAR.
 */

import { logger } from "../lib/logger.js";

const BASE_URL = "https://eodhd.com/api";

function getApiKey(): string {
  const key = process.env["EODHD_API_KEY"];
  if (!key) {
    throw new Error(
      "EODHD_API_KEY environment variable is not set. " +
        "For development, obtain a personal plan key from eodhd.com. " +
        "For production serving subscribers, you need the commercial license ($399–$2,499/month).",
    );
  }
  return key;
}

/** Convert ZAc (cents) to ZAR. EODHD returns JSE prices in cents. */
export function centToRand(cents: number): string {
  return (cents / 100).toFixed(6);
}

export interface EodhdOhlcv {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjusted_close: number;
  volume: number;
}

export async function fetchEodPrices(
  ticker: string,
  from: string,
  to: string,
): Promise<EodhdOhlcv[]> {
  const key = getApiKey();
  const jseSymbol = `${ticker}.JSE`;
  const url = `${BASE_URL}/eod/${jseSymbol}?api_token=${key}&fmt=json&from=${from}&to=${to}`;

  logger.info({ ticker, from, to }, "Fetching EOD prices from EODHD");

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    logger.error({ ticker, status: res.status, body: text }, "EODHD EOD fetch failed");
    throw new Error(`EODHD API error ${res.status} for ${jseSymbol}`);
  }

  const data = (await res.json()) as EodhdOhlcv[];
  return data;
}

export interface EodhdDividend {
  date: string;
  declarationDate: string;
  recordDate: string;
  paymentDate: string;
  period: string;
  value: number;
  unadjustedValue: number;
  currency: string;
}

export async function fetchDividends(
  ticker: string,
  from: string,
  to: string,
): Promise<EodhdDividend[]> {
  const key = getApiKey();
  const jseSymbol = `${ticker}.JSE`;
  const url = `${BASE_URL}/div/${jseSymbol}?api_token=${key}&fmt=json&from=${from}&to=${to}`;

  logger.info({ ticker, from, to }, "Fetching dividends from EODHD");

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    logger.error({ ticker, status: res.status, body: text }, "EODHD dividends fetch failed");
    throw new Error(`EODHD dividend API error ${res.status} for ${jseSymbol}`);
  }

  return (await res.json()) as EodhdDividend[];
}

export interface EodhdFundamentals {
  General?: {
    Name?: string;
    Sector?: string;
    Industry?: string;
    SharesOutstanding?: number;
  };
  Financials?: {
    Income_Statement?: {
      yearly?: Record<string, {
        date?: string;
        filing_date?: string;
        totalRevenue?: string;
        netIncome?: string;
        grossProfit?: string;
        totalAssets?: string;
        totalDebt?: string;
        eps?: string;
      }>;
    };
    Balance_Sheet?: {
      yearly?: Record<string, {
        date?: string;
        filing_date?: string;
        totalAssets?: string;
        totalLiab?: string;
        totalCurrentAssets?: string;
        totalCurrentLiabilities?: string;
        longTermDebt?: string;
        bookValuePerShare?: string;
      }>;
    };
    Cash_Flow?: {
      yearly?: Record<string, {
        date?: string;
        filing_date?: string;
        totalCashFromOperatingActivities?: string;
      }>;
    };
  };
}

export async function fetchFundamentals(ticker: string): Promise<EodhdFundamentals> {
  const key = getApiKey();
  const jseSymbol = `${ticker}.JSE`;
  const url = `${BASE_URL}/fundamentals/${jseSymbol}?api_token=${key}&fmt=json`;

  logger.info({ ticker }, "Fetching fundamentals from EODHD");

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    logger.error({ ticker, status: res.status, body: text }, "EODHD fundamentals fetch failed");
    throw new Error(`EODHD fundamentals API error ${res.status} for ${jseSymbol}`);
  }

  return (await res.json()) as EodhdFundamentals;
}
