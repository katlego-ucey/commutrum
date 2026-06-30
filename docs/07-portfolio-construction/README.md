# Module 07 — Portfolio Construction

> **Commutrum Wealth Engine** — One stage in the 13-module pipeline that scores and ranks JSE equities for investment. All modules feed into a single composite score and calibrated win probability. See the [root README](../../README.md) for the full pipeline.

**Pipeline position:** Consumes calibrated probabilities from
`06-probability-calibration`. Outputs target portfolio weights to
`08-execution-model`.
**Status:** Specification

## Purpose

Turn per-stock probabilities into an actual portfolio. This is a deliberately
separate layer from the wealth engine — a critique raised across this
project's design process is that "should I act on this score" is a position
sizing and risk question, not a scoring question, and conflating the two
(e.g. building a "do nothing" mode *into* the scoring engine) muddies both.

## Rules

### Position selection

- Select from the investable universe (`00`) ranked by
  `probability_positive_return` from `06`.
- Apply a **minimum probability threshold** — stocks below the threshold are
  not held, regardless of composite score. This is the system's "do nothing"
  mechanism: it lives here, as a portfolio rule, not inside the research
  engine.
- Target portfolio size: 15–25 stocks. Few enough to reflect genuine
  conviction; many enough to avoid single-name concentration risk in a
  ~280-stock universe where the top-ranked tier can otherwise be tiny.

### Position sizing

- **Inverse volatility** or **risk parity** sizing by default — higher
  conviction (higher probability) does not automatically mean a larger
  position if that stock is also far more volatile.
- Formula (inverse volatility, simplest version):

```
raw_weight(ticker) = 1 / trailing_60d_volatility(ticker)
position_weight(ticker) = raw_weight(ticker) / Σ raw_weight(all selected tickers)
```

### Constraints

| Constraint | Default | Rationale |
|---|---|---|
| Max single position | 7% | Limits idiosyncratic risk in a concentrated universe |
| Max sector exposure | 20% | JSE is sector-concentrated (resources, financials); prevents an accidental sector bet disguised as a stock-picking signal |
| Max country/style exposure | tracked, not hard-capped by default | Distinguish SA-domestic vs. offshore-revenue/dual-listed exposure (flagged in `05`) |
| Minimum probability threshold | versioned parameter | The actual "do nothing" gate |
| Cash allocation | allowed, not forced to be fully invested | If insufficient names clear the probability threshold, hold cash rather than forcing weak positions into the portfolio |

### Rebalancing

- Default: monthly. More frequent rebalancing increases turnover and
  transaction cost drag (quantified in `08-execution-model`) faster than it
  improves signal freshness for factors with quarter-scale decay horizons.
- Rebalance logic must use the **same point-in-time data discipline** as
  everywhere else — no using end-of-month prices that weren't yet known when
  the rebalance decision was notionally made.

## Database tables owned

- `portfolio_holdings(date, ticker, weight, probability_at_selection, sizing_method)`
- `position_sizing_rules(rule_id, method, parameters, effective_from)`
- `portfolio_constraints(constraint_id, type, value, effective_from)`

## API endpoints

- `GET /portfolio/current` → current target weights
- `GET /portfolio/history?from=&to=` → historical holdings
- `POST /portfolio/rebalance` → simulate a rebalance given current probability outputs (does not place real trades — see `08-execution-model` for that boundary)

## Acceptance criteria / Definition of Done

- [ ] Minimum probability threshold is enforced and configurable, not hardcoded inline
- [ ] Sector/position constraints are enforced at construction time, not checked after the fact
- [ ] Cash allocation is a valid, tested output state (the system can recommend holding 100% cash)
- [ ] Rebalance simulation never uses data that wouldn't have been known at the simulated rebalance date

## Known failure modes & mitigations

| Failure mode | Mitigation |
|---|---|
| Conflating "what's the score" with "should I act on it" | Position sizing and minimum thresholds live entirely in this module, not in `05` or `06` |
| High-probability but high-volatility stock dominating the portfolio | Inverse volatility / risk parity sizing by default |
| Forcing the portfolio to always be 100% invested even when no names clear the bar | Explicit cash allocation as a first-class output |
| Sector concentration disguised as stock selection (JSE is naturally concentrated in resources/financials) | Hard sector exposure cap, enforced at construction |

## References

- Risk parity / inverse-volatility position sizing: standard portfolio construction methodology (Qian, 2005; Maillard, Roncalli, Teiletche, 2010)
