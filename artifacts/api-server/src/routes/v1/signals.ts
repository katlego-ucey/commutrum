import { Router } from "express";
import { db } from "@workspace/db";
import { factorSignals } from "@workspace/db";
import { eq, and, lte, desc, sql } from "drizzle-orm";

const router = Router();
const meta = (asOf?: string) => ({
  as_of: asOf ?? null,
  generated_at: new Date().toISOString(),
});

router.get("/signals/:ticker", async (req, res): Promise<void> => {
  const { ticker } = req.params;
  const { asOf } = req.query;
  const asOfDate = (asOf as string) ?? new Date().toISOString().slice(0, 10);

  const rows = await db
    .select()
    .from(factorSignals)
    .where(and(eq(factorSignals.ticker, ticker), lte(factorSignals.publicationDate, asOfDate)))
    .orderBy(factorSignals.factorId, desc(factorSignals.signalDate))
    .limit(50);

  void res.json({
    data: rows.map((r) => ({
      factorId: r.factorId,
      rawValue: r.rawValue,
      sectorRelative: r.sectorRelative,
      zScore: r.zScore,
      zScoreWinsorized: r.zScoreWinsorized,
      sector: r.sector,
      signalDate: r.signalDate,
    })),
    meta: meta(asOfDate),
  });
});

router.get("/signals/sector-stats", async (req, res): Promise<void> => {
  const { date } = req.query;
  if (!date) {
    void res.status(400).json({ error: { code: "MISSING_DATE", message: "date is required" } });
    return;
  }

  const rows = await db
    .select({
      sector: factorSignals.sector,
      factorId: factorSignals.factorId,
      mean: sql<number>`avg(${factorSignals.zScore})`,
      stdDev: sql<number>`stddev(${factorSignals.zScore})`,
      count: sql<number>`count(*)`,
    })
    .from(factorSignals)
    .where(eq(factorSignals.signalDate, date as string))
    .groupBy(factorSignals.sector, factorSignals.factorId);

  void res.json({ data: rows, meta: meta(date as string) });
});

export default router;
