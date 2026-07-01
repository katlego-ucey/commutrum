import { db, closeConnection } from './index.js';
import { factorType } from './schema/index.js';

async function seed() {
  console.log('Seeding database...');

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
    console.log(`  ✓ Factor: ${factor.name}`);
  }

  console.log('Seed complete.');
  await closeConnection();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});