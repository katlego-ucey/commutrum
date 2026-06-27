# Commutrum

Rules-based JSE (Johannesburg Stock Exchange) factor research engine. No AI — pure quantitative signal construction, portfolio construction, and hypothesis management.

## Stack

- **Backend**: Express 5, PostgreSQL, Drizzle ORM, Zod validation
- **Frontend**: React 19, Vite, Tailwind CSS, Recharts, TanStack Query
- **Language**: TypeScript 5.9 throughout
- **Monorepo**: pnpm workspaces

## Structure

```
artifacts/
  api-server/       Express 5 REST API (~30 endpoints, 13 pipeline modules)
  commutrum/        React + Vite frontend (5 research dashboards)
lib/
  db/               Drizzle ORM schema (35 tables)
  api-spec/         OpenAPI spec + Orval codegen
  api-client-react/ Generated TanStack Query hooks
  api-zod/          Generated Zod schemas
```

## Dashboards

| Dashboard | Purpose |
|---|---|
| Research | Factor score tables, return attribution, rolling IC |
| Factor Explorer | Factor definitions, backtests, decay charts |
| Portfolio Construction | Rebalance scheduler, weights, trade list |
| Monitoring | Live signals, alert rules, regime detection |
| Hypothesis Registry | Hypothesis CRUD, test status, evidence log |

## Factors (JSE baseline)

| Factor | Type |
|---|---|
| Piotroski F-score | Quality |
| Earnings revisions | Sentiment |
| 12-1 month momentum | Momentum |
| Liquidity (ADV) | Hard screen |

## Getting started

```bash
pnpm install
pnpm --filter @workspace/db run push        # migrate DB
pnpm --filter @workspace/api-spec run codegen  # regenerate API hooks
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/commutrum run dev
```

Required env: `DATABASE_URL`, `PORT`, `SESSION_SECRET`

## Design constraints

- Point-in-time integrity: always filter on `publication_date`, never `period_end_date`
- All thresholds and parameters are versioned database rows — nothing hardcoded
- South Africa tax params: STT 0.25 %, dividend WHT 20 %, CGT effective 21.6 % (corporate)
