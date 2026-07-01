import { Router } from "express";
import { db } from "@workspace/db";
import {
  hypothesisRegistry,
  modelVersions,
  registryAuditLog,
  factorCandidates,
  admissionGateResults,
  admissionDecisions,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod/v4";

const router = Router();

router.get("/factors", async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(hypothesisRegistry)
      .orderBy(desc(hypothesisRegistry.registeredDate));
    res.json({ registry: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/factors/:id", async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const [row] = await db
      .select()
      .from(hypothesisRegistry)
      .where(eq(hypothesisRegistry.hypothesisId, id))
      .limit(1);
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    const versions = await db
      .select()
      .from(modelVersions)
      .where(eq(modelVersions.hypothesisId, id));
    res.json({ hypothesis: row, versions });
  } catch (err) {
    next(err);
  }
});

router.get("/audit-log", async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(registryAuditLog)
      .orderBy(desc(registryAuditLog.performedAt))
      .limit(200);
    res.json({ audit_log: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/factor-candidates", async (req, res, next) => {
  try {
    const status = req.query["status"] as string | undefined;
    const rows = await db.select().from(factorCandidates);
    const filtered = status ? rows.filter((r) => r.status === status) : rows;
    res.json({ candidates: filtered });
  } catch (err) {
    next(err);
  }
});

router.get("/factor-candidates/:id/gate-results", async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const rows = await db
      .select()
      .from(admissionGateResults)
      .where(eq(admissionGateResults.candidateId, id));
    res.json({ candidate_id: id, gate_results: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
