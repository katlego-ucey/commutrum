# Module 08 — Execution Model

> **Commutrum Wealth Engine** — One stage in the 13-module pipeline that scores and ranks JSE equities for investment. All modules feed into a single composite score and calibrated win probability. See the [root README](../../README.md) for the full pipeline.

**Pipeline position:** Consumes target portfolio weights from
`07-portfolio-construction`. Outputs an implementation shortfall estimate to
`09-walk-forward-validation` (for realistic backtesting) and, in production,
to the actual trade execution layer.
**Status:** Specification

## Purpose

The gap between a backtested return and a real, tradable return is where
most "great on paper" quant systems die. This module models every real-world
friction so that backtest results in `09` are never reported without them.

## Cost components

### 1. Brokerage fees

Versioned parameter per broker/account tier — typically a percentage of
trade value plus a minimum flat fee. South African discount brokers
commonly charge in the 0.1%–0.4% range per trade; store as a configurable
parameter, not a constant, since this varies by broker and changes over time.

### 2. Bid-ask spread

```
spread_cost(ticker, t) = (ask(t) - bid(t)) / mid_price(t)
```

Wider for less liquid names — pulls directly from the same liquidity data
used in `00-universe-screening`'s hard filter.

### 3. Slippage / market impact

```
market_impact(order_size, ADTV) = k * sqrt(order_size / ADTV)
```

A square-root impact model is the standard starting point (Almgren et al.);
`k` is a calibrated parameter, refined using actual paper-portfolio fills
once the system reaches that stage of the governance lifecycle (see
`13-hypothesis-model-registry`).

### 4. South African taxes

| Tax | Rate | Applies to |
|---|---|---|
| Securities Transfer Tax (STT) | 0.25% | Every transfer of a listed security — i.e., every buy |
| Dividend Withholding Tax | 20% | Dividends received, withheld at source |
| Capital Gains Tax (effective, companies) | 21.6% | Realized gains, if held in a corporate structure |
| Capital Gains Tax (effective, individuals, top marginal) | ~18% | Realized gains, if held personally |

These are **statutory rates current as of this specification's writing** and
must be stored as versioned parameters (with an `effective_from` date) since
they change via SARS/the annual Budget — do not hard-code them as constants
in application logic.

### 5. Execution delay

Model the gap between signal generation (e.g., end-of-day rebalance
decision) and actual fill (e.g., next-day open or VWAP) — backtests that
assume same-day-close execution at the price used to generate the signal are
optimistic by construction.

### 6. Capacity limitations

```
max_position_size(ticker) = capacity_fraction * ADTV(ticker)
```

If `target_weight(ticker) * portfolio_AUM > max_position_size(ticker)`, the
order must be split across multiple days or the position capped — flag this
explicitly rather than silently assuming the full size fills at one price.
This is the JSE-specific capacity problem: a "Strong Buy" on a R200m
market-cap name is a real constraint, not a theoretical one, once meaningful
capital is involved.

## Output: implementation shortfall estimate

```
implementation_shortfall = market_impact + spread_cost + brokerage_fee
                          + (execution_price - decision_price) / decision_price
                          + tax_drag
```

This number, not the raw research-engine return, is what `09` reports as
the "real" backtest result.

## Database tables owned

- `cost_model_parameters(parameter, value, effective_from, effective_to)` — brokerage, taxes, impact coefficient `k`
- `execution_assumptions(scenario_id, description, parameters_used)`
- `implementation_shortfall_log(ticker, date, decision_price, modeled_execution_price, total_cost_bps)`

## API endpoints

- `GET /execution/cost-model` → current parameters in effect
- `POST /execution/estimate-shortfall` → given a hypothetical trade, return the modeled cost breakdown

## Acceptance criteria / Definition of Done

- [ ] Every cost component above is implemented and individually testable
- [ ] Tax/fee parameters are versioned with effective dates, never hardcoded as bare constants
- [ ] Capacity limits scale with portfolio AUM as a configurable input, not a fixed number
- [ ] `09-walk-forward-validation` cannot report a backtest result without passing it through this module first

## Known failure modes & mitigations

| Failure mode | Mitigation |
|---|---|
| Reporting backtest returns before transaction costs and taxes | This module is a mandatory gate before any return number is reported in `09` or `10` |
| Assuming unlimited liquidity at the decision price | Square-root market impact model + capacity limit, tied to real ADTV |
| Tax/fee rates becoming stale as SARS Budget changes | Versioned parameters with effective dates, reviewed annually |
| Treating score instability, transaction costs, and capacity as one issue | They are tracked as three separate cost/constraint dimensions here — score instability (turnover) is actually owned by `07`'s rebalance frequency choice, cost is owned here, capacity is owned here — keep the distinction explicit in monitoring (`10`) |

## References

- Almgren, R. et al., square-root market impact models
- SARS: Securities Transfer Tax (0.25%), Dividends Tax (20%), Capital Gains Tax effective rates

---

## Minimum Investment Research — Can You Trade JSE from R1?

> **See also:** Issue #42 (small investor support).

### JSE exchange rules on minimum trade size

The Johannesburg Stock Exchange imposes **no minimum trade value**. The only exchange-level minimum is **1 share (1 board lot)**. A stock priced at R0.50 can be purchased for R0.50 + transaction costs.

### Practical minimums by broker (South Africa)

| Broker | Min per trade | Fractional shares | Commission | R1 trade possible? |
|---|---|---|---|---|
| **EasyEquities** | **R5** | **Yes** | ~0.25% (no floor) | Yes — from R5 |
| Satrix Direct | R10 | No | 0.2% | No |
| Capitec Invest | R10 | No | 0.5% | No |
| Standard Bank OST | R100+ (min R79 fee) | No | ~R79 minimum | No |
| FNB Share Investing | R100+ (min R70 fee) | No | R70 minimum | No |
| Interactive Brokers | ~R18 (min $1 USD) | Yes | Variable | Marginal |

**Verdict:** R1 trades are technically possible on the JSE via EasyEquities fractional shares. The practical minimum for cost-efficient wealth building is **R50 per position**.

### Transaction cost analysis by portfolio size

| Trade size | STT (0.25%) | Commission (0.25%) | Round-trip cost | Friction % | Assessment |
|---|---|---|---|---|---|
| R1 | R0.003 | R0.003 | ~R0.01 | ~3.0% | Very poor — costs dominate returns |
| R10 | R0.025 | R0.025 | ~R0.05 | ~1.0% | Marginal |
| R50 | R0.125 | R0.125 | ~R0.25 | **~0.5%** | **Acceptable — wealth engine minimum** |
| R100 | R0.25 | R0.25 | ~R0.50 | ~0.5% | Good |
| R500 | R1.25 | R1.25 | ~R2.50 | ~0.5% | Optimal |
| R1,000+ | R2.50 | R2.50 | ~R5.00 | ~0.5% | Optimal |

### South African Tax Parameters (versioned — updated annually with SARS Budget)

All parameters stored in `cost_model_parameters` with `effective_from` and `effective_to` dates. **Never hardcode these** — they change with the annual February Budget.

| Parameter | Current rate | Effective from | Notes |
|---|---|---|---|
| STT (Securities Transfer Tax) | **0.25%** | 2008-02-01 | Applied to all equity **purchases** (not sales) |
| Dividend Withholding Tax | **20%** | 2017-02-22 | Applied to all dividend distributions |
| CGT effective rate (corporate) | **21.6%** | 2023-03-01 | 80% inclusion × 27% corporate tax rate |
| CGT effective rate (individual, max) | **~18%** | 2023-03-01 | 40% inclusion × 45% marginal tax rate |
| ADTV capacity fraction | **5%** | versioned | Max position as % of 20-day ADTV |

### Cost model modes (API parameter: `cost_model`)

```
"easyequities"   — 0.25% commission, no floor. Default for portfolios < R10,000
"standard"       — 0.5% commission, R70 minimum floor. Default for portfolios ≥ R10,000
"institutional"  — custom parameters stored in cost_model_parameters table
```

The cost model mode is determined by `portfolio_capital_zar` unless explicitly overridden.

### SAST Tax Calendar

SARS announces budget changes each **February** (SAST). The `effective_from` date on `cost_model_parameters` must use **UTC midnight** of the applicable SAST date:

```typescript
// Budget day example: 19 February 2025, effective immediately in SAST
effective_from: new Date('2025-02-19T00:00:00+02:00').toISOString() // stored as UTC
```

### Acceptance criteria (additions)

- [ ] R1 feasibility documented: system correctly calculates 3% round-trip friction on R1 and warns the user
- [ ] EasyEquities cost model (0.25%, no floor) implemented and selected automatically for `portfolio_capital_zar < 10000`
- [ ] All tax parameters stored as `cost_model_parameters` rows with `effective_from` in UTC `TIMESTAMPTZ`
- [ ] A test confirms: changing `effective_from` date correctly selects the right parameter version for a given trade date
