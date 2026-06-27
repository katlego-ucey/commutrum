# Module 16 — Frontend Dashboards

**Scope:** Cross-cutting UI layer. Consumes the API in `15-api-specification`.
**Status:** Specification

## Screens

### 1. Research Dashboard

- Company search/select
- Composite score with full factor-level attribution breakdown (transparency
  principle — never show a score without showing what produced it)
- Probability output with confidence interval and sample size (from `06`)
- Currency-sensitivity / dual-listing flag, shown prominently when present
- Historical score chart over time

### 2. Factor Explorer

- List of all factors (baseline + admitted candidates) with current status
  from `13-hypothesis-model-registry`
- Per-factor: rolling IC history chart, decay status, correlation with other
  active factors (from `04`), admission gate results (from `12`)
- Visual flag for any factor currently in `Watch` or `Under Review` status

### 3. Portfolio Dashboard

- Current holdings with weights, sizing method, and the probability that
  justified each position at selection time
- Expected return / risk summary at the portfolio level
- Sector and currency-sensitivity exposure breakdown (enforcing visibility
  of the constraints from `07`)
- Rebalance history and the implementation shortfall actually incurred

### 4. Monitoring Dashboard

- Rolling IC, Sharpe, Sortino, hit rate, drawdown — each shown against its
  validated/expected reference band from `09`, not as a bare number
- Open alerts from `10`/`11`, with status and investigation notes
- Capacity utilization vs. limits from `08`

### 5. Hypothesis Registry Browser

- Searchable list of every factor/model, current lifecycle stage, and full
  audit history
- Read-only view of rejected candidates and the reason for rejection (so the
  same idea isn't silently re-proposed without that context)

## Design notes

- Every screen that shows a score, probability, or rating must show its
  basis — attribution, sample size, confidence interval, or audit link.
  Never present a bare number as if it were self-evidently trustworthy; that
  is the exact failure mode this whole project was designed to avoid.
- Use a consistent reference-band visual pattern across Monitoring,
  Research, and Factor Explorer so "this is within expected range" vs. "this
  has drifted" reads the same way everywhere.
- Mobile/tablet: Monitoring and Portfolio dashboards are the most likely to
  be checked on the go — prioritize responsive layout there first.

## Suggested stack

React + TypeScript, Recharts or D3 for the rolling-metric and reliability
diagram charts (a reliability diagram in particular needs a custom
scatter/calibration-curve component, not an off-the-shelf chart type),
shadcn/ui or Tailwind for layout primitives.

## Acceptance criteria / Definition of Done

- [ ] Every score/probability/rating displayed has a visible attribution or "why" affordance
- [ ] Monitoring charts show the validated reference band, not just the live value
- [ ] Hypothesis Registry Browser includes rejected/retired entries, not just active ones
- [ ] All five screens consume only the versioned `/api/v1` endpoints from `15`, no direct database access from the frontend

## References

See `15-api-specification` for the endpoints each screen consumes.
