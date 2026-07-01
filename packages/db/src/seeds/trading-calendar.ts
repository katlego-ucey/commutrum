import type { InsertTradingCalendar } from "../schema/01-data-pipeline";

type Holiday = { date: string; name: string };

const HOLIDAYS: Holiday[] = [
  { date: "2025-01-01", name: "New Year's Day" },
  { date: "2025-03-21", name: "Human Rights Day" },
  { date: "2025-04-18", name: "Good Friday" },
  { date: "2025-04-21", name: "Family Day" },
  { date: "2025-04-28", name: "Freedom Day (observed)" },
  { date: "2025-05-01", name: "Workers' Day" },
  { date: "2025-06-16", name: "Youth Day" },
  { date: "2025-08-11", name: "National Women's Day (observed)" },
  { date: "2025-09-24", name: "Heritage Day" },
  { date: "2025-12-16", name: "Day of Reconciliation" },
  { date: "2025-12-25", name: "Christmas Day" },
  { date: "2025-12-26", name: "Day of Goodwill" },

  { date: "2026-01-01", name: "New Year's Day" },
  { date: "2026-03-23", name: "Human Rights Day (observed)" },
  { date: "2026-04-03", name: "Good Friday" },
  { date: "2026-04-06", name: "Family Day" },
  { date: "2026-04-27", name: "Freedom Day" },
  { date: "2026-05-01", name: "Workers' Day" },
  { date: "2026-06-16", name: "Youth Day" },
  { date: "2026-08-10", name: "National Women's Day (observed)" },
  { date: "2026-09-24", name: "Heritage Day" },
  { date: "2026-12-16", name: "Day of Reconciliation" },
  { date: "2026-12-25", name: "Christmas Day" },
  { date: "2026-12-28", name: "Day of Goodwill (observed)" },

  { date: "2027-01-01", name: "New Year's Day" },
  { date: "2027-03-22", name: "Human Rights Day (observed)" },
  { date: "2027-03-26", name: "Good Friday" },
  { date: "2027-03-29", name: "Family Day" },
  { date: "2027-04-27", name: "Freedom Day" },
  { date: "2027-05-03", name: "Workers' Day (observed)" },
  { date: "2027-06-16", name: "Youth Day" },
  { date: "2027-08-09", name: "National Women's Day" },
  { date: "2027-09-24", name: "Heritage Day" },
  { date: "2027-12-16", name: "Day of Reconciliation" },
  { date: "2027-12-27", name: "Christmas Day (observed)" },
  { date: "2027-12-28", name: "Day of Goodwill (observed)" },
];

function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + "T00:00:00Z");
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function generateTradingCalendar(
  fromDate: string,
  toDate: string,
): InsertTradingCalendar[] {
  const holidaySet = new Map(HOLIDAYS.map((h) => [h.date, h.name]));
  const rows: InsertTradingCalendar[] = [];

  let current = fromDate;
  while (current <= toDate) {
    const weekend = isWeekend(current);
    const holidayName = holidaySet.get(current) ?? null;
    const isTradingDay = !weekend && holidayName === null;

    rows.push({
      calendarDate: current,
      isTradingDay,
      holidayName: weekend ? null : (holidayName ?? null),
    });

    current = addDays(current, 1);
  }

  return rows;
}
