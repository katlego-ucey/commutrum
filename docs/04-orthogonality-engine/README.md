# Module 04 — Orthogonality Engine

> **Commutrum Wealth Engine** — One stage in the 13-module pipeline that scores and ranks JSE equities for investment. All modules feed into a single composite score and calibrated win probability. See the [root README](../../README.md) for the full pipeline.

**Pipeline position:** Consumes normalized signals from `03-signal-construction`.
Outputs a reduced, independence-checked signal set to `05-composite-research-engine`.
**Status:** Specification

## Purpose

Remove redundant information before signals are combined. The original
design listed 11 technical indicators (RSI, MACD, EMA 20/50/100/200, SMA,
Bollinger Bands, ATR, OBV, ADX, Support/Resistance, Trend Direction) as if
independent — but most of them measure the same underlying phenomenon
(price momentum/trend). Treating them as separate weighted contributions
double- and triple-counts the same signal while *appearing* diversified.
The same problem exists on the fundamental side: ROE, ROA, gross margin, and
operating margin are all derived from the same income statement and equity
base and co-move heavily.

## Algorithm

1. **Correlation matrix**: compute pairwise Pearson correlation across all
   active signals, within the investable universe, over a rolling window.
2. **Variance Inflation Factor (VIF)**: for each signal, regress it against
   all other signals; `VIF = 1 / (1 - R²)`. Flag `VIF > 5`.
3. **Principal Component Analysis (PCA)**: on flagged correlated clusters,
   identify whether they collapse to one or two latent components (e.g.,
   "momentum cluster" reduces to one component capturing >85% of variance).
4. **Mutual information**: a non-linear complement to correlation, catches
   redundancy that a linear correlation coefficient misses.
5. **IC overlap analysis**: when two signals are both correlated *and* have
   similar standalone Information Coefficient (IC) against forward returns,
   keep the one with higher standalone IC and either drop the other or
   replace both with their first principal component.

```
for each correlated pair/cluster (|corr| > 0.7 OR VIF > 5):
    compute standalone IC for each member
    if a single component explains > 0.85 of cluster variance:
        replace cluster with PC1, label it (e.g. "momentum_composite")
    else:
        keep highest-IC member, drop the rest, log the decision
```

This step runs on **both** the technical indicator cluster (if/when
technical factors are admitted via `12-factor-admission-protocol`) and the
fundamental ratio cluster (ROE/ROA/margins) — not just one or the other.

## Database tables owned

- `signal_correlation_matrix(date, factor_id_a, factor_id_b, correlation, vif_a, vif_b)`
- `signal_clusters(cluster_id, date, member_factor_ids, representative_factor_id, method)`
- `orthogonalized_signals(ticker, date, signal_id, value)` — the output set, post-reduction

## API endpoints

- `GET /orthogonality/correlation-matrix?date=`
- `GET /orthogonality/clusters?date=`

## Acceptance criteria / Definition of Done

- [ ] Correlation/VIF computed on a rolling window, recalculated regularly (not a one-time analysis frozen at launch)
- [ ] Every cluster reduction decision is logged with the method and the signals dropped
- [ ] `05-composite-research-engine` only receives the orthogonalized set, never the raw signal set directly
- [ ] Adding a new factor candidate automatically triggers a re-run of this module before admission is finalized

## Known failure modes & mitigations

| Failure mode | Mitigation |
|---|---|
| Double-counting trend/momentum across many technical indicators | Cluster + PCA reduction before composite scoring |
| Profitability ratios (ROE/ROA/margins) inflating the "Financial Health" category's apparent weight | Same orthogonality check applied to fundamental ratio clusters, not just technical ones |
| Correlation analysis run once and never revisited as new factors are admitted | Correlation matrix is recomputed on a schedule and whenever a new factor candidate is added |

## References

- VIF and multicollinearity diagnostics: standard econometrics methodology (e.g., Wooldridge, *Introductory Econometrics*)
