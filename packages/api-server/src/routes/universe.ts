import { Router, type Router as RouterType } from "express";
import { z } from "zod";
import { getUniverse, screenTicker, runDailyScreen } from "../services/universe.service.js";

const router: RouterType = Router();

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

router.get("/", async (req, res, next) => {
  try {
    const date = req.query["date"] as string | undefined;
    if (date) dateSchema.parse(date);
    const rows = await getUniverse(date);
    res.json({ date: date ?? "today", count: rows.length, universe: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/:ticker/screen-status", async (req, res, next) => {
  try {
    const { ticker } = req.params as { ticker: string };
    const date = req.query["date"] as string | undefined;
    if (date) dateSchema.parse(date);
    const result = await screenTicker(ticker.toUpperCase(), date ?? new Date().toISOString().slice(0, 10));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/run-screen", async (req, res, next) => {
  try {
    const date = req.query["date"] as string | undefined;
    if (date) dateSchema.parse(date);
    const results = await runDailyScreen(date);
    res.json({ screened: results.length, results });
  } catch (err) {
    next(err);
  }
});

export default router;
