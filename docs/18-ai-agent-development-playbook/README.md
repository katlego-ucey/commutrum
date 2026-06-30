# Module 18 — AI Agent Development Playbook

> **Commutrum Wealth Engine** — One stage in the 13-module pipeline that scores and ranks JSE equities for investment. All modules feed into a single composite score and calibrated win probability. See the [root README](../../README.md) for the full pipeline.

**Scope:** Meta-document. This is what an AI coding agent (Claude Code or
similar) should follow while implementing any module in this repository.
**Status:** Specification

## The rule

No agent writes implementation code directly from an idea. Every feature —
whether it's a whole module or a single new factor — moves through these
stages in order, and **cannot skip a stage**:

```
Research → Business Specification → Technical Specification → Database Design
   → API Design → Backend Development → Unit Testing → Integration Testing
   → Walk-Forward Validation → Frontend Integration → Acceptance Testing
   → Production Deployment → Continuous Monitoring
```

For most features in this repository, "Research" and "Business/Technical
Specification" are already done — they're the module README you're
implementing. Don't re-derive them; read them fully before writing code.

## Definition of Done (applies to every feature, every module)

A feature is **not done** until all of the following are true:

- [ ] **Purpose** is met: the implemented behavior matches the module README's stated purpose, not a reinterpretation of it
- [ ] **Inputs/outputs** match the README's specified schema exactly — field names, types, and units
- [ ] **Dependencies** are respected: the feature only reads from upstream modules' documented outputs, never reaches around them to a raw data source directly
- [ ] **Acceptance tests** from the module's own "Acceptance criteria" checklist are implemented as automated tests, not just manually eyeballed
- [ ] **Known failure modes** listed in the module's README each have a corresponding test or guard in the code (e.g., if the README warns about look-ahead bias, there is a test that would fail if look-ahead bias were reintroduced)
- [ ] **Review checklist** (below) has been worked through
- [ ] **Documentation** updated if the implementation revealed a gap or necessary clarification in the module README itself
- [ ] **No guessing**: if the module README is ambiguous about a specific value or rule, that ambiguity is resolved by reading the upstream module that produces the relevant data — not invented

## Review checklist

1. Does this change touch any point-in-time-sensitive data? If yes, is
   `publication_date` (not `period_end_date`) used in every query?
2. Does this change touch the investable universe or backtest window? If
   yes, does it correctly include delisted names for historical dates?
3. Is any threshold, weight, or rate hardcoded that should instead be a
   versioned parameter (per `14-database-schema`'s design principles)?
4. If this is a new factor or interaction term, has it gone through
   `12-factor-admission-protocol` rather than being added directly to `02`
   or `05`?
5. Does the change produce a return/performance number without also
   producing the accompanying risk metrics (max drawdown, Sharpe, Sortino)
   required by `09-walk-forward-validation`?
6. Is anything here reachable from the frontend or API without going
   through the auth/versioning conventions in `15-api-specification`?

## Common mistakes specific to this kind of system

- **Off-by-one on reporting dates**: using a calendar quarter-end date
  instead of the actual SENS publication date for that quarter's results.
- **Silent defaulting on missing data**: treating a missing fundamental
  field as zero or as the sector average instead of excluding the stock
  from scoring until the data arrives.
- **Joining on the wrong universe**: computing a sector z-score (`03`)
  against the full JSE listing instead of the investable universe (`00`)
  for that date.
- **Re-tuning on the test window**: "just checking" how a weight change
  performs on the locked holdout period from `09`, then adjusting based on
  what's seen — this is exactly the overfitting the holdout exists to prevent.
- **Treating a score as a probability**: outputting `composite_score` where
  a `probability_positive_return` field is expected, or vice versa — these
  come from different modules (`05` vs. `06`) and are not interchangeable.

## Performance targets

- Daily universe screen + factor computation for the full investable
  universe completes within the nightly batch window (target: well under
  the time between market close and the next trading day's open).
- API response time for any single-ticker research/probability query:
  sub-second for cached/pre-computed daily values.
- Walk-forward validation runs are batch jobs, not expected to be fast —
  optimize for correctness and reproducibility first, runtime second.

## Security requirements

- No vendor API keys or database credentials in source control.
- No SQL string concatenation; parameterized queries only.
- Auth required on every endpoint that exposes portfolio holdings or
  triggers a write/compute-heavy operation.

## Documentation requirements

- Any deviation from a module README's specification (because the spec
  turned out to be wrong, ambiguous, or infeasible) must be documented as an
  update to that README, with a note on why — not silently implemented
  differently while the README goes stale.

## Git workflow / testing before merge / deployment checklist

- Feature branches per module or per factor candidate.
- CI (per `17-testing-deployment`) must pass before merge: unit,
  integration, and leakage tests at minimum.
- Deployment checklist: migrations applied, versioned parameters confirmed
  current (especially tax/cost rates in `08-execution-model`, which change
  with the SARS Budget), monitoring dashboards (`10`) confirmed receiving
  data post-deploy.

## How to start

1. Read the root `README.md`.
2. Read this file in full.
3. Implement `00-universe-screening` and `01-data-pipeline` first — every
   other module depends on them and neither can be meaningfully tested
   without the other.
4. Proceed through `02` → `13` in order. Do not parallelize ahead of
   dependencies even if it looks faster — `05-composite-research-engine`
   genuinely cannot be correctly tested without `04-orthogonality-engine`'s
   output existing first.
5. Treat `14`–`17` as living references, consulted continuously, not as a
   separate phase done at the end.
