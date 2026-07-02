// Drizzle-specific schema index — uses .ts imports (no .js extension)
// for compatibility with drizzle-kit's CJS loader (jiti).
// The main index.ts uses .js extensions for the TypeScript bundler build.

export * from './00-universe.js';
export * from './01-data-pipeline.js';
export * from './02-05-research.js';
export * from './06-08-portfolio-execution.js';
export * from './07-governance.js';

// Re-export inline tables from main index
export {
  users,
  refreshTokens,
  equities,
  priceData,
  factorType,
  factorScores,
  recommendations,
  portfolios,
  portfolioPositions,
  apiUsage,
} from './index.js';
