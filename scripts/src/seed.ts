import { db, factorDefinitions, hypothesisRegistry, monitoringAlerts, monitoringMetrics } from "@workspace/db";

async function seed() {
  console.log("Seeding factor definitions…");

  await db.insert(factorDefinitions).values([
    {
      factorName:     "Value / Book-to-Price",
      description:    "Ranks JSE-listed equities by book-to-market ratio, capturing the value premium documented on SA markets.",
      mechanism:      "Reversion",
      decayHorizon:   60,
      formulaVersion: "1.0",
      effectiveFrom:  "2024-01-01",
    },
    {
      factorName:     "12-1 Momentum",
      description:    "12-month trailing return excluding the most recent month. Captures the momentum anomaly adjusted for JSE liquidity constraints.",
      mechanism:      "Momentum",
      decayHorizon:   20,
      formulaVersion: "1.1",
      effectiveFrom:  "2024-01-01",
    },
    {
      factorName:     "Low Volatility",
      description:    "Inverse realised volatility over a 63-day rolling window. Overweights low-risk names as a defensive tilt.",
      mechanism:      "Defensive",
      decayHorizon:   null,
      formulaVersion: "1.0",
      effectiveFrom:  "2024-03-01",
    },
    {
      factorName:     "Quality / ROE",
      description:    "Return on Equity z-scored cross-sectionally. Identifies structurally profitable JSE companies.",
      mechanism:      "Quality",
      decayHorizon:   90,
      formulaVersion: "1.0",
      effectiveFrom:  "2024-03-01",
    },
    {
      factorName:     "Currency Sensitivity Alpha",
      description:    "Identifies equities whose earnings are positively exposed to ZAR weakness — e.g. dual-listed rand hedges.",
      mechanism:      "Macro",
      decayHorizon:   30,
      formulaVersion: "2.0",
      effectiveFrom:  "2024-06-01",
    },
    {
      factorName:     "Earnings Revision Momentum",
      description:    "Aggregate sell-side EPS revision over the trailing 3 months. Captures analyst information advantage.",
      mechanism:      "Sentiment",
      decayHorizon:   45,
      formulaVersion: "1.0",
      effectiveFrom:  "2024-06-01",
    },
  ]).onConflictDoNothing();

  console.log("Seeding hypothesis registry…");

  await db.insert(hypothesisRegistry).values([
    { factorName: "Value / Book-to-Price",      mechanismType: "reversion",  rationale: "Classic Graham-style value on JSE mid-cap universe",                           status: "Production" },
    { factorName: "12-1 Momentum",              mechanismType: "momentum",   rationale: "Momentum on JSE All Share excluding resources sector",                          status: "Production" },
    { factorName: "Low Volatility",             mechanismType: "defensive",  rationale: "Risk-adjusted returns outperform on JSE over 10-year horizon",                  status: "Validation" },
    { factorName: "Quality / ROE",              mechanismType: "quality",    rationale: "High ROE predictive of 6-month forward returns on JSE ex-miners",               status: "Paper Portfolio" },
    { factorName: "Currency Sensitivity Alpha", mechanismType: "macro",      rationale: "ZAR depreciation predictive of rand-hedge equity outperformance within 30 days", status: "R&D" },
    { factorName: "Earnings Revision Momentum", mechanismType: "sentiment",  rationale: "EPS upgrades lead price discovery on thinly-covered JSE small-caps",           status: "R&D" },
    { factorName: "Dividend Yield",             mechanismType: "income",     rationale: "High-dividend names historically outperform on JSE in risk-off regimes",        status: "Retired" },
    { factorName: "Short Interest Ratio",       mechanismType: "contrarian", rationale: "High short interest predicts reversal. Limited SA data availability.",          status: "Watch" },
  ]).onConflictDoNothing();

  console.log("Seeding monitoring alert (system startup)…");

  await db.insert(monitoringAlerts).values([
    {
      alertType: "System",
      severity:  "info",
      message:   "Commutrum factor engine initialised. Database seeded with 6 factor definitions. Ready for pipeline runs.",
      factorId:  null,
    },
  ]);

  console.log("Seed complete ✓");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
