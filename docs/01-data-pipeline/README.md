# Module 01 — Point-in-Time Data Pipeline

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
