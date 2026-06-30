# Commutrum — JSE Wealth Engine

A rules-based quantitative wealth engine for the Johannesburg Stock Exchange.
Commutrum ingests live JSE market and fundamental data, constructs and validates factor signals, and outputs a ranked list of **highly recommended JSE equities** — scored by quality, momentum, and earnings revision strength — with calibrated probability estimates and full portfolio construction.

No AI. No black boxes. Every score is explainable, every parameter is versioned, and every recommendation is backed by rigorous out-of-sample validation.

---

## What Commutrum Produces

```
Daily Output (after 17:05 SAST) → JSE equities ranked by composite wealth score
  Each stock: probability of positive return · confidence interval
              factor attribution · recommended portfolio weight
  Portfolio:  position list tailored to your capital in ZAR (from R50)
```

The pipeline runs nightly after JSE market close: live JSE data in → investable universe filtered → factors computed → signals normalized → redundancy removed → composite score built → probabilities calibrated → portfolio constructed → recommendations published.

---

## South African Market Context

| Detail | Value |
|---|---|
| Exchange | Johannesburg Stock Exchange (JSE) |
| Currency | South African Rand — **ZAR (R)** |
| Timezone | **SAST = UTC+2** (Africa/Johannesburg) — no daylight saving |
| Market open | 09:00 SAST (07:00 UTC) — pre-market auction starts 08:30 |
| Continuous trading ends | 16:50 SAST (14:50 UTC) |
| Closing auction | 16:50–17:00 SAST (14:50–15:00 UTC) |
| Market close (session end) | 17:00 SAST (15:00 UTC) |
| Nightly batch | **17:05 SAST** (15:05 UTC) — after closing auction |
| JSE universe | ~280 listed companies; ~120–150 investable after screening |
| Minimum trade | **R1** technically (JSE has no minimum value floor) |
| Practical minimum | **R50 per position** via EasyEquities (0.25% commission, fractional shares) |

> **On R1 trades:** The JSE exchange itself imposes no minimum trade value — only 1 share minimum. EasyEquities supports fractional shares from **R5**. A R50 trade costs ~R0.25 in total friction (0.5% round-trip). A R1 trade costs ~R0.03 (3%). Wealth engine recommendations work from **R50** upward; the scoring itself is identical at all capital levels.

---

## Stack

- **Backend**: Express 5, PostgreSQL + TimescaleDB, Drizzle ORM, Zod validation
- **Frontend**: React 19, Vite, Tailwind CSS, Recharts, TanStack Query
- **Language**: TypeScript 5.9 throughout
- **Package manager**: pnpm workspaces
- **Live JSE data**: EODHD API (recommended) / Alpha Vantage (development)

---

## Repository Structure

```
apps/
  api-server/         Express 5 REST API — all 13 pipeline module endpoints
  commutrum/          React + Vite frontend — 5 research and monitoring dashboards
packages/
  db/                 Drizzle ORM schema (35+ tables across all modules)
  api-spec/           OpenAPI spec (openapi.yaml) + Orval codegen config
  api-client-react/   Generated TanStack Query hooks (do not hand-edit)
  api-zod/            Generated Zod schemas (do not hand-edit)
docs/
  00–13/              Module specifications (pipeline stages)
  14–18/              Database schema, API spec, dashboards, testing, playbook
AUDIT.md              Full audit report (issues found, feasibility assessment)
ROADMAP.md            Phased implementation plan with data costs and sprint checklist
```

> **Status: documentation phase.** No implementation code exists yet.
> Read `ROADMAP.md` for the concrete first steps before writing any code.
> Read `docs/18-ai-agent-development-playbook/README.md` if using an AI coding agent.

---

## The 13-Stage Wealth Engine Pipeline

Each stage feeds the next. The full dependency chain is documented in GitHub issues.

```
[Live JSE Data (EODHD/Alpha Vantage)]
         ↓
[M01: Point-in-Time Data Warehouse]  ←── foundation; every module reads from here
         ↓
[M00: Universe Screening]            ←── ~280 JSE stocks → ~120–150 investable names
         ↓
[M02: Baseline Factors]              ←── Piotroski, earnings revisions, momentum
         ↓
[M03: Signal Construction]           ←── sector-relative z-score normalization
         ↓
[M04: Orthogonality Engine]          ←── remove double-counted correlated signals
         ↓
[M05: Composite Scoring Engine]      ←── regime-aware, decay-weighted score
         ↓                                  (output: composite wealth score per stock)
[M06: Probability Calibration]       ←── score → calibrated win probability
         ↓                                  (output: "72% chance of positive return")
[M07: Portfolio Construction]        ←── rank by probability + position sizing
         ↓                                  (output: recommended buy list in ZAR)
[M08: Execution Model]               ←── apply real costs (STT, commission, slippage)
         ↓
[M09: Walk-Forward Validation]       ←── bias-free historical proof the engine works
         ↓
[M10: Continuous Monitoring]         ←── daily live signal health checks
         ↓
[M11: Decay Detection]               ←── distinguish noise from real alpha decay
         ↕
[M12: Factor Admission Protocol]     ←── 9-gate gatekeeper for any new factor
         ↕
[M13: Hypothesis & Model Registry]   ←── audit trail for every decision ever made
```

---

## Small Investor Support (R50 → R5m+)

The wealth engine produces identical scores at all portfolio sizes. Capital only affects the number of positions:

| Portfolio size | Mode | Positions | Notes |
|---|---|---|---|
| R5 – R100 | ETF mode | 1 | Top-scored JSE ETF (e.g., Satrix Top 40) recommended |
| R100 – R500 | Starter | 3–5 | Equal weight, fractional shares via EasyEquities |
| R500 – R2,000 | Standard | 5–10 | Full composite scoring, simplified rebalancing |
| R2,000+ | Full | 15–25 | All M07 constraints, monthly rebalancing |

Transaction costs (EasyEquities model, default for small investors):
- Commission: 0.25% per trade (no minimum floor)
- STT: 0.25% on all equity purchases (SARS-mandated)
- Round-trip friction on R50 trade: ~R0.25 (0.5%) — acceptable

---

## Live JSE Data Integration

| Provider | Use | Cost | Notes |
|---|---|---|---|
| **EODHD** | **Recommended production** | $19–79/month | Best JSE coverage, near-realtime |
| Alpha Vantage | Development/testing | Free–$50+/month | 25 free calls/day, format: `JSE:NPN` |
| Yahoo Finance | Prototyping only | Free | No SLA, 15min delayed |

**JSE price format:** EODHD returns prices in **cents (ZAc)**. The ingestion layer divides by 100 to store in **Rand (ZAR)**. Example: `346000c → R3,460.00`.

Required environment variables:
```
EODHD_API_KEY=...
```

---

## Dashboards

| Dashboard | What it shows |
|---|---|
| **Research** | Ranked JSE stocks by wealth score, calibrated win probability, factor attribution |
| **Factor Explorer** | Factor definitions, IC charts, decay tracking |
| **Portfolio Construction** | Recommended holdings for your ZAR capital, weights, rebalance schedule |
| **Monitoring** | Live signal health, alert rules, regime detection (SAST times) |
| **Hypothesis Registry** | Full audit trail — what was tested, what passed, what failed |

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
| `EODHD_API_KEY` | Live JSE data — get at eodhd.com |

---

## Design Constraints

- **SAST timezone**: all timestamps stored as UTC (`TIMESTAMPTZ`), displayed as `Africa/Johannesburg` (SAST = UTC+2, no DST)
- **ZAR currency**: all monetary values in South African Rand. Column naming: `_zar` suffix. Display format: `R 1 250.00` (`en-ZA` locale)
- **JSE cents conversion**: EODHD returns prices in cents — divide by 100 on ingestion
- **Point-in-time integrity**: all queries filter on `publication_date`, never `period_end_date`
- **Survivorship-free**: delisted companies remain queryable for all historical dates
- **No hardcoded parameters**: all thresholds, weights, and tax rates are versioned database rows
- **SA tax params**: STT 0.25%, dividend WHT 20%, CGT effective 21.6% (corporate) — versioned with `effective_from` dates; updated annually with SARS Budget
- **Backtest honesty**: every result reported with IC, ICIR, Sharpe, Sortino, max drawdown, and benchmark comparison — never a bare return number
- **Factor governance**: no factor enters production without clearing `docs/12-factor-admission-protocol`

---

## Documentation

| Doc | Module |
|---|---|
| [00 — Universe Screening](docs/00-universe-screening/README.md) | Daily investable universe construction |
| [01 — Data Pipeline](docs/01-data-pipeline/README.md) | Point-in-time data warehouse + live JSE API |
| [02 — Baseline Factors](docs/02-baseline-factors/README.md) | v1 factor computation |
| [03 — Signal Construction](docs/03-signal-construction/README.md) | Normalization and standardization |
| [04 — Orthogonality Engine](docs/04-orthogonality-engine/README.md) | Signal independence checks |
| [05 — Composite Engine](docs/05-composite-research-engine/README.md) | Regime-aware scoring |
| [06 — Probability Calibration](docs/06-probability-calibration/README.md) | Calibrated win probabilities |
| [07 — Portfolio Construction](docs/07-portfolio-construction/README.md) | Position sizing, small investor tiers |
| [08 — Execution Model](docs/08-execution-model/README.md) | Transaction costs, SA taxes, R1 feasibility |
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
