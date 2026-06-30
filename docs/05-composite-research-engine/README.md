# Module 05 — Composite Research Engine

> **Commutrum Wealth Engine** — One stage in the 13-module pipeline that scores and ranks JSE equities for investment. All modules feed into a single composite score and calibrated win probability. See the [root README](../../README.md) for the full pipeline.

**Pipeline position:** Consumes orthogonalized signals from `04-orthogonality-engine`.
Outputs a single composite research score per ticker per day to `06-probability-calibration`.
**Status:** Specification

## Purpose

Combine independent signals into one score — **without** the flaw that
sank the original design: a flat weighted average that assumes factors add
linearly and that fixed weights work across all market conditions. This
module is "rules-based," not "AI," but it is also not "naive." It must:

1. Account for factor **interactions** (a stock with strong quality AND
   strong momentum is not just the sum of two independent +10s).
2. Account for **time-horizon mismatch** (a revisions signal that decays in
   weeks cannot be blended with a Piotroski signal that decays in quarters
   using the same static weight every day).
3. Be **regime-aware** without resorting to an opaque ML model, since the
   project's constraint is "no AI." This is done with explicit, auditable
   rules — not a black-box classifier.

## Step 1 — Time-weighted aggregation by decay horizon

Each baseline factor carries a `decay_horizon` attribute (set in
`02-baseline-factors`). Apply an exponential decay weight so a stale
revisions signal (decays in weeks) contributes less by the time it's a month
old, while a Piotroski signal (decays in quarters) remains fully weighted
over the same period:

```
horizon_weight(factor, days_since_update) = exp(-ln(2) * days_since_update / half_life(factor))

half_life(piotroski) ≈ 60 trading days
half_life(revisions) ≈ 15 trading days
half_life(momentum)  ≈ 30 trading days
```

These half-lives are versioned parameters, set initially from the published
decay horizon and refined only through `09-walk-forward-validation`, never
through in-sample tuning.

## Step 2 — Rules-based regime classification (no black box)

Define regimes using transparent, pre-specified rules on observable market
state — not a fitted/learned classifier:

```
regime(t) = classify(
    trailing_180d_market_return,     # trend direction
    trailing_60d_market_volatility,  # risk-on/risk-off proxy
    yield_curve_slope                # macro backdrop
)
→ one of: {RISK_ON_TREND, RISK_OFF_DEFENSIVE, SIDEWAYS_CHOPPY}
```

Each regime has a pre-defined, documented weight profile (e.g., momentum
weighted higher in `RISK_ON_TREND`, quality/Piotroski weighted higher in
`RISK_OFF_DEFENSIVE`). The weight profile per regime is set via
out-of-sample walk-forward testing (`09`), reviewed periodically, and never
silently adjusted mid-backtest. This directly answers the regime-blindness
critique without introducing an unauditable model.

## Step 3 — Interaction terms

Rather than `composite = Σ wᵢ·signalᵢ`, allow explicitly specified,
hypothesis-driven interaction terms where there's a documented mechanism:

```
composite = Σ wᵢ(regime)·signalᵢ + Σ wᵢⱼ·(signalᵢ × signalⱼ)
```

Example: a `quality × momentum` interaction term, included only if it has
its own hypothesis registry entry and clears the same out-of-sample IC
improvement test required of any new factor (`12-factor-admission-protocol`).
**Do not** add interaction terms speculatively — each one is itself a
factor candidate and must earn its place the same way.

## Step 4 — Composite score and dual-listed/ZAR-sensitivity flag

For tickers flagged `dual_listed` or with high `offshore_revenue_pct`
(from `00-universe-screening`), attach a `currency_sensitivity_flag` to the
composite score output rather than silently scoring them identically to
purely domestic names. This is surfaced to the user, not corrected for
inside the score itself — correcting for it without disclosure would hide
information the user needs.

## Database tables owned

- `regime_classifications(date, regime, trailing_return, trailing_vol, yield_curve_slope)`
- `regime_weight_profiles(regime, factor_id, weight, effective_from)`
- `composite_scores(ticker, date, composite_score, regime_used, currency_sensitivity_flag)`
- `interaction_terms(term_id, factor_a, factor_b, weight, hypothesis_registry_ref)`

## API endpoints

- `GET /research/{ticker}?date=` → composite score + factor attribution breakdown
- `GET /regime/current` → current regime classification and the weight profile in use

## Acceptance criteria / Definition of Done

- [ ] Regime classification rules are fully specified and reproducible from raw market data (no hidden state)
- [ ] Every interaction term has a hypothesis registry entry and passed the admission protocol
- [ ] Composite score output includes a factor-level attribution breakdown (transparency principle)
- [ ] Currency/dual-listing sensitivity is flagged, never silently absorbed into the score

## Known failure modes & mitigations

| Failure mode | Mitigation |
|---|---|
| Flat linear weighting ignoring factor interactions | Explicit, hypothesis-gated interaction terms only |
| Fixed weights that work in one regime and destroy value in another | Rules-based regime classification with versioned, walk-forward-tested weight profiles |
| Mixing signals with different decay horizons as co-equal | Exponential time-decay weighting by `half_life(factor)` |
| Treating Naspers/Anglo/Richemont like a purely domestic stock | Explicit `currency_sensitivity_flag` surfaced in output |
| Regime rules quietly becoming a fitted black box over time | Regime weight profiles only change via documented, versioned, walk-forward-reviewed updates — logged in `13-hypothesis-model-registry` |

## References

- Factor regime research (style factors exhibit distinct bull/bear behavior): cited in the design discussion that produced this module
- ROE × Market Value and similar factor-interaction findings in weighted stock-scoring literature
