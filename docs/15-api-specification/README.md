# Module 15 — API Specification (Consolidated)

> **Commutrum Wealth Engine** — One stage in the 13-module pipeline that scores and ranks JSE equities for investment. All modules feed into a single composite score and calibrated win probability. See the [root README](../../README.md) for the full pipeline.

**Scope:** Cross-cutting. Every numbered module lists its own endpoints
under "API endpoints" in its README. This document is the consolidated
reference: conventions, auth, versioning, and the full endpoint list.
**Status:** Specification

## Conventions

- **Base path**: `/api/v1/...` — version the API from day one so breaking
  changes don't silently affect every consumer.
- **Date parameters**: always `YYYY-MM-DD`, always interpreted as "as of end
  of this trading day" unless an endpoint explicitly documents otherwise.
- **Response envelope**: every response is `{ "data": ..., "meta": { "as_of": ..., "generated_at": ... } }` — `as_of` matters enormously in a point-in-time system; a client must always be able to tell what date's view of the world it's looking at.
- **Errors**: standard HTTP status codes; error body is `{ "error": { "code": ..., "message": ... } }`.
- **Pagination**: cursor-based for any list endpoint that can return more than ~100 rows (e.g., `GET /universe`).

## Authentication

- JWT-based auth for any endpoint that exposes portfolio holdings, execution
  parameters, or write operations (`POST`/`PUT`).
- Read-only research endpoints (factor definitions, public methodology) can
  be unauthenticated if the platform is ever exposed beyond internal use —
  decide this explicitly per deployment, don't default to open by accident.
- Rate limiting on all endpoints; stricter limits on anything that triggers
  a backtest run (`09`) or a rebalance simulation (`07`), since those are
  computationally expensive.

## Consolidated endpoint list

| Module | Endpoints |
|---|---|
| `00` Universe | `GET /universe`, `GET /universe/{ticker}/screen-status` |
| `01` Data | `GET /data/prices/{ticker}`, `GET /data/fundamentals/{ticker}`, `GET /data/events/{ticker}`, `GET /data/quality/{ticker}` |
| `02` Factors | `GET /factors/{ticker}/raw`, `GET /factors/definitions` |
| `03` Signals | `GET /signals/{ticker}`, `GET /signals/sector-stats` |
| `04` Orthogonality | `GET /orthogonality/correlation-matrix`, `GET /orthogonality/clusters` |
| `05` Composite | `GET /research/{ticker}`, `GET /regime/current` |
| `06` Probability | `GET /probability/{ticker}`, `GET /calibration/reliability-diagram` |
| `07` Portfolio | `GET /portfolio/current`, `GET /portfolio/history`, `POST /portfolio/rebalance` |
| `08` Execution | `GET /execution/cost-model`, `POST /execution/estimate-shortfall` |
| `09` Validation | `GET /backtest/runs`, `GET /backtest/results/{run_id}`, `GET /backtest/benchmark-comparison` |
| `10` Monitoring | `GET /monitoring/metrics`, `GET /monitoring/alerts`, `POST /monitoring/alerts/{id}/acknowledge` |
| `11` Decay | `GET /decay/alerts`, `POST /decay/alerts/{id}/investigate` |
| `12` Admission | `GET /factor-candidates`, `GET /factor-candidates/{id}/gate-results`, `POST /factor-candidates/{id}/decision` |
| `13` Registry | `GET /registry/factors`, `GET /registry/factors/{id}`, `GET /registry/audit-log`, `POST /registry/factors/{id}/transition` |

That's roughly 30 endpoints for the v1 baseline — again, intentionally
smaller than the 120–180 endpoints estimated for the full all-candidate-factor
platform. Add endpoints as modules/factors are actually built, not ahead of
need.

## OpenAPI generation

If using FastAPI (the recommended default per the root README), the OpenAPI
schema is generated automatically from the endpoint type hints — keep
request/response models as explicit Pydantic schemas so the generated docs
stay accurate without separate manual maintenance.

## Acceptance criteria / Definition of Done

- [ ] Every endpoint listed in a module README exists and matches its documented response shape
- [ ] All endpoints are versioned under `/api/v1`
- [ ] Auth is applied consistently — no accidental open write endpoint
- [ ] OpenAPI spec is generated and kept current as part of CI (see `17-testing-deployment`)

## References

See per-module READMEs for the authoritative request/response contract of each endpoint.
