import { Router } from "express";
import { db } from "@workspace/db";
import { universeSnapshot, exclusionsLog, screeningRules } from "@workspace/db";
import { eq, and, lte, isNull, or, desc } from "drizzle-orm";

const router = Router();

const meta = (asOf?: string) => ({
  as_of: asOf ?? null,
  generated_at: new Date().toISOString(),
});

router.get("/universe", async (req, res): Promise<void> => {
  const { date, cursor, limit } = req.query;
  if (!date) {
    void res.status(400).json({ error: { code: "MISSING_DATE", message: "date is required" } });
    return;
  }

  const pageSize = Math.min(Number(limit) || 100, 500);

  const rows = await db
    .select()
    .from(universeSnapshot)
    .where(
      and(
        lte(universeSnapshot.snapshotDate, date as string),
        or(isNull(universeSnapshot.delistedAt), lte(universeSnapshot.delistedAt, date as string))
      )
    )
    .orderBy(desc(universeSnapshot.snapshotDate), universeSnapshot.ticker)
    .limit(pageSize + 1);

  const hasNext = rows.length > pageSize;
  const data = hasNext ? rows.slice(0, pageSize) : rows;

  void res.json({
    data: data.map((r) => ({
      ticker: r.ticker,
      companyName: r.companyName,
      sector: r.sector,
      marketCapZar: r.marketCapZar,
      adtv20d: r.adtv20d,
      isActive: r.isActive,
    })),
    meta: meta(date as string),
    nextCursor: hasNext ? data[data.length - 1].ticker : undefined,
  });
});

router.get("/universe/:ticker/screen-status", async (req, res): Promise<void> => {
  const { ticker } = req.params;
  const { date } = req.query;
  const asOf = (date as string) ?? new Date().toISOString().slice(0, 10);

  const [snap] = await db
    .select()
    .from(universeSnapshot)
    .where(and(eq(universeSnapshot.ticker, ticker), lte(universeSnapshot.snapshotDate, asOf)))
    .orderBy(desc(universeSnapshot.snapshotDate))
    .limit(1);

  if (!snap) {
    void res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticker not found" } });
    return;
  }

  const exclusions = await db
    .select()
    .from(exclusionsLog)
    .where(and(eq(exclusionsLog.ticker, ticker), lte(exclusionsLog.exclusionDate, asOf)))
    .orderBy(desc(exclusionsLog.exclusionDate))
    .limit(5);

  void res.json({
    data: {
      ticker: snap.ticker,
      asOf,
      passes: snap.isActive,
      filters: {
        liquidityPass: (snap.adtv20d ?? 0) >= 500000,
        marketCapPass: (snap.marketCapZar ?? 0) >= 500000000,
        historyPass: (snap.yearsOfHistory ?? 0) >= 3,
        dataQualityPass: (snap.dataQualityScore ?? 0) >= 0.95,
        noActiveSuspension: snap.isActive,
      },
      recentExclusions: exclusions.map((e) => ({ date: e.exclusionDate, reason: e.reason })),
    },
    meta: meta(asOf),
  });
});

export default router;
