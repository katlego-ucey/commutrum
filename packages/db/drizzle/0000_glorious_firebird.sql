CREATE TABLE "api_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" varchar(255) NOT NULL,
	"method" varchar(10) NOT NULL,
	"status_code" integer,
	"response_time_ms" integer,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equities" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"sector" varchar(100),
	"industry" varchar(100),
	"isin" varchar(12),
	"listing_date" timestamp with time zone,
	"market_cap" numeric(20, 2),
	"currency" varchar(3) DEFAULT 'ZAR' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "factor_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"factor_type_id" integer NOT NULL,
	"score" numeric(10, 6) NOT NULL,
	"percentile" numeric(6, 2),
	"date" timestamp with time zone NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "factor_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"description" text,
	"category" varchar(50) NOT NULL,
	"weight" numeric(5, 4) DEFAULT '0.3333',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "factor_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "portfolio_positions" (
	"id" serial PRIMARY KEY NOT NULL,
	"portfolio_id" integer NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"shares" numeric(18, 4) NOT NULL,
	"entry_price" numeric(14, 4) NOT NULL,
	"current_price" numeric(14, 4),
	"entry_date" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolios" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) DEFAULT 'My Portfolio' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"open" numeric(14, 4),
	"high" numeric(14, 4),
	"low" numeric(14, 4),
	"close" numeric(14, 4),
	"volume" numeric(20, 0),
	"adj_close" numeric(14, 4),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"composite_score" numeric(10, 6) NOT NULL,
	"rank" integer NOT NULL,
	"signal" varchar(20) NOT NULL,
	"quality_score" numeric(10, 6),
	"momentum_score" numeric(10, 6),
	"earnings_score" numeric(10, 6),
	"date" timestamp with time zone NOT NULL,
	"rationale" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "exclusions_log" (
	"id" text PRIMARY KEY NOT NULL,
	"ticker" text NOT NULL,
	"exclusion_date" date NOT NULL,
	"reason" text NOT NULL,
	"detail" text,
	"rule_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "screening_rules" (
	"rule_id" text PRIMARY KEY NOT NULL,
	"rule_name" text NOT NULL,
	"threshold" numeric(20, 6) NOT NULL,
	"unit" text NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"rationale" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickers" (
	"ticker" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"isin" text,
	"sector" text,
	"sub_sector" text,
	"listed_date" date,
	"delisted_date" date,
	"is_currently_listed" boolean DEFAULT true NOT NULL,
	"dual_listed" boolean DEFAULT false NOT NULL,
	"offshore_revenue_pct" numeric(5, 2),
	"shares_outstanding" numeric(20, 0),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "universe_snapshot" (
	"ticker" text NOT NULL,
	"snapshot_date" date NOT NULL,
	"pass_fail" boolean NOT NULL,
	"exclusion_reason" text,
	"adtv_20d" numeric(20, 2),
	"market_cap_zar" numeric(20, 2),
	"years_audited_history" numeric(5, 2),
	"last_audit_opinion" text,
	"data_completeness_score" numeric(5, 4),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_quality_log" (
	"id" text PRIMARY KEY NOT NULL,
	"ticker" text,
	"check_date" date NOT NULL,
	"check_type" text NOT NULL,
	"passed" boolean NOT NULL,
	"detail" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "macro_series" (
	"id" text PRIMARY KEY NOT NULL,
	"series_code" text NOT NULL,
	"observation_date" date NOT NULL,
	"publication_date" date NOT NULL,
	"value" numeric(20, 6) NOT NULL,
	"unit" text,
	"source" text NOT NULL,
	"ingested_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "macro_series_code_obs_pub_uniq" UNIQUE("series_code","observation_date","publication_date")
);
--> statement-breakpoint
CREATE TABLE "raw_analyst_estimates" (
	"id" text PRIMARY KEY NOT NULL,
	"ticker" text NOT NULL,
	"publication_date" date NOT NULL,
	"forecast_period_end" date NOT NULL,
	"mean_eps_estimate" numeric(20, 6),
	"analyst_count" integer,
	"source" text DEFAULT 'eodhd' NOT NULL,
	"ingested_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raw_corporate_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"ticker" text NOT NULL,
	"action_date" date NOT NULL,
	"publication_date" date NOT NULL,
	"action_type" text NOT NULL,
	"ratio" numeric(20, 10),
	"description" text,
	"source" text DEFAULT 'eodhd' NOT NULL,
	"ingested_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raw_dividends" (
	"id" text PRIMARY KEY NOT NULL,
	"ticker" text NOT NULL,
	"ex_dividend_date" date NOT NULL,
	"publication_date" date NOT NULL,
	"dividend_zar" numeric(20, 6) NOT NULL,
	"dividend_type" text DEFAULT 'ordinary',
	"source" text DEFAULT 'eodhd' NOT NULL,
	"ingested_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "raw_dividends_ticker_exdate_uniq" UNIQUE("ticker","ex_dividend_date")
);
--> statement-breakpoint
CREATE TABLE "raw_estimate_revisions" (
	"id" text PRIMARY KEY NOT NULL,
	"ticker" text NOT NULL,
	"revision_date" date NOT NULL,
	"publication_date" date NOT NULL,
	"forecast_period_end" date NOT NULL,
	"previous_estimate" numeric(20, 6),
	"new_estimate" numeric(20, 6),
	"revision_direction" text,
	"source" text DEFAULT 'eodhd' NOT NULL,
	"ingested_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raw_fundamentals" (
	"id" text PRIMARY KEY NOT NULL,
	"ticker" text NOT NULL,
	"period_end" date NOT NULL,
	"publication_date" date NOT NULL,
	"period_type" text NOT NULL,
	"revenue" numeric(20, 2),
	"net_income" numeric(20, 2),
	"operating_cash_flow" numeric(20, 2),
	"total_assets" numeric(20, 2),
	"total_debt" numeric(20, 2),
	"current_assets" numeric(20, 2),
	"current_liabilities" numeric(20, 2),
	"shares_outstanding" numeric(20, 0),
	"gross_profit" numeric(20, 2),
	"eps_basic" numeric(20, 6),
	"book_value_per_share" numeric(20, 6),
	"audit_opinion" text,
	"source" text DEFAULT 'eodhd' NOT NULL,
	"ingested_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "raw_fundamentals_ticker_period_pub_uniq" UNIQUE("ticker","period_end","publication_date")
);
--> statement-breakpoint
CREATE TABLE "raw_market_data" (
	"id" text PRIMARY KEY NOT NULL,
	"ticker" text NOT NULL,
	"trade_date" date NOT NULL,
	"open_zar" numeric(20, 6),
	"high_zar" numeric(20, 6),
	"low_zar" numeric(20, 6),
	"close_zar" numeric(20, 6) NOT NULL,
	"adjusted_close_zar" numeric(20, 6) NOT NULL,
	"volume" numeric(20, 0),
	"traded_value_zar" numeric(20, 2),
	"source" text DEFAULT 'eodhd' NOT NULL,
	"ingested_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "raw_market_data_ticker_date_uniq" UNIQUE("ticker","trade_date")
);
--> statement-breakpoint
CREATE TABLE "trading_calendar" (
	"calendar_date" date PRIMARY KEY NOT NULL,
	"is_trading_day" boolean NOT NULL,
	"holiday_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calibration_curves" (
	"id" text PRIMARY KEY NOT NULL,
	"model_id" text NOT NULL,
	"bin_low" numeric(6, 4) NOT NULL,
	"bin_high" numeric(6, 4) NOT NULL,
	"mean_predicted" numeric(6, 4) NOT NULL,
	"fraction_positive" numeric(6, 4) NOT NULL,
	"sample_count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calibration_models" (
	"model_id" text PRIMARY KEY NOT NULL,
	"method" text NOT NULL,
	"trained_on" date NOT NULL,
	"training_window_months" integer NOT NULL,
	"bin_count" integer,
	"brier_score" numeric(10, 8),
	"is_active" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "composite_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"ticker" text NOT NULL,
	"score_date" date NOT NULL,
	"composite_score" numeric(10, 6) NOT NULL,
	"regime" text NOT NULL,
	"profile_version" text NOT NULL,
	"component_scores" jsonb,
	"universe_rank" integer,
	"universe_percentile" numeric(5, 4),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "composite_scores_ticker_date_uniq" UNIQUE("ticker","score_date")
);
--> statement-breakpoint
CREATE TABLE "factor_definitions" (
	"factor_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"mechanism" text NOT NULL,
	"decay_horizon" text NOT NULL,
	"formula_version" text NOT NULL,
	"required_data" text[],
	"academic_reference" text,
	"hypothesis_registry_id" text,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "factor_raw_values" (
	"id" text PRIMARY KEY NOT NULL,
	"ticker" text NOT NULL,
	"compute_date" date NOT NULL,
	"factor_id" text NOT NULL,
	"raw_value" numeric(20, 10),
	"computed_from_publication_date" date NOT NULL,
	"formula_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "factor_raw_values_ticker_date_factor_uniq" UNIQUE("ticker","compute_date","factor_id")
);
--> statement-breakpoint
CREATE TABLE "factor_signals" (
	"id" text PRIMARY KEY NOT NULL,
	"ticker" text NOT NULL,
	"signal_date" date NOT NULL,
	"factor_id" text NOT NULL,
	"raw_value" numeric(20, 10),
	"z_score" numeric(10, 6),
	"winsorized_z_score" numeric(10, 6),
	"sector_rank" integer,
	"sector_percentile" numeric(5, 4),
	"sector" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "factor_signals_ticker_date_factor_uniq" UNIQUE("ticker","signal_date","factor_id")
);
--> statement-breakpoint
CREATE TABLE "interaction_terms" (
	"id" text PRIMARY KEY NOT NULL,
	"ticker" text NOT NULL,
	"compute_date" date NOT NULL,
	"factor1_id" text NOT NULL,
	"factor2_id" text NOT NULL,
	"interaction_value" numeric(10, 6) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orthogonalized_signals" (
	"id" text PRIMARY KEY NOT NULL,
	"ticker" text NOT NULL,
	"signal_date" date NOT NULL,
	"factor_id" text NOT NULL,
	"orthogonalized_value" numeric(10, 6) NOT NULL,
	"variance_inflation_factor" numeric(10, 4),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orth_signals_ticker_date_factor_uniq" UNIQUE("ticker","signal_date","factor_id")
);
--> statement-breakpoint
CREATE TABLE "probability_outputs" (
	"id" text PRIMARY KEY NOT NULL,
	"ticker" text NOT NULL,
	"output_date" date NOT NULL,
	"calibrated_probability" numeric(6, 4) NOT NULL,
	"raw_score" numeric(10, 6) NOT NULL,
	"model_id" text NOT NULL,
	"confidence_interval_90_low" numeric(6, 4),
	"confidence_interval_90_high" numeric(6, 4),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prob_outputs_ticker_date_uniq" UNIQUE("ticker","output_date")
);
--> statement-breakpoint
CREATE TABLE "regime_classifications" (
	"id" text PRIMARY KEY NOT NULL,
	"classification_date" date NOT NULL,
	"regime" text NOT NULL,
	"confidence" numeric(5, 4),
	"jse40_return_1m" numeric(10, 6),
	"repo_rate" numeric(6, 4),
	"zar_usd" numeric(10, 6),
	"cpi_yoy" numeric(6, 4),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "regime_class_date_uniq" UNIQUE("classification_date")
);
--> statement-breakpoint
CREATE TABLE "regime_weight_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"profile_version" text NOT NULL,
	"regime" text NOT NULL,
	"factor_id" text NOT NULL,
	"weight" numeric(6, 4) NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"rationale" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sector_mapping" (
	"ticker" text NOT NULL,
	"sector" text NOT NULL,
	"sub_sector" text,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"source" text DEFAULT 'jse' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signal_clusters" (
	"id" text PRIMARY KEY NOT NULL,
	"compute_date" date NOT NULL,
	"cluster_label" text NOT NULL,
	"factor_ids" text[] NOT NULL,
	"method" text DEFAULT 'pca' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signal_correlation_matrix" (
	"id" text PRIMARY KEY NOT NULL,
	"compute_date" date NOT NULL,
	"factor1_id" text NOT NULL,
	"factor2_id" text NOT NULL,
	"correlation" numeric(10, 6) NOT NULL,
	"p_value" numeric(10, 8),
	"sample_size" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "broker_config" (
	"broker_id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"commission_pct" numeric(8, 6) NOT NULL,
	"commission_min_zar" numeric(10, 2),
	"has_monthly_flat_fee" boolean DEFAULT false NOT NULL,
	"monthly_flat_fee_zar" numeric(10, 2),
	"thrive_waiver_under_age" integer,
	"thrive_waiver_over_age" integer,
	"fractional_shares" boolean DEFAULT false NOT NULL,
	"min_trade_zar" numeric(10, 2) NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cost_model_parameters" (
	"id" text PRIMARY KEY NOT NULL,
	"parameter" text NOT NULL,
	"value" numeric(20, 8) NOT NULL,
	"unit" text NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"rationale" text,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "execution_assumptions" (
	"scenario_id" text PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"parameters_used" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "implementation_shortfall_log" (
	"id" text PRIMARY KEY NOT NULL,
	"ticker" text NOT NULL,
	"trade_date" date NOT NULL,
	"decision_price_zar" numeric(20, 6) NOT NULL,
	"modeled_execution_price_zar" numeric(20, 6) NOT NULL,
	"total_cost_bps" numeric(10, 4) NOT NULL,
	"market_impact_bps" numeric(10, 4),
	"spread_cost_bps" numeric(10, 4),
	"brokerage_bps" numeric(10, 4),
	"tax_drag_bps" numeric(10, 4),
	"trade_value_zar" numeric(20, 2),
	"scenario_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_constraints" (
	"constraint_id" text PRIMARY KEY NOT NULL,
	"constraint_type" text NOT NULL,
	"scope" text NOT NULL,
	"max_weight" numeric(6, 4),
	"min_weight" numeric(6, 4),
	"effective_from" date NOT NULL,
	"effective_to" date,
	"rationale" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_holdings" (
	"id" text PRIMARY KEY NOT NULL,
	"portfolio_id" text NOT NULL,
	"ticker" text NOT NULL,
	"holding_date" date NOT NULL,
	"weight" numeric(8, 6) NOT NULL,
	"position_size_zar" numeric(20, 2),
	"shares" numeric(20, 6),
	"entry_price_zar" numeric(20, 6),
	"broker_config_id" text,
	"capital_tier" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "portfolio_holdings_portfolio_ticker_date_uniq" UNIQUE("portfolio_id","ticker","holding_date")
);
--> statement-breakpoint
CREATE TABLE "position_sizing_rules" (
	"rule_id" text PRIMARY KEY NOT NULL,
	"capital_tier" text NOT NULL,
	"min_capital_zar" numeric(20, 2) NOT NULL,
	"max_capital_zar" numeric(20, 2),
	"sizing_method" text NOT NULL,
	"max_positions" integer NOT NULL,
	"min_positions" integer NOT NULL,
	"rebalance_frequency" text NOT NULL,
	"default_broker_config_id" text,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admission_decisions" (
	"id" text PRIMARY KEY NOT NULL,
	"candidate_id" text NOT NULL,
	"decision" text NOT NULL,
	"decision_date" date NOT NULL,
	"rationale" text NOT NULL,
	"decision_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admission_gate_results" (
	"id" text PRIMARY KEY NOT NULL,
	"candidate_id" text NOT NULL,
	"gate_name" text NOT NULL,
	"passed" boolean NOT NULL,
	"evidence_ref" text,
	"detail" text,
	"evaluated_date" date NOT NULL,
	"evaluated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alert_log" (
	"id" text PRIMARY KEY NOT NULL,
	"alert_type" text NOT NULL,
	"severity" text NOT NULL,
	"message" text NOT NULL,
	"metric_name" text,
	"metric_value" numeric(20, 8),
	"threshold" numeric(20, 8),
	"acknowledged_at" timestamp with time zone,
	"acknowledged_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "backtest_results" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"window_start" date NOT NULL,
	"window_end" date NOT NULL,
	"annualised_return_pct" numeric(8, 4),
	"benchmark_return_pct" numeric(8, 4),
	"sharpe_ratio" numeric(8, 4),
	"sortino_ratio" numeric(8, 4),
	"information_coefficient" numeric(8, 6),
	"icir" numeric(8, 6),
	"max_drawdown_pct" numeric(8, 4),
	"total_turnover_pct" numeric(8, 4),
	"net_of_costs_return_pct" numeric(8, 4),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "backtest_runs" (
	"run_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"train_start" date NOT NULL,
	"train_end" date NOT NULL,
	"test_start" date NOT NULL,
	"test_end" date NOT NULL,
	"rolling_window_months" integer NOT NULL,
	"factor_ids" text[] NOT NULL,
	"cost_model_scenario_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"triggered_by" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decay_alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"factor_id" text NOT NULL,
	"alert_date" date NOT NULL,
	"decay_type" text NOT NULL,
	"ic_trailing_90d" numeric(8, 6),
	"ic_trailing_252d" numeric(8, 6),
	"icir_trailing_252d" numeric(8, 6),
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decay_investigation_log" (
	"id" text PRIMARY KEY NOT NULL,
	"alert_id" text NOT NULL,
	"investigated_by" text,
	"finding" text NOT NULL,
	"verdict" text NOT NULL,
	"action" text,
	"investigated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "factor_candidates" (
	"candidate_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"hypothesis_summary" text NOT NULL,
	"causality" text NOT NULL,
	"proposed_by" text,
	"proposed_date" date NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hypothesis_registry" (
	"hypothesis_id" text PRIMARY KEY NOT NULL,
	"factor_name" text NOT NULL,
	"mechanism" text NOT NULL,
	"academic_support" text,
	"expected_horizon" text NOT NULL,
	"required_data" text[],
	"failure_criteria" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"registered_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_versions" (
	"version_id" text PRIMARY KEY NOT NULL,
	"hypothesis_id" text NOT NULL,
	"version_tag" text NOT NULL,
	"formula_hash" text,
	"parameters" jsonb,
	"trained_on" date,
	"lifecycle_status" text DEFAULT 'candidate' NOT NULL,
	"promoted_at" timestamp with time zone,
	"retired_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monitoring_metrics_daily" (
	"id" text PRIMARY KEY NOT NULL,
	"metric_date" date NOT NULL,
	"metric_name" text NOT NULL,
	"value" numeric(20, 8) NOT NULL,
	"trailing_30d" numeric(20, 8),
	"trailing_90d" numeric(20, 8),
	"trailing_252d" numeric(20, 8),
	"alert_triggered" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "monitoring_metrics_date_name_uniq" UNIQUE("metric_date","metric_name")
);
--> statement-breakpoint
CREATE TABLE "registry_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"action" text NOT NULL,
	"previous_state" jsonb,
	"new_state" jsonb,
	"performed_by" text,
	"performed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "validation_periods" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"period_type" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"locked_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_usage" ADD CONSTRAINT "api_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factor_scores" ADD CONSTRAINT "factor_scores_factor_type_id_factor_types_id_fk" FOREIGN KEY ("factor_type_id") REFERENCES "public"."factor_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_positions" ADD CONSTRAINT "portfolio_positions_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exclusions_log" ADD CONSTRAINT "exclusions_log_ticker_tickers_ticker_fk" FOREIGN KEY ("ticker") REFERENCES "public"."tickers"("ticker") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exclusions_log" ADD CONSTRAINT "exclusions_log_rule_id_screening_rules_rule_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."screening_rules"("rule_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "universe_snapshot" ADD CONSTRAINT "universe_snapshot_ticker_tickers_ticker_fk" FOREIGN KEY ("ticker") REFERENCES "public"."tickers"("ticker") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_quality_log" ADD CONSTRAINT "data_quality_log_ticker_tickers_ticker_fk" FOREIGN KEY ("ticker") REFERENCES "public"."tickers"("ticker") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_analyst_estimates" ADD CONSTRAINT "raw_analyst_estimates_ticker_tickers_ticker_fk" FOREIGN KEY ("ticker") REFERENCES "public"."tickers"("ticker") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_corporate_actions" ADD CONSTRAINT "raw_corporate_actions_ticker_tickers_ticker_fk" FOREIGN KEY ("ticker") REFERENCES "public"."tickers"("ticker") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_dividends" ADD CONSTRAINT "raw_dividends_ticker_tickers_ticker_fk" FOREIGN KEY ("ticker") REFERENCES "public"."tickers"("ticker") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_estimate_revisions" ADD CONSTRAINT "raw_estimate_revisions_ticker_tickers_ticker_fk" FOREIGN KEY ("ticker") REFERENCES "public"."tickers"("ticker") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_fundamentals" ADD CONSTRAINT "raw_fundamentals_ticker_tickers_ticker_fk" FOREIGN KEY ("ticker") REFERENCES "public"."tickers"("ticker") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_market_data" ADD CONSTRAINT "raw_market_data_ticker_tickers_ticker_fk" FOREIGN KEY ("ticker") REFERENCES "public"."tickers"("ticker") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calibration_curves" ADD CONSTRAINT "calibration_curves_model_id_calibration_models_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."calibration_models"("model_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "composite_scores" ADD CONSTRAINT "composite_scores_ticker_tickers_ticker_fk" FOREIGN KEY ("ticker") REFERENCES "public"."tickers"("ticker") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factor_raw_values" ADD CONSTRAINT "factor_raw_values_ticker_tickers_ticker_fk" FOREIGN KEY ("ticker") REFERENCES "public"."tickers"("ticker") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factor_raw_values" ADD CONSTRAINT "factor_raw_values_factor_id_factor_definitions_factor_id_fk" FOREIGN KEY ("factor_id") REFERENCES "public"."factor_definitions"("factor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factor_signals" ADD CONSTRAINT "factor_signals_ticker_tickers_ticker_fk" FOREIGN KEY ("ticker") REFERENCES "public"."tickers"("ticker") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factor_signals" ADD CONSTRAINT "factor_signals_factor_id_factor_definitions_factor_id_fk" FOREIGN KEY ("factor_id") REFERENCES "public"."factor_definitions"("factor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interaction_terms" ADD CONSTRAINT "interaction_terms_ticker_tickers_ticker_fk" FOREIGN KEY ("ticker") REFERENCES "public"."tickers"("ticker") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orthogonalized_signals" ADD CONSTRAINT "orthogonalized_signals_ticker_tickers_ticker_fk" FOREIGN KEY ("ticker") REFERENCES "public"."tickers"("ticker") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orthogonalized_signals" ADD CONSTRAINT "orthogonalized_signals_factor_id_factor_definitions_factor_id_fk" FOREIGN KEY ("factor_id") REFERENCES "public"."factor_definitions"("factor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "probability_outputs" ADD CONSTRAINT "probability_outputs_ticker_tickers_ticker_fk" FOREIGN KEY ("ticker") REFERENCES "public"."tickers"("ticker") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "probability_outputs" ADD CONSTRAINT "probability_outputs_model_id_calibration_models_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."calibration_models"("model_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regime_weight_profiles" ADD CONSTRAINT "regime_weight_profiles_factor_id_factor_definitions_factor_id_fk" FOREIGN KEY ("factor_id") REFERENCES "public"."factor_definitions"("factor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sector_mapping" ADD CONSTRAINT "sector_mapping_ticker_tickers_ticker_fk" FOREIGN KEY ("ticker") REFERENCES "public"."tickers"("ticker") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signal_correlation_matrix" ADD CONSTRAINT "signal_correlation_matrix_factor1_id_factor_definitions_factor_id_fk" FOREIGN KEY ("factor1_id") REFERENCES "public"."factor_definitions"("factor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signal_correlation_matrix" ADD CONSTRAINT "signal_correlation_matrix_factor2_id_factor_definitions_factor_id_fk" FOREIGN KEY ("factor2_id") REFERENCES "public"."factor_definitions"("factor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "implementation_shortfall_log" ADD CONSTRAINT "implementation_shortfall_log_ticker_tickers_ticker_fk" FOREIGN KEY ("ticker") REFERENCES "public"."tickers"("ticker") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_holdings" ADD CONSTRAINT "portfolio_holdings_ticker_tickers_ticker_fk" FOREIGN KEY ("ticker") REFERENCES "public"."tickers"("ticker") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_decisions" ADD CONSTRAINT "admission_decisions_candidate_id_factor_candidates_candidate_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."factor_candidates"("candidate_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_gate_results" ADD CONSTRAINT "admission_gate_results_candidate_id_factor_candidates_candidate_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."factor_candidates"("candidate_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backtest_results" ADD CONSTRAINT "backtest_results_run_id_backtest_runs_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."backtest_runs"("run_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decay_alerts" ADD CONSTRAINT "decay_alerts_factor_id_factor_definitions_factor_id_fk" FOREIGN KEY ("factor_id") REFERENCES "public"."factor_definitions"("factor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decay_investigation_log" ADD CONSTRAINT "decay_investigation_log_alert_id_decay_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."decay_alerts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_versions" ADD CONSTRAINT "model_versions_hypothesis_id_hypothesis_registry_hypothesis_id_fk" FOREIGN KEY ("hypothesis_id") REFERENCES "public"."hypothesis_registry"("hypothesis_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validation_periods" ADD CONSTRAINT "validation_periods_run_id_backtest_runs_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."backtest_runs"("run_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_api_user_timestamp" ON "api_usage" USING btree ("user_id","timestamp");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_equities_symbol" ON "equities" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "idx_equities_sector" ON "equities" USING btree ("sector");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_factor_symbol_type_date" ON "factor_scores" USING btree ("symbol","factor_type_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_position_portfolio_symbol" ON "portfolio_positions" USING btree ("portfolio_id","symbol");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_price_symbol_date" ON "price_data" USING btree ("symbol","date");--> statement-breakpoint
CREATE INDEX "idx_price_date" ON "price_data" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_rec_symbol_date" ON "recommendations" USING btree ("symbol","date");--> statement-breakpoint
CREATE INDEX "idx_rec_rank_date" ON "recommendations" USING btree ("rank","date");--> statement-breakpoint
CREATE INDEX "exclusions_log_ticker_idx" ON "exclusions_log" USING btree ("ticker");--> statement-breakpoint
CREATE INDEX "universe_snapshot_date_idx" ON "universe_snapshot" USING btree ("snapshot_date");--> statement-breakpoint
CREATE INDEX "universe_snapshot_ticker_date_idx" ON "universe_snapshot" USING btree ("ticker","snapshot_date");--> statement-breakpoint
CREATE INDEX "data_quality_log_ticker_date_idx" ON "data_quality_log" USING btree ("ticker","check_date");--> statement-breakpoint
CREATE INDEX "macro_series_code_date_idx" ON "macro_series" USING btree ("series_code","observation_date");--> statement-breakpoint
CREATE INDEX "raw_analyst_estimates_ticker_pub_idx" ON "raw_analyst_estimates" USING btree ("ticker","publication_date");--> statement-breakpoint
CREATE INDEX "raw_corporate_actions_ticker_idx" ON "raw_corporate_actions" USING btree ("ticker");--> statement-breakpoint
CREATE INDEX "raw_dividends_ticker_idx" ON "raw_dividends" USING btree ("ticker");--> statement-breakpoint
CREATE INDEX "raw_estimate_revisions_ticker_idx" ON "raw_estimate_revisions" USING btree ("ticker","revision_date");--> statement-breakpoint
CREATE INDEX "raw_fundamentals_pub_date_idx" ON "raw_fundamentals" USING btree ("publication_date");--> statement-breakpoint
CREATE INDEX "raw_market_data_ticker_idx" ON "raw_market_data" USING btree ("ticker");--> statement-breakpoint
CREATE INDEX "raw_market_data_date_idx" ON "raw_market_data" USING btree ("trade_date");--> statement-breakpoint
CREATE INDEX "composite_scores_date_rank_idx" ON "composite_scores" USING btree ("score_date","universe_rank");--> statement-breakpoint
CREATE INDEX "factor_raw_values_date_factor_idx" ON "factor_raw_values" USING btree ("compute_date","factor_id");--> statement-breakpoint
CREATE INDEX "factor_signals_date_factor_idx" ON "factor_signals" USING btree ("signal_date","factor_id");--> statement-breakpoint
CREATE INDEX "prob_outputs_date_prob_idx" ON "probability_outputs" USING btree ("output_date","calibrated_probability");--> statement-breakpoint
CREATE INDEX "signal_corr_date_idx" ON "signal_correlation_matrix" USING btree ("compute_date");--> statement-breakpoint
CREATE INDEX "impl_shortfall_log_ticker_date_idx" ON "implementation_shortfall_log" USING btree ("ticker","trade_date");--> statement-breakpoint
CREATE INDEX "portfolio_holdings_portfolio_date_idx" ON "portfolio_holdings" USING btree ("portfolio_id","holding_date");--> statement-breakpoint
CREATE INDEX "alert_log_created_at_idx" ON "alert_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "backtest_results_run_id_idx" ON "backtest_results" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "decay_alerts_factor_date_idx" ON "decay_alerts" USING btree ("factor_id","alert_date");--> statement-breakpoint
CREATE INDEX "monitoring_metrics_date_idx" ON "monitoring_metrics_daily" USING btree ("metric_date");--> statement-breakpoint
CREATE INDEX "registry_audit_log_entity_idx" ON "registry_audit_log" USING btree ("entity_type","entity_id");