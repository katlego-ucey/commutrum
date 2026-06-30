import { Router } from "express";
import { z } from "zod/v4";
import { db } from "@workspace/db";
import { rawMarketData, rawFundamentals, dataQualityLog, tickers } from "@workspace/db";
import { eq, and, lte, gte, desc } from "drizzle-orm";
import { ingestPrices, ingestDividends, ingestFundamentals, runNightlyBatch } from "../services/ingestion.service";

const router = Router();
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

router.get("/prices/:ticker", async (req, res, next) => {
  try {
    const ticker = (req.params as { ticker: string }).ticker.toUpperCase();
    const from = req.query["from"] as string | undefined;
    const to = req.query["to"] as string | undefined;
    if (from) dateSchema.parse(from);
    if (to) dateSchema.parse(to);

    const query = db
      .select()
      .from(rawMarketData)
      .where(
        and(
          eq(rawMarketData.ticker, ticker),
          from ? gte(rawMarketData.tradeDate, from) : undefined,
          to ? lte(rawMarketData.tradeDate, to) : undefined,
        ),
      )
      .orderBy(desc(rawMarketData.tradeDate))
      .limit(500);

    const rows = await query;
    res.json({ ticker, count: rows.length, prices: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/fundamentals/:ticker", async (req, res, next) => {
  try {
    const ticker = (req.params as { ticker: string }).ticker.toUpperCase();
    const asOf = req.query["as_of"] as string | undefined;
    if (asOf) dateSchema.parse(asOf);

    const rows = await db
      .select()
      .from(rawFundamentals)
      .where(
        and(
          eq(rawFundamentals.ticker, ticker),
          asOf ? lte(rawFundamentals.publicationDate, asOf) : undefined,
        ),
      )
      .orderBy(desc(rawFundamentals.publicationDate))
      .limit(20);

    res.json({ ticker, count: rows.length, fundamentals: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/quality/:ticker", async (req, res, next) => {
  try {
    const ticker = (req.params as { ticker: string }).ticker.toUpperCase();
    const rows = await db
      .select()
      .from(dataQualityLog)
      .where(eq(dataQualityLog.ticker, ticker))
      .orderBy(desc(dataQualityLog.checkDate))
      .limit(50);
    res.json({ ticker, checks: rows });
  } catch (err) {
    next(err);
  }
});

router.post("/ingest/prices/:ticker", async (req, res, next) => {
  try {
    const ticker = (req.params as { ticker: string }).ticker.toUpperCase();
    const from = (req.query["from"] as string) ?? subtractDays(new Date().toISOString().slice(0, 10), 30);
    const to = (req.query["to"] as string) ?? new Date().toISOString().slice(0, 10);
    dateSchema.parse(from);
    dateSchema.parse(to);
    const count = await ingestPrices(ticker, from, to);
    res.json({ ticker, from, to, ingested: count });
  } catch (err) {
    next(err);
  }
});

router.post("/ingest/fundamentals/:ticker", async (req, res, next) => {
  try {
    const ticker = (req.params as { ticker: string }).ticker.toUpperCase();
    const count = await ingestFundamentals(ticker);
    res.json({ ticker, ingested: count });
  } catch (err) {
    next(err);
  }
});

router.post("/ingest/nightly-batch", async (req, res, next) => {
  try {
    const date = req.query["date"] as string | undefined;
    if (date) dateSchema.parse(date);
    const results = await runNightlyBatch(date);
    const totalPrices = results.reduce((a, r) => a + r.prices, 0);
    const errors = results.filter((r) => r.error);
    res.json({ tickers: results.length, totalPrices, errors: errors.length, results });
  } catch (err) {
    next(err);
  }
});

function subtractDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

export default router;
