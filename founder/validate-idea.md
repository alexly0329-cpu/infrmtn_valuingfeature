<!-- /founder:validate-idea · 2026-11-14 · input: inframation.io, the founder has contacted me and i want to pitch the idea of a feature building on top of his current product, adding a valuation component similarly to what i did with the dominion virginia forecast (github.com/alexly0329-cpu/dominionenergy_forecast). is this something already available? -->

# Validate idea: a valuation layer on Inframation

Assumption: "valuation component" means reusing the Dominion method (stage-tagged pipeline, probability weights, Monte Carlo, capital and earnings output) on Inframation's project records.
Assumption: the buyer of this pitch is Andrew Gibson, who runs Inframation. The end users are his visitors: developers, investors and lenders, landowners, plant owners.
Assumption: you want paid work or a partnership out of this, not a separate company. Not stated.

## Is it already available?

**On Inframation: no.** Checked 2026-11-14. The site is a free map and register of projects, plants, companies, assets and prices. Project pages show capacity, stage, dates and sources. No dollar value, no build probability. The prices page is labeled "For screening, not a forecast". PJM, MISO and ISO New England prices are link-outs only. ([inframation.io](https://inframation.io/), [prices](https://inframation.io/prices))

**In the market: yes, at enterprise tier.**

| Who | What they sell | Source |
|---|---|---|
| S&P Global Power Evaluator | Plant valuations, 52,000+ nodal forecasts, 30+ adjustable assumptions | [spglobal.com](https://www.spglobal.com/power-evaluator) |
| Enverus | Pre-calculated IRR, NPV and payback per plant, plus a six-stage powered-land valuation framework | [portfolio economics](https://www.enverus.com/products/power-plant-portfolio-economics/), [powered land](https://www.enverus.com/?p=331237) |
| Wood Mackenzie | Plant-level DCF valuation tool | [woodmac.com](https://www.woodmac.com/nslp/power-and-renewables/power-valuation-tool/) |
| Aurora Chronos | Battery asset valuation | [auroraer.com](https://auroraer.com/software/chronos) |
| LandGate | Data center value index score on every US parcel, free in property reports | [landgate.com](https://www.landgate.com/energy-markets/data-centers) |
| Cleanview, Interconnection.fyi | Trackers like Inframation, no valuation found | [cleanview.co](https://cleanview.co), [interconnection.fyi](https://interconnection.fyi/data-center) |

Pricing for all of the above: Not found. None publish it.

The gap: a free, source-cited tracker with a build-probability and value range on each record. Not found at Inframation's tier.

## 1. The 30-second assessment

Real problem, wrong shape as pitched. Your Dominion model values a utility: rate base, revenue requirement, earnings. Inframation's users care about one site or one plant. And the site is free: the money comes from brokerage (site origination, diligence, introductions) through Compass International ([services](https://inframation.io/services)). A valuation feature only matters to Andrew if it produces more "Book a call" clicks.

## 2. The five fatal questions

**Q1: Who is the customer, and would they pay today?**
One customer: Andrew Gibson. His users pay nothing ("Free to read", [about](https://inframation.io/about)). He pays you only if the feature feeds his deal flow. Willingness to pay: unknown, so treat it as a no until he says a number. Estimate: a contractor build of 4 to 6 weeks, or a revenue share on introductions it sources. Neither is confirmed.

**Q2: Why hasn't someone built this already?**
They have, for banks and large developers (table above). They did not build it for free trackers because valuation needs price forecasts, cost assumptions and legal cover. What changed: powered land is now priced on power access. Enverus reports modeled value rising more than 20-fold from raw land to energized capacity ([Enverus](https://www.enverus.com/?p=331237)). A broker quoted about $4M an acre unpowered versus at least $6M powered in Northern Virginia ([TechTarget](https://www.techtarget.com/it-infrastructure/news/366651918/AI-data-center-land-buying-hits-6B-as-power-premiums-rise)).

**Q3: What's the distribution advantage?**
Strong, and it is not yours. Inframation already has the records (7,844 planned projects, 14,635 operating plants per its homepage) and the audience. He contacted you, so you skip cold outreach. Risk: one channel. If he says no, you have a model and no users.

**Q4: Big business or a feature?**
A feature. Say so in the pitch. Ceiling as a standalone: low, because S&P, Enverus and Wood Mackenzie own paid valuation. $1M ARR would need Inframation to launch a paid tier (its "Deal room" beta lists "Powered sites: Premium") and about 170 seats at $500 a month. Estimate: 170 × $500 × 12 = $1.02M. No evidence yet that tier has buyers.

**Q5: Can you build it?**
The pipeline-probability and Monte Carlo stages port directly. Hardest parts:
- Calibration. Your Dominion probabilities are assumptions. On a public site they need a backtest against real outcomes.
- Site-level value needs nodal or zonal price views. Inframation has no PJM prices, and PJM is your home turf. That is an opening and a workload.
- Liability. A broker publishing dollar values next to assets he may broker is a conflict. Ranges, published assumptions and a plain "model, not appraisal" label are required.

Not a first-hire problem. It is a credibility problem: your repo has 2 commits and a synthetic-data mode.

## 3. Idea scorecard

| Dimension | Score | Notes |
|---|---|---|
| Problem severity | 4 | The site itself says "much planned capacity will never be built". Users cannot tell which. |
| Market size | 3 | Niche: developers, lenders, landowners, plant owners. |
| Willingness to pay | 2 | Users pay $0 today. Only the owner might pay. |
| Competition gap | 3 | Crowded at enterprise tier, open at free tier. |
| Distribution | 4 | Warm inbound from the owner of the data and audience. |
| Timing | 5 | Data center demand is repricing power and land now. |
| Founder fit | 3 | You built the method once, for one utility. No production record. |
| **Total** | **24/35** | Promising, with gaps. Fix willingness to pay first. |

## 4. Validation experiments

**1. Does valuation come up in his calls?**
- Test: callers ask about worth or build odds.
- How: on your first call with Andrew, ask "Of your last 10 inquiries, what did they ask after 'is there power'?" Do not mention valuation first.
- Success: 3 or more of 10 concern price, value, or whether a project will get built.
- Cost: 30 minutes, $0.

**2. Does your probability method predict anything?**
- Test: stage-based probabilities beat a flat base rate.
- How: take a public 2021 interconnection queue snapshot. Score each project with your `05_pipeline_probability.py` logic. Compare with what EIA-860M shows as operating or under construction today.
- Success: Brier score better than the flat base rate, and the top quintile completes at 2x the bottom quintile or more.
- Cost: 3 to 4 days, $0.

**3. Will he put it in front of a client?**
- Test: the output is useful in his sales process.
- How: pick 5 real Inframation records in the PJM DOM zone (underused plants or planned sites). Make a one-page sheet each: build probability, value range, assumptions with sources. Send them before the pitch.
- Success: he forwards one to a client, or asks for 5 more, or proposes terms.
- Cost: 1 week, $0.

## 5. The honest verdict

**Pivot it.** Do not pitch "a valuation module like my Dominion forecast". Pitch this: "A build-probability score and a powered-site value range on every record, with sourced assumptions, that sends qualified sellers and buyers to your Book a call button." Lead with probability, not dollars. It answers the caveat he already prints on his own site, it fits his "every fact names its register" rule through your assumptions register, and it carries less liability than a price.

This week: run experiment 3 for five DOM-zone records and bring the sheets to the call.

Open question for you: what do you want from Andrew? Contract fee, revenue share, or a role. Decide before the call.
