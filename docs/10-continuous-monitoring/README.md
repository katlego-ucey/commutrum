# Module 10 — Continuous Monitoring

**Pipeline position:** Runs continuously against production output from all
modules. Feeds `11-decay-detection` and the Monitoring Dashboard
(`16-frontend-dashboards`).
**Status:** Specification

## Purpose

A factor that worked in backtesting is not guaranteed to keep working in
production. This module is the live, ongoing version of the same scrutiny
`09-walk-forward-validation` applies historically — nothing in this system
is "done" once deployed; it is "currently passing its checks."

## Metrics tracked (rolling, daily)

| Metric | Window | Alert condition (example) |
|---|---|---|
| Rolling IC | 60-day rolling | Drops below pre-defined threshold (e.g. < 0.02 for 20 consecutive days) |
| ICIR | 90-day rolling | Declines significantly vs. the value recorded at promotion to production |
| Sharpe / Sortino | Trailing 12-month | Falls below the value observed in the locked holdout test from `09` |
| Hit rate | Trailing 60-day | Falls meaningfully below the historical win rate reported in `06-probability-calibration` |
| Turnover | Per rebalance | Spikes unexpectedly (signals score instability — see `08`'s note on this) |
| Calibration error | Reliability diagram refresh, monthly | Predicted-vs-realized probability gap exceeds threshold |
| Factor stability | Per factor, monthly | Factor weight or IC contribution drifts from its walk-forward-validated range |
| Capacity usage | Daily | Position sizes approaching the capacity limits set in `08-execution-model` |
| Drawdown & alpha decay | Daily | Live drawdown approaches or exceeds the worst drawdown observed in backtesting |

## Dashboards & alerts

- Automatic notifications when any metric above breaches its pre-defined
  threshold — thresholds are set during `09`'s validation, not invented
  after the fact once live numbers start looking concerning.
- Dashboard view (see `16-frontend-dashboards`) shows rolling charts for
  every metric above, with the backtested/expected range shown as a
  reference band so deviation is visually obvious, not just numeric.

## Database tables owned

- `monitoring_metrics_daily(date, metric, scope, value, threshold_min, threshold_max, breached)`
- `alert_log(alert_id, date, metric, severity, acknowledged_by, resolution)`

## API endpoints

- `GET /monitoring/metrics?metric=&from=&to=`
- `GET /monitoring/alerts?status=open`
- `POST /monitoring/alerts/{id}/acknowledge`

## Acceptance criteria / Definition of Done

- [ ] Every metric has a pre-defined threshold sourced from `09`'s validated ranges, not set arbitrarily after deployment
- [ ] Alerts are logged with enough context to investigate without re-deriving the metric from scratch
- [ ] Dashboard shows the validated/expected range alongside the live value for every chart

## Known failure modes & mitigations

| Failure mode | Mitigation |
|---|---|
| No early warning before a factor's live performance materially diverges from backtest | Rolling IC/ICIR/Sharpe tracked daily with pre-set thresholds |
| Thresholds invented after the fact to match whatever is currently happening | Thresholds locked in from `09`'s walk-forward results, changed only through the same governance process as any other model change |
| Monitoring treated as a dashboard nobody looks at | Automatic alerting, feeding directly into `11-decay-detection`'s investigation triggers |

## References

- Information Coefficient/Information Ratio monitoring practice in production quant systems (e.g., factor monitoring frameworks used by systematic asset managers)
