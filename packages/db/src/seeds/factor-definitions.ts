import { db } from "../index.js";
import { factorDefinitions } from "../schema/index.js";

const FACTOR_RECORDS = [
  {
    factorId: "piotroski_fscore_v1",
    name: "piotroski_fscore",
    mechanism: "nine-point binary score based on profitability, leverage, liquidity, and operating efficiency ratios vs prior year",
    decayHorizon: "monthly",
    formulaVersion: "v1",
    requiredData: ["rawFundamentals"],
    academicReference: "Piotroski, J. D. (2000). Value Investing: The Use of Historical Financial Statement Information.",
    hypothesisRegistryId: "HYP-001",
    effectiveFrom: "2010-01-01",
  },
  {
    factorId: "price_momentum_12_1_v1",
    name: "price_momentum_12_1",
    mechanism: "12-month price return skipping the most recent month, using adjusted close prices for dividend-adjusted returns",
    decayHorizon: "monthly",
    formulaVersion: "v1",
    requiredData: ["rawMarketData"],
    academicReference: "Jegadeesh, N. & Titman, S. (1993). Returns to Buying Winners and Selling Losers.",
    hypothesisRegistryId: "HYP-002",
    effectiveFrom: "2010-01-01",
  },
  {
    factorId: "earnings_revision_signal_v1",
    name: "earnings_revision_signal",
    mechanism: "composite of revision breadth (upgrades minus downgrades / total) and mean magnitude of estimate changes over trailing 30 days",
    decayHorizon: "daily",
    formulaVersion: "v1",
    requiredData: ["rawEstimateRevisions"],
    academicReference: "Asquith, P., Mikhail, M. B., & Au, A. S. (2005). Information content of equity analyst reports.",
    hypothesisRegistryId: "HYP-003",
    effectiveFrom: "2010-01-01",
  },
  {
    factorId: "liquidity_adtv_20d_v1",
    name: "liquidity_adtv_20d",
    mechanism: "20-day average daily trading value in ZAR; continuous liquidity metric used for ranking and minimum liquidity screening",
    decayHorizon: "daily",
    formulaVersion: "v1",
    requiredData: ["rawMarketData"],
    academicReference: "Amihud, Y. (2002). Illiquidity and stock returns: cross-section and time-series effects.",
    hypothesisRegistryId: "HYP-004",
    effectiveFrom: "2010-01-01",
  },
];

export async function seedFactorDefinitions(): Promise<void> {
  for (const record of FACTOR_RECORDS) {
    await db
      .insert(factorDefinitions)
      .values(record)
      .onConflictDoNothing({ target: factorDefinitions.factorId });
    console.log(`  ✓ Factor definition: ${record.name}`);
  }
}