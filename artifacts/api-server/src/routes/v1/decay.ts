import { Router } from "express";
import { db } from "@workspace/db";
import { decayAlerts, decayInvestigationLog } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();
const meta = () => ({ generated_at: new Date().toISOString() });

router.get("/decay/alerts", async (req, res): Promise<void> => {
  const { status } = req.query;

  const rows = await db
    .select()
    .from(decayAlerts)
    .where(status ? eq(decayAlerts.status, status as string) : undefined)
    .orderBy(desc(decayAlerts.alertDate))
    .limit(200);

  void res.json({
    data: rows.map((r) => ({
      id: r.id,
      alertDate: r.alertDate,
      factorId: r.factorId,
      decayRule: r.decayRule,
      observedValue: r.observedValue,
      thresholdValue: r.thresholdValue,
      status: r.status,
    })),
    meta: meta(),
  });
});

router.post("/decay/alerts/:id/investigate", async (req, res): Promise<void> => {
  const { id } = req.params;
  const { rootCauseCategory, findings, decision, decisionRationale } = req.body as {
    rootCauseCategory?: string;
    findings?: string;
    decision?: string;
    decisionRationale?: string;
  };

  if (!rootCauseCategory || !findings || !decision || !decisionRationale) {
    void res.status(400).json({
      error: { code: "MISSING_FIELDS", message: "rootCauseCategory, findings, decision, decisionRationale are required" },
    });
    return;
  }

  const [alert] = await db
    .select()
    .from(decayAlerts)
    .where(eq(decayAlerts.id, parseInt(id)))
    .limit(1);

  if (!alert) {
    void res.status(404).json({ error: { code: "NOT_FOUND", message: "Decay alert not found" } });
    return;
  }

  await db.insert(decayInvestigationLog).values({
    alertId: alert.id,
    rootCauseCategory,
    findings,
    decision,
    decisionRationale,
  });

  await db
    .update(decayAlerts)
    .set({ status: "investigated", resolution: decision, resolvedAt: new Date() })
    .where(eq(decayAlerts.id, alert.id));

  void res.json({ data: { alertId: alert.id, decision }, meta: meta() });
});

export default router;
