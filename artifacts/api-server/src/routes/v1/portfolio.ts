import { Router } from "express";
import { db, portfolioTargets } from "@workspace/db";
import { desc } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/current", async (req, res) => {
  const latestDateResult = await db
    .select({ rebalanceDate: portfolioTargets.rebalanceDate })
    .from(portfolioTargets)
    .orderBy(desc(portfolioTargets.rebalanceDate))
    .limit(1);

  const latestDate = latestDateResult[0]?.rebalanceDate ?? null;

  const holdings = latestDate
    ? await db
        .select()
        .from(portfolioTargets)
        .where(sql`${portfolioTargets.rebalanceDate} = ${latestDate}`)
        .orderBy(desc(portfolioTargets.targetWeight))
    : [];

  res.json({
    data: { rebalanceDate: latestDate, holdings },
    meta: { as_of: latestDate, generated_at: new Date().toISOString() },
  });
});

export default router;
