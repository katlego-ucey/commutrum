# Module 01 — Point-in-Time Data Pipeline

> **Commutrum Wealth Engine** — One stage in the 13-module pipeline that scores and ranks JSE equities for investment. All modules feed into a single composite score and calibrated win probability. See the [root README](../../README.md) for the full pipeline.

**Pipeline position:** Foundation layer. Every other module reads from this
one. Nothing downstream may bypass it to query a data source directly.
**Status:** Specification

## Purpose

Ingest, validate, and store every data type the engine needs, with strict
**point-in-time integrity**: for any historical date `t`, a query against
this pipeline must return only the data that was actually knowable on `t`.
This single rule is what prevents look-ahead bias from contaminating every
factor and every backtest built on top of this module.

## Data domains

| Domain | Examples | Update frequency |
|---|---|---|
| Market data | Daily OHLCV, traded volume, corporate actions, dividends | Daily (EOD) |
| Fundamental data | Income statement, balance sheet, cash flow statement | Per reporting period, as published |
| Events & news | SENS announcements, results releases, dividend/rights announcements, corporate events | Real-time / daily |
| Analyst & macro | EPS estimates, estimate revisions, sector indices, macro (repo rate, ZAR/USD, CPI) | Daily / monthly |

## The point-in-time rule (non-negotiable)

Every fundamental data row must store **both**:
- `period_end_date` — the date the financial period being reported covers
- `publication_date` (a.k.a. `as_of_date`) — the date the data actually
  became public (the SENS results announcement date, not the period end)

JSE companies typically publish results 6–8 weeks after period end. **Any
query used to build a factor or run a backtest must filter on
`publication_date <= t`, never on `period_end_date <= t`.** Using period-end
date instead of publication date is the single most common source of
inflated backtest performance in this entire system — it lets the model
"see" Q1 results on the day Q1 ends, weeks before they actually existed.

```sql
-- WRONG: introduces look-ahead bias
SELECT * FROM fundamentals WHERE period_end_date <= :as_of_date;

-- CORRECT: only data that was actually public on :as_of_date
SELECT * FROM fundamentals WHERE publication_date <= :as_of_date;
```

## Survivorship-free storage rule (non-negotiable)

Never delete or archive-out a company's historical records when it delists,
gets acquired, or goes bankrupt. Mark it `is_active = false` and stop
ingesting new data, but its full price/fundamental history must remain
queryable for any date prior to delisting. Roughly 500 JSE delistings
occurred between 1989 and 2024 — a system that silently drops them will
systematically overstate historical engine performance.

## Schema sketch (see `14-database-schema` for the full version)

- `raw_market_data(ticker, date, open, high, low, close, volume, adjusted_close, ingestion_ts)`
- `raw_corporate_actions(ticker, action_date, action_type, ratio_or_value)`
- `raw_dividends(ticker, declaration_date, ex_date, pay_date, amount_per_share)`
- `raw_fundamentals(ticker, period_end_date, publication_date, statement_type, line_item, value, currency, ingestion_ts)`
- `raw_sens_announcements(ticker, announcement_date, category, headline, body_ref)`
- `raw_analyst_estimates(ticker, estimate_date, fiscal_period, metric, value, source)`
- `raw_estimate_revisions(ticker, revision_date, metric, old_value, new_value)`
- `macro_series(series_name, date, value)` — repo rate, ZAR/USD, CPI, etc.
- `data_quality_log(ticker, date, field, issue_type, resolved)`

## Validation rules

- Range checks per field (e.g. price > 0, ratios within plausible bounds)
- Outlier flagging (e.g. single-day return > ±30% without a matching
  corporate action — flag for review, don't silently accept or silently drop)
- Corporate-action back-adjustment: splits and unbundlings must be applied
  consistently to historical price series, with both adjusted and
  unadjusted series retained
- Missing-data policy: a ticker with missing fundamentals for the current
  reporting period is **not** scored for the modules that depend on that
  field until the data arrives — it is not given a default/neutral value,
  which would silently bias its score

## Data sources for the JSE

- **JSE direct feeds**: live, intraday, end-of-day, and historical market and
  index data, including the FTSE/JSE Africa Index Series (JSE/FTSE Russell
  joint venture). Delayed feeds carry a mandatory 15-minute lapse.
- **SENS** (Stock Exchange News Service): the primary source for
  `raw_sens_announcements` — results, trading updates, dividend declarations,
  rights issues, director dealings, and other regulatory disclosures.
- **Authorised vendors**: IRESS, Profile Data, Sharenet, FactSet, Morningstar,
  Infront, and others are authorised JSE data redistributors and typically
  provide fundamentals, consensus estimates, and corporate actions feeds that
  the raw exchange feed doesn't carry in a structured form.
- **Macro data**: SARB (South African Reserve Bank) for repo rate, Stats SA
  for CPI, standard FX data providers for ZAR/USD and ZAR/GBP.

## API endpoints

- `GET /data/prices/{ticker}?from=&to=&as_of=` — point-in-time price series
- `GET /data/fundamentals/{ticker}?metric=&as_of=` — point-in-time fundamental query
- `GET /data/events/{ticker}?from=&to=` — SENS/event history
- `GET /data/quality/{ticker}?date=` — data quality report for a ticker/date

## Acceptance criteria / Definition of Done

- [ ] Every fundamental row has a non-null `publication_date` distinct from `period_end_date`
- [ ] A point-in-time query for any historical date returns identical results
      every time it is run (i.e., later corrections/restatements do not
      silently rewrite history — store restatements as new rows with their
      own publication date, never overwrite)
- [ ] Delisted tickers remain fully queryable for dates prior to delisting
- [ ] Automated validation flags outliers before they reach `02-baseline-factors`
- [ ] Ingestion is idempotent (re-running a day's ingestion does not duplicate rows)

## Known failure modes & mitigations

| Failure mode | Mitigation |
|---|---|
| Look-ahead bias via period-end date instead of publication date | Hard rule above; enforce via a database view that *only* exposes `publication_date`-filtered queries to downstream modules |
| Survivorship bias via deleting delisted companies | Hard rule above; `is_active` flag, never delete |
| Silent data restatement rewriting history | Append-only fundamentals table; restatements are new rows with new publication dates |
| Treating missing data as zero/neutral | Explicit `data_completeness_score`; missing fields block scoring rather than defaulting |

## References

- JSE market data products and delayed-feed rules: jse.co.za/market-data
- JSE delisting count (1989–2024) and rising market concentration: Financial Mail

---

## Live JSE Data Sources

> **Depends on:** Issue #41 (live JSE API integration) must be configured before this module ingests real data.

The JSE does not provide a free public data API. Recommended providers:

| Provider | Ticker format | Coverage | Dev cost | Production (redistribution) cost | Notes |
|---|---|---|---|---|---|
| **EODHD** (recommended) | `NPN.JSE` | Full JSE — OHLCV, fundamentals, dividends, corporate actions | $19–$79/month (personal plan) | **$399–$2,499/month** (commercial license — required to redistribute scored data to subscribers) | Personal plan prohibits third-party redistribution. Contact EODHD sales before Stage 2 launch. |
| Alpha Vantage | `JSE:NPN` | OHLCV + fundamentals | Free (25 calls/day) | $50+/month | Use for local development only — JSE fundamental coverage incomplete |
| Yahoo Finance | `NPN.JO` | OHLCV only | Free (unofficial) | Not applicable | No SLA — prototype use only; do not use in production |

> **EODHD licensing rule:** Use the personal/developer plan ($19–$79/month) for all internal development and backtesting in Phase 1. The moment any user receives scored or derived data, switch to the commercial API license. Failure to do so violates EODHD's terms of service. See `SYSTEM_REPORT.md §8.1` and `ROADMAP.md Decision 1` for the full cost breakdown.

### JSE Price Format — Cents to Rand Conversion

**Critical:** EODHD and most JSE data providers return prices in **South African cents (ZAc)**, not Rand (ZAR).

```typescript
// WRONG — stores cents as if they were Rand
await db.insert(rawMarketData).values({ close_zar: eodhResponse.close });

// CORRECT — always divide by 100 before storing
await db.insert(rawMarketData).values({ close_zar: eodhResponse.close / 100 });
// Example: 346000c (Naspers) → R3,460.00 stored as 3460.0000
```

All monetary values in the database are stored in **ZAR (Rand)** as `NUMERIC(18,4)` with `_zar` column suffix.

### Data Ingestion Schedule (SAST)

```
17:05 SAST (15:05 UTC) — nightly batch, after JSE closing auction
  ├── Ingest EOD OHLCV for all listed tickers (cents → ZAR conversion)
  ├── Ingest new SENS announcements published today
  ├── Ingest updated analyst EPS estimates and revisions
  ├── Trigger M00 universe re-screen
  └── Trigger M02 baseline factor recomputation

Cron expression (UTC): 5 15 * * 1-5   (weekdays only — JSE is closed weekends)
```

> **Important:** the cron expression alone is insufficient — it does not exclude JSE public holidays. Before triggering the nightly batch, the scheduler must check a `trading_calendar` table in the database and skip the run on non-trading days.

**JSE public holidays (South African statutory holidays on which the exchange does not trade):**

| Holiday | Date |
|---|---|
| New Year's Day | 1 January |
| Human Rights Day | 21 March |
| Good Friday | Variable — Friday before Easter Sunday |
| Family Day | Monday after Easter Sunday (variable) |
| Freedom Day | 27 April |
| Workers' Day | 1 May |
| Youth Day | 16 June |
| National Women's Day | 9 August |
| Heritage Day | 24 September |
| Day of Reconciliation | 16 December |
| Christmas Day | 25 December |
| Day of Goodwill | 26 December |

When a public holiday falls on a Sunday, the following Monday is observed and the exchange is closed that Monday. A `trading_calendar` table seeded with the complete holiday schedule (populated at migration time, refreshed annually) is the authoritative source. The cron scheduler must read this table — never infer holidays from the cron expression.

```sql
CREATE TABLE trading_calendar (
  calendar_date DATE PRIMARY KEY,
  is_trading_day BOOLEAN NOT NULL,
  holiday_name   TEXT,           -- null when is_trading_day = true
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduler check before triggering nightly batch:
SELECT is_trading_day FROM trading_calendar WHERE calendar_date = CURRENT_DATE;
-- If false: skip batch, log skipped reason, alert if unexpected
```

---

## South African Timezone Enforcement

All timestamps follow the project-wide SAST standard (see issue #43):

| Rule | Implementation |
|---|---|
| **Storage** | `TIMESTAMPTZ` (UTC) in all PostgreSQL columns — no exceptions |
| **Display** | `Africa/Johannesburg` (SAST = UTC+2, permanent — no DST) in API responses and frontend |
| **Publication date** | Exact SENS announcement time stored as UTC `TIMESTAMPTZ` |
| **Ingestion timestamp** | `ingestion_ts TIMESTAMPTZ DEFAULT NOW()` records when data entered the system |

```sql
-- Correct column definitions
publication_date  TIMESTAMPTZ NOT NULL,   -- when results published on SENS (UTC stored)
period_end_date   DATE NOT NULL,          -- accounting period end date only (no time)
ingestion_ts      TIMESTAMPTZ DEFAULT NOW()

-- WRONG
publication_date  TIMESTAMP WITHOUT TIME ZONE  -- never use this
```

API responses must include timezone offset: `"2025-06-30T17:00:00+02:00"` — never a bare `"2025-06-30T17:00:00"`.
