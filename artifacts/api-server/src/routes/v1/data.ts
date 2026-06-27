import { Router } from "express";
import { db } from "@workspace/db";
import { rawMarketData, rawFundamentals, rawSensAnnouncements, dataQualityLog } from "@workspace/db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

const router = Router();

const meta = (asOf?: string) => ({
  as_of: asOf ?? null,
  generated_at: new Date().toISOString(),
});

router.get("/data/prices/:ticker", async (req, res): Promise<void> => {
  const { ticker } = req.params;
  const { from, to } = req.query;

  const conditions = [eq(rawMarketData.ticker, ticker)];
  if (from) conditions.push(gte(rawMarketData.tradeDate, from as string));
  if (to) conditions.push(lte(rawMarketData.tradeDate, to as string));

  const rows = await db
    .select()
    .from(rawMarketData)
    .where(and(...conditions))
    .orderBy(rawMarketData.tradeDate)
    .limit(2000);

  void res.json({
    data: rows.map((r) => ({
      date: r.tradeDate,
      open: r.open,
      high: r.high,
      low: r.low,
      close: r.close,
      volume: r.volume,
      vwap: r.vwap,
    })),
    meta: meta(to as string),
  });
});

router.get("/data/fundamentals/:ticker", async (req, res): Promise<void> => {
  const { ticker } = req.params;
  const { asOf } = req.query;
  const asOfDate = (asOf as string) ?? new Date().toISOString().slice(0, 10);

  const [row] = await db
    .select()
    .from(rawFundamentals)
    .where(and(eq(rawFundamentals.ticker, ticker), lte(rawFundamentals.publicationDate, asOfDate)))
    .orderBy(desc(rawFundamentals.publicationDate))
    .limit(1);

  if (!row) {
    void res.status(404).json({ error: { code: "NOT_FOUND", message: "No fundamentals found for ticker" } });
    return;
  }

  void res.json({
    data: {
      ticker: row.ticker,
      periodEndDate: row.periodEndDate,
      publicationDate: row.publicationDate,
      revenue: row.revenue,
      netIncome: row.netIncome,
      totalAssets: row.totalAssets,
      equity: row.equity,
      eps: row.eps,
      roe: row.roe,
      roa: row.roa,
    },
    meta: meta(asOfDate),
  });
});

router.get("/data/events/:ticker", async (req, res): Promise<void> => {
  const { ticker } = req.params;
  const { from, to } = req.query;

  const conditions = [eq(rawSensAnnouncements.ticker, ticker)];
  if (from) conditions.push(gte(rawSensAnnouncements.announcementDate, from as string));
  if (to) conditions.push(lte(rawSensAnnouncements.announcementDate, to as string));

  const rows = await db
    .select()
    .from(rawSensAnnouncements)
    .where(and(...conditions))
    .orderBy(desc(rawSensAnnouncements.announcementDate))
    .limit(500);

  void res.json({
    data: rows.map((r) => ({
      date: r.announcementDate,
      category: r.category,
      headline: r.headline,
    })),
    meta: meta(to as string),
  });
});

router.get("/data/quality/:ticker", async (req, res): Promise<void> => {
  const { ticker } = req.params;

  const rows = await db
    .select()
    .from(dataQualityLog)
    .where(eq(dataQualityLog.ticker, ticker))
    .orderBy(desc(dataQualityLog.checkDate))
    .limit(50);

  const passed = rows.filter((r) => r.passed).length;
  const overallScore = rows.length > 0 ? passed / rows.length : 0;

  void res.json({
    data: {
      ticker,
      overallScore,
      checks: rows.map((r) => ({ checkType: r.checkType, passed: r.passed, message: r.message })),
    },
    meta: meta(),
  });
});

export default router;
