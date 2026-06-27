# Module 00 — Universe Screening (Hard Filters)

**Pipeline position:** First stage. Consumes raw listing data; outputs the
daily investable universe consumed by every downstream module.
**Status:** Specification

## Purpose

Reduce the full JSE listed universe (≈280 companies, down from roughly 500
delistings between 1989 and 2024 — meaning the *current* count is itself
shrinking and concentration is rising) to a daily, point-in-time investable
universe of roughly 120–150 names that the rest of the engine is allowed to
score. This module exists to answer one question per stock per day: **"is
this stock even eligible to be rated today?"** — before any factor touches it.

## Inputs

- Daily listing status (listed / suspended / delisted) per ticker
- Daily OHLCV + traded value (from `01-data-pipeline`)
- Market capitalization (from `01-data-pipeline`)
- Audited financial history length per company
- Governance flags: trading suspensions, qualified/adverse audit opinions
- Data completeness flags per ticker

## Outputs

- `universe_snapshot` table: one row per (ticker, date) with a pass/fail flag
  and the reason for any exclusion
- A "current investable universe" view consumed by `02-baseline-factors`
  onward

## Hard filters (pass/fail, not scored)

| Filter | Threshold | Rationale |
|---|---|---|
| Liquidity | 20-day ADTV ≥ R500k–R2m (tiered by strategy capital size — see `08-execution-model`) | A stock you can't trade in size isn't part of the *investable* universe, regardless of score |
| Market capitalization | ≥ R500m | Removes micro-caps where data quality and corporate governance risk are highest |
| Financial history | ≥ 3 years of audited financials | Factors like Piotroski F-score and CAGR-based growth need a minimum history to be meaningful |
| Governance | No active suspension; no qualified/adverse/disclaimer audit opinion in the most recent audited financials | A scoring engine cannot price governance risk reliably — exclude rather than penalize |
| Data quality | No persistent missing fields (price, volume, or core financial statement line items) over the trailing screening window | Garbage in, garbage out — silently scoring a stock on stale/missing data is worse than excluding it |

## Algorithm

```
ADTV(t) = mean(price(d) * volume(d) for d in last 20 trading days ending t)
MarketCap(t) = shares_outstanding(t) * price(t)

universe_pass(ticker, t) =
    ADTV(ticker, t) >= liquidity_threshold(t)
    AND MarketCap(ticker, t) >= 500_000_000
    AND years_of_audited_history(ticker, t) >= 3
    AND NOT is_suspended(ticker, t)
    AND last_audit_opinion(ticker, t) == "unqualified"
    AND data_completeness_score(ticker, t) >= 0.95
```

Run this once per trading day, for every ticker that has ever been listed
(not just currently listed ones — see Pitfalls below).

## Edge cases

- **IPOs**: a newly listed company cannot enter the universe until it has the
  minimum financial history above. Do not special-case new listings into
  early eligibility — that is exactly the kind of exception that quietly
  reintroduces survivorship bias.
- **Delistings**: a delisted company must remain in the historical universe
  for any date *before* its delisting. Never delete a delisted company's
  historical rows — see `01-data-pipeline`'s survivorship-free storage rule.
- **Dual-listed / offshore-revenue names** (Naspers, Prosus, Anglo American,
  Richemont, BHP): these pass the hard filters normally, but must be flagged
  with a `dual_listed = true` / `offshore_revenue_pct` attribute, because
  `02-baseline-factors` and `05-composite-research-engine` need to know that
  their JSE share price is influenced by foreign price discovery and ZAR/USD
  moves independently of local fundamentals.
- **Trading halts vs. suspensions**: a short trading halt (hours) is not the
  same as a suspension (days/weeks/indefinite). Only suspensions trigger
  exclusion; halts should be logged but not force an exclusion for that day
  unless the halt persists past market close.

## Database tables owned

- `universe_snapshot(ticker, date, pass_fail, exclusion_reason, adtv, market_cap, years_history, audit_opinion, data_completeness_score)`
- `screening_rules(rule_id, threshold, effective_from, effective_to)` — versioned, so threshold changes are auditable
- `exclusions_log(ticker, date, reason, detail)`

## API endpoints

- `GET /universe?date=YYYY-MM-DD` → list of (ticker, pass/fail, reason)
- `GET /universe/{ticker}/screen-status?date=YYYY-MM-DD` → full filter breakdown for one name

## Acceptance criteria / Definition of Done

- [ ] Universe is reconstructable for **any** historical date using only data
      that existed as of that date (no current-day market cap or current
      listing status leaking into a historical query)
- [ ] Delisted companies appear in `universe_snapshot` for all dates before
      their delisting
- [ ] Unit tests cover each filter independently with at least one pass and
      one fail case
- [ ] Threshold changes are versioned, never silently overwritten

## Known failure modes & mitigations

| Failure mode | Mitigation |
|---|---|
| Survivorship bias: screening only currently-listed names inflates backtest returns | Maintain full historical constituent list including delisted names; never filter by "is currently listed" |
| Shallow universe (post-filter pool may be only 120–150 names) means rating tiers can repeat the same names week after week | Document this limitation explicitly in `10-continuous-monitoring`; do not present a "Strong Buy" list of 10 names as if it were a deep, rotating signal |
| Liquidity threshold set once and never revisited | Liquidity threshold is a versioned parameter (see `screening_rules`), reviewed alongside `08-execution-model`'s capacity assumptions |

## References

- JSE delisting/concentration trend and ~280-company current count: Financial Mail
- JSE liquidity premium research (informs threshold-setting, see `08-execution-model`): Taylor & Francis, JSE 2000–2015 study
