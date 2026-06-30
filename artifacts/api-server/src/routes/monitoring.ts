import { Router } from "express";
import { db } from "@workspace/db";
import { monitoringMetricsDaily, alertLog, decayAlerts } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/metrics", async (req, res, next) => {
  try {
    const metric = req.query["metric"] as string | undefined;
    const rows = await db
      .select()
      .from(monitoringMetricsDaily)
      .orderBy(desc(monitoringMetricsDaily.metricDate))
      .limit(100);
    const filtered = metric ? rows.filter((r) => r.metricName === metric) : rows;
    res.json({ metrics: filtered });
  } catch (err) {
    next(err);
  }
});

router.get("/alerts", async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(alertLog)
      .orderBy(desc(alertLog.createdAt))
      .limit(50);
    res.json({ alerts: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/decay-alerts", async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(decayAlerts)
      .where(eq(decayAlerts.status, "open"))
      .orderBy(desc(decayAlerts.alertDate));
    res.json({ decay_alerts: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
