# Commutrum — Implementation Roadmap

> See `AUDIT.md` for the full audit report. This document translates the specifications into a concrete, phased build sequence.

---

## Before You Write a Single Line of Code

### Decision 1 — Data provider

The entire pipeline depends on data quality. Make this decision first.

| Option | Cost | Covers | Good for |
|---|---|---|---|
| **EODHD $79/month (All-World)** | ~R1,500/month | EOD prices, dividends, corporate actions, some fundamentals | Phase 1–2 start (price data + partial fundamentals) |
| **Profile Data / Sharenet** | R3,000–R15,000/month | Full JSE fundamentals, SENS, consensus estimates | Phase 2 production (Piotroski requires this) |
| **Alpha Vantage free tier** | Free | 25 calls/day EOD prices only | Local dev/testing only — not viable for production |

**Minimum viable start:** EODHD $19/month (gives JSE EOD prices). You can build M00, M01, and the momentum factor. You **cannot** build Piotroski F-score without quality fundamental data.

### Decision 2 — Infrastructure

Start simple. Do not over-engineer before v1 is validated.

- Local development: PostgreSQL + TimescaleDB via Docker
- Production v1: Single server (DigitalOcean Droplet R500–R1,500/month, or Hetzner Cloud for ZAR pricing)
- Move to Kubernetes only after live monitoring (`docs/10`) shows the need

---

## Phase 1 — Data Foundation (Months 1–3)

**Goal:** Nightly JSE price ingestion running reliably. Universe screening passing. No scoring yet.

### Sprint 1 (Weeks 1–2): Workspace scaffolding

```
commutrum/
├── pnpm-workspace.yaml
├── package.json                  ← root tasks: typecheck, test, build
├── tsconfig.base.json
├── tsconfig.json
├── apps/
│   └── api-server/               ← Express 5, TypeScript
│       ├── package.json
│       ├── src/
│       │   ├── index.ts
│       │   ├── app.ts
│       │   └── routes/
│       └── tsconfig.json
└── packages/
    ├── db/                       ← Drizzle ORM schema
    │   ├── package.json
    │   ├── src/
    │   │   └── schema/
    │   └── drizzle.config.ts
    ├── api-spec/                 ← OpenAPI + Orval codegen
    │   ├── openapi.yaml
    │   └── orval.config.ts
    └── api-client-react/         ← Generated TanStack Query hooks
```

CI must pass (typecheck + build) before any data work begins.

### Sprint 2 (Weeks 3–4): Database schema — M00 + M01 tables

Implement the tables for M00 and M01 only. Do not create tables for modules that don't exist yet.

```typescript
// packages/db/src/schema/market.ts
export const rawMarketData = pgTable('raw_market_data', {
  ticker: varchar('ticker', { length: 20 }).notNull(),
  date: date('date').notNull(),
  open: numeric('open', { precision: 18, scale: 4 }),
  high: numeric('high', { precision: 18, scale: 4 }),
  low: numeric('low', { precision: 18, scale: 4 }),
  closeZar: numeric('close_zar', { precision: 18, scale: 4 }).notNull(), // ZAR, not cents
  volume: bigint('volume', { mode: 'number' }),
  adjustedCloseZar: numeric('adjusted_close_zar', { precision: 18, scale: 4 }),
  ingestionTs: timestamp('ingestion_ts', { withTimezone: true }).defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.ticker, t.date] }),
  tickerDateIdx: index('raw_market_data_ticker_date_idx').on(t.ticker, t.date),
}));

// CRITICAL: close_zar = eodhResponse.close / 100
// EODHD returns prices in cents. Always divide by 100.
```

### Sprint 3 (Weeks 5–8): EODHD integration + nightly ingestion cron

- Implement `GET /api/v1/data/prices/{ticker}` (point-in-time filtered)
- Cron job at 17:05 SAST (15:05 UTC, weekdays): `5 15 * * 1-5`
- Cents-to-Rand conversion at ingestion — never in query layer
- Idempotent ingestion (re-run same day = no duplicate rows)

### Sprint 4 (Weeks 9–12): M00 — Universe screening

- Implement `universe_snapshot` and `screening_rules` tables
- ADTV filter (R500k threshold, versioned parameter)
- Market cap filter (R500m, versioned parameter)
- Governance flags (suspension, audit opinion)
- `GET /api/v1/universe?date=YYYY-MM-DD`

**Phase 1 done when:** Universe screening runs nightly and produces a consistent list of 120–150 investable names. Historical universe is reconstructable for any date from 2010 onwards using EODHD historical data.

---

## Phase 2 — Factor Engine (Months 4–7)

**Goal:** Composite score produced daily for every investable name. No probability calibration yet.

### M02 — Baseline factors

Start with what the data supports:

**If EODHD fundamentals coverage is adequate (check for the top 50 JSE names):**
- Implement Piotroski F-score using point-in-time filtered fundamentals
- Implement 12–1 month price momentum (price data already available from Phase 1)
- Leave earnings revisions until analyst estimate data is sourced

**If fundamentals are inadequate:**
- Implement momentum only
- Document that Piotroski is blocked on data access — this is an honest, traceable decision

### M03 — Signal construction

Sector-relative z-score normalization. Requires `sector_mapping` table (JSE GICS sector classification — this is available from EODHD or manual assignment for the top 100 names).

### M04 — Orthogonality engine

With only 2–3 factors at this stage, orthogonality is mainly a correlation check between momentum and revisions (if both are available). PCA is overkill at this stage — implement the correlation check and VIF, and defer PCA to when more factors are admitted.

### M05 — Composite research engine (simplified)

For v1 with 2–3 factors:
- Skip regime classification (not enough historical periods to validate weight profiles yet)
- Use equal time-decay weighting based on each factor's documented decay horizon
- Log the regime classification as a placeholder — it will be filled in during Phase 3 validation

### Phase 2 done when:

Daily composite scores are produced for the investable universe, stored in `composite_scores`, and accessible via `GET /api/v1/research/{ticker}?date=`.

---

## Phase 3 — Validation (Months 8–11)

**Goal:** First honest, cost-adjusted walk-forward backtest completed. System either has demonstrated alpha or methodology is revised.

### M08 — Execution model

Build this before backtesting. Every result must pass through transaction costs.

Initial parameters:
```
commission: 0.25% (EasyEquities model)
STT: 0.25% (statutory)
spread_cost: estimated from ADTV (no live bid-ask data at EODHD tier)
market_impact: square-root model, k=0.1 initial estimate
execution_delay: 1 trading day (signal date to fill date)
```

### M09 — Walk-forward validation

This is the most important module for knowing if the system works. Do not skip or shortcut it.

Historical data requirements: EODHD provides full JSE historical OHLCV back to the late 1990s. Quality fundamental history goes back to ~2010 for most JSE names.

Minimum walk-forward configuration:
```
Training window: 5 years
Test window: 1 year
Number of periods: as many as data allows (target: 8–10 periods)
Final holdout: most recent 24 months — LOCKED, never touched
```

### Phase 3 done when:

A complete walk-forward report exists with IC, ICIR, Sharpe, Sortino, max drawdown, and ALSI benchmark comparison across all periods. The result — whether positive or negative — is the honest answer to "does this work."

---

## Phase 4 — Paper Trading (Months 12–18)

**Goal:** Governance lifecycle Stage 5 complete. Recommendations published daily. Small live capital tracking.

### M06 — Probability calibration

Calibrate using the out-of-sample walk-forward results from Phase 3 only. Build the reliability diagram before surfacing any probability to a user.

### M07 — Portfolio construction

Implement all four capital tiers. Start with the "Standard" tier (R500–R2,000) for paper tracking.

### Paper trading implementation

Track recommendations as they would be executed — at next-day open prices, with full cost simulation from M08. Store in a dedicated `paper_portfolio` table. Run this for 3–6 months before considering live capital.

### M10, M11, M13 — Monitoring, decay detection, registry

These run continuously once live. Implement M13 (registry) first — every factor should have a registry entry before Phase 4 begins.

### Live capital milestone

If paper portfolio is performing as expected after 3 months, deploy R5,000–R20,000 of real capital via EasyEquities. This is self-directed investing, not fund management — no license required at this stage.

---

## Phase 5 — Regulated Operations (Years 3–5)

This phase depends on Phase 3 and Phase 4 results. If the alpha is not there, this phase does not happen — and that is the correct outcome of a rigorous system.

### Requirements for FSCA Category IIA (Hedge Fund) application

| Requirement | Who / How |
|---|---|
| RE1 + RE3 regulatory exams | Key Individual (the person managing the fund) |
| 2 years audited live track record | Must be live, not backtested |
| R750,000 liquid capital in the FSP entity | Company capital, not investment capital |
| Compliance framework | FICA, AML/CFT, record keeping |
| Third-party custodian | Standard Bank, Computershare, etc. |
| Annual FSCA audit | Approved auditor |

**Do not attempt to manage third-party money before this license is in place.** Publishing daily recommendations that users act on with their own capital is legally distinct from discretionary fund management, and is the correct first target.

---

## First Sprint Checklist

Day 1, before writing any code:

- [ ] Open EODHD account and verify JSE data coverage (download a sample for NPN, AGL, SOL)
- [ ] Verify that EODHD returns prices in cents — test `GET /v1/eod/NPN.JSE?api_token=...` and check that Naspers is ~346,000 (cents), not ~3,460 (Rand)
- [ ] Set up local PostgreSQL + TimescaleDB (via Docker)
- [ ] Set `EODHD_API_KEY` environment variable
- [ ] Create the pnpm workspace scaffold (see Phase 1, Sprint 1 above)
- [ ] CI must pass before any module work begins

Day 1 facts to have clear:
- JSE market hours: continuous trading 09:00–16:50 SAST, closing auction 16:50–17:00 SAST
- Nightly batch: 17:05 SAST = 15:05 UTC (cron: `5 15 * * 1-5`)
- All monetary values stored in ZAR, `_zar` column suffix, `NUMERIC(18,4)`
- All timestamps stored UTC `TIMESTAMPTZ`, displayed with `+02:00` offset
- Never filter fundamental queries on `period_end_date` — always `publication_date`

---

## Cost Budget (Minimum Viable Build)

| Item | Monthly cost |
|---|---|
| EODHD All-World (price data) | $79 (~R1,500) |
| PostgreSQL server (DigitalOcean/Hetzner) | R500–R1,000 |
| Domain + SSL | R100 |
| **Total Phase 1–2 minimum** | **~R2,100–R2,600/month** |
| Profile Data / Sharenet fundamentals (Phase 2 production) | R3,000–R15,000/month |
| Analyst estimates (Phase 2 production) | R5,000–R20,000/month |
| **Total production system** | **R10,000–R40,000/month** |

Data costs are the largest operational expense. Plan for them before building.
