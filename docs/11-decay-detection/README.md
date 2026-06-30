# Module 11 — Decay Detection

> **Commutrum Wealth Engine** — One stage in the 13-module pipeline that scores and ranks JSE equities for investment. All modules feed into a single composite score and calibrated win probability. See the [root README](../../README.md) for the full pipeline.

**Pipeline position:** Consumes alerts and rolling metrics from
`10-continuous-monitoring`. Outputs investigation triggers to
`13-hypothesis-model-registry` (status change candidates) and, where
warranted, to a human/governance review — this module flags, it does not
unilaterally remove.
**Status:** Specification

## Purpose

Distinguish ordinary short-term noise in a factor's performance from a
genuine, structural loss of predictive power ("alpha decay"). The line
between the two matters enormously: removing a factor on noise destroys a
working strategy; keeping a factor that has genuinely decayed (e.g., because
crowding has eroded the premium, per the causality discussion that shaped
this design) erodes returns while the system keeps reporting confidence it
no longer has.

## Pre-defined decay rules (set during `09`, not invented after the fact)

| Rule | Trigger | What it means |
|---|---|---|
| IC threshold breach | Rolling IC drops below the validated minimum for N consecutive periods | The factor's rank-correlation with forward returns has weakened |
| IR decline | ICIR declines significantly vs. its walk-forward-validated value | The factor's signal has become less *consistent*, even if average IC hasn't moved much |
| Hit rate fall | Trailing hit rate falls meaningfully below the historical win rate on record | More individual calls are simply wrong than the calibration model expects |
| Calibration drift | Reliability diagram in `06` shows growing gap between predicted probability and realized frequency | The probability outputs are no longer trustworthy, independent of the raw score |
| Stability break | Factor weight or composite contribution moves outside its validated range in `05` | Something about how the factor behaves relative to others has structurally changed |
| Regime change | `05`'s regime classifier flags a sustained shift not seen in the training history | The market environment may have moved outside the conditions the factor was validated under |

## What happens when a rule fires

1. **Investigation, not automatic removal.** A fired rule creates an entry
   in `13-hypothesis-model-registry` with status `Under Review` — this
   routes to the governance process (see `13`), not to instant deletion. An
   automated system silently dropping factors based on short windows of
   live data is itself a way to overfit to noise, just in production instead
   of backtesting.
2. **Root-cause check**: is this noise (a short window, consistent with
   historical IC variance), a real structural break (e.g. crowding, a
   regime never seen in training, a changed economic mechanism), or a data
   problem upstream (`01-data-pipeline` issue masquerading as alpha decay)?
3. **Decision recorded**: retain / watch / remove, logged with the
   reasoning — per the governance lifecycle in `13`.

## Database tables owned

- `decay_alerts(alert_id, factor_id, rule_triggered, date, metric_value, threshold, status)`
- `decay_investigation_log(alert_id, investigator, root_cause_assessment, decision, decided_at)`

## API endpoints

- `GET /decay/alerts?status=open`
- `POST /decay/alerts/{id}/investigate` → records the root-cause assessment and decision

## Acceptance criteria / Definition of Done

- [ ] Every decay rule's threshold was set during `09`'s validation, not chosen reactively
- [ ] A fired rule never auto-deletes a factor; it always creates a reviewable record
- [ ] The investigation log distinguishes noise vs. structural break vs. upstream data issue as separate categories

## Known failure modes & mitigations

| Failure mode | Mitigation |
|---|---|
| Removing a working factor because of a short losing streak that's within normal historical variance | Thresholds set from validated IC variance, not from "this feels bad right now" |
| Keeping a structurally decayed factor because nobody is watching | Mandatory rolling thresholds + alert routing into the governance review process |
| Confusing a data pipeline problem for alpha decay | Investigation log requires an explicit root-cause category before a retain/remove decision is recorded |

## References

- Factor crowding and alpha decay research discussed in this project's design process (e.g., factor ETF volume growth correlating with declining remaining alpha post-2015)
