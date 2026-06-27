import { Router } from "express";
import { db } from "@workspace/db";
import { monitoringMetricsDaily, alertLog } from "@workspace/db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

const router = Router();
const meta = () => ({ generated_at: new Date().toISOString() });

router.get("/monitoring/metrics", async (req, res): Promise<void> => {
  const { factorId, from, to } = req.query;
  const conditions = [];
  if (factorId) conditions.push(eq(monitoringMetricsDaily.factorId, factorId as string));
  if (from) conditions.push(gte(monitoringMetricsDaily.metricDate, from as string));
  if (to) conditions.push(lte(monitoringMetricsDaily.metricDate, to as string));

  const rows = await db
    .select()
    .from(monitoringMetricsDaily)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(monitoringMetricsDaily.metricDate))
    .limit(500);

  void res.json({
    data: rows.map((r) => ({
      metricDate: r.metricDate,
      factorId: r.factorId,
      metricName: r.metricName,
      value: r.value,
      validatedBandLow: r.validatedBandLow,
      validatedBandHigh: r.validatedBandHigh,
      isWithinBand: r.isWithinBand,
    })),
    meta: meta(),
  });
});

router.get("/monitoring/alerts", async (req, res): Promise<void> => {
  const { acknowledged } = req.query;
  const conditions = [];
  if (acknowledged !== undefined) {
    conditions.push(eq(alertLog.acknowledged, acknowledged === "true"));
  }

  const rows = await db
    .select()
    .from(alertLog)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(alertLog.alertDate))
    .limit(200);

  void res.json({
    data: rows.map((r) => ({
      id: r.id,
      alertDate: r.alertDate,
      alertType: r.alertType,
      factorId: r.factorId,
      severity: r.severity,
      message: r.message,
      acknowledged: r.acknowledged,
    })),
    meta: meta(),
  });
});

router.post("/monitoring/alerts/:id/acknowledge", async (req, res): Promise<void> => {
  const { id } = req.params;
  const { acknowledgedBy } = req.body as { acknowledgedBy?: string };
  if (!acknowledgedBy) {
    void res.status(400).json({ error: { code: "MISSING_FIELD", message: "acknowledgedBy is required" } });
    return;
  }

  const [updated] = await db
    .update(alertLog)
    .set({ acknowledged: true, acknowledgedAt: new Date(), acknowledgedBy })
    .where(eq(alertLog.id, parseInt(id)))
    .returning();

  if (!updated) {
    void res.status(404).json({ error: { code: "NOT_FOUND", message: "Alert not found" } });
    return;
  }

  void res.json({
    data: { id: updated.id, acknowledged: updated.acknowledged },
    meta: meta(),
  });
});

export default router;
