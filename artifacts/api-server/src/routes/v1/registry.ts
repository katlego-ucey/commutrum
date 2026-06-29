import { Router } from "express";
import { db, hypothesisRegistry } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/factors", async (req, res) => {
  const rows = await db
    .select()
    .from(hypothesisRegistry)
    .orderBy(desc(hypothesisRegistry.registeredAt));
  res.json({ data: rows, meta: { generated_at: new Date().toISOString() } });
});

export default router;
