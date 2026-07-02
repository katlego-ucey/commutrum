import { db, closeConnection } from './index.js';
import { factorType, brokerConfig, costModelParameters, tradingCalendar } from './schema/index.js';
import { seedFactorDefinitions } from './seeds/factor-definitions.js';
import { BROKER_SEEDS } from './seeds/broker-config.js';
import { COST_MODEL_PARAMETER_SEEDS } from './seeds/cost-model-parameters.js';
import { generateTradingCalendar } from './seeds/trading-calendar.js';

async function seed() {
  console.log('Seeding database...');

  // 1. Seed Factor Types
  const factors = [
    {
      name: 'quality_roe',
      displayName: 'Return on Equity',
      description: 'Measures profitability relative to shareholder equity',
      category: 'quality',
      weight: '0.1667',
    },
    {
      name: 'quality_debt_to_equity',
      displayName: 'Debt-to-Equity Ratio',
      description: 'Measures financial leverage',
      category: 'quality',
      weight: '0.1667',
    },
    {
      name: 'momentum_6m',
      displayName: '6-Month Momentum',
      description: 'Price return over the last 6 months',
      category: 'momentum',
      weight: '0.1667',
    },
    {
      name: 'momentum_12m',
      displayName: '12-Month Momentum',
      description: 'Price return over the last 12 months, excluding the last month',
      category: 'momentum',
      weight: '0.1667',
    },
    {
      name: 'earnings_revision_up',
      displayName: 'Earnings Revision Upgrades',
      description: 'Net percentage of analysts revising earnings upward',
      category: 'earnings',
      weight: '0.1667',
    },
    {
      name: 'earnings_surprise',
      displayName: 'Earnings Surprise',
      description: 'Magnitude of actual earnings vs consensus estimates',
      category: 'earnings',
      weight: '0.1667',
    },
  ];

  for (const factor of factors) {
    await db.insert(factorType).values(factor).onConflictDoNothing({ target: factorType.name });
    console.log(`  ✓ Factor type: ${factor.name}`);
  }

  // 2. Seed Factor Definitions
  await seedFactorDefinitions();

  // 3. Seed Broker Configurations
  for (const broker of BROKER_SEEDS) {
    await db.insert(brokerConfig).values(broker).onConflictDoNothing({ target: brokerConfig.brokerId });
    console.log(`  ✓ Broker config: ${broker.brokerId}`);
  }

  // 4. Seed Cost Model Parameters
  // Check if cost model parameters already exist to avoid duplicate inserts on re-seed
  const existingParams = await db.select().from(costModelParameters);
  if (existingParams.length === 0) {
    for (const param of COST_MODEL_PARAMETER_SEEDS) {
      await db.insert(costModelParameters).values(param);
      console.log(`  ✓ Cost model parameter: ${param.parameter}`);
    }
  } else {
    console.log('  ✓ Cost model parameters already seeded, skipping...');
  }

  // 5. Seed Trading Calendar
  // Generate calendar dates from 2025-01-01 to 2027-12-31
  const calendarRows = generateTradingCalendar('2025-01-01', '2027-12-31');
  for (const day of calendarRows) {
    await db.insert(tradingCalendar).values(day).onConflictDoNothing({ target: tradingCalendar.calendarDate });
  }
  console.log(`  ✓ Trading calendar seeded: ${calendarRows.length} days`);

  console.log('Seed complete.');
  await closeConnection();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
