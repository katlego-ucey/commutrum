# Module 09 — Walk-Forward Validation

**Pipeline position:** Orchestrates `00` through `08` repeatedly across
rolling historical windows. Outputs validated performance metrics to
`06-probability-calibration` (training data), `13-hypothesis-model-registry`
(promotion evidence), and `10-continuous-monitoring` (baseline to compare
live performance against).
**Status:** Specification

## Purpose

This is the module that determines whether anything in this system is real.
A backtest run carelessly — using current listings, current-day fundamentals,
and one long in-sample tuning pass — will show impressive numbers that are
substantially manufactured by bias rather than signal. This module exists to
make that impossible.

## Three biases this module must eliminate

### 1. Survivorship bias

**Problem:** backtesting only on companies that exist today silently removes
every company that went to zero, inflating returns and underestimating risk.
**Fix:** universe reconstruction at each historical date must use
`00-universe-screening`'s point-in-time logic, which includes delisted
companies for all dates prior to their delisting. This module must never
query "current JSE constituents" — only "JSE constituents as of date `t`."

### 2. Look-ahead bias

**Problem:** using information that wasn't actually available at the
backtested decision date — most commonly, using a financial statement on the
day its reporting period ended rather than the day it was actually published
(JSE companies publish 6–8 weeks after period end).
**Fix:** every query in this module must filter on `publication_date`, as
enforced by `01-data-pipeline`. This module's test suite must include an
explicit "leakage check" — run the backtest with a deliberately corrupted
publication date and confirm performance changes meaningfully, proving the
date filter is actually doing something.

### 3. Overfitting via weight adjustment

**Problem:** "adjust weights if historical testing shows better predictive
performance," applied naively to the whole historical window, is how every
parameter ends up fit to noise rather than signal.
**Fix:** strict walk-forward methodology, below — no parameter is ever tuned
using the same window it is then evaluated on.

## Walk-forward methodology

```
Window 1: Train on 2010–2015 → Test (out-of-sample) on 2016
Window 2: Train on 2011–2016 → Test (out-of-sample) on 2017
Window 3: Train on 2012–2017 → Test (out-of-sample) on 2018
...continue rolling forward through the most recent complete period
```

- "Train" means: fit any tunable parameter (factor weights, regime weight
  profiles, calibration model) using only data inside the training window.
- "Test" means: run the full pipeline (`00` → `08`) on the test window using
  the parameters frozen at the end of the training window, with zero further
  adjustment.
- A **final holdout period** (e.g., the most recent 12–24 months) is locked
  and never touched during any development or tuning work — this is the
  honest out-of-sample check that catches overfitting missed by the rolling
  windows themselves.

## Metrics computed per window and in aggregate

| Metric | Definition |
|---|---|
| IC | Rank correlation between composite score and realized forward return |
| ICIR | Mean IC / standard deviation of IC across periods — measures consistency |
| Sharpe ratio | Annualized excess return / annualized volatility |
| Sortino ratio | Same as Sharpe, but penalizing only downside volatility |
| Hit rate | % of selected positions with a positive return over the holding period |
| Maximum drawdown | Largest peak-to-trough decline over the test window |
| Calmar ratio | Annualized return / maximum drawdown |
| Benchmark comparison | All of the above, computed for the FTSE/JSE All Share Index (ALSI) over the same window, for direct comparison |

**No backtest result is reported as a Sharpe/return number alone.** Maximum
drawdown must always be reported alongside return — a strategy with high
return and a deep drawdown can be an inferior choice to simply holding the
index.

## Benchmark comparison (required, not optional)

Every walk-forward result must be reported against at least one naive
alternative:
- The ALSI itself (passive benchmark)
- A simple single-factor momentum decile sort (cheapest possible active strategy)
- A simple single-factor quality (Piotroski-only) sort

If the four-factor composite doesn't beat these naive alternatives
out-of-sample, after costs (via `08-execution-model`), it has not earned
deployment — regardless of how good it looks against zero.

## Database tables owned

- `backtest_runs(run_id, window_train_start, window_train_end, window_test_start, window_test_end, parameters_used_ref)`
- `backtest_results(run_id, ticker_or_portfolio, metric, value)`
- `validation_periods(period_id, type, start_date, end_date, locked)` — `locked=true` for the final holdout

## API endpoints

- `GET /backtest/runs?from=&to=`
- `GET /backtest/results/{run_id}`
- `GET /backtest/benchmark-comparison?run_id=`

## Acceptance criteria / Definition of Done

- [ ] Universe reconstruction in every window includes delisted names per that window's dates
- [ ] All fundamental queries filter on `publication_date`, with an explicit leakage test in the suite
- [ ] Final holdout period is locked in `validation_periods` and never used during parameter tuning
- [ ] Every reported result includes IC, ICIR, Sharpe, Sortino, max drawdown, and benchmark comparison together — never a return number alone
- [ ] Costs from `08-execution-model` are applied before any result is reported

## Known failure modes & mitigations

| Failure mode | Mitigation |
|---|---|
| Survivorship bias inflating returns | Point-in-time universe reconstruction at every test date |
| Look-ahead bias from period-end vs. publication date confusion | `publication_date` filter enforced at the data layer + explicit leakage test |
| Overfitting through repeated in-sample weight tuning | Strict rolling walk-forward + a locked, untouched final holdout |
| Reporting raw return without risk-adjustment | Mandatory metric bundle (IC, ICIR, Sharpe, Sortino, max drawdown, Calmar) on every result |
| No reference point for "is this actually good" | Mandatory benchmark comparison against ALSI and naive single-factor sorts |

## References

- Walk-forward / nested cross-validation methodology in quantitative finance
- Survivorship and look-ahead bias treatment in backtesting literature
