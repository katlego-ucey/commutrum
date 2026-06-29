import { Router } from "express";
import { db, factorDefinitions } from "@workspace/db";
import { asc } from "drizzle-orm";

const router = Router();

router.get("/definitions", async (req, res) => {
  const rows = await db.select().from(factorDefinitions).orderBy(asc(factorDefinitions.factorId));
  res.json({ data: rows, meta: { generated_at: new Date().toISOString() } });
});

export default router;
