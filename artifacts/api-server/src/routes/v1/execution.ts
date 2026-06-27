import { Router } from "express";
import { db } from "@workspace/db";
import { costModelParameters, rawMarketData } from "@workspace/db";
import { and, isNull, lte, or, gte, desc, eq } from "drizzle-orm";

const router = Router();
const meta = () => ({ generated_at: new Date().toISOString() });

router.get("/execution/cost-model", async (_req, res): Promise<void> => {
  const today = new Date().toISOString().slice(0, 10);

  const rows = await db
    .select()
    .from(costModelParameters)
    .where(
      and(
        lte(costModelParameters.effectiveFrom, today),
        or(isNull(costModelParameters.effectiveTo), gte(costModelParameters.effectiveTo, today))
      )
    )
    .orderBy(costModelParameters.component, costModelParameters.paramName);

  void res.json({
    data: rows.map((r) => ({
      component: r.component,
      paramName: r.paramName,
      value: r.value,
      unit: r.unit,
      effectiveFrom: r.effectiveFrom,
    })),
    meta: meta(),
  });
});

router.post("/execution/estimate-shortfall", async (req, res): Promise<void> => {
  const { ticker, side, orderSizeZar, tradeDate } = req.body as {
    ticker?: string;
    side?: string;
    orderSizeZar?: number;
    tradeDate?: string;
  };

  if (!ticker || !side || !orderSizeZar || !tradeDate) {
    void res.status(400).json({ error: { code: "MISSING_FIELDS", message: "ticker, side, orderSizeZar, tradeDate are required" } });
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const params = await db
    .select()
    .from(costModelParameters)
    .where(or(isNull(costModelParameters.effectiveTo), gte(costModelParameters.effectiveTo, today)));

  const get = (name: string) => params.find((p) => p.paramName === name)?.value ?? 0;

  const brokerageBps = get("brokerage_rate") * 10000;
  const taxBps = side === "buy" ? get("stt_rate") * 10000 : 0;

  const [priceRow] = await db
    .select()
    .from(rawMarketData)
    .where(and(eq(rawMarketData.ticker, ticker), lte(rawMarketData.tradeDate, tradeDate)))
    .orderBy(desc(rawMarketData.tradeDate))
    .limit(1);

  const adtv = priceRow?.volume ?? 1_000_000;
  const k = get("market_impact_k") || 0.1;
  const marketImpactBps = k * Math.sqrt(orderSizeZar / adtv) * 10000;
  const spreadBps = get("spread_bps") || 10;
  const executionDelayBps = get("execution_delay_bps") || 5;
  const totalShortfallBps = brokerageBps + taxBps + marketImpactBps + spreadBps + executionDelayBps;

  void res.json({
    data: {
      ticker,
      totalShortfallBps,
      breakdown: { brokerageBps, spreadBps, marketImpactBps, taxBps, executionDelayBps },
    },
    meta: meta(),
  });
});

export default router;
