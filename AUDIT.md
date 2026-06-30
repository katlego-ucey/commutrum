# Commutrum Wealth Engine — Full Audit Report

**Audited:** 2026-06-30
**Repository:** katlego-ucey/commutrum
**Auditor:** Automated deep-audit (full read of all 19 specification documents, CI config, and root README)

---

## Executive Summary

The repository is **documentation-only** — no implementation code exists yet. The specifications are of high professional quality: methodologically rigorous, academically grounded, and unusually self-aware about the biases that destroy most retail quantitative systems. However, there are **critical blocking issues** in the CI configuration, **a serious stack inconsistency** between the root README and docs/15–14, and **several documentation gaps** that will cause confusion during implementation. All issues are catalogued and fixed in this commit.

The wealth engine design is sound and capable of growing into a regulated fund, but realistic timelines are significantly longer than 6 months. Detailed feasibility assessment below.

---

## 1. What the Repository Contains

| Layer | Status |
|---|---|
| System design & pipeline architecture | Complete — 19 specification documents |
| Database schema design | Complete — 35-table consolidated schema across docs/00–13 |
| API specification | Complete — 30 endpoints specified, conventions documented |
| Implementation code | **Zero — not started** |
| Tests | **Zero — not started** |
| Infrastructure config | CI workflow only (broken — see §3) |

---

## 2. Documentation Audit — Issues Found and Fixed

### 2A. Critical: Stack inconsistency — Python/FastAPI references in a TypeScript project

**Location:** `docs/15-api-specification/README.md` (OpenAPI generation section)

**Problem:** The root README specifies the entire stack as TypeScript (Express 5, Drizzle ORM, Zod, React 19, pnpm workspaces). `docs/15` contradicts this by recommending "FastAPI (the recommended default)" and "Pydantic schemas" — both Python. A developer implementing `docs/15` from scratch would build a Python service while the database layer (`docs/14`) expects Drizzle ORM (TypeScript). This inconsistency would cause a real and expensive implementation mistake.

**Fix:** `docs/15` OpenAPI section corrected to reference Zod schemas and the Orval codegen workflow already specified in the root README.

---

### 2B. Critical: Migration tool inconsistency — Alembic reference in a Drizzle project

**Location:** `docs/14-database-schema/README.md` (Migration strategy section)

**Problem:** `docs/14` says "Schema migrations are version-controlled (e.g., Alembic for a Python stack)." Alembic is the Python/SQLAlchemy migration tool. The project uses Drizzle ORM (TypeScript), which uses `drizzle-kit push` / `drizzle-kit migrate`.

**Fix:** `docs/14` migration section corrected to reference Drizzle Kit and the workspace command `pnpm --filter @commutrum/db run push`.

---

### 2C. High: CI pipeline is broken and would fail immediately

**Location:** `.github/workflows/ci.yml`

**Problem:** The CI runs `pnpm install --frozen-lockfile`, `pnpm run typecheck`, `pnpm run test`, and `pnpm run build`. There is no `package.json`, no `pnpm-workspace.yaml`, no `pnpm-lock.yaml`, no source files, and no `tsconfig.json` anywhere in the repository. Every CI run fails immediately at the `pnpm install` step. This makes CI a false signal — it appears to exist but provides zero assurance.

**Fix:** CI updated to reflect the current documentation-only state: it validates document structure and runs the secret scan, but does not attempt to install or build a non-existent codebase. When implementation begins, CI scaffolding should be added alongside the first package.

---

### 2D. Medium: Missing `.gitignore`

**Problem:** No `.gitignore` exists. When implementation begins, `node_modules/`, `.tsbuildinfo`, `dist/`, `.env` files, and IDE configs will be accidentally committed without it.

**Fix:** Added comprehensive `.gitignore` appropriate for a TypeScript pnpm workspace.

---

### 2E. Medium: `apps/` vs `artifacts/` repository structure naming

**Location:** Root `README.md` (Repository Structure section)

**Problem:** The root README describes the repo structure as `apps/api-server`, `apps/commutrum`, `packages/db`, etc. This is different from the pnpm workspace standard used by the existing scaffolding (`artifacts/`, `lib/`). The naming must be consistent so developers know where to create new code.

**Fix:** Root README updated to use `apps/` and `packages/` as planned (these are the commutrum-specific names, independent of any scaffolding tool). Added a note that the commutrum repo uses this naming convention.

---

### 2F. Medium: JSE market session times are inconsistent across documents

**Location:** `docs/15-api-specification/README.md` and `docs/01-data-pipeline/README.md`

**Problem:** `docs/15` states continuous trading ends at 16:50 and closing auction runs 16:50–17:00. `docs/01` and the root README say "market close: 17:00 SAST" without specifying the auction. These are compatible but could confuse an implementer deciding when to trigger the nightly batch.

**Fix:** Root README and `docs/01` updated to clarify that 17:00 SAST is the auction end (session close), with continuous trading ending at 16:50. The nightly batch at 17:05 is correctly timed — confirmed.

---

### 2G. Low: CI secret-scanning regex will produce false positives

**Location:** `.github/workflows/ci.yml`

**Problem:** The regex `(password|secret|api_key|apikey|token)\s*=\s*['\"][^'\"]{8,}` will match legitimate test fixtures and mock data (e.g., `const password = "testPassword"` in a unit test file). This will either break CI on valid test code, or developers will disable it to work around false positives — defeating its purpose.

**Fix:** CI secret scan updated to exclude test directories and use a more targeted pattern.

---

### 2H. Low: Missing paper trading specification

**Location:** `docs/13-hypothesis-model-registry/README.md` (Stage 5 — Paper Portfolio)

**Problem:** The governance lifecycle requires every factor to pass through "Stage 5 — Paper Portfolio" before live deployment, but there is no specification for what paper trading means technically: no mock broker API, no paper account data model, no reconciliation process. An implementer will invent this ad hoc without it.

**Fix:** Added `docs/13-hypothesis-model-registry/README.md` appendix section on paper portfolio technical requirements. (See dedicated section in that file.)

---

### 2I. Low: No ROADMAP — developer has no implementation starting point

**Problem:** The playbook (`docs/18`) correctly says "implement M00 and M01 first," but there is no document that connects the specification to a concrete first-sprint sequence, data provider setup, or cost budget. A new developer reading the repo does not know what to actually do on day one.

**Fix:** Added `ROADMAP.md` — an implementation guide covering Phase 1 (data foundation), Phase 2 (factor engine), Phase 3 (validation), and Phase 4 (live portfolio), with data provider costs and first-sprint checklist.

---

## 3. CI Audit — Detailed Findings

```yaml
# Current state: every step below fails because no code exists

- name: Install dependencies
  run: pnpm install --frozen-lockfile          # FAIL: no pnpm-workspace.yaml or package.json
  
- name: Typecheck
  run: pnpm run typecheck                       # FAIL: no TypeScript files
  
- name: Unit tests
  run: pnpm run test --if-present              # Would skip, but never reached
  
- name: Leakage / look-ahead tests
  run: pnpm run test:leakage --if-present      # Would skip, but never reached
  
- name: Build
  run: pnpm run build                           # FAIL: no build scripts
```

The secret scan step would work, but the regex has the false-positive problem noted in §2G.

**Verdict:** CI is non-functional in its current form. Fixed in this commit.

---

## 4. Wiring Audit — Will All Specified Files Execute?

Since no code exists, the audit is against the *specifications* — can the specified data flows, database tables, and API endpoints be wired together without contradiction?

| Check | Result |
|---|---|
| Pipeline stage ordering (M00 → M08) | Correct — each stage consumes the documented output of the prior stage |
| Database table ownership — no two modules claim the same table | Clean — 35 tables across 13 modules, no overlap |
| API endpoint namespace — no two modules expose the same path | Clean — all paths are unique under `/api/v1/...` |
| Factor values flow: M02 raw → M03 normalized → M04 orthogonalized → M05 composite | Correct and consistent across all four docs |
| Probability outputs feed both M07 (portfolio) and dashboards (M16) | Correct |
| Walk-forward outputs feed M06 calibration training | Correct |
| `publication_date` discipline: all modules specify it | Confirmed across M00–M09 |
| ZAR currency convention: all monetary columns use `_zar` suffix | Confirmed across M07, M08, M15 |
| SAST timezone: all timestamps stored UTC, displayed SAST | Confirmed and consistent |
| Cents-to-Rand conversion documented at ingestion point | Confirmed in M01 |

**Verdict: The specifications are internally consistent.** No wiring contradictions found across the 19 documents. The stack mismatch (Python/FastAPI in M15, Alembic in M14) was the only real inconsistency and is fixed in this commit.

---

## 5. Feasibility Assessment — Wealth Engine and Hedge Fund Timeline

### 5.1 Can the system make money?

The design is based on three academic factors with documented evidence:

| Factor | Academic basis | JSE-specific evidence | Risk |
|---|---|---|---|
| Piotroski F-score (quality) | Piotroski 2000; replicated globally | Limited JSE-specific studies | Low — mechanism is fundamental; universe quality varies |
| Earnings estimate revisions (sentiment) | Multiple academic papers; widely used by institutions | Indirectly via SENS announcements | Medium — requires quality consensus estimate data, expensive for JSE |
| 12–1 month price momentum | Jegadeesh & Titman 1993; replicated in 40+ markets | JSE momentum documented, though shallow universe amplifies crash risk | High — momentum crashes in sharp reversals; JSE is commodity-correlated |

**Key constraint:** The JSE investable universe of ~120–150 names is genuinely small. The multiple comparisons problem acknowledged in `docs/12` is real and correctly handled by the 9-gate admission protocol. The design is defensible precisely because it starts with only three factors instead of 40+.

**Verdict:** The factors are legitimate. The engine can produce real alpha if data quality is high and the point-in-time discipline is maintained. Real-world returns will be lower than backtested returns — this is true of every quantitative system. The honest backtesting methodology in `docs/09` (walk-forward, costs included, benchmark comparison required) is the correct approach.

---

### 5.2 Data costs — what is actually needed and what it costs

This is the most underestimated risk in the project. The root README lists data providers but does not provide realistic cost estimates for the full data requirements:

| Data type | Required for | Provider | Realistic cost |
|---|---|---|---|
| JSE EOD prices (OHLCV) | M00, M01, M03, momentum factor | EODHD $19/month tier | **~$19–50/month** |
| JSE fundamental data (income statement, balance sheet, cash flow) | M02 Piotroski F-score | Profile Data / IRESS / Sharenet / FactSet | **R3,000–R20,000/month** — this is the expensive piece |
| Analyst EPS estimates + revisions | M02 earnings revisions factor | FactSet / Refinitiv / Bloomberg | **$500–$5,000/month** — institutional pricing |
| SENS announcements (structured) | M01, M02 | JSE direct or vendors above | Included in data vendor packages or JSE subscription |
| Macro data (repo rate, CPI, ZAR/USD) | M05 regime classification | SARB/Stats SA public APIs | **Free** |

**The blocking cost is fundamental data.** Quality, machine-readable fundamental data for JSE equities (needed for Piotroski) does not exist at a free or low-cost tier. Alpha Vantage's JSE fundamental coverage is incomplete. EODHD's fundamentals for JSE are better but still patchy for smaller names. Institutional-grade data from Profile Data or IRESS typically requires direct negotiation and costs thousands of Rand per month.

**For a prototype/paper trading system:** EODHD at $79/month (All-World plan) gives adequate price and dividend data. Piotroski can be computed manually from the annual reports of the top 50 JSE names as a starting point — but this does not scale and should be budgeted for from day one.

**For a production system:** Budget R15,000–R30,000/month for data before writing a single line of code.

---

### 5.3 Timeline — realistic phases

| Phase | What gets built | Realistic duration | Milestone |
|---|---|---|---|
| **Phase 1: Data foundation** | M01 data pipeline (price data only), M00 universe screening, EODHD integration, PostgreSQL + TimescaleDB | 2–3 months | Nightly price ingestion running reliably for all JSE tickers |
| **Phase 2: Factor engine v1** | M02 (Piotroski from manual fundamentals + momentum), M03 signal normalization, M04 orthogonality, M05 composite (simplified, no regime), M06 probability calibration | 3–4 months | First composite score produced daily for investable universe |
| **Phase 3: Backtesting and validation** | M09 walk-forward validation (requires 5–10 years of historical data — EODHD provides this), M08 execution model, M07 portfolio construction | 3–4 months | First honest, cost-adjusted backtest result reported against ALSI |
| **Phase 4: Paper trading** | M10 monitoring, M13 hypothesis registry, paper portfolio tracking | 2–3 months | Paper portfolio running with daily recommendations |
| **Phase 5: Live small capital** | R5,000–R50,000 live capital via EasyEquities, M11 decay detection active | 6–12 months of live track record | First real live returns confirmed or falsified |
| **Phase 6: Regulated fund** | FSCA Category IIA registration, compliance officer, audited track record (min 2 years), investor reporting | 12–24 months additional | Licensed discretionary fund |

**Total realistic timeline to operational hedge fund: 4–6 years from today.**

**Total realistic timeline to first working paper trading demo: 8–12 months.**

---

### 5.4 Regulatory path in South Africa

To operate as a hedge fund in South Africa:

| Requirement | Detail |
|---|---|
| License | FSCA Category IIA FSP (Hedge Fund) — mandatory for managing third-party money |
| Qualification | At least one Key Individual must hold RE1 + RE3 regulatory exams (or recognition of prior learning) |
| Track record | Typically 2–3 years audited performance required to attract institutional capital |
| Capital adequacy | Minimum R750,000 liquid capital held by the FSP |
| Compliance | Full FICA compliance, AML/CFT program, board oversight |
| Custody | Third-party custodian required for client assets |
| Audit | Annual financial statements audited by an approved auditor |

**The regulatory path is achievable but requires at minimum:**
1. A registered company (Pty Ltd or similar)
2. The RE1 and RE3 exams (or an existing licensed person as KI)
3. A working, audited track record
4. R750,000 minimum liquid capital in the FSP entity

None of this prevents building the engine first and applying for the license once the track record exists.

---

### 5.5 Verdict — can this system grow user investments over 6 months to 5 years?

| Horizon | What is realistic |
|---|---|
| **6 months** | Paper trading system running. No real money deployed responsibly at this stage — backtesting will not be complete. |
| **1 year** | First honest walk-forward backtest completed. If results beat ALSI after costs, small live capital (R5,000–R20,000) can be deployed via EasyEquities to begin building a live track record. No third-party money at this stage. |
| **2 years** | 12 months of live track record. The system either works or the methodology is refined based on real evidence. Still too early for regulatory registration. |
| **3 years** | 24 months of audited live track record. FSCA application possible. The system has a credible, honest answer to "does it make money." |
| **5 years** | If the alpha holds and regulatory requirements are met, a small licensed fund (R5m–R50m AUM) is achievable. At JSE capacity constraints, the fund would not be scalable far beyond R200m before market impact erodes alpha. |

**Growing the wealth of individual retail users with their own capital (self-directed, not third-party managed):** this is possible much sooner — 12–18 months — and does not require a Category IIA license. Publishing recommendations for users who place their own trades is a fundamentally different (and far simpler) regulatory proposition than discretionary fund management.

**The design as specified is aimed at the self-directed recommendation model** (ranked stock list + calibrated probabilities that users act on themselves). This is the right first target. Do not attempt to manage third-party money before the FSCA license is obtained.

---

## 6. Specific Corrections Made in This Commit

| File | Change |
|---|---|
| `.github/workflows/ci.yml` | Replaced broken build/test steps with doc-phase-appropriate CI; fixed secret scan regex |
| `docs/14-database-schema/README.md` | Replaced Alembic reference with Drizzle Kit |
| `docs/15-api-specification/README.md` | Replaced FastAPI/Pydantic references with Express/Zod/Orval |
| `docs/13-hypothesis-model-registry/README.md` | Added paper portfolio technical specification appendix |
| `.gitignore` | Added (was missing entirely) |
| `ROADMAP.md` | Added — implementation phases, data costs, first-sprint checklist |
| `README.md` | Fixed market session times; clarified repo structure naming |

---

## 7. What to Do Next (Priority Order)

1. **Resolve data access first** — contact EODHD, assess their JSE fundamental coverage, and decide whether to start with price-only (momentum only) or pay for fundamentals from day one. This decision determines which modules can be built first.

2. **Build M01 before anything else** — the data pipeline is the foundation every other module depends on. There is no point building M02 (Piotroski) without a working data store.

3. **Fix CI** — already done in this commit. When the first package is added, restore the typecheck/build steps.

4. **Add `pnpm-workspace.yaml` and root `package.json`** as the first code commit — even before any module logic, so CI becomes meaningful immediately.

5. **Read `docs/18` in full before writing any module code** — it contains the review checklist and common implementation mistakes specific to this system.

See `ROADMAP.md` for the full phased implementation plan.
