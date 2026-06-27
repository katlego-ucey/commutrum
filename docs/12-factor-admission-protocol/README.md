# Module 12 — Factor Admission Protocol

**Pipeline position:** Gatekeeper for any new factor candidate before it can
be added to `02-baseline-factors` (or treated as an interaction term in
`05-composite-research-engine`). Every admitted/rejected decision is logged
to `13-hypothesis-model-registry`.
**Status:** Specification

## Purpose

The original design proposed 40+ indicators with no admission criteria
beyond "this is a commonly used metric." This module is the answer to the
deepest question raised across the whole design process: **why should a
historical relationship continue, and is it distinguishable from chance in
a ~280-stock universe?** Nothing skips this gate, including factors that
sound obviously reasonable (P/E, ROE, RSI) — "looks reasonable" is exactly
the standard that let the original design balloon to 40+ ungated indicators.

## The gates (all must pass — a single failure is a rejection)

| Gate | Requirement |
|---|---|
| **Economic rationale** | A written, specific mechanism for *why* this factor should predict returns — not "investors like this metric," but the actual behavioral or risk-based reason (see the three explanations below) |
| **Academic / empirical support** | Documented evidence from peer-reviewed or otherwise credible research, ideally validated across more than one market, not just back-fit to JSE data alone |
| **Independent predictive power** | Standalone IC against forward returns, computed out-of-sample, must clear a minimum threshold |
| **Improves IC of the baseline** | Adding the factor to the existing composite must improve the composite's IC out-of-sample — not just have IC on its own |
| **Improves ICIR** | Improves consistency of the signal, not just average magnitude |
| **Survives costs** | Improvement must hold after `08-execution-model`'s realistic transaction costs, taxes, and slippage are applied |
| **Improves across regimes** | Tested across at least the regime types defined in `05` (risk-on, risk-off, sideways) — a factor that only works in one regime needs that limitation explicitly documented, not hidden |
| **Improves benchmark out-of-sample** | The composite *with* this factor must beat the composite *without* it on the locked final holdout from `09` |
| **Low multicollinearity** | Passes the orthogonality check in `04` — a factor highly correlated with an existing one adds little and inflates apparent diversification |

**If any required gate fails → REJECTED.** Rejection is recorded, not
deleted — a rejected candidate with its reasoning stays in
`13-hypothesis-model-registry` so the same idea isn't silently re-proposed
and re-tested later without acknowledging it already failed.

## The causality question (apply before testing, not after)

Before running any statistical test, write down which of these three
explanations applies, and why:

1. **Risk-based**: the factor captures genuine risk the market prices
   rationally (e.g., value stocks are riskier, hence cheaper). Premium
   should persist as long as the risk does — but expect deeper drawdowns
   in stress periods.
2. **Behavioral**: the factor captures a systematic investor bias (e.g.,
   under-extrapolation, slow information diffusion). Premium should persist
   as long as the bias does, but can erode if the anomaly becomes widely
   known and crowded.
3. **Chance**: in a small universe with a limited, clean-accounting history,
   testing many factor combinations will produce a few that look significant
   by pure multiple-comparisons noise.

A factor whose best explanation is genuinely "chance" must be rejected
regardless of how good its in-sample statistics look. A factor with a
plausible mechanism but weak JSE-specific statistical support should be
tested for **cross-market validation** (does the same factor work on a
comparable emerging market — e.g., Nigeria, Egypt — over the same period?)
before being trusted on JSE data alone.

## Database tables owned

- `factor_candidates(candidate_id, name, hypothesis_summary, proposed_by, proposed_date)`
- `admission_gate_results(candidate_id, gate_name, passed, evidence_ref, evaluated_date)`
- `admission_decisions(candidate_id, decision, decision_date, rationale)`

## API endpoints

- `GET /factor-candidates?status=pending|admitted|rejected`
- `GET /factor-candidates/{id}/gate-results`
- `POST /factor-candidates/{id}/decision`

## Acceptance criteria / Definition of Done

- [ ] Every gate above is independently evaluated and recorded — no bundling multiple gates into a single pass/fail judgment call
- [ ] A candidate's causality classification (risk/behavioral/chance) is recorded before statistical testing begins, not retrofitted afterward to match the result
- [ ] Rejected candidates remain in the registry with their reasoning, preventing silent re-litigation later

## Known failure modes & mitigations

| Failure mode | Mitigation |
|---|---|
| Adding factors because they're popular/conventional rather than evidenced | Mandatory written economic rationale gate, evaluated before statistical testing |
| Multiple-comparisons false positives in a small universe | Out-of-sample IC improvement requirement + explicit causality classification + cross-market validation recommendation |
| A factor that "removing it hurt backtest performance" being treated as sufficient evidence | This module requires positive, out-of-sample, cost-adjusted evidence for *inclusion* — absence of harm from removal is not the same as the gates above being satisfied |

## References

- Multiple comparisons problem in factor research on small universes (discussed extensively in this project's design process)
- Factor crowding and premium decay literature (e.g., post-2015 Fama-French factor decay correlated with factor ETF volume growth)
