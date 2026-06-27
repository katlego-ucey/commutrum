import { Router } from "express";
import { db } from "@workspace/db";
import { signalCorrelationMatrix, signalClusters } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();
const meta = (asOf?: string) => ({
  as_of: asOf ?? null,
  generated_at: new Date().toISOString(),
});

router.get("/orthogonality/correlation-matrix", async (req, res): Promise<void> => {
  const { date } = req.query;
  if (!date) {
    void res.status(400).json({ error: { code: "MISSING_DATE", message: "date is required" } });
    return;
  }

  const rows = await db
    .select()
    .from(signalCorrelationMatrix)
    .where(eq(signalCorrelationMatrix.asOfDate, date as string))
    .orderBy(signalCorrelationMatrix.factorIdA, signalCorrelationMatrix.factorIdB);

  void res.json({
    data: rows.map((r) => ({
      factorIdA: r.factorIdA,
      factorIdB: r.factorIdB,
      pearsonCorrelation: r.pearsonCorrelation,
      vif: r.vif,
    })),
    meta: meta(date as string),
  });
});

router.get("/orthogonality/clusters", async (req, res): Promise<void> => {
  const { date } = req.query;
  if (!date) {
    void res.status(400).json({ error: { code: "MISSING_DATE", message: "date is required" } });
    return;
  }

  const rows = await db
    .select()
    .from(signalClusters)
    .where(eq(signalClusters.asOfDate, date as string))
    .orderBy(signalClusters.clusterId);

  const clusterMap = new Map<string, { representative: string; members: string[] }>();
  for (const row of rows) {
    if (!clusterMap.has(row.clusterId)) {
      clusterMap.set(row.clusterId, { representative: "", members: [] });
    }
    const cluster = clusterMap.get(row.clusterId)!;
    cluster.members.push(row.factorId);
    if (row.isRepresentative) cluster.representative = row.factorId;
  }

  void res.json({
    data: Array.from(clusterMap.entries()).map(([clusterId, c]) => ({
      clusterId,
      representative: c.representative,
      members: c.members,
    })),
    meta: meta(date as string),
  });
});

export default router;
