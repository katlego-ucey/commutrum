import { Router } from "express";
import { db } from "@workspace/db";
import { factorRawValues, factorDefinitions } from "@workspace/db";
import { eq, and, lte, isNull, or, gte, desc } from "drizzle-orm";

const router = Router();
const meta = (asOf?: string) => ({
  as_of: asOf ?? null,
  generated_at: new Date().toISOString(),
});

router.get("/factors/:ticker/raw", async (req, res): Promise<void> => {
  const { ticker } = req.params;
  const { asOf } = req.query;
  const asOfDate = (asOf as string) ?? new Date().toISOString().slice(0, 10);

  const rows = await db
    .select({
      factorId: factorRawValues.factorId,
      factorName: factorDefinitions.factorName,
      rawValue: factorRawValues.rawValue,
      asOfDate: factorRawValues.asOfDate,
      publicationDate: factorRawValues.publicationDate,
      formulaVersion: factorRawValues.formulaVersion,
    })
    .from(factorRawValues)
    .leftJoin(factorDefinitions, eq(factorRawValues.factorId, factorDefinitions.factorId))
    .where(and(eq(factorRawValues.ticker, ticker), lte(factorRawValues.publicationDate, asOfDate)))
    .orderBy(factorRawValues.factorId, desc(factorRawValues.publicationDate))
    .limit(100);

  void res.json({ data: rows, meta: meta(asOfDate) });
});

router.get("/factors/definitions", async (_req, res): Promise<void> => {
  const today = new Date().toISOString().slice(0, 10);

  const rows = await db
    .select()
    .from(factorDefinitions)
    .where(or(isNull(factorDefinitions.effectiveTo), gte(factorDefinitions.effectiveTo, today)))
    .orderBy(factorDefinitions.factorId);

  void res.json({
    data: rows.map((r) => ({
      factorId: r.factorId,
      factorName: r.factorName,
      description: r.description,
      mechanism: r.mechanism,
      decayHorizon: r.decayHorizon,
      formulaVersion: r.formulaVersion,
      effectiveFrom: r.effectiveFrom,
    })),
    meta: meta(),
  });
});

export default router;
