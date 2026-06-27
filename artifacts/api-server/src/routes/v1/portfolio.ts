import { Router } from "express";
import { db } from "@workspace/db";
import { portfolioHoldings, probabilityOutputs, positionSizingRules } from "@workspace/db";
import { desc, eq, gte, lte, and, isNull, or } from "drizzle-orm";

const router = Router();
const meta = (asOf?: string) => ({
  as_of: asOf ?? null,
  generated_at: new Date().toISOString(),
});

router.get("/portfolio/current", async (_req, res): Promise<void> => {
  const [latestDate] = await db
    .select({ portfolioDate: portfolioHoldings.portfolioDate })
    .from(portfolioHoldings)
    .orderBy(desc(portfolioHoldings.portfolioDate))
    .limit(1);

  if (!latestDate) {
    void res.json({ data: { portfolioDate: null, holdings: [], totalInvested: 0, cashPct: 0 }, meta: meta() });
    return;
  }

  const holdings = await db
    .select()
    .from(portfolioHoldings)
    .where(eq(portfolioHoldings.portfolioDate, latestDate.portfolioDate));

  const cashPct = holdings.filter((h) => h.isCash).reduce((s, h) => s + (h.weight ?? 0), 0);

  void res.json({
    data: {
      portfolioDate: latestDate.portfolioDate,
      holdings: holdings.map((h) => ({
        ticker: h.ticker,
        weight: h.weight,
        sector: h.sector,
        selectionProbability: h.selectionProbability,
        isCash: h.isCash,
      })),
      totalInvested: 1 - cashPct,
      cashPct,
    },
    meta: meta(latestDate.portfolioDate),
  });
});

router.get("/portfolio/history", async (req, res): Promise<void> => {
  const { from, to } = req.query;

  const conditions = [];
  if (from) conditions.push(gte(portfolioHoldings.rebalanceDate, from as string));
  if (to) conditions.push(lte(portfolioHoldings.rebalanceDate, to as string));

  const rows = await db
    .select()
    .from(portfolioHoldings)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(portfolioHoldings.rebalanceDate))
    .limit(2000);

  const grouped = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = row.rebalanceDate;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(row);
  }

  void res.json({
    data: Array.from(grouped.entries()).map(([rebalanceDate, holdings]) => ({
      rebalanceDate,
      holdings: holdings.map((h) => ({
        ticker: h.ticker,
        weight: h.weight,
        sector: h.sector,
        selectionProbability: h.selectionProbability,
        isCash: h.isCash,
      })),
    })),
    meta: meta(),
  });
});

router.post("/portfolio/rebalance", async (req, res): Promise<void> => {
  const { asOf } = req.body as { asOf?: string };
  if (!asOf) {
    void res.status(400).json({ error: { code: "MISSING_DATE", message: "asOf is required" } });
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const [rules] = await db
    .select()
    .from(positionSizingRules)
    .where(or(isNull(positionSizingRules.effectiveTo), gte(positionSizingRules.effectiveTo, today)))
    .orderBy(desc(positionSizingRules.effectiveFrom))
    .limit(1);

  const candidates = await db
    .select()
    .from(probabilityOutputs)
    .where(eq(probabilityOutputs.outputDate, asOf))
    .orderBy(desc(probabilityOutputs.probabilityPositiveReturn1m))
    .limit(rules?.targetPortfolioSize ?? 25);

  const threshold = rules?.minProbabilityThreshold ?? 0.55;
  const eligible = candidates.filter((c) => (c.probabilityPositiveReturn1m ?? 0) >= threshold);
  const maxPos = rules?.maxSinglePositionPct ?? 0.07;
  const equalWeight = eligible.length > 0 ? Math.min(1 / eligible.length, maxPos) : 0;

  const proposedHoldings: Array<{
    ticker: string;
    weight: number;
    selectionProbability: number | null;
    isCash: boolean;
  }> = eligible.map((c) => ({
    ticker: c.ticker,
    weight: equalWeight,
    selectionProbability: c.probabilityPositiveReturn1m,
    isCash: false,
  }));

  const investedTotal = proposedHoldings.reduce((s, h) => s + h.weight, 0);
  if (investedTotal < 1) {
    proposedHoldings.push({ ticker: "CASH", weight: 1 - investedTotal, selectionProbability: null, isCash: true });
  }

  void res.json({
    data: { simulationDate: asOf, proposedHoldings, estimatedTurnover: null, estimatedCost: null },
    meta: meta(asOf),
  });
});

export default router;
