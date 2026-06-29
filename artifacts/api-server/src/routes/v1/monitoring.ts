import { Router } from "express";
import { db, monitoringMetrics, monitoringAlerts } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

const router = Router();

router.get("/metrics", async (req, res) => {
  const rows = await db
    .select()
    .from(monitoringMetrics)
    .orderBy(desc(monitoringMetrics.metricDate), monitoringMetrics.factorId)
    .limit(100);
  res.json({ data: rows, meta: { generated_at: new Date().toISOString() } });
});

router.get("/alerts", async (req, res) => {
  const rows = await db
    .select()
    .from(monitoringAlerts)
    .orderBy(desc(monitoringAlerts.alertDate))
    .limit(50);
  res.json({ data: rows, meta: { generated_at: new Date().toISOString() } });
});

router.post("/alerts/:id/acknowledge", async (req, res) => {
  const id = Number(req.params.id);
  const { acknowledgedBy } = req.body as { acknowledgedBy?: string };
  await db
    .update(monitoringAlerts)
    .set({ acknowledged: true, acknowledgedBy: acknowledgedBy ?? "system", acknowledgedAt: new Date() })
    .where(eq(monitoringAlerts.id, id));
  res.json({ data: { id, acknowledged: true }, meta: { generated_at: new Date().toISOString() } });
});

export default router;
