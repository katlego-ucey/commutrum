# Module 03 — Signal Construction

**Pipeline position:** Consumes raw factor values from `02-baseline-factors`
(and any admitted candidate factors from `12-factor-admission-protocol`).
Outputs normalized, comparable signals to `04-orthogonality-engine`.
**Status:** Specification

## Purpose

Raw factor values are not comparable to each other or across companies. A
Piotroski score of 7 and a momentum value of 0.15 live on different scales;
a P/E of 8 means something different for a miner than for a retailer at
different points in a commodity cycle. This module converts every raw value
into a standardized, sector-adjusted signal before anything is combined.

## Pipeline

```
Raw factor value
   → Sector-relative transform
   → Z-score standardization
   → Outlier treatment (winsorization)
   → Final signal
```

### Step 1 — Sector-relative transform

```
sector_relative(ticker, t) = raw_value(ticker, t) - sector_mean(sector(ticker), t)
```

Computed within the *investable universe only* (output of `00`), not the
full JSE listing, and using only data that was point-in-time available.
Mandatory for any factor whose absolute scale is sector-dependent (valuation
ratios, margins). Less critical but still applied for consistency on factors
like momentum, which are less sector-bound.

### Step 2 — Z-score standardization

```
z(ticker, t) = (sector_relative(ticker, t) - mean(sector_relative(*, t))) / std(sector_relative(*, t))
```

Computed cross-sectionally, across the investable universe, on date `t`.
This is what makes a Piotroski z-score and a momentum z-score combinable in
`05-composite-research-engine`.

### Step 3 — Outlier treatment (winsorization)

```
z_winsorized = clip(z, -3, +3)
```

Caps extreme values (e.g., a stock with momentum 8 standard deviations above
the mean due to a one-off corporate event) so a single name can't dominate
the composite score. Cap level is a versioned parameter, not a hard constant.

## Database tables owned

- `factor_signals(ticker, date, factor_id, sector_relative_value, z_score, z_winsorized, sector_used)`
- `sector_mapping(ticker, sector, effective_from, effective_to)` — versioned, because sector reclassifications happen

## API endpoints

- `GET /signals/{ticker}?date=&factor_id=`
- `GET /signals/sector-stats?sector=&date=` — for debugging/auditing the normalization itself

## Acceptance criteria / Definition of Done

- [ ] Sector classification is point-in-time versioned (a reclassification
      doesn't retroactively change historical sector-relative values)
- [ ] Z-scores are computed only within the investable universe for that date
- [ ] Winsorization threshold is a versioned, documented parameter
- [ ] Unit tests confirm a known input distribution produces the expected mean-0/std-1 output before winsorization

## Known failure modes & mitigations

| Failure mode | Mitigation |
|---|---|
| Scoring a P/E of 8 the same for a mining company at commodity-cycle peak and a consumer staples company | Mandatory sector-relative transform before standardization |
| A handful of extreme values dominating the composite score | Winsorization at ±3 (versioned parameter) |
| Sector reclassification silently rewriting historical signal values | `sector_mapping` is versioned with effective date ranges |

## References

- Standard cross-sectional factor normalization methodology used in academic and practitioner factor research (e.g., MSCI Barra, Fama-French sorts)
