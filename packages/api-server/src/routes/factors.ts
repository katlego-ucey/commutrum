import { Router, type Router as RouterType } from "express";
import { db } from "@commutrum/db";
import { factorRawValues, factorDefinitions } from "@commutrum/db";
import { eq, and, lte, desc } from "drizzle-orm";
import { computeAllFactors } from "../services/factors.service.js";

const router: RouterType = Router();

router.get("/definitions", async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(factorDefinitions)
      .orderBy(factorDefinitions.effectiveFrom);
    res.json({ factors: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/:ticker/raw", async (req, res, next) => {
  try {
    const ticker = (req.params as { ticker: string }).ticker.toUpperCase();
    const date = req.query["date"] as string | undefined;
    const factorId = req.query["factor_id"] as string | undefined;

    const rows = await db
      .select()
      .from(factorRawValues)
      .where(
        and(
          eq(factorRawValues.ticker, ticker),
          date ? lte(factorRawValues.computeDate, date) : undefined,
          factorId ? eq(factorRawValues.factorId, factorId) : undefined,
        ),
      )
      .orderBy(desc(factorRawValues.computeDate))
      .limit(100);

    res.json({ ticker, factors: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/:ticker/compute", async (req, res, next) => {
  try {
    const ticker = (req.params as { ticker: string }).ticker.toUpperCase();
    const date = req.query["date"] as string | undefined;
    const result = await computeAllFactors(ticker, date);
    res.json({ ticker, date: date ?? "today", ...result });
  } catch (err) {
    next(err);
  }
});

export default router;
