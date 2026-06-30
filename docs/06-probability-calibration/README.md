# Module 06 — Probability Calibration

> **Commutrum Wealth Engine** — One stage in the 13-module pipeline that scores and ranks JSE equities for investment. All modules feed into a single composite score and calibrated win probability. See the [root README](../../README.md) for the full pipeline.

**Pipeline position:** Consumes composite scores from `05-composite-research-engine`
and historical outcomes from `09-walk-forward-validation`. Outputs calibrated
probabilities to `07-portfolio-construction` and to the user-facing dashboards.
**Status:** Specification

## Purpose

A composite score of 88.7/100 is **not** a 72% probability of a positive
return. A raw score is an ordinal ranking; a probability is a calibrated
statistical estimate. This module is what makes the difference real instead
of aspirational. It is the most important module for keeping the system
honest: nowhere else in the pipeline is it more tempting to silently treat
"high score" as "high confidence" without the math behind it.

## Method

Train a calibration model that maps composite score (and relevant context,
e.g. regime) to historically observed outcome frequency.

### Platt scaling (logistic)

```
P(positive_return | score) = 1 / (1 + exp(-(a·score + b)))
```

`a` and `b` are fit by logistic regression on historical (score, realized
forward-return-sign) pairs from `09-walk-forward-validation`'s **out-of-sample**
results only — never on the same data used to design or weight the factors.

### Isotonic regression (non-parametric alternative)

Used when the score-to-outcome relationship is not well approximated by a
logistic curve — isotonic regression fits a monotonic step function instead,
at the cost of needing more historical data points per score bucket to avoid
overfitting the calibration curve itself.

### Output set

For each ticker/date, this module outputs:

```
{
  "composite_score": 88.7,
  "probability_positive_return_1m": 0.72,
  "expected_return_1m": 0.064,
  "confidence_interval_90": [0.041, 0.087],
  "historical_win_rate_similar_signals": 0.68,
  "calibration_sample_size": 412,
  "risk_level": "medium"
}
```

`calibration_sample_size` must always be surfaced — a probability backed by
12 historical observations in a similar score bucket is categorically less
trustworthy than one backed by 400, even if both say "72%."

## Reliability diagrams (mandatory validation, not optional)

Before any probability output ships to a user, build a reliability diagram:
bucket predicted probabilities into deciles, plot against realized frequency
of positive outcomes in each decile, on out-of-sample data. A well-calibrated
model has points lying close to the 45° line. **A model that is not
calibrated must not output probabilities at all** — fall back to score and
rank only until calibration passes this test.

## Confidence intervals via bootstrap

```
for b in 1..1000:
    resample historical (score, outcome) pairs with replacement
    refit calibration model
    record predicted probability at the score in question
CI_90 = [2.5th percentile, 97.5th percentile] of the 1000 predictions
```

## Database tables owned

- `calibration_models(model_id, method, trained_on_period, version, active)`
- `calibration_curves(model_id, score_bucket, predicted_prob, realized_freq, sample_size)`
- `probability_outputs(ticker, date, model_id, probability_positive_return, expected_return, ci_lower, ci_upper, sample_size, risk_level)`

## API endpoints

- `GET /probability/{ticker}?date=&horizon=1m`
- `GET /calibration/reliability-diagram?model_id=` — for the Monitoring dashboard

## Acceptance criteria / Definition of Done

- [ ] Calibration model is fit **only** on out-of-sample walk-forward results, never on in-sample backtest data
- [ ] Reliability diagram passes a documented goodness-of-calibration threshold before going live
- [ ] Every probability output carries a sample size and a confidence interval — no bare point estimate
- [ ] Calibration model is versioned and re-fit on a schedule, not frozen forever at launch

## Known failure modes & mitigations

| Failure mode | Mitigation |
|---|---|
| Treating a 0–100 score as if it were already a probability | Explicit Platt/isotonic calibration layer; score and probability are two different output fields, never conflated |
| Overconfident probability from a thin historical sample | Mandatory `sample_size` and confidence interval on every output |
| Calibration fit on the same data used to design the factors (circular validation) | Calibration training set is restricted to genuine out-of-sample walk-forward periods from `09` |
| Calibration model never re-checked once deployed | Reliability diagram recomputed on a schedule, surfaced in `10-continuous-monitoring` |

## References

- Platt, J. (1999), probabilistic outputs for support vector machines (the scaling method generalizes to any score-based classifier)
- Isotonic regression for calibration: Zadrozny & Elkan (2002)
