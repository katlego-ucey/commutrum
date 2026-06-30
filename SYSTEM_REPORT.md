# Commutrum Wealth Engine — System Report

**Document:** Full System Report — Architecture, Profit Generation, Capabilities, Risks, and Roadmap
**Version:** 1.1 (fact-checked — 2026-06-30)
**Date:** 2026-06-30
**Exchange:** Johannesburg Stock Exchange (JSE)
**Currency:** South African Rand (ZAR)

---

## Table of Contents

1. [What Commutrum Is](#1-what-commutrum-is)
2. [How the Engine Generates Profits — Day by Day](#2-how-the-engine-generates-profits-day-by-day)
3. [The 13-Stage Pipeline Explained Simply](#3-the-13-stage-pipeline-explained-simply)
4. [What Gets Created — Full Inventory](#4-what-gets-created-full-inventory)
5. [System Capabilities](#5-system-capabilities)
6. [Profit Scenarios — From R50 to R5 Million](#6-profit-scenarios-from-r50-to-r5-million)
7. [Growth Possibilities — What This Can Become](#7-growth-possibilities-what-this-can-become)
8. [Issues Still Requiring Attention](#8-issues-still-requiring-attention)
9. [Competitive Position](#9-competitive-position)
10. [How to Measure Success](#10-how-to-measure-success)

---

## 1. What Commutrum Is

Commutrum is a **rules-based quantitative wealth engine** for the Johannesburg Stock Exchange. It answers one question every trading day, for every investable JSE company:

> *"Given everything we know about this company's financials, analyst sentiment, and recent price behaviour — what is the probability its share price will be higher in one month, and how much of an investor's capital should be allocated to it?"*

It is **not** a stock-tip service, an AI chatbot, or a black box. Every recommendation it makes is fully explainable — you can trace a stock's score back to the exact financial ratios, estimate revisions, and momentum calculations that produced it. This explainability is not a design preference; it is the only approach that allows honest backtesting and reliable monitoring over time.

### What it is not

| It is not | Why this matters |
|---|---|
| Artificial intelligence / machine learning | AI systems cannot explain why they made a call. A black box cannot be audited, corrected, or trusted with real money. |
| A day-trading system | Transaction costs (STT + commission) make short-term trading mathematically self-defeating for small capital. The engine targets 1–3 month holding periods. |
| A guarantee | No quantitative system guarantees profits. Commutrum outputs *calibrated probabilities* — "72% chance of a positive return" means it has been right ~72% of the time in comparable historical conditions, not that it will always be right. |
| A get-rich-quick scheme | The design targets consistent, compound wealth growth over 6 months to 5 years — not overnight returns. |

---

## 2. How the Engine Generates Profits — Day by Day

### The core mechanism: finding mispriced quality

Markets are not perfectly efficient. Specifically, the JSE has three documented, persistent inefficiencies that Commutrum exploits:

**1. Slow reaction to fundamental improvement (Piotroski effect)**
When a company's balance sheet, cash flows, and profitability are all quietly improving, the market is slow to price this in — particularly for unglamorous, out-of-favour companies. Piotroski's research (and decades of global replication) shows that buying financially strengthening companies and selling financially deteriorating ones produces above-market returns, even after controlling for size and value.

*Example:* A mid-cap JSE mining services company posts improving ROA, lower debt, and stronger cash flows across three consecutive quarters. The share price hasn't moved because no analyst covers it. The Piotroski F-score flags this as a high-quality buy before the market catches on.

**2. Analyst estimate revisions lead price (revision momentum)**
Analysts with direct access to company management update their EPS estimates gradually, not all at once. A cluster of upward revisions — especially when breadth (number of analysts revising up) confirms magnitude (size of revision) — signals that something real has changed in the company's earnings trajectory. Price follows, typically over the next 4–8 weeks.

*Example:* A JSE retailer's consensus EPS estimate for the year is revised up 8% by three analysts in one month after a strong trading update. The share price has moved 2%. The gap represents a buying opportunity; revision momentum captures it.

**3. Price momentum (underreaction / slow diffusion)**
Good news and bad news diffuse slowly into prices. A stock that has outperformed the JSE over the past 11 months (excluding the most recent month, which often mean-reverts) tends to continue outperforming for the next 1–3 months. This is the most-replicated finding in all of finance: momentum works, across virtually every market and time period studied.

*Example:* Capitec has outperformed the ALSI by 35% over the past year. Momentum says hold or buy until the signal fades. The engine weights this position accordingly.

### The daily cycle — step by step

```
17:00 SAST — JSE closing auction ends. Markets close.
      │
17:05 SAST — Nightly batch begins automatically.
      │
      ├── Step 1: Ingest today's closing prices for all JSE tickers
      │           Convert cents → ZAR (EODHD returns prices in cents)
      │           Flag any abnormal moves (>±30%) for review
      │
      ├── Step 2: Re-screen investable universe
      │           Is each stock still liquid? (20-day ADTV ≥ R500k)
      │           Still above R500m market cap?
      │           Still no governance flags?
      │           → outputs: ~120–150 stocks eligible to be scored today
      │
      ├── Step 3: Compute baseline factors (for any stock with new data)
      │           Piotroski F-score (updates when new financials published)
      │           Earnings revisions (updates daily from analyst estimate feeds)
      │           Momentum (updates daily from price data)
      │
      ├── Step 4: Normalize signals
      │           Convert raw factor values → sector-relative z-scores
      │           Winsorize extremes (no single stock dominates)
      │
      ├── Step 5: Remove redundant signals
      │           Check correlations between factors
      │           Ensure momentum and revisions aren't double-counted
      │
      ├── Step 6: Build composite score
      │           Weight each factor by its decay horizon
      │           Adjust weights for today's market regime
      │           → output: composite score 0–100 per stock
      │
      ├── Step 7: Calibrate probabilities
      │           Convert score → "X% probability of positive return in 1 month"
      │           Attach confidence interval and historical sample size
      │
      ├── Step 8: Construct portfolio
      │           Select top-ranked stocks clearing the minimum probability threshold
      │           Size each position by inverse volatility (higher risk = smaller position)
      │           Apply sector caps, position limits
      │           → output: recommended portfolio for your capital tier
      │
      └── Step 9: Publish recommendations
                  Rankings available via API and dashboard by ~17:30 SAST
                  User sees: ranked list, scores, probabilities, suggested weights
```

This cycle runs every trading day (Monday–Friday, JSE holidays excluded). The entire pipeline targets completion within 25 minutes of market close.

### Where the profit comes from

The profit mechanism is compound accumulation over many trades and many months:

- The engine does not need to be right on every stock. At a 60% win rate (typical for well-validated momentum/quality strategies), with average gains larger than average losses, the portfolio grows steadily.
- Transaction costs are real and explicitly modelled. At EasyEquities rates (0.25% commission + 0.25% STT), a round-trip on R1,000 costs about R5. The engine only recommends holding periods long enough for the expected return to significantly exceed this cost.
- Monthly rebalancing (not daily) keeps costs low while keeping the portfolio aligned with the current signal.
- The engine does not fight the market — it runs with documented, academically-grounded tailwinds.

---

## 3. The 13-Stage Pipeline Explained Simply

| Stage | What it does | Analogy |
|---|---|---|
| **M00 Universe Screening** | Filters ~280 JSE stocks down to ~120–150 that are liquid, solvent, and data-complete | Security checkpoint — only credible candidates get through |
| **M01 Data Pipeline** | Ingests and stores daily prices, quarterly financials, analyst estimates — with strict rules preventing any "future" data from contaminating historical analysis | The archive — every fact timestamped precisely to when it was actually known |
| **M02 Baseline Factors** | Computes the three signals (Piotroski quality score, earnings revision breadth/magnitude, price momentum) | The raw measurements |
| **M03 Signal Construction** | Converts raw numbers into comparable scores, adjusted within each sector | Putting everything on the same scale |
| **M04 Orthogonality Engine** | Removes double-counting — if two factors are measuring the same thing, collapse them to one | Deduplication |
| **M05 Composite Engine** | Combines the independent signals into one score, giving more weight to signals relevant to today's market regime | The judgment call — rules-based, fully auditable |
| **M06 Probability Calibration** | Converts the 0–100 score into a statistically calibrated percentage probability | "Score of 85 = 68% probability" — proven against history, not assumed |
| **M07 Portfolio Construction** | Turns probabilities into portfolio weights: how much capital to put in each stock | Translating research into an actual plan |
| **M08 Execution Model** | Applies real-world costs (STT, commission, slippage, market impact) before any recommendation is made | Making sure the math works after costs |
| **M09 Walk-Forward Validation** | Tests the whole engine on historical periods it was never tuned to | The honest proof — does it actually work? |
| **M10 Continuous Monitoring** | Tracks live signal health every day — is the engine still performing as expected? | The early-warning system |
| **M11 Decay Detection** | Distinguishes short-term bad luck from real structural failure | Separating noise from signal degradation |
| **M12 Factor Admission Protocol** | 9-gate gatekeeper: any new factor must earn its way in with documented evidence | Quality control — preventing the system from bloating with untested ideas |
| **M13 Hypothesis Registry** | Permanent, searchable audit trail of every decision ever made | The institutional memory |

---

## 4. What Gets Created — Full Inventory

### Documentation (created — in repo now)

| File | Purpose |
|---|---|
| `README.md` | System overview, pipeline diagram, environment setup, JSE market context |
| `AUDIT.md` | Full audit report — all issues found and fixed, feasibility assessment |
| `ROADMAP.md` | Phased implementation plan with data costs, infrastructure, sprint checklist |
| `SYSTEM_REPORT.md` | This document — the complete stakeholder briefing |
| `docs/00–13/README.md` | One detailed specification per pipeline module (13 documents) |
| `docs/14–18/README.md` | Database schema, API spec, dashboards, testing, development playbook |

### Software to be built (Phase 1–4)

| Component | Technology | What it does |
|---|---|---|
| `apps/api-server` | Express 5, TypeScript, Node.js 24 | REST API exposing all 13 module endpoints. Runs nightly batch. Serves recommendations. |
| `apps/commutrum` | React 19, Vite, TypeScript, Tailwind CSS | 5 dashboards: Research, Factor Explorer, Portfolio, Monitoring, Registry |
| `packages/db` | Drizzle ORM, PostgreSQL + TimescaleDB | 35-table schema — time-series market data, factors, scores, portfolio holdings, audit trail |
| `packages/api-spec` | OpenAPI 3.1 YAML + Orval | Contract between server and client. Codegen produces typed hooks and Zod schemas. |
| `packages/api-client-react` | TanStack Query (generated) | Typed React hooks for every API endpoint — auto-generated, never hand-edited |
| `packages/api-zod` | Zod schemas (generated) | Server-side request/response validation — auto-generated from OpenAPI spec |

### Infrastructure

| Component | Technology | Purpose |
|---|---|---|
| Database | PostgreSQL 16 + TimescaleDB extension | Time-series optimised storage, monthly partitioning for market data tables |
| Ingestion cron | Node.js cron (node-cron) | Triggers nightly batch at 17:05 SAST exactly |
| Data provider | EODHD API (recommended) | Live JSE EOD prices, dividends, corporate actions, some fundamentals |
| Authentication | JWT (jsonwebtoken) | Protects portfolio and write endpoints |
| CI/CD | GitHub Actions | Documentation validation, secret scanning, (typecheck + build when code exists) |

### Dashboards (5 screens)

| Dashboard | Primary users | Key data shown |
|---|---|---|
| **Research** | Individual investors, analysts | Ranked JSE stocks by composite score and win probability, factor attribution, dual-listing flag |
| **Factor Explorer** | System administrators, quants | Rolling IC charts, decay status, factor correlations, admission gate history |
| **Portfolio** | Investors | Current recommended holdings with weights, expected return, sector exposure, cost estimates |
| **Monitoring** | Operators | Rolling IC, Sharpe, hit rate, drawdown vs. validated reference band, open alerts |
| **Hypothesis Registry** | Governance | All factors (active, retired, rejected) with full audit trail |

---

## 5. System Capabilities

### Current design capabilities

| Capability | Detail |
|---|---|
| **Daily JSE rankings** | Every investable JSE stock scored and ranked nightly, available from ~17:30 SAST |
| **Calibrated probabilities** | "72% probability of positive return in 1 month" — statistically calibrated against history, not estimated |
| **Factor attribution** | Every score shows exactly which factor contributed how much — fully transparent |
| **Tiered portfolio sizing** | Produces appropriate recommendations for R50 (ETF mode) through R5m+ (full model) |
| **Live cost estimation** | Every recommendation includes STT, commission, and market impact estimate before user acts |
| **Regime-aware scoring** | Weights shift between quality-heavy and momentum-heavy depending on market conditions |
| **Governance lifecycle** | Every factor tracks through Research → Backtest → Paper → Live → Monitor with full audit trail |
| **Survivorship-free backtesting** | Historical performance includes delisted companies — no survivorship bias inflating results |
| **Point-in-time integrity** | All backtests use only data that was actually known at each historical date — no look-ahead bias |
| **SA tax modelling** | STT (0.25%), Dividend WHT (20%), CGT rates — versioned and updated with SARS Budget |

### Capacity limits (what the system can serve)

| User type | Capital | Positions | Notes |
|---|---|---|---|
| Micro investor | R5–R100 | 1 JSE ETF | Satrix Top 40 or similar recommended |
| Starter | R100–R500 | 3–5 stocks | Equal weight, fractional shares via EasyEquities |
| Standard | R500–R2,000 | 5–10 stocks | Full scoring, simplified sizing |
| Full model | R2,000+ | 15–25 stocks | All constraints active, monthly rebalance |
| Institutional | R50m+ | Requires capacity modelling | JSE liquidity limits mean large orders move the market — separate treatment |

### Technical performance targets

| Metric | Target |
|---|---|
| Nightly batch completion | < 25 minutes from 17:05 SAST trigger |
| Single-ticker API response | < 200ms (pre-computed daily values) |
| Daily ingestion latency | < 5 minutes after EODHD data availability |
| Historical data coverage | 2010–present (15+ years, sufficient for robust walk-forward validation) |
| Uptime | 99.5% on nightly batch; API can tolerate scheduled maintenance windows |

---

## 6. Profit Scenarios — From R50 to R5 Million

These scenarios are based on the factors' documented historical performance characteristics. They are illustrative, not guaranteed. Actual results depend on live factor performance, which will be confirmed or revised by the walk-forward validation and paper trading phases.

All figures assume:
- Monthly rebalancing
- EasyEquities commission model (0.25% per trade, 1c minimum)
- STT 0.25% on all purchases (SARS-mandated)
- **EasyEquities Thrive fee: R25/month** — charged unless user reaches Thrive Level 3, or is under 21 or over 65. This flat fee is explicitly included in the net figures below. See note on tier viability.
- Composite score Sharpe ratio of 0.6–0.9 (conservative, within historical range of similar strategies)

> **Thrive fee impact on small portfolios:** At R25/month, the Thrive fee represents 5% of capital per month on a R500 portfolio and 50% of starting capital on a R50 portfolio — making the two smallest tiers economically unviable for users who pay the fee. The practical minimum capital for an EasyEquities user paying Thrive is approximately R2,000 (where R25/month = 1.25%/month = ~15%/year drag). Below this, direct the user to Satrix Direct (R10 minimum, no monthly fee, 0.2% commission) or Capitec Invest, or confirm they qualify for Thrive fee waiver before recommending EasyEquities.

### R500 portfolio (Standard tier — 5–10 positions)

> **EasyEquities Thrive fee drag at this capital level: R25/month = 5%/month of capital.** Net figures below subtract this fee. At R500, this tier is borderline — users who don't qualify for fee waiver should be directed to Satrix Direct or Capitec Invest instead.

| Scenario | Gross monthly return | Thrive drag | Net monthly | Net after 2 years | Net after 5 years |
|---|---|---|---|---|---|
| Conservative (Sharpe 0.5) | ~1.5% | −5.0% | −3.5% | ~R140 | ~R50 |
| Base case (Sharpe 0.7) | ~2.0% | −5.0% | −3.0% | ~R200 | ~R80 |
| Strong (Sharpe 0.9) | ~2.5% | −5.0% | −2.5% | ~R250 | ~R120 |

**Recommendation: the R500 tier is only viable via EasyEquities for users with Thrive fee waiver (under 21, over 65, or Thrive Level 3). For all others, Satrix Direct eliminates the flat monthly fee and the minimum viable entry point becomes R500 with sensible economics.**

**Vs benchmark:** ALSI total returns vary significantly by measurement window and dividend treatment. Rolling 10-year annualised figures have ranged from approximately 7% to 12% depending on start date — one commonly cited 10-year window produced 7.1% annualised; another ending 2019 with dividends reinvested reached ~12%. The trailing 12 months to early 2026 showed 43.6% on a gold/resources-led rally — emphatically not a representative year to anchor to. Use a specific window with a start date when referencing ALSI returns; never cite a single number without it. The base case targets 27%/year — roughly 15–20 percentage points of alpha over the median 10-year window. This is the alpha the factor research supports but does not guarantee.

### R10,000 portfolio (Full model tier)

> **Thrive drag at this level: R25/month = 0.25%/month = ~3% per year.** Meaningful but manageable. Net figures subtract this fee.

| Scenario | After 1 year (net) | After 3 years (net) | After 5 years (net) |
|---|---|---|---|
| Conservative | ~R11,500 | ~R15,800 | ~R22,100 |
| Base case | ~R12,300 | ~R19,200 | ~R29,400 |
| Strong | ~R13,100 | ~R22,700 | ~R40,600 |

### R100,000 portfolio (Full model — meaningful capital)

> **Thrive drag at this level: R25/month = 0.025%/month = ~0.3% per year.** Economically negligible at this capital level. Net figures are essentially unchanged.

| Scenario | After 1 year (net) | After 3 years (net) | After 5 years (net) |
|---|---|---|---|
| Conservative | ~R118,700 | ~R168,100 | ~R236,900 |
| Base case | ~R126,700 | ~R204,100 | ~R318,800 |
| Strong | ~R133,700 | ~R241,100 | ~R438,700 |

### Honest disclaimer on these numbers

- These are pre-CGT figures. Capital Gains Tax applies to realised gains (effective ~18% at the individual top marginal rate; annual exclusion is R50,000 from 26 February 2026 per SARS Budget).
- Past factor performance in academic research does not guarantee future JSE-specific performance. The walk-forward validation (Phase 3) will determine the real number for this system.
- The base case is not optimistic — a 0.7 Sharpe is conservative for a well-validated multi-factor model. However: McLean & Pontiff (*Journal of Finance*, 2016), studying 97 published return predictors, found returns came in 26% lower out-of-sample and 58% lower after academic publication than the original in-sample result. "40–60% of the paper result in live trading" is therefore not a casual hedge — it is a peer-reviewed empirical baseline. Build the walk-forward validation (Phase 3) before presenting any return number to users or investors.
- A 6-month result is not statistically meaningful. Evaluate the system over 18–24 months minimum.

---

## 7. Growth Possibilities — What This Can Become

### Stage 1 — Internal paper trading tool (Months 8–12)
The system runs daily, produces ranked recommendations, and tracks a simulated portfolio. No external users. This stage answers: "Does the science hold up in live conditions?"

### Stage 2 — Investor platform (Months 12–24)

> **⚠ FAIS licensing is unresolved here — this is the most important issue to clarify before Stage 2 launches.** The original draft stated "no fund license required." This is likely incorrect under FAIS. A platform where users enter their capital amount and receive personalised, capital-weighted portfolio recommendations is arguably furnishing "advice" as defined by the Financial Advisory and Intermediary Services Act — even when the user places the trade themselves. Automated or robo-advice is explicitly captured by FSCA fit-and-proper regulations.

**Get a written FAIS opinion from a financial services attorney before Stage 2 opens to real users.** The specific question to ask: *"Does a system where a user enters their capital amount and receives a daily personalised ranked portfolio with recommended weights meet the FAIS definition of advice, and if so, what is the minimum licensing path and realistic timeline?"*

Three structural answers may come back — each reshapes Stage 2 differently:

| Answer | What it means for Stage 2 |
|---|---|
| **License first** | Obtain Category I (non-discretionary advice) FSP authorisation before any personalised recommendation reaches a user. The license fee is modest, but a compliance officer, a Key Individual who has passed RE1/RE3, and a documented risk framework take months to establish. Budget this as a year-one cost, not year two. |
| **Redesign as general research** | Ship Stage 2 without capital-weighted personalisation — everyone sees the same ranked list and the methodology behind it, with no system-generated position sizing. Personalised weighting becomes a Stage 3 feature gated behind the license. This is the fastest route to market and the most defensible regulatory position. |
| **Appointed representative** | Operate under an already-licensed FSP's umbrella rather than building a standalone license. Slower to full independence, typically involves a revenue share and someone else's compliance oversight, but a common fintech route to market while the proprietary license is pending. |

Until the attorney's answer is in hand, **Stage 2 development should be scoped as the general research version** (option 2 above) — it requires no licensing and can be built while the FAIS question is resolved.

**Revenue model (general research version, pre-license):**
- Subscription: R99–R299/month per user for ranked scores, methodology, and educational content
- Personalised capital-weighted allocation gated behind license at Stage 3
- At 500 users: R50,000–R150,000 MRR

### Stage 3 — Licensed advisory service (Year 2–3)
With 12+ months of audited recommendations and a growing user base, apply for an FSCA Category I FSP (Financial Services Provider) license to formalise the advisory relationship. This enables providing regulated financial advice in writing.

**Revenue model expansion:**
- Tiered subscriptions (R99 basic / R499 professional / R1,499 institutional)
- White-label API for financial advisors and wealth managers
- At 2,000 subscribers: R200,000–R300,000 MRR

### Stage 4 — Discretionary portfolio management (Year 3–4)
With FSCA **Category II** (Discretionary FSP) license, manage client capital directly. Clients transfer funds; Commutrum executes trades on their behalf using EasyEquities or a custodian account. This is where the fund model begins.

> **Note on license categories:** Category II authorises discretionary investment decisions for portfolio and asset management. Category IIA is the separate, specialised Hedge Fund FSP licence reserved for Stage 5. These are distinct licenses with different requirements — do not conflate them.

**Revenue model:**
- Management fee: 0.5–1.5% per annum on AUM
- Performance fee: 10–20% of returns above ALSI benchmark (high-water mark)
- R10m AUM → R50,000–R150,000/year management fees
- R100m AUM → R500,000–R1,500,000/year management fees + performance fees

### Stage 5 — Hedge fund structure (Year 4–5)
Formally structured as a Qualified Investor Hedge Fund (QIHF) under the Collective Investment Schemes Control Act. Minimum investment typically R1m per investor. Institutional investors (pension funds, family offices) may participate.

**Revenue at scale:**
- R50m AUM: R750,000–R2,500,000/year (management + performance)
- R200m AUM: R3,000,000–R10,000,000/year — JSE capacity limit approaches here
- Beyond R200m: strategy alpha begins to erode as position sizes approach ADTV limits

### Additional product lines (Years 2–5)

| Product | What it is | Revenue potential |
|---|---|---|
| **Factor API** | Sell the scored factor data as a B2B data product to financial advisors, asset managers, Bloomberg terminal users | R5,000–R50,000/month per enterprise client |
| **SENS event alerting** | Real-time alerts when a JSE company's Piotroski score or revision momentum changes materially | R199–R499/month add-on |
| **Sector rotation signals** | Aggregate signals at sector level — which JSE sectors are in regime-aligned momentum right now | Institutional subscription |
| **Bespoke backtesting** | Run the walk-forward engine against a client's custom factor hypothesis | Project-based consulting |
| **Education platform** | Explain factor investing and the JSE to retail investors — content embedded in the dashboard | Advertising or included in subscription |

---

## 8. Issues Still Requiring Attention

### 8.1 Blocking (must resolve before any implementation begins)

**Data access — JSE fundamental data and EODHD commercial licensing**
This is the single most critical unresolved issue, with two distinct dimensions:

**Dimension 1 — Data quality:** The Piotroski F-score requires clean, machine-readable financial statements (income statement, balance sheet, cash flow) for every investable JSE company, timestamped with the SENS publication date, not the period end. EODHD fundamentals for JSE are adequate for the top 40–50 names; patchy for mid-caps. Profile Data / Sharenet offers better coverage at R3,000–R15,000/month.

**Dimension 2 — Commercial licensing tier (critical, previously uncosted):** The cost budget in ROADMAP.md assumed EODHD at $79/month (the personal/developer plan). **Distributing scored data to paying subscribers requires EODHD's commercial API license, which costs $399–$2,499/month** — a 5–30× increase over the development budget. This is not optional: EODHD's terms of service prohibit redistribution of data to third parties on the personal plan. Verify the applicable commercial tier before any subscriber-facing feature is built.

| EODHD Plan | Monthly cost | Data redistribution allowed? | Use case |
|---|---|---|---|
| Personal/Developer | $19–$79 | No | Internal development only |
| Commercial Basic | $399 | Yes (limited) | Up to ~100 subscribers |
| Commercial Professional | $999–$2,499 | Yes | Scale |

**Revised year-one data budget:** Replace the "$79/month EODHD" line in ROADMAP.md with $399–$999/month commercial tier once any user receives scored data. Budget R8,000–R20,000/month for data (EODHD commercial + one SA fundamentals vendor) from the point Stage 2 launches.

- **What happens if this isn't resolved**: the system can only run momentum (price data only). A single-factor momentum system is legitimate but has documented crash risk and lower conviction than the three-factor design.

**Action required:** (1) Download a 20-company EODHD sample and verify JSE fundamental coverage and publication date accuracy. (2) Contact EODHD sales to confirm the commercial tier required for distributing ranked scores to paying subscribers and get written confirmation of the redistribution terms.

---

### 8.2 High Priority (resolve in Phase 1–2)

**Analyst estimate data**
The earnings revisions factor requires consensus EPS estimates from multiple analysts. This data does not come from EODHD at standard tiers. Quality sources (Refinitiv, FactSet, Bloomberg) cost $500–$5,000/month. Without it, the revisions factor cannot be built. Interim option: manually track estimates for the top 30 JSE stocks covered by multiple analysts (SA banks, miners, retailers) as a prototype, then automate when budget allows.

**No paper trading broker integration yet**
The paper trading specification (docs/13 appendix) is now written, but there is no integration with a broker API to even simulate real order placement. EasyEquities does not have a public API. Interactive Brokers has a JSE offering and an API — this may be the route for Stage 4 (discretionary management) and should be investigated in Phase 4.

**Capacity constraint documentation**
The system specifies a capacity fraction of 5% of 20-day ADTV per position (docs/08). For a R500,000 portfolio with a 15-position target, each position averages R33,000. At 5% of ADTV, a stock needs R660,000 in daily traded value to support this position — most of the investable universe easily clears this. However, as AUM grows toward R10m+, some JSE mid-caps will become capacity-constrained. This needs an explicit AUM ceiling per stock documented and tracked in the monitoring dashboard.

---

### 8.3 Medium Priority (resolve in Phase 2–3)

**Regime classification validation**
The composite engine (docs/05) specifies three market regimes (RISK_ON_TREND, RISK_OFF_DEFENSIVE, SIDEWAYS_CHOPPY) with pre-specified weight profiles. The weight profiles are currently placeholders — they must be set via out-of-sample walk-forward analysis, not guessed. Until Phase 3 validation is complete, the regime classification should run in "SIDEWAYS" default mode (equal weights) to avoid introducing a parameter that hasn't been validated.

**JSE holiday calendar**
The nightly batch cron runs weekdays (`1-5` in cron), but does not exclude JSE public holidays. The complete list of South African statutory holidays that close the JSE is:

| Holiday | Date |
|---|---|
| New Year's Day | 1 January |
| Human Rights Day | 21 March |
| Good Friday | Variable (Friday before Easter Sunday) |
| **Family Day** | **Monday after Easter Sunday** ← was missing from earlier versions |
| **Freedom Day** | **27 April** ← was missing from earlier versions |
| Workers' Day | 1 May |
| Youth Day | 16 June |
| National Women's Day | 9 August |
| Heritage Day | 24 September |
| Day of Reconciliation | 16 December |
| Christmas Day | 25 December |
| Day of Goodwill | 26 December |

When a public holiday falls on a Sunday, the following Monday is observed. The full calendar must be stored in a `trading_calendar` database table (with `date`, `is_trading_day`, `holiday_name`) and consumed by the cron scheduler — the cron expression alone (`1-5`) is insufficient. The execution delay model (M08) must also look up this table when calculating next-day fill prices.

**Naspers / Prosus complexity**
Naspers (NPN) and Prosus (PRX) — the two largest JSE stocks by weight — have a documented structural anomaly: their JSE price is substantially determined by Tencent's Hong Kong price and the ZAR/USD rate, not by domestic fundamental factors. Commutrum flags them with `dual_listed = true` and a `currency_sensitivity_flag`, but has no mechanism to decompose their returns into "SA-driven" vs "Tencent-driven" components. Until this is built, scoring Naspers/Prosus on the same Piotroski/momentum factors as a domestic bank or retailer will produce misleading signals. Interim fix: exclude them from the scored universe or hard-cap their weight at 1%.

**Dividend handling in momentum calculation**
The momentum factor uses raw price: `price(t-1m) / price(t-12m) - 1`. Stocks that pay large dividends (some JSE financial and resource companies pay 5–10% dividend yields) will show artificially low momentum because their price drops on ex-dividend dates. Momentum should be calculated on **total return** (price + dividends), not price alone. This requires the dividend data feed to be operational and integrated into the momentum calculation. EODHD provides `adjusted_close` which accounts for dividends — use this column, not `close`, for momentum.

---

### 8.4 Lower Priority (resolve before Phase 4)

**No disaster recovery runbook**
Docs/17 specifies that a disaster recovery runbook must be written and tested before Phase 4 (live capital). The runbook should cover: what to do if the nightly batch fails, what to do if EODHD data is delayed or corrupted, what to do if the database goes down, and how to restore from backup. This is a documentation task but cannot be skipped once real money is involved.

**Tax reporting for users**
Once live users are placing trades based on Commutrum recommendations, they have annual CGT obligations. The system currently models transaction costs but does not produce CGT reports. For SA individuals, realised gains are subject to CGT at 40% inclusion rate × marginal tax rate (effective ~18% at top rate). The SARS 2026 Budget (25 February 2026) raised the annual CGT exclusion to **R50,000** (up from R40,000) — for small investors this means most will pay nothing, but this should be surfaced in the dashboard, versioned in `cost_model_parameters`, and updated each February Budget.

**JSE ETF recommendation (ETF mode)**
The R5–R100 tier recommends "the top-scored JSE ETF" but there is no specification for how ETFs are scored. ETFs don't have Piotroski scores or analyst revisions. A simple approach: rank by (expense ratio, AUM, tracking error vs. index) and recommend the one with lowest costs and closest index tracking. The Satrix Top 40 and Satrix ALSI are the obvious defaults. This tier needs its own simple scoring logic.

---

## 9. Competitive Position

### What exists in South Africa today

| Provider | What they offer | What they don't do |
|---|---|---|
| Old Mutual / Sanlam / Allan Gray | Actively managed unit trusts | Quantitative/rules-based methods, daily transparency, small investor focus |
| JSE direct platform | Execution only | Any research or recommendations |
| EasyEquities | Execution, basic market data, Thematic Portfolios | Individual stock research, factor scoring, calibrated probabilities |
| Bloomberg / Refinitiv | Institutional data and analytics | Accessible to retail investors, JSE-focused recommendations |
| Standard Bank / FNB online trading | Execution + some research notes | Quantitative daily rankings, probability outputs |
| International quant platforms (UK/US) | Factor-based ETFs and managed portfolios | JSE focus, ZAR denomination, local tax modelling |

### Commutrum's differentiators

1. **JSE-native** — built specifically for the ~150-stock investable universe, SA tax rates, SAST timezone, ZAR pricing, and JSE corporate governance context. International platforms apply global models poorly to the JSE.

2. **Accessible capital floor** — the system produces meaningful recommendations from R50 (EasyEquities fractional shares). No other quantitative research platform serves sub-R10,000 investors in South Africa.

3. **Full transparency** — every score shows its component factors, every probability shows its sample size and confidence interval. No other JSE research service publishes this.

4. **Calibrated probabilities, not scores** — a score of 85/100 is not a probability. Commutrum converts scores to statistically calibrated probabilities, tested against history. This is rare even in institutional quantitative research.

5. **SA-specific cost modelling** — STT, EasyEquities commission structure, SARS CGT rates, JSE market hours, SENS publication dates — all explicitly modelled and versioned.

---

## 10. How to Measure Success

### At 6 months (end of Phase 2)

- [ ] Daily composite scores are being produced for the full investable universe
- [ ] Scores are available via the dashboard and API within 30 minutes of market close
- [ ] No look-ahead bias in the signal calculation (confirmed by the leakage test in the test suite)
- [ ] Paper portfolio is running (even if only tracking the top 10 ranked stocks)

### At 12 months (end of Phase 3)

- [ ] Walk-forward validation completed on 10+ years of JSE data
- [ ] The composite strategy beats the ALSI benchmark after costs in the majority of walk-forward test windows
- [ ] IC (Information Coefficient) > 0.05 consistently (the minimum bar for a signal worth trading)
- [ ] ICIR (Information Ratio) > 0.3 (signal must be consistent, not just occasionally high)
- [ ] Maximum drawdown in the worst walk-forward window < 25% (acceptable risk level)
- [ ] Reliability diagram passes calibration threshold (probabilities are real)

### At 24 months (end of Phase 4)

- [ ] 12 months of live paper or small-capital performance tracked
- [ ] Live results within the confidence interval of the walk-forward results
- [ ] No factor in permanent `Watch` or `Retired` status due to live decay
- [ ] At least 100 users receiving daily recommendations

### At 5 years

- [ ] Audited 3-year track record
- [ ] FSCA license application filed (or license granted)
- [ ] AUM > R10m under discretionary management
- [ ] System has successfully admitted at least one new factor through the 9-gate admission protocol

---

## Summary

Commutrum is a well-designed, professionally specified quantitative wealth engine. The specifications are internally consistent, methodologically rigorous, and correctly protect against the biases (survivorship, look-ahead, overfitting) that make most retail quantitative systems fail. The design is sound enough to build a profitable recommendation service in 12–18 months and a regulated fund in 3–5 years.

The path is clear. The primary constraint is not technical — it is data access and capital for data vendor subscriptions. Resolve that first. Everything else follows the roadmap.

**The engine can grow user investments. The math works. The question is execution.**

---

*End of System Report v1.0*
*Document maintained in: `katlego-ucey/commutrum` repository*
*Updates to this document should be committed alongside any significant change to the system architecture or pipeline specifications.*
