# Module 14 — Database Schema (Consolidated)

> **Commutrum Wealth Engine** — One stage in the 13-module pipeline that scores and ranks JSE equities for investment. All modules feed into a single composite score and calibrated win probability. See the [root README](../../README.md) for the full pipeline.

**Scope:** Cross-cutting. Every numbered module (`00`–`13`) owns specific
tables, listed in its own README under "Database tables owned." This
document is the consolidated reference: the full table list, relationships,
indexing strategy, and migration approach.
**Status:** Specification

## Design principles

1. **Point-in-time first.** Any table holding fundamental or estimate data
   carries both a `period_end_date`/`as_of_date` and a `publication_date` or
   `ingestion_ts`. This is not optional per-table — it is the schema-level
   enforcement of `01-data-pipeline`'s core rule.
2. **Append-only where history matters.** Fundamentals, factor values,
   signals, and scores are never updated in place — a correction or
   recalculation is a new row with a new `publication_date`/`computed_at`,
   so historical point-in-time queries are never silently rewritten.
3. **Versioned parameters, not constants.** Anything that can change
   (screening thresholds, cost model parameters, factor weights, calibration
   models) is a row in a parameters table with `effective_from`/`effective_to`,
   not a hardcoded value in application code.
4. **Time-series partitioning.** Tables like `raw_market_data`,
   `factor_signals`, and `monitoring_metrics_daily` should be partitioned by
   date (e.g., monthly partitions via native Postgres partitioning or the
   TimescaleDB extension) — both for query performance and for straightforward
   archival of old partitions.

## Consolidated table list (grouped by owning module)

| Module | Tables |
|---|---|
| `00` Universe Screening | `universe_snapshot`, `screening_rules`, `exclusions_log` |
| `01` Data Pipeline | `raw_market_data`, `raw_corporate_actions`, `raw_dividends`, `raw_fundamentals`, `raw_sens_announcements`, `raw_analyst_estimates`, `raw_estimate_revisions`, `macro_series`, `data_quality_log`, **`trading_calendar`** |
| `02` Baseline Factors | `factor_raw_values`, `factor_definitions` |
| `03` Signal Construction | `factor_signals`, `sector_mapping` |
| `04` Orthogonality Engine | `signal_correlation_matrix`, `signal_clusters`, `orthogonalized_signals` |
| `05` Composite Research Engine | `regime_classifications`, `regime_weight_profiles`, `composite_scores`, `interaction_terms` |
| `06` Probability Calibration | `calibration_models`, `calibration_curves`, `probability_outputs` |
| `07` Portfolio Construction | `portfolio_holdings`, `position_sizing_rules`, `portfolio_constraints` |
| `08` Execution Model | `cost_model_parameters`, `execution_assumptions`, `implementation_shortfall_log`, **`broker_config`** |
| `09` Walk-Forward Validation | `backtest_runs`, `backtest_results`, `validation_periods` |
| `10` Continuous Monitoring | `monitoring_metrics_daily`, `alert_log` |
| `11` Decay Detection | `decay_alerts`, `decay_investigation_log` |
| `12` Factor Admission Protocol | `factor_candidates`, `admission_gate_results`, `admission_decisions` |
| `13` Hypothesis & Model Registry | `hypothesis_registry`, `model_versions`, `lifecycle_status`, `audit_log` |

**`trading_calendar`** (owned by `01`) stores one row per calendar date with `is_trading_day BOOLEAN` and `holiday_name TEXT`. The nightly cron scheduler must consult this table before triggering the batch — the cron expression alone (`1-5`) does not exclude JSE public holidays. See `docs/01-data-pipeline` for the full DDL and the complete 12-holiday list including Freedom Day (27 April) and Family Day (Monday after Easter).

**`broker_config`** (owned by `08`) stores one row per broker with fields including `has_monthly_flat_fee BOOLEAN` and `monthly_flat_fee_zar NUMERIC(10,2)`, enabling the EasyEquities Thrive fee (R25/month) to be modelled as a parameterised cost rather than a hardcoded constant. See `docs/08-execution-model` for the full Thrive fee modelling rules.

That is roughly 37 tables for the v1 four-factor baseline. This is
intentionally far short of the "40–60 tables" estimated for the full,
all-candidate-factors version of the platform — table count should grow
only as factors are actually admitted via `12`, not be pre-built for
factors that don't exist yet.

## Key relationships

- `universe_snapshot.ticker` → referenced by nearly every other table; a
  ticker is the central join key throughout the schema.
- `factor_raw_values.factor_id` → `factor_definitions.factor_id` →
  `hypothesis_registry.factor_id` (every factor traces back to its
  governance record).
- `backtest_runs.run_id` → `backtest_results.run_id`, and `backtest_results`
  feeds both `calibration_models` (training data) and
  `lifecycle_status` (promotion evidence).
- `composite_scores.ticker, date` → `probability_outputs.ticker, date` →
  `portfolio_holdings.ticker, date` is the core daily data flow from research
  score to actual position.

## Indexing strategy

- Composite index on `(ticker, date)` for every time-series table — this is
  the dominant query pattern throughout the system.
- Index on `publication_date` (separately from `period_end_date`) on
  `raw_fundamentals`, since point-in-time queries filter on it specifically.
- Partial indexes on `status`/`pass_fail` flag columns where queries
  frequently filter to "currently active" or "currently passing" subsets.

## Migration strategy

- Schema migrations are managed with **Drizzle Kit** (`drizzle-kit migrate` /
  `drizzle-kit push`), version-controlled alongside the schema definition in
  `packages/db/src/schema/`. Apply migrations in order; no manual schema edits
  in any environment. The workspace command is:
  `pnpm --filter @commutrum/db run push` (development) or
  `pnpm --filter @commutrum/db run migrate` (production with generated SQL files).
- Every migration that adds a column to a point-in-time-sensitive table must
  include a backfill plan or an explicit note that historical rows will have
  `NULL` for the new column (and downstream code must handle that explicitly,
  not assume a default).

## Acceptance criteria / Definition of Done

- [ ] Every table from every module README above exists in the schema with the fields specified in that module's doc
- [ ] No fundamental/estimate table is missing a `publication_date`-equivalent column
- [ ] Time-series tables are partitioned by date
- [ ] All "constants" (thresholds, tax rates, cost parameters) live in versioned parameter tables, not application code

## References

See the per-module READMEs (`00`–`13`) for the authoritative field-level definition of each table.
