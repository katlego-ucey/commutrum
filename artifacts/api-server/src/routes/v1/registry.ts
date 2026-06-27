import { Router } from "express";
import { db } from "@workspace/db";
import { hypothesisRegistry, lifecycleStatus, auditLog } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router = Router();
const meta = () => ({ generated_at: new Date().toISOString() });

const VALID_STATUSES = ["R&D", "Validation", "Paper Portfolio", "Production", "Watch", "Retired"];

router.get("/registry/factors", async (req, res): Promise<void> => {
  const { status } = req.query;

  const rows = await db
    .select()
    .from(hypothesisRegistry)
    .where(status ? eq(hypothesisRegistry.status, status as string) : undefined)
    .orderBy(hypothesisRegistry.factorId);

  void res.json({
    data: rows.map((r) => ({
      factorId: r.factorId,
      factorName: r.factorName,
      mechanismType: r.mechanismType,
      status: r.status,
      registeredAt: r.registeredAt,
    })),
    meta: meta(),
  });
});

router.get("/registry/factors/:id", async (req, res): Promise<void> => {
  const { id } = req.params;

  const [factor] = await db
    .select()
    .from(hypothesisRegistry)
    .where(eq(hypothesisRegistry.factorId, id))
    .limit(1);

  if (!factor) {
    void res.status(404).json({ error: { code: "NOT_FOUND", message: "Factor not found in registry" } });
    return;
  }

  const history = await db
    .select()
    .from(lifecycleStatus)
    .where(eq(lifecycleStatus.factorId, id))
    .orderBy(desc(lifecycleStatus.transitionedAt));

  void res.json({
    data: {
      factorId: factor.factorId,
      factorName: factor.factorName,
      hypothesis: factor.hypothesis,
      mechanismType: factor.mechanismType,
      causalityClassification: factor.causalityClassification,
      dataRequirements: factor.dataRequirements,
      expectedReturnHorizon: factor.expectedReturnHorizon,
      failureCriteria: factor.failureCriteria,
      status: factor.status,
      lifecycleHistory: history.map((h) => ({
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        transitionedAt: h.transitionedAt,
        evidence: h.evidence,
      })),
    },
    meta: meta(),
  });
});

router.get("/registry/audit-log", async (req, res): Promise<void> => {
  const { entityType, entityId, limit } = req.query;
  const pageSize = Math.min(Number(limit) || 100, 500);

  const conditions = [];
  if (entityType) conditions.push(eq(auditLog.entityType, entityType as string));
  if (entityId) conditions.push(eq(auditLog.entityId, entityId as string));

  const rows = await db
    .select()
    .from(auditLog)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditLog.performedAt))
    .limit(pageSize + 1);

  const hasNext = rows.length > pageSize;
  const data = hasNext ? rows.slice(0, pageSize) : rows;

  void res.json({
    data: data.map((r) => ({
      id: r.id,
      entityType: r.entityType,
      entityId: r.entityId,
      action: r.action,
      performedBy: r.performedBy,
      performedAt: r.performedAt,
    })),
    nextCursor: hasNext ? String(data[data.length - 1].id) : undefined,
    meta: meta(),
  });
});

router.post("/registry/factors/:id/transition", async (req, res): Promise<void> => {
  const { id } = req.params;
  const { toStatus, evidence, transitionedBy, backtestRunId } = req.body as {
    toStatus?: string;
    evidence?: string;
    transitionedBy?: string;
    backtestRunId?: string;
  };

  if (!toStatus || !evidence) {
    void res.status(400).json({ error: { code: "MISSING_FIELDS", message: "toStatus and evidence are required" } });
    return;
  }

  if (!VALID_STATUSES.includes(toStatus)) {
    void res.status(400).json({ error: { code: "INVALID_STATUS", message: `toStatus must be one of: ${VALID_STATUSES.join(", ")}` } });
    return;
  }

  const [factor] = await db
    .select()
    .from(hypothesisRegistry)
    .where(eq(hypothesisRegistry.factorId, id))
    .limit(1);

  if (!factor) {
    void res.status(404).json({ error: { code: "NOT_FOUND", message: "Factor not found in registry" } });
    return;
  }

  const fromStatus = factor.status;

  await db.insert(lifecycleStatus).values({ factorId: id, fromStatus, toStatus, transitionedBy, evidence, backtestRunId });

  await db
    .update(hypothesisRegistry)
    .set({ status: toStatus, updatedAt: new Date() })
    .where(eq(hypothesisRegistry.factorId, id));

  await db.insert(auditLog).values({
    entityType: "factor",
    entityId: id,
    action: "lifecycle_transition",
    performedBy: transitionedBy,
    before: { status: fromStatus },
    after: { status: toStatus },
    notes: evidence,
  });

  void res.json({ data: { factorId: id, newStatus: toStatus }, meta: meta() });
});

export default router;
