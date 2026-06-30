# Module 17 — Testing & Deployment

> **Commutrum Wealth Engine** — One stage in the 13-module pipeline that scores and ranks JSE equities for investment. All modules feed into a single composite score and calibrated win probability. See the [root README](../../README.md) for the full pipeline.

**Scope:** Cross-cutting. Applies to every module above.
**Status:** Specification

## Test strategy

| Test type | Scope | Example |
|---|---|---|
| Unit | Single formula/function | Piotroski F-score against 3 hand-calculated companies; z-score normalization against a known distribution |
| Integration | Module-to-module data flow | A factor computed in `02` flows correctly through `03` → `04` → `05` with expected transformations at each step |
| Mathematical validation | Formula correctness independent of code | Confirm the calibration model's reliability diagram matches a synthetic dataset with known, designed-in calibration |
| Leakage / look-ahead | Point-in-time integrity | Deliberately corrupt a `publication_date` and confirm backtest results change — proves the filter is actually enforced, not just present in the schema |
| Regression | Full pipeline, on a fixed historical slice | Re-running `00`→`09` on a frozen historical dataset produces byte-identical results run to run |
| Security | Auth, injection, secrets handling | No SQL injection on any parameterized endpoint; no API keys or credentials in source control |
| Performance | Latency/throughput under realistic load | Universe screen + factor computation completes within the daily batch window for the full ~280-stock universe |
| Acceptance | Per-module Definition of Done | Each module's README acceptance criteria checklist is the literal acceptance test suite for that module |

## CI/CD

- Every pull request runs: unit + integration + leakage tests, plus a lint/type-check pass.
- Merges to main trigger a full regression run against the frozen historical
  test dataset before deployment is allowed.
- Walk-forward validation (`09`) is **not** run on every commit — it's
  expensive and only meaningful when a factor or weighting actually changes;
  trigger it explicitly when `02`, `04`, `05`, or `06` change.

## Infrastructure

- Docker + docker-compose for local development and v1 production.
- Move to Kubernetes only once `10-continuous-monitoring` and real usage
  patterns justify the added operational complexity — building for scale
  before there's a working, validated v1 is its own form of overfitting,
  this time on imagined future requirements rather than historical data.
- Secrets (database credentials, vendor data API keys) via environment
  variables injected at deploy time or a secrets manager — never committed
  to source control, never hardcoded alongside the versioned business
  parameters described in `14-database-schema`.

## Logging, backups, disaster recovery

- Structured logging across all services, correlated by a request/run ID so
  a single backtest run or rebalance can be traced end-to-end.
- Daily database backups, with point-in-time recovery enabled given how much
  of this system's value is in its historical record (`13`'s audit trail in
  particular must never be silently lost).
- Documented recovery runbook: what to do if the daily data ingestion fails,
  if a vendor feed is delayed, or if a deploy needs to be rolled back.

## Acceptance criteria / Definition of Done

- [ ] Every module's own acceptance criteria checklist has a corresponding automated test, not just a manual review note
- [ ] CI blocks merges that fail leakage/look-ahead tests
- [ ] Secrets are never present in source control (verified by a pre-commit or CI secret-scanning step)
- [ ] A disaster-recovery runbook exists and has been exercised at least once (a real or simulated restore-from-backup test)

## References

Testing priorities here are sequenced from the project's own design history — leakage and survivorship-bias tests are treated as first-class, not incidental, because they were identified as the most common source of illusory performance across this project's multiple critique rounds.
