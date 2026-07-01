import { db } from "@workspace/db";
import { tradingCalendar } from "@workspace/db";
import { eq, and, lte, gte } from "drizzle-orm";
import { todaySast } from "../lib/sast";

export async function isTradingDay(date?: string): Promise<boolean> {
  const d = date ?? todaySast();
  const row = await db
    .select({ isTradingDay: tradingCalendar.isTradingDay })
    .from(tradingCalendar)
    .where(eq(tradingCalendar.calendarDate, d))
    .limit(1);
  if (row.length === 0) {
    const dayOfWeek = new Date(d + "T00:00:00Z").getUTCDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6;
  }
  return row[0]!.isTradingDay;
}

export async function getCalendar(from: string, to: string) {
  return db
    .select()
    .from(tradingCalendar)
    .where(and(gte(tradingCalendar.calendarDate, from), lte(tradingCalendar.calendarDate, to)))
    .orderBy(tradingCalendar.calendarDate);
}

export async function nextTradingDay(after?: string): Promise<string | null> {
  const start = after ?? todaySast();
  const rows = await db
    .select({ calendarDate: tradingCalendar.calendarDate })
    .from(tradingCalendar)
    .where(
      and(
        eq(tradingCalendar.isTradingDay, true),
        gte(tradingCalendar.calendarDate, addDays(start, 1)),
      ),
    )
    .orderBy(tradingCalendar.calendarDate)
    .limit(1);
  return rows[0]?.calendarDate ?? null;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
