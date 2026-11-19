# Valuation calculator demo for Inframation: design

Date: 2026-11-14. Status: waiting for approval.

## Intent

Win a paid build from Andrew Gibson (runs Inframation), with a role as the possible next step. The pitch is a "Value this project" calculator for Inframation project pages. The proof is a working demo on real Virginia projects that Andrew can use himself, plus a one-page memo.

Why a calculator: it needs almost no upkeep (the site stores no forecasts), it serves investors and bankers who must value projects, it covers every record, and the number belongs to the user, so Andrew carries no broker conflict.

## Goals

1. Andrew opens one link or file, changes an assumption, and sees a value range move.
2. Every pre-filled number shows its source.
3. He can export the result to Excel.
4. The memo states scope, timeline, and price for the paid build in one page.

## Non-goals

- No integration with his real site. No access, and his stack is unknown.
- No price forecast. The user types their own price view.
- No gas or battery projects in the demo. Their revenue works differently (fuel cost, price spreads). They are named as phase 2 in the memo, which is also the case for ongoing work.
- No tax, debt, or tax-credit modelling. Stated on the page.

## Anti-goals

- A number that reads as Inframation's opinion or as investment advice.
- Invented data shown as real.
- Inframation's branding or look. The page is labelled as a demo by Alexandre Ly.
- Anything committed, pushed, published, or sent before Alex has seen it and said yes.

## Approaches considered

| | Single web page | Python app (Streamlit) | Notebook + Excel |
|---|---|---|---|
| He can type his own numbers | Yes | Yes | No |
| Hosting | None | Needed, free tier sleeps | None |
| Reuse of Dominion code | Low | High | Highest |
| Looks like the feature | Yes | Partly | No |

**Picked: single web page.** Alex chose it. Reason: the sale depends on Andrew using it on the call, and a page with no server proves the low-upkeep claim.

## What gets built

### 1. Data file (`demo/projects.json`)

Three to five real planned or under-construction projects in Virginia (PJM DOM zone), solar and wind only, taken from Inframation's public pages. One should be Coastal Virginia Offshore Wind (2,640 MW), since it is on his map and well known.

Per project: name, type, MW, stage, in-service date, county, Inframation URL.

Pre-filled defaults, each with a source URL and date:

| Default | Source |
|---|---|
| Build cost per kW, running cost, capacity factor, plant life, by technology | NREL Annual Technology Baseline, latest edition |
| Odds the project gets built, by technology | Berkeley Lab "Queued Up", latest edition |
| Local price, 12-month average | PJM DOM zone day-ahead prices |

The file is made by hand or by one small Python script. With five records, hand entry is acceptable.

### 2. The page (`demo/index.html`)

One self-contained file. Plain HTML, CSS, and JavaScript. One outside library: SheetJS from cdnjs, for the Excel export.

```
┌─ Value this project ─────────────────────────────┐
│ Project: [ Coastal Virginia Offshore Wind  ▾ ]   │
│                                                  │
│ From public records        Your assumptions      │
│ Capacity   2,640 MW        Price      [ $__ /MWh]│
│ Type       Offshore wind   Build cost [ $__ /kW ]│
│ Stage      Construction    Output     [ __ % ]   │
│ In service Jan 2027        Discount   [ __ % ]   │
│ (each with a source link)  Odds built [ __ % ]   │
│                            ▸ Ranges (low / high) │
│──────────────────────────────────────────────────│
│ Value if built    low $__   mid $__   high $__   │
│ Risk-weighted mid $__       Chance of loss __%   │
│ [small histogram]                                │
│ [ Export to Excel ]                              │
│ Your assumptions, your number. Not advice.       │
└──────────────────────────────────────────────────┘
```

### 3. The maths

For each of 10,000 draws:

- Draw price, build cost, and capacity factor from a triangular distribution (low, mid, high). Low and high default to 20% either side of mid and can be edited under "Ranges".
- Yearly cash = MW × capacity factor × 8,760 × price, minus running cost.
- Value if built = sum of yearly cash over plant life, discounted, minus build cost.

Outputs: 10th, 50th, and 90th percentile of value if built, in dollars and dollars per kW. Risk-weighted mid = 50th percentile × odds built. Chance of loss = share of draws below zero.

The random generator is seeded so the same inputs give the same result.

Check: a test page or script confirms that with zero spread, the result equals a hand-calculated value.

### 4. Excel export

Three sheets: Inputs (pre-filled and user values), Cash flow (mid case, with live formulas so a banker can audit it), Sources (every default with URL and date). The percentile results go in as values.

### 5. Memo (`pitch/memo.md`)

One page, written last, using real numbers from the demo:

- The problem in his words: "much planned capacity will never be built", and bankers must still value it.
- What the feature is, with one screenshot.
- Why it suits Inframation: near zero upkeep, every record, no broker conflict, fills the PJM price gap.
- Paid build scope: the panel on solar and wind project pages, Excel export, PJM price feed.
- Phase 2: gas, batteries, capacity revenue, more regions.
- Timeline and fee: `[Alex to fill]`.

### 6. Dominion repo README fix (separate, small)

The README on GitHub lists `src/`, a `Makefile`, and `config.yaml`. None exist. All logic is in `dc_load_model.ipynb`. Fix the README to match before Andrew sees the link. Done in that repo, on a branch, shown to Alex before any push.

## Constraints

- Nothing leaves this machine without Alex's OK: no commit, push, publish, or message.
- All files live in the folder the app made for this session, under `demo/`, `pitch/`, and `docs/`.
- Every outside number carries a source. No source means it is labelled as an assumption.

## Calls made by the designer (check these)

1. Solar and wind only in the demo.
2. Pre-tax, no-debt valuation.
3. Ranges default to 20% either side, editable.
4. Odds built defaults to Berkeley Lab base rates, editable.
5. Own neutral styling, not Inframation's.
6. Mid-case cash flow exported with live formulas.
7. Demo credited to "Alexandre Ly", the name on the GitHub repo.

## Left to the builder

- Which three to five Virginia projects, beyond CVOW.
- Exact NREL and Berkeley Lab editions and figures.
- Histogram drawing method (no chart library).

## Open risks

- **PJM DOM prices.** PJM's data service may need a free account and API key. Alex would have to create that account himself. Fallback: a manual CSV download, or PJM Western Hub prices with the substitution stated on the page.
- **Inframation data terms.** The site says its data is free via the API. Terms for reuse in a demo are not checked. The demo uses a handful of records and links each one back to its Inframation page.
- **Fee and timeline.** Only Alex can set them. The memo carries placeholders until he does.
