# Commutrum — JSE Wealth Engine

A rules-based quantitative wealth engine for the Johannesburg Stock Exchange.
Commutrum systematically ingests market and fundamental data, constructs and validates factor signals, and outputs a ranked list of **highly recommended JSE equities** — scored by quality, momentum, and earnings revision strength — with calibrated probability estimates and full portfolio construction.

No AI. No black boxes. Every score is explainable, every parameter is versioned, and every recommendation is backed by rigorous out-of-sample validation.

---

## What Commutrum Produces

```
Daily Output → Top JSE equity candidates ranked by composite wealth score
               Each with: probability of positive return, confidence interval,
               factor attribution breakdown, portfolio weight recommendation
```

The pipeline runs nightly: raw JSE data in → investable universe filtered → factors computed → signals normalized → redundancy removed → composite score built → probabilities calibrated → portfolio constructed → recommendations published.

---

## Stack

- **Backend**: Express 5, PostgreSQL + TimescaleDB, Drizzle ORM, Zod validation
- **Frontend**: React 19, Vite, Tailwind CSS, Recharts, TanStack Query
- **Language**: TypeScript 5.9 throughout
- **Package manager**: pnpm workspaces

---

## Repository Structure

```
apps/
  api-server/         Express 5 REST API — all 13 pipeline module endpoints
  commutrum/          React + Vite frontend — 5 research and monitoring dashboards
packages/
  db/                 Drizzle ORM schema (35+ tables across all modules)
  api-spec/           OpenAPI spec + Orval codegen
  api-client-react/   Generated TanStack Query hooks
  api-zod/            Generated Zod schemas
docs/
  00–13/              Module specifications (pipeline stages)
  14–18/              Database schema, API spec, dashboards, testing, playbook
```

---

## The 13-Stage Wealth Engine Pipeline

| Stage | Module | Purpose |
|---|---|---|
| 00 | Universe Screening | Filter ~280 JSE listings to ~120–150 investable names daily |
| 01 | Data Pipeline | Point-in-time data warehouse — survivorship-free, look-ahead-safe |
| 02 | Baseline Factors | Piotroski F-score, earnings revisions, price momentum |
| 03 | Signal Construction | Sector-relative normalization, z-scoring, winsorization |
| 04 | Orthogonality Engine | Correlation/VIF/PCA — remove double-counted signals |
| 05 | Composite Engine | Regime-aware, decay-weighted scoring with interaction terms |
| 06 | Probability Calibration | Platt scaling / isotonic regression → calibrated win probability |
| 07 | Portfolio Construction | Inverse-vol sizing, sector constraints, 15–25 stock target |
| 08 | Execution Model | Brokerage, bid-ask, STT (0.25%), market impact, capacity limits |
| 09 | Walk-Forward Validation | Rolling out-of-sample backtesting — bias-free |
| 10 | Continuous Monitoring | Daily rolling IC/Sharpe/drawdown with pre-set alert thresholds |
| 11 | Decay Detection | Distinguish noise from structural alpha decay |
| 12 | Factor Admission | Rigorous 9-gate protocol for any new factor candidate |
| 13 | Hypothesis Registry | Scientific governance lifecycle — audit trail for every decision |

---

## Dashboards

| Dashboard | Purpose |
|---|---|
| Research | Composite wealth scores, factor attribution, return forecasts |
| Factor Explorer | Factor definitions, IC charts, decay tracking |
| Portfolio Construction | Recommended holdings, weights, rebalance schedule |
| Monitoring | Live signal health, alert rules, regime detection |
| Hypothesis Registry | Full audit trail — what was tested, what passed, what failed |

---

## Baseline Factors (v1)

| Factor | Type | Decay horizon |
|---|---|---|
| Piotroski F-score | Quality | Quarterly |
| Earnings estimate revisions | Sentiment | Weekly |
| 12–1 month price momentum | Momentum | Monthly |
| Liquidity (20-day ADTV) | Hard screen only — not scored | Daily |

Additional factors must clear the 9-gate Factor Admission Protocol (`docs/12-factor-admission-protocol`) before entering production.

---

## Getting Started

```bash
pnpm install
pnpm --filter @commutrum/db run push           # apply database migrations
pnpm --filter @commutrum/api-spec run codegen  # regenerate API hooks + Zod schemas
pnpm --filter @commutrum/api-server run dev    # start the API server
pnpm --filter @commutrum/commutrum run dev     # start the frontend
```

**Required environment variables:**

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | API server port |
| `JWT_SECRET` | Secret for JWT signing (protected endpoints) |

---

## Design Constraints

- **Point-in-time integrity**: all queries filter on `publication_date`, never `period_end_date`
- **Survivorship-free**: delisted companies remain queryable for all historical dates
- **No hardcoded parameters**: all thresholds, weights, and tax rates are versioned database rows
- **South Africa tax params**: STT 0.25%, dividend WHT 20%, CGT effective 21.6% (corporate) — versioned with `effective_from` dates
- **Backtest honesty**: every result reported with IC, ICIR, Sharpe, Sortino, max drawdown, and benchmark comparison — never a bare return number
- **Factor governance**: no factor enters production without clearing `docs/12-factor-admission-protocol`

---

## Documentation

Each pipeline stage has a full specification in `docs/`:

| Doc | Module |
|---|---|
| [00 — Universe Screening](docs/00-universe-screening/README.md) | Daily investable universe construction |
| [01 — Data Pipeline](docs/01-data-pipeline/README.md) | Point-in-time data warehouse |
| [02 — Baseline Factors](docs/02-baseline-factors/README.md) | v1 factor computation |
| [03 — Signal Construction](docs/03-signal-construction/README.md) | Normalization and standardization |
| [04 — Orthogonality Engine](docs/04-orthogonality-engine/README.md) | Signal independence checks |
| [05 — Composite Engine](docs/05-composite-research-engine/README.md) | Regime-aware scoring |
| [06 — Probability Calibration](docs/06-probability-calibration/README.md) | Calibrated win probabilities |
| [07 — Portfolio Construction](docs/07-portfolio-construction/README.md) | Position sizing and constraints |
| [08 — Execution Model](docs/08-execution-model/README.md) | Transaction costs and capacity |
| [09 — Walk-Forward Validation](docs/09-walk-forward-validation/README.md) | Bias-free backtesting |
| [10 — Continuous Monitoring](docs/10-continuous-monitoring/README.md) | Live signal health tracking |
| [11 — Decay Detection](docs/11-decay-detection/README.md) | Alpha decay identification |
| [12 — Factor Admission](docs/12-factor-admission-protocol/README.md) | New factor governance |
| [13 — Hypothesis Registry](docs/13-hypothesis-model-registry/README.md) | Scientific audit trail |
| [14 — Database Schema](docs/14-database-schema/README.md) | Full schema reference |
| [15 — API Specification](docs/15-api-specification/README.md) | REST endpoint reference |
| [16 — Frontend Dashboards](docs/16-frontend-dashboards/README.md) | Dashboard specifications |
| [17 — Testing & Deployment](docs/17-testing-deployment/README.md) | Test strategy and CI/CD |
| [18 — Development Playbook](docs/18-ai-agent-development-playbook/README.md) | Implementation guide |
