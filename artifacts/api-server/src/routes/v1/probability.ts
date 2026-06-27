import { Router } from "express";
import { db } from "@workspace/db";
import { probabilityOutputs, calibrationCurves, calibrationModels } from "@workspace/db";
import { eq, and, lte, isNull, or, gte, desc } from "drizzle-orm";

const router = Router();
const meta = (asOf?: string) => ({
  as_of: asOf ?? null,
  generated_at: new Date().toISOString(),
});

router.get("/probability/:ticker", async (req, res): Promise<void> => {
  const { ticker } = req.params;
  const { asOf } = req.query;
  const asOfDate = (asOf as string) ?? new Date().toISOString().slice(0, 10);

  const [row] = await db
    .select()
    .from(probabilityOutputs)
    .where(and(eq(probabilityOutputs.ticker, ticker), lte(probabilityOutputs.publicationDate, asOfDate)))
    .orderBy(desc(probabilityOutputs.outputDate))
    .limit(1);

  if (!row) {
    void res.status(404).json({ error: { code: "NOT_FOUND", message: "No probability output found for ticker" } });
    return;
  }

  void res.json({
    data: {
      ticker: row.ticker,
      compositeScore: row.compositeScore,
      probabilityPositiveReturn1m: row.probabilityPositiveReturn1m,
      expectedReturn1m: row.expectedReturn1m,
      confidenceIntervalLow90: row.confidenceIntervalLow90,
      confidenceIntervalHigh90: row.confidenceIntervalHigh90,
      historicalWinRate: row.historicalWinRate,
      calibrationSampleSize: row.calibrationSampleSize,
      riskLevel: row.riskLevel,
    },
    meta: meta(asOfDate),
  });
});

router.get("/calibration/reliability-diagram", async (_req, res): Promise<void> => {
  const today = new Date().toISOString().slice(0, 10);

  const [activeModel] = await db
    .select()
    .from(calibrationModels)
    .where(or(isNull(calibrationModels.effectiveTo), gte(calibrationModels.effectiveTo, today)))
    .orderBy(desc(calibrationModels.fitDate))
    .limit(1);

  if (!activeModel) {
    void res.json({ data: [], meta: meta() });
    return;
  }

  const curves = await db
    .select()
    .from(calibrationCurves)
    .where(eq(calibrationCurves.modelId, activeModel.id))
    .orderBy(calibrationCurves.scoreBin);

  void res.json({
    data: curves.map((c) => ({
      scoreBin: c.scoreBin,
      observedFrequency: c.observedFrequency,
      sampleCount: c.sampleCount,
    })),
    meta: meta(),
  });
});

export default router;
