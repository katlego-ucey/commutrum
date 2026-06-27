import { Router } from "express";
import { db } from "@workspace/db";
import { backtestRuns, backtestResults, validationPeriods } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();
const meta = () => ({ generated_at: new Date().toISOString() });

router.get("/backtest/runs", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(backtestRuns)
    .orderBy(desc(backtestRuns.startedAt))
    .limit(100);

  void res.json({
    data: rows.map((r) => ({
      runId: r.runId,
      status: r.status,
      description: r.description,
      startedAt: r.startedAt,
      completedAt: r.completedAt,
      costsApplied: r.costsApplied,
    })),
    meta: meta(),
  });
});

router.get("/backtest/results/:runId", async (req, res): Promise<void> => {
  const { runId } = req.params;

  const [run] = await db
    .select()
    .from(backtestRuns)
    .where(eq(backtestRuns.runId, runId))
    .limit(1);

  if (!run) {
    void res.status(404).json({ error: { code: "NOT_FOUND", message: "Backtest run not found" } });
    return;
  }

  const periods = await db
    .select()
    .from(validationPeriods)
    .where(eq(validationPeriods.runId, runId));

  const results = await db
    .select()
    .from(backtestResults)
    .where(eq(backtestResults.runId, runId));

  const resultsByPeriod = new Map(results.map((r) => [r.periodId, r]));

  void res.json({
    data: {
      runId,
      periods: periods.map((p) => {
        const r = resultsByPeriod.get(p.id);
        return {
          periodStart: p.periodStart,
          periodEnd: p.periodEnd,
          locked: p.locked,
          ic: r?.ic,
          icir: r?.icir,
          sharpe: r?.sharpe,
          sortino: r?.sortino,
          hitRate: r?.hitRate,
          maxDrawdown: r?.maxDrawdown,
          annualReturn: r?.annualReturn,
          benchmarkReturn: r?.benchmarkReturn,
          excessReturn: r?.excessReturn,
        };
      }),
    },
    meta: meta(),
  });
});

router.get("/backtest/benchmark-comparison", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      runId: backtestResults.runId,
      annualReturn: backtestResults.annualReturn,
      benchmarkReturn: backtestResults.benchmarkReturn,
      excessReturn: backtestResults.excessReturn,
      sharpe: backtestResults.sharpe,
    })
    .from(backtestResults)
    .orderBy(desc(backtestResults.computedAt))
    .limit(200);

  void res.json({ data: rows, meta: meta() });
});

export default router;
