import { Router } from "express";
import { db } from "@workspace/db";
import { brokerConfig, costModelParameters } from "@workspace/db";
import { eq, isNull } from "drizzle-orm";
import { z } from "zod/v4";

const router = Router();

router.get("/broker-config", async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(brokerConfig)
      .where(isNull(brokerConfig.effectiveTo));
    res.json({ brokers: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/cost-model", async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(costModelParameters)
      .where(isNull(costModelParameters.effectiveTo));
    res.json({ parameters: rows });
  } catch (err) {
    next(err);
  }
});

const shortfallSchema = z.object({
  ticker: z.string(),
  tradeValueZar: z.number().positive(),
  brokerId: z.string().default("easyequities"),
  adtv20dZar: z.number().positive().optional(),
});

router.post("/estimate-shortfall", async (req, res, next) => {
  try {
    const body = shortfallSchema.parse(req.body);

    const brokerRows = await db
      .select()
      .from(brokerConfig)
      .where(eq(brokerConfig.brokerId, body.brokerId))
      .limit(1);

    const broker = brokerRows[0];
    const commissionPct = broker ? Number(broker.commissionPct) : 0.0025;
    const commissionMin = broker?.commissionMinZar ? Number(broker.commissionMinZar) : 0;

    const commission = Math.max(body.tradeValueZar * commissionPct, commissionMin);
    const stt = body.tradeValueZar * 0.0025;

    const adtv = body.adtv20dZar ?? body.tradeValueZar * 10;
    const participation = body.tradeValueZar / adtv;
    const marketImpactPct = 0.1 * Math.sqrt(participation);
    const marketImpact = body.tradeValueZar * marketImpactPct;

    const totalCostZar = commission + stt + marketImpact;
    const totalCostBps = (totalCostZar / body.tradeValueZar) * 10000;

    const thriveDragNote =
      broker?.hasMonthlyFlatFee && broker.monthlyFlatFeeZar
        ? `Excludes monthly Thrive fee of R${broker.monthlyFlatFeeZar}/mo — pro-rate over portfolio value`
        : undefined;

    res.json({
      ticker: body.ticker,
      broker_id: body.brokerId,
      trade_value_zar: body.tradeValueZar,
      breakdown: {
        commission_zar: +commission.toFixed(2),
        stt_zar: +stt.toFixed(2),
        market_impact_zar: +marketImpact.toFixed(2),
        total_zar: +totalCostZar.toFixed(2),
        total_bps: +totalCostBps.toFixed(2),
      },
      ...(thriveDragNote ? { note: thriveDragNote } : {}),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
