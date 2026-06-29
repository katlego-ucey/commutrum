import { Router } from "express";
import { db, compositeScores } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const date = (req.query.date as string) ?? new Date().toISOString().slice(0, 10);
  const rows = await db
    .select()
    .from(compositeScores)
    .where(eq(compositeScores.scoreDate, date))
    .orderBy(desc(compositeScores.compositeScore));
  res.json({ data: rows, meta: { as_of: date, generated_at: new Date().toISOString() } });
});

export default router;
