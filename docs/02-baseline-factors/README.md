# Module 02 — Baseline Factors (Version 1)

> **Commutrum Wealth Engine** — One stage in the 13-module pipeline that scores and ranks JSE equities for investment. All modules feed into a single composite score and calibrated win probability. See the [root README](../../README.md) for the full pipeline.

**Pipeline position:** Consumes the investable universe (`00`) and
point-in-time data (`01`). Outputs raw factor values consumed by
`03-signal-construction`.
**Status:** Specification

## Purpose

Compute the four factors that make up the defensible v1 baseline. This
module deliberately does **not** implement the other 35+ indicators from the
original design (ROE, ROA, all the valuation ratios, the full technical
indicator suite, news scoring, growth CAGRs). Those are factor *candidates*
that must clear `12-factor-admission-protocol` before they get a module of
their own. Building everything at once was the central mistake identified
across all rounds of critique — it guarantees overfitting in a ~280-stock
universe with limited history (the multiple-comparisons problem: test enough
factor combinations on a small dataset and several will look significant by
chance alone).

## The four baseline factors

### 1. Piotroski F-score

A 9-point binary score from financial statements, identifying companies that
are fundamentally strengthening. Score 0–9.

| # | Signal | Pass condition |
|---|---|---|
| 1 | Profitability: ROA | Net income / total assets > 0 |
| 2 | Profitability: CFO | Cash flow from operations > 0 |
| 3 | Profitability: ΔROA | ROA(t) > ROA(t-1) |
| 4 | Profitability: Accruals | CFO > Net income |
| 5 | Leverage: ΔLeverage | Long-term debt / total assets (t) < (t-1) |
| 6 | Liquidity: ΔCurrent ratio | Current ratio(t) > current ratio(t-1) |
| 7 | Dilution: Shares issued | No new common shares issued in the period |
| 8 | Efficiency: ΔGross margin | Gross margin(t) > gross margin(t-1) |
| 9 | Efficiency: ΔAsset turnover | Revenue/total assets (t) > (t-1) |

**Mechanism:** investors underreact to gradual fundamental improvement,
especially in unglamorous/out-of-favor companies. **Decay horizon:**
quarters — recompute on every new publication-dated financial statement.

### 2. Earnings estimate revisions

Breadth and magnitude of analyst EPS estimate changes over trailing 1 and 3
months.

```
revision_breadth(t) = (analysts_upgrading - analysts_downgrading) / total_analysts
revision_magnitude(t) = (mean_estimate(t) - mean_estimate(t - 1m)) / abs(mean_estimate(t - 1m))
```

**Mechanism:** analysts have private information (management conversations,
channel checks) that leaks slowly into consensus; revisions lead price.
**Decay horizon:** weeks — this is the fastest-decaying baseline factor and
must not be blended with quarterly-decay factors using equal weighting (see
`05-composite-research-engine`).

### 3. Price momentum (12–1 month)

```
momentum(t) = price(t - 1m) / price(t - 12m) - 1
```

Skip the most recent month deliberately (the "1" in "12–1") to exclude
short-term reversal effects, which are a separate, opposite-signed phenomenon.
**Mechanism:** investor underreaction / slow diffusion of information.
**Decay horizon:** months, but carries documented crash risk in sharp market
reversals — position sizing in `07-portfolio-construction` must account for
this, not the scoring formula itself.

### 4. Liquidity (hard screen only — not scored)

Already enforced in `00-universe-screening`. It is listed here only to make
explicit that liquidity is a **gate**, not a positively-weighted factor. A
stock does not get extra points for being liquid; it gets excluded entirely
for being illiquid. JSE-specific research found a liquidity premium distinct
from size and value — conflating it with a scored factor would let a
high-score, untradeable micro-cap slip through.

## Hypothesis registry entries required before coding

Each factor above must have a corresponding row in `13-hypothesis-model-registry`
recording: rationale, academic support, expected horizon, required data,
and failure criteria — **before** the calculation code is merged. This is
not bureaucracy; it is what keeps the system falsifiable per the project's
governing principles.

## Database tables owned

- `factor_raw_values(ticker, date, factor_id, raw_value, computed_from_publication_date)`
- `factor_definitions(factor_id, name, formula_version, mechanism, decay_horizon, effective_from)`

## API endpoints

- `GET /factors/{ticker}/raw?date=&factor_id=`
- `GET /factors/definitions` — list of currently active baseline factors and their formulas

## Acceptance criteria / Definition of Done

- [ ] Each factor's calculation uses only `publication_date`-filtered data from `01-data-pipeline`
- [ ] Piotroski F-score validated against at least 3 hand-calculated example companies
- [ ] Each factor has a hypothesis registry entry before its first production run
- [ ] Factor formulas are versioned; a formula change creates a new `formula_version`, old values are never silently recalculated in place

## Known failure modes & mitigations

| Failure mode | Mitigation |
|---|---|
| Building all 40+ original indicators before validating the baseline | This module is scoped to exactly four factors by design; everything else routes through `12-factor-admission-protocol` |
| Mixing factors with different decay horizons as if co-equal | Decay horizon is a recorded attribute per factor, consumed explicitly by `05-composite-research-engine`'s time-weighting |
| Treating Piotroski/momentum/revisions as independent when fundamentals partially co-move | `04-orthogonality-engine` runs on these four before they reach the composite engine — do not assume independence here |

## References

- Piotroski, J. (2000), "Value Investing: The Use of Historical Financial Statement Information to Separate Winners from Losers"
- Novy-Marx, R. (2013), profitability and quality factor research
