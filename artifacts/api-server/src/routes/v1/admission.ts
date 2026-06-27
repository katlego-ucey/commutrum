import { Router } from "express";
import { db } from "@workspace/db";
import { factorCandidates, admissionGateResults, admissionDecisions } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();
const meta = () => ({ generated_at: new Date().toISOString() });

router.get("/factor-candidates", async (req, res): Promise<void> => {
  const { status } = req.query;

  const rows = await db
    .select()
    .from(factorCandidates)
    .where(status ? eq(factorCandidates.status, status as string) : undefined)
    .orderBy(desc(factorCandidates.submittedAt));

  void res.json({
    data: rows.map((r) => ({
      candidateId: r.candidateId,
      factorName: r.factorName,
      causalityClassification: r.causalityClassification,
      status: r.status,
      submittedAt: r.submittedAt,
    })),
    meta: meta(),
  });
});

router.get("/factor-candidates/:id/gate-results", async (req, res): Promise<void> => {
  const { id } = req.params;

  const [candidate] = await db
    .select()
    .from(factorCandidates)
    .where(eq(factorCandidates.candidateId, id))
    .limit(1);

  if (!candidate) {
    void res.status(404).json({ error: { code: "NOT_FOUND", message: "Factor candidate not found" } });
    return;
  }

  const gates = await db
    .select()
    .from(admissionGateResults)
    .where(eq(admissionGateResults.candidateId, id))
    .orderBy(admissionGateResults.gateNumber);

  void res.json({
    data: gates.map((g) => ({
      gateNumber: g.gateNumber,
      gateName: g.gateName,
      passed: g.passed,
      metricValue: g.metricValue,
      threshold: g.threshold,
      evidence: g.evidence,
    })),
    meta: meta(),
  });
});

router.post("/factor-candidates/:id/decision", async (req, res): Promise<void> => {
  const { id } = req.params;
  const { decision, rationale, decidedBy } = req.body as {
    decision?: string;
    rationale?: string;
    decidedBy?: string;
  };

  if (!decision || !rationale) {
    void res.status(400).json({ error: { code: "MISSING_FIELDS", message: "decision and rationale are required" } });
    return;
  }

  const [candidate] = await db
    .select()
    .from(factorCandidates)
    .where(eq(factorCandidates.candidateId, id))
    .limit(1);

  if (!candidate) {
    void res.status(404).json({ error: { code: "NOT_FOUND", message: "Factor candidate not found" } });
    return;
  }

  const gates = await db
    .select()
    .from(admissionGateResults)
    .where(eq(admissionGateResults.candidateId, id));

  const allPassed = gates.length === 9 && gates.every((g) => g.passed === true);
  const failedGates = gates.filter((g) => !g.passed).map((g) => g.gateName).join(", ") || null;

  await db.insert(admissionDecisions).values({
    candidateId: id,
    decision,
    rationale,
    decidedBy,
    allGatesPassed: allPassed,
    failedGates,
  });

  await db
    .update(factorCandidates)
    .set({ status: decision, finalDecision: decision, finalDecisionAt: new Date(), finalDecisionRationale: rationale })
    .where(eq(factorCandidates.candidateId, id));

  void res.json({ data: { candidateId: id, decision }, meta: meta() });
});

export default router;
