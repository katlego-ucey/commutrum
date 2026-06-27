import { Router } from "express";
import { db } from "@workspace/db";
import { compositeScores, regimeClassifications } from "@workspace/db";
import { eq, and, lte, desc } from "drizzle-orm";

const router = Router();
const meta = (asOf?: string) => ({
  as_of: asOf ?? null,
  generated_at: new Date().toISOString(),
});

router.get("/research/:ticker", async (req, res): Promise<void> => {
  const { ticker } = req.params;
  const { asOf } = req.query;
  const asOfDate = (asOf as string) ?? new Date().toISOString().slice(0, 10);

  const [row] = await db
    .select()
    .from(compositeScores)
    .where(and(eq(compositeScores.ticker, ticker), lte(compositeScores.publicationDate, asOfDate)))
    .orderBy(desc(compositeScores.scoreDate))
    .limit(1);

  if (!row) {
    void res.status(404).json({ error: { code: "NOT_FOUND", message: "No composite score found for ticker" } });
    return;
  }

  void res.json({
    data: {
      ticker: row.ticker,
      scoreDate: row.scoreDate,
      compositeScore: row.compositeScore,
      regime: row.regime,
      currencySensitivityFlag: row.currencySensitivityFlag,
      factorAttribution: row.factorAttribution,
    },
    meta: meta(asOfDate),
  });
});

router.get("/regime/current", async (_req, res): Promise<void> => {
  const [row] = await db
    .select()
    .from(regimeClassifications)
    .orderBy(desc(regimeClassifications.classificationDate))
    .limit(1);

  if (!row) {
    void res.json({ data: null, meta: meta() });
    return;
  }

  void res.json({
    data: {
      classificationDate: row.classificationDate,
      regime: row.regime,
      trailing180dReturn: row.trailing180dReturn,
      trailing60dVolatility: row.trailing60dVolatility,
      yieldCurveSlope: row.yieldCurveSlope,
    },
    meta: meta(row.classificationDate),
  });
});

export default router;
