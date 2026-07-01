import { Router } from "express";
import { z } from "zod";
import { getCalendar, isTradingDay, nextTradingDay } from "../services/trading-calendar.service.js";
import { todaySast, isJseTradingHours } from "../lib/sast.js";

const router = Router();
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

router.get("/", async (req, res, next) => {
  try {
    const from = (req.query["from"] as string) ?? todaySast();
    const to = (req.query["to"] as string) ?? todaySast();
    dateSchema.parse(from);
    dateSchema.parse(to);
    const rows = await getCalendar(from, to);
    res.json({ from, to, count: rows.length, calendar: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/status", async (_req, res, next) => {
  try {
    const today = todaySast();
    const [trading, next] = await Promise.all([
      isTradingDay(today),
      nextTradingDay(today),
    ]);
    res.json({
      date: today,
      timezone: "Africa/Johannesburg (SAST = UTC+2)",
      is_trading_day: trading,
      jse_session_open: isJseTradingHours(),
      next_trading_day: next,
      jse_hours_utc: "07:00–14:50",
      jse_hours_sast: "09:00–16:50",
    });
  } catch (err) {
    next(err);
  }
});

export default router;
