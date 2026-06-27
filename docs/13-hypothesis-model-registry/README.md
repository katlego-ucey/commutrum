# Module 13 — Hypothesis & Model Registry

**Pipeline position:** The permanent record that every other module writes
to. Implements the Scientific Governance Lifecycle (the 8-stage process
running alongside the entire pipeline).
**Status:** Specification

## Purpose

This is the audit trail that makes the whole system falsifiable and
transparent rather than a black box that happens to be made of rules instead
of a neural network. Every factor and every model version has a permanent,
queryable record of what it claimed, what evidence it had, what happened to
it, and why any decision was made about it.

## The Scientific Governance Lifecycle

```
1. Hypothesis Registry   — record rationale, mechanism, expected horizon, metrics
        ↓
2. Research & Development — construct factor, explore data, gather initial evidence
        ↓
3. Backtest (in-sample)   — test on historical data with proper methodology
        ↓
4. Walk-Forward Validation — out-of-sample testing across multiple periods
        ↓
5. Paper Portfolio        — run in a simulated portfolio with transaction costs
        ↓
6. Production Deployment  — live portfolio execution
        ↓
7. Monitoring & Review    — continuous performance monitoring
        ↓
8. Decision               — retain / watch / remove, based on evidence
        ↓
   [REMOVE if criteria fail] → factor retired & archived (never deleted)
```

No factor or model skips a stage. A factor cannot go from stage 3 straight to
stage 6 because the in-sample backtest looked good — it must clear stage 4's
out-of-sample test and stage 5's cost-aware paper trading first.

## Registry fields per factor/model

| Field | Description |
|---|---|
| Factor ID | Unique, versioned identifier |
| Hypothesis / rationale | Risk-based, behavioral, or chance classification (per `12`), with the written mechanism |
| Data requirements | What `01-data-pipeline` inputs this factor needs |
| Expected return / horizon | What the hypothesis predicts, and over what time horizon |
| Status | One of: `R&D`, `Validation`, `Paper Portfolio`, `Production`, `Watch`, `Retired` |
| Performance summary | Current IC, ICIR, Sharpe, hit rate vs. the values recorded at each lifecycle stage |
| Failure criteria | Pre-defined, written *before* deployment — what observed performance triggers a `Watch` or `Retired` status |
| Documentation & links | Links to the relevant module README, admission gate results, and decay investigation logs |
| Audit trail | Every status change, who/what triggered it, and when |

## Database tables owned

- `hypothesis_registry(factor_id, name, rationale, mechanism_type, data_requirements, expected_horizon, failure_criteria, created_date)`
- `model_versions(model_id, factor_id, version, formula_or_weights, effective_from, effective_to)`
- `lifecycle_status(factor_id, current_stage, status, last_updated)`
- `audit_log(entity_type, entity_id, change_type, old_value, new_value, changed_by, changed_at)`

## API endpoints

- `GET /registry/factors?status=`
- `GET /registry/factors/{id}` → full history, current stage, performance summary
- `GET /registry/audit-log?entity_id=`
- `POST /registry/factors/{id}/transition` → move a factor to its next lifecycle stage, with required evidence attached

## Acceptance criteria / Definition of Done

- [ ] No factor reaches `Production` status without a recorded pass through every prior lifecycle stage
- [ ] Failure criteria are recorded before deployment, never edited retroactively to match observed results
- [ ] Retired factors are archived, not deleted — their full history remains queryable
- [ ] Every status transition is attributable (who/what triggered it) in the audit log

## Known failure modes & mitigations

| Failure mode | Mitigation |
|---|---|
| Skipping validation stages under pressure to "ship" a promising-looking factor | Lifecycle stage transitions are enforced at the data model level — a transition without the required prior-stage evidence is rejected by the API, not just discouraged by policy |
| Redefining "success" after seeing results | Failure/success criteria are recorded at stage 1, immutable once a factor reaches stage 3 |
| Losing institutional memory of why a factor was rejected or retired | Full audit trail, permanently retained |

## References

- Model governance practice in institutional quantitative research (promotion/demotion lifecycles, audit trails)
