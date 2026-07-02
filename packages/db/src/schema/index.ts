// ─── Re-export all module-specific schema files ────────────────────────
// These contain the pipeline tables the api-server services depend on.
export * from './00-universe';
export * from './01-data-pipeline';
export * from './02-05-research';
export * from './06-08-portfolio-execution';
export * from './07-governance';

import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  decimal,
  boolean,
  integer,
  uuid,
  uniqueIndex,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';

// ─── Users & Authentication ────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: varchar('display_name', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const refreshTokens = pgTable('refresh_tokens', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── JSE Equities ──────────────────────────────────────────────────────

export const equities = pgTable(
  'equities',
  {
    id: serial('id').primaryKey(),
    symbol: varchar('symbol', { length: 20 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    sector: varchar('sector', { length: 100 }),
    industry: varchar('industry', { length: 100 }),
    isin: varchar('isin', { length: 12 }),
    listingDate: timestamp('listing_date', { withTimezone: true }),
    marketCap: decimal('market_cap', { precision: 20, scale: 2 }),
    currency: varchar('currency', { length: 3 }).default('ZAR').notNull(),
    status: varchar('status', { length: 20 }).default('active').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    symbolIdx: uniqueIndex('idx_equities_symbol').on(table.symbol),
    sectorIdx: index('idx_equities_sector').on(table.sector),
  }),
);

// ─── Price Data (Timescale-friendly) ───────────────────────────────────

export const priceData = pgTable(
  'price_data',
  {
    id: serial('id').primaryKey(),
    symbol: varchar('symbol', { length: 20 }).notNull(),
    date: timestamp('date', { withTimezone: true }).notNull(),
    open: decimal('open', { precision: 14, scale: 4 }),
    high: decimal('high', { precision: 14, scale: 4 }),
    low: decimal('low', { precision: 14, scale: 4 }),
    close: decimal('close', { precision: 14, scale: 4 }),
    volume: decimal('volume', { precision: 20, scale: 0 }),
    adjClose: decimal('adj_close', { precision: 14, scale: 4 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    symbolDateIdx: uniqueIndex('idx_price_symbol_date').on(table.symbol, table.date),
    dateIdx: index('idx_price_date').on(table.date),
  }),
);

// ─── Factor Data (Quality, Momentum, Earnings Revision) ────────────────

export const factorType = pgTable('factor_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }).notNull(), // quality, momentum, earnings
  weight: decimal('weight', { precision: 5, scale: 4 }).default('0.3333'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const factorScores = pgTable(
  'factor_scores',
  {
    id: serial('id').primaryKey(),
    symbol: varchar('symbol', { length: 20 }).notNull(),
    factorTypeId: integer('factor_type_id')
      .notNull()
      .references(() => factorType.id),
    score: decimal('score', { precision: 10, scale: 6 }).notNull(),
    percentile: decimal('percentile', { precision: 6, scale: 2 }),
    date: timestamp('date', { withTimezone: true }).notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    symbolFactorDateIdx: uniqueIndex('idx_factor_symbol_type_date').on(
      table.symbol,
      table.factorTypeId,
      table.date,
    ),
  }),
);

// ─── Recommendations ───────────────────────────────────────────────────

export const recommendations = pgTable(
  'recommendations',
  {
    id: serial('id').primaryKey(),
    symbol: varchar('symbol', { length: 20 }).notNull(),
    compositeScore: decimal('composite_score', { precision: 10, scale: 6 }).notNull(),
    rank: integer('rank').notNull(),
    signal: varchar('signal', { length: 20 }).notNull(), // strong_buy, buy, hold, sell, strong_sell
    qualityScore: decimal('quality_score', { precision: 10, scale: 6 }),
    momentumScore: decimal('momentum_score', { precision: 10, scale: 6 }),
    earningsScore: decimal('earnings_score', { precision: 10, scale: 6 }),
    date: timestamp('date', { withTimezone: true }).notNull(),
    rationale: text('rationale'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    symbolDateIdx: uniqueIndex('idx_rec_symbol_date').on(table.symbol, table.date),
    rankDateIdx: index('idx_rec_rank_date').on(table.rank, table.date),
  }),
);

// ─── User Portfolios ───────────────────────────────────────────────────

export const portfolios = pgTable('portfolios', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull().default('My Portfolio'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const portfolioPositions = pgTable(
  'portfolio_positions',
  {
    id: serial('id').primaryKey(),
    portfolioId: integer('portfolio_id')
      .notNull()
      .references(() => portfolios.id, { onDelete: 'cascade' }),
    symbol: varchar('symbol', { length: 20 }).notNull(),
    shares: decimal('shares', { precision: 18, scale: 4 }).notNull(),
    entryPrice: decimal('entry_price', { precision: 14, scale: 4 }).notNull(),
    currentPrice: decimal('current_price', { precision: 14, scale: 4 }),
    entryDate: timestamp('entry_date', { withTimezone: true }).defaultNow().notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    portfolioSymbolIdx: uniqueIndex('idx_position_portfolio_symbol').on(
      table.portfolioId,
      table.symbol,
    ),
  }),
);

// ─── API Usage Tracking ────────────────────────────────────────────────

export const apiUsage = pgTable(
  'api_usage',
  {
    id: serial('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    endpoint: varchar('endpoint', { length: 255 }).notNull(),
    method: varchar('method', { length: 10 }).notNull(),
    statusCode: integer('status_code'),
    responseTimeMs: integer('response_time_ms'),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userTimestampIdx: index('idx_api_user_timestamp').on(table.userId, table.timestamp),
  }),
);