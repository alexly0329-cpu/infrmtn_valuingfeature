# Valuation calculator demo implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A single web page where Andrew Gibson values real Virginia solar and wind projects with his own assumptions, plus a one-page memo pitching it as a paid build.

**Architecture:** Plain HTML, CSS and JavaScript, no framework and no server. Maths, sheet layout and data live in three small script files so Node can test them. A 10-line Python script inlines them into one HTML file for sending.

**Tech stack:** Browser JavaScript (classic scripts, no modules), `node --test` (Node v26, built in), Python 3.11 standard library for the inline step, SheetJS 0.18.5 from cdnjs for the Excel file.

**Spec:** `docs/2026-11-14-valuation-calculator-demo-design.md`

## Global constraints

- No commit, push, publish, or message without Alex's explicit OK. This plan has no commit steps. Each task ends by showing Alex the result.
- All files stay in the session folder under `demo/`, `pitch/`, `docs/`.
- Every pre-filled number has a source URL and a date. A number without a source is labelled "assumption" on the page.
- Solar and wind only. Pre-tax, no debt, no tax credits. Stated on the page.
- Own neutral styling. No Inframation logo, colours, or fonts. Footer text exactly: `Demo by Alexandre Ly. Not an Inframation product.`
- Disclaimer text exactly: `Your assumptions, your number. Not advice.`
- One outside script only: `https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js`
- Each `.js` file ends with `if (typeof module !== 'undefined') module.exports = {...}` so it loads in both the browser and Node.
- Data is a script file (`projects.js`), not `projects.json`: a page opened from disk cannot `fetch` a local JSON file. This replaces the file name in the spec.

## Review focus

Inputs the spec does not mention but a banker will hit, most likely first:

1. An empty or non-numeric field: the panel shows which field is wrong and shows no `NaN`. Test in Task 1 (`validateInputs`).
2. Discount rate of 0%: a value appears, no divide by zero. Test in Task 1 (`npvIfBuilt`).
3. Ranges where low > mid or mid > high: a message, no `NaN`. Test in Task 1 (`validateInputs`).
4. Odds built or output outside 0 to 100%: rejected with a message. Test in Task 1 (`validateInputs`).
5. SheetJS fails to load (no internet): the calculator still works and the export button is disabled with a note. Manual check in Task 4.

---

## File structure

| File | Responsibility |
|---|---|
| `demo/calc.js` | Maths, input checks, money formatting |
| `demo/sheets.js` | Lays out the three Excel sheets as plain arrays |
| `demo/projects.js` | The projects and their sourced defaults |
| `demo/index.html` | The panel: markup, styles, wiring |
| `demo/build.py` | Inlines the three scripts into one file |
| `demo/dist/valuation-demo.html` | The file Andrew receives |
| `demo/tests/*.test.js` | Node tests |
| `pitch/memo.md`, `pitch/panel.png` | The memo and its screenshot |

---

### Task 1: Maths (`demo/calc.js`)

**Files:**
- Create: `demo/calc.js`
- Test: `demo/tests/calc.test.js`

**Interfaces:**
- Produces:
  - `mulberry32(seed: number) -> () => number` in [0, 1)
  - `triangular(u: number, low: number, mid: number, high: number) -> number` (inverse CDF; returns `mid` when `low === high`)
  - `npvIfBuilt({mw, capacityFactor, price, capexPerKw, fixedOmPerKwYr, lifeYears, discountRate}) -> number` in dollars. `capacityFactor` and `discountRate` are fractions (0.25, 0.08).
  - `simulate(inputs, {draws = 10000, seed = 1} = {}) -> {p10, p50, p90, p50PerKw, riskWeightedP50, chanceOfLoss, values}`
  - `validateInputs(inputs) -> string[]` (empty array means valid)
  - `formatMoney(dollars: number) -> string`
  - `inputs` shape, used by every later task:
    ```js
    { mw, fixedOmPerKwYr, lifeYears, discountRate, oddsBuilt,
      price:          {low, mid, high},   // $/MWh
      capexPerKw:     {low, mid, high},   // $/kW
      capacityFactor: {low, mid, high} }  // fraction
    ```

- [ ] **Step 1: Write the failing tests**

```js
const test = require('node:test');
const assert = require('node:assert');
const c = require('../calc.js');

const base = { mw: 100, capacityFactor: 0.25, price: 40, capexPerKw: 600,
               fixedOmPerKwYr: 15, lifeYears: 25, discountRate: 0.08 };

test('npv matches hand calculation', () => {
  // 219,000 MWh x $40 - $1.5M = $7.26M a year; annuity 10.674776; minus $60M
  assert.ok(Math.abs(c.npvIfBuilt(base) - 17498875) < 500);
});
test('npv with zero discount rate', () => {
  assert.strictEqual(c.npvIfBuilt({ ...base, discountRate: 0 }), 7.26e6 * 25 - 60e6);
});
test('triangular endpoints and mode', () => {
  assert.strictEqual(c.triangular(0, 10, 20, 40), 10);
  assert.strictEqual(c.triangular(1, 10, 20, 40), 40);
  assert.ok(Math.abs(c.triangular(1 / 3, 10, 20, 40) - 20) < 1e-9);
  assert.strictEqual(c.triangular(0.7, 5, 5, 5), 5);
});
const inputs = { mw: 100, fixedOmPerKwYr: 15, lifeYears: 25, discountRate: 0.08, oddsBuilt: 0.2,
  price: { low: 40, mid: 40, high: 40 }, capexPerKw: { low: 600, mid: 600, high: 600 },
  capacityFactor: { low: 0.25, mid: 0.25, high: 0.25 } };
test('zero spread: every percentile equals the hand value', () => {
  const r = c.simulate(inputs);
  for (const k of ['p10', 'p50', 'p90']) assert.ok(Math.abs(r[k] - 17498875) < 500);
  assert.ok(Math.abs(r.riskWeightedP50 - 0.2 * r.p50) < 1e-6);
  assert.ok(Math.abs(r.p50PerKw - r.p50 / 100000) < 1e-6);
  assert.strictEqual(r.chanceOfLoss, 0);
  assert.strictEqual(r.values.length, 10000);
});
test('same seed, same result; spread orders the percentiles', () => {
  const wide = { ...inputs, price: { low: 32, mid: 40, high: 48 } };
  const a = c.simulate(wide), b = c.simulate(wide);
  assert.strictEqual(a.p50, b.p50);
  assert.ok(a.p10 < a.p50 && a.p50 < a.p90);
});
test('validateInputs', () => {
  assert.deepStrictEqual(c.validateInputs(inputs), []);
  assert.ok(c.validateInputs({ ...inputs, mw: NaN }).length === 1);
  assert.ok(c.validateInputs({ ...inputs, price: { low: 50, mid: 40, high: 48 } }).length === 1);
  assert.ok(c.validateInputs({ ...inputs, oddsBuilt: 1.2 }).length === 1);
  assert.ok(c.validateInputs({ ...inputs, capacityFactor: { low: 0.2, mid: 0.25, high: 1.1 } }).length === 1);
  assert.ok(c.validateInputs({ ...inputs, discountRate: -0.01 }).length === 1);
});
test('formatMoney', () => {
  assert.strictEqual(c.formatMoney(1.24e9), '$1.2B');
  assert.strictEqual(c.formatMoney(17498875), '$17.5M');
  assert.strictEqual(c.formatMoney(-3.2e6), '-$3.2M');
  assert.strictEqual(c.formatMoney(950), '$950');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test demo/tests/`
Expected: FAIL, `Cannot find module '../calc.js'`

- [ ] **Step 3: Implement `demo/calc.js`**

Rules the tests do not fix:
- `npvIfBuilt`: yearly cash = `mw × capacityFactor × 8760 × price − mw × 1000 × fixedOmPerKwYr`. Cash arrives at each year end. Build cost `mw × 1000 × capexPerKw` is paid at year 0.
- `simulate`: per draw, three calls to the generator, in the order price, capexPerKw, capacityFactor. Percentile = sorted `values[Math.floor(p × (draws − 1))]`. `chanceOfLoss` = share of draws below 0. `riskWeightedP50 = p50 × oddsBuilt`. `p50PerKw = p50 / (mw × 1000)`.
- `validateInputs`: one message per bad field, naming the field. Allowed: `mw > 0`, `lifeYears` 1 to 60, `discountRate` 0 to 0.5, `oddsBuilt` 0 to 1, `capacityFactor.*` 0 to 1, `capexPerKw.* ≥ 0`, `low ≤ mid ≤ high` for each range. Price may be negative (PJM prices go below zero).

- [ ] **Step 4: Run to verify pass**

Run: `node --test demo/tests/`
Expected: 7 tests pass.

---

### Task 2: Data (`demo/projects.js`)

**Files:**
- Create: `demo/projects.js`
- Test: `demo/tests/projects.test.js`

**Interfaces:**
- Produces: global `PROJECTS`, an array of:
  ```js
  { id, name, type,              // type: 'solar' | 'onshore_wind' | 'offshore_wind'
    mw, stage, inService, county, inframationUrl,
    defaults: {
      capexPerKw:     {value, source, sourceDate},
      fixedOmPerKwYr: {value, source, sourceDate},
      capacityFactor: {value, source, sourceDate},
      lifeYears:      {value, source, sourceDate},
      oddsBuilt:      {value, source, sourceDate},
      price:          {value, source, sourceDate} } }
  ```
  `source` is a URL, or the literal string `'assumption'`.

- [ ] **Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert');
const { PROJECTS } = require('../projects.js');

test('3 to 5 projects, solar and wind only, CVOW included', () => {
  assert.ok(PROJECTS.length >= 3 && PROJECTS.length <= 5);
  for (const p of PROJECTS) assert.ok(['solar', 'onshore_wind', 'offshore_wind'].includes(p.type));
  assert.ok(PROJECTS.some(p => p.mw === 2640 && p.type === 'offshore_wind'));
});
test('every default has a number, a source and a date', () => {
  const keys = ['capexPerKw', 'fixedOmPerKwYr', 'capacityFactor', 'lifeYears', 'oddsBuilt', 'price'];
  for (const p of PROJECTS) {
    assert.ok(p.inframationUrl.startsWith('https://inframation.io/proposals/'));
    for (const k of keys) {
      const d = p.defaults[k];
      assert.ok(Number.isFinite(d.value), `${p.id}.${k}`);
      assert.ok(d.source === 'assumption' || d.source.startsWith('https://'), `${p.id}.${k}`);
      assert.match(d.sourceDate, /^\d{4}-\d{2}-\d{2}$/);
    }
  }
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test demo/tests/`
Expected: FAIL, `Cannot find module '../projects.js'`

- [ ] **Step 3: Collect the project records**

Open `https://inframation.io/proposals` in Chrome, filter to Virginia. Take Coastal Virginia Offshore Wind (2,640 MW) plus two to four planned or under-construction solar or wind projects of different sizes. Copy name, type, MW, stage, in-service date, county and page URL exactly as shown.

- [ ] **Step 4: Collect the defaults**

| Default | Where | Rule |
|---|---|---|
| `capexPerKw`, `fixedOmPerKwYr`, `capacityFactor`, `lifeYears` | NREL ATB, latest edition, `https://atb.nrel.gov/electricity` | Moderate scenario, the class nearest Virginia. Record the edition page URL. |
| `oddsBuilt` | Berkeley Lab Queued Up, latest edition, `https://emp.lbl.gov/queues` | Completion rate by technology. If none for a technology, use the all-technology rate and say so in a comment. |
| `price` | PJM DOM zone day-ahead, 12-month average | See Step 5. |

- [ ] **Step 5: PJM DOM price**

Try PJM Data Miner 2 (`https://dataminer2.pjm.com`, feed "Day-Ahead Hourly LMPs", zone DOM) for a 12-month CSV without signing in. If it needs an account or key: **stop and ask Alex** to either create the account himself or download the CSV by hand. Do not create an account. If neither is possible, use PJM Western Hub, set `source` to that page, and add a visible note on the panel: `PJM Western Hub used in place of DOM zone.`

- [ ] **Step 6: Write `demo/projects.js` and run the tests**

Run: `node --test demo/tests/`
Expected: 9 tests pass.

---

### Task 3: The panel (`demo/index.html`)

**Files:**
- Create: `demo/index.html`

**Interfaces:**
- Consumes: `PROJECTS` (Task 2); `simulate`, `validateInputs`, `formatMoney` (Task 1).
- Produces: function `readInputs() -> inputs` (Task 1 shape) and global `lastResult`, both used by Task 4. Element ids: `project`, `price`, `capex`, `output`, `discount`, `odds`, `price-low`, `price-high`, `capex-low`, `capex-high`, `output-low`, `output-high`, `errors`, `p10`, `p50`, `p90`, `per-kw`, `risk-weighted`, `loss`, `hist`, `export`.

- [ ] **Step 1: Build the page**

Layout as sketched in the spec, section "The page". Loads `projects.js`, `calc.js`, then an inline script.

Behaviour:
- Picking a project fills the left column (read only, each fact a link to `inframationUrl`) and resets the right column to that project's defaults. Each default shows a small "source" link, or the word "assumption".
- Percent fields show whole percents (25, not 0.25). `readInputs()` converts to fractions.
- Low and high start at mid × 0.8 and mid × 1.2 and sit inside a closed `<details>` named "Ranges". Changing a mid value re-centres its low and high only if the user has not edited them.
- Default discount rate is 8, labelled "assumption".
- Any input change: run `validateInputs`. Errors go in `#errors` (with `role="alert"`) and the results show a dash. Otherwise run `simulate` and fill the results with `formatMoney`.
- `#hist`: an inline SVG with 30 bars from `result.values`. No chart library. Bars below zero in a second colour, with a text legend so colour is not the only signal.
- Every input has a `<label>`. Works at 375px width with no sideways scroll.
- A line under the results: `Pre-tax, no debt, no tax credits. Solar and wind only.`

- [ ] **Step 2: Check it in the browser**

Open `demo/index.html` in the built-in browser (local file preview).
Expected:
- CVOW selected: three values appear, low < mid < high.
- Type `abc` in Price: an error names Price, results show a dash, no `NaN` anywhere on the page.
- Set Discount to 0: values still appear.
- Set Price low above Price mid: an error names the price range.
- Set viewport to 375px: no sideways scroll.
- Console: no errors.

---

### Task 4: Excel export

**Files:**
- Create: `demo/sheets.js`
- Test: `demo/tests/sheets.test.js`
- Modify: `demo/index.html` (load SheetJS and `sheets.js`, wire `#export`)

**Interfaces:**
- Consumes: `inputs` and `simulate` result (Task 1), a `PROJECTS` entry (Task 2), `readInputs()` and `lastResult` (Task 3).
- Produces: `buildSheets(project, inputs, result) -> { Inputs, CashFlow, Sources }`, each an array of rows. A formula cell is `{ f: '...' }` with no leading `=`.

Fixed cell addresses, so the formulas can refer to them:

| Cell on `Inputs` | Value |
|---|---|
| B2 | MW |
| B3 | Capacity factor (mid, fraction) |
| B4 | Price (mid) |
| B5 | Build cost per kW (mid) |
| B6 | Running cost per kW-year |
| B7 | Plant life, years |
| B8 | Discount rate (fraction) |
| B9 | Odds built (fraction) |

Rows 11 onward on `Inputs`: project name, type, stage, in-service date, then low and high for each range, then the simulation results (10th, 50th, 90th percentile, chance of loss) as values with the label `From 10,000 simulated draws`.

`CashFlow`: row 1 headers `Year, Revenue, Running cost, Net cash, Discounted`. Rows 2 to `lifeYears + 1`, one per year, with year number in column A and:
- B: `Inputs!$B$2*Inputs!$B$3*8760*Inputs!$B$4`
- C: `Inputs!$B$2*1000*Inputs!$B$6`
- D: `B{r}-C{r}`
- E: `D{r}/(1+Inputs!$B$8)^A{r}`

Then, two rows below the last year: `Build cost` = `Inputs!$B$2*1000*Inputs!$B$5`; `Value if built (mid case)` = `SUM(E2:E{last})-` that cell; `Risk-weighted` = value cell `*Inputs!$B$9`.

`Sources`: header `Input, Value, Source, Date`, one row per default, then one row with the project's `inframationUrl`.

- [ ] **Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert');
const { buildSheets } = require('../sheets.js');
const { simulate } = require('../calc.js');
const { PROJECTS } = require('../projects.js');

const p = PROJECTS[0];
const inputs = { mw: 100, fixedOmPerKwYr: 15, lifeYears: 25, discountRate: 0.08, oddsBuilt: 0.2,
  price: { low: 32, mid: 40, high: 48 }, capexPerKw: { low: 480, mid: 600, high: 720 },
  capacityFactor: { low: 0.2, mid: 0.25, high: 0.3 } };
const s = buildSheets(p, inputs, simulate(inputs));

test('inputs sit at the fixed addresses', () => {
  assert.deepStrictEqual([1, 2, 3, 4, 5, 6, 7, 8].map(r => s.Inputs[r][1]),
    [100, 0.25, 40, 600, 15, 25, 0.08, 0.2]);
});
test('cash flow has one formula row per year', () => {
  assert.strictEqual(s.CashFlow[0][0], 'Year');
  assert.strictEqual(s.CashFlow[25][0], 25);
  assert.strictEqual(s.CashFlow[1][1].f, 'Inputs!$B$2*Inputs!$B$3*8760*Inputs!$B$4');
  assert.strictEqual(s.CashFlow[25][4].f, 'D26/(1+Inputs!$B$8)^A26');
  const flat = JSON.stringify(s.CashFlow);
  assert.ok(flat.includes('SUM(E2:E26)'));
});
test('sources list every default and the project page', () => {
  assert.strictEqual(s.Sources.length, 1 + 6 + 1);
  assert.ok(s.Sources.at(-1).includes(p.inframationUrl));
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test demo/tests/`
Expected: FAIL, `Cannot find module '../sheets.js'`

- [ ] **Step 3: Implement `buildSheets` in `demo/sheets.js`**

- [ ] **Step 4: Run to verify pass**

Run: `node --test demo/tests/`
Expected: 12 tests pass.

- [ ] **Step 5: Wire the button in `demo/index.html`**

Add the SheetJS `<script>` tag (exact URL in Global constraints) and `sheets.js`. On click: `buildSheets(...)`, turn each sheet into a worksheet with `XLSX.utils.aoa_to_sheet`, and save as `<project id>-valuation.xlsx` with `XLSX.writeFile`. If `window.XLSX` is undefined at load, disable `#export` and show next to it: `Excel export needs an internet connection.`

- [ ] **Step 6: Check it in the browser**

Expected:
- Click Export: a file downloads. Open it: three sheets, and the `Value if built (mid case)` cell on `CashFlow` shows a number, not an error.
- Change `Inputs!B4` in the spreadsheet: the cash flow values change.
- Rename the SheetJS URL to a wrong one and reload: the calculator still works, Export is disabled with the note. Restore the URL.

---

### Task 5: One file for sending, then show Alex

**Files:**
- Create: `demo/build.py`
- Output: `demo/dist/valuation-demo.html`

- [ ] **Step 1: Write `demo/build.py`**

Reads `demo/index.html`, replaces each `<script src="X.js"></script>` for `projects.js`, `calc.js`, `sheets.js` with `<script>` plus that file's text plus `</script>`, leaves the cdnjs tag untouched, writes `demo/dist/valuation-demo.html`. Exits with an error if any of the three tags is not found.

- [ ] **Step 2: Build and check**

Run: `python3 demo/build.py && grep -c 'src="' demo/dist/valuation-demo.html`
Expected: `1` (only the cdnjs tag).

Open `demo/dist/valuation-demo.html` in the built-in browser. Expected: same behaviour as Task 3 Step 2, console clean.

- [ ] **Step 3: Screenshot**

Save a screenshot of the panel with CVOW selected to `pitch/panel.png`.

- [ ] **Step 4: Show Alex and stop**

Send Alex `demo/dist/valuation-demo.html` and the screenshot. List what works and what was not checked. Wait for his reaction before Task 6.

---

### Task 6: The memo (`pitch/memo.md`)

**Files:**
- Create: `pitch/memo.md`

- [ ] **Step 1: Write the memo**

At most 350 words, addressed to Andrew, in Alex's voice. Sections in this order:
1. The gap, quoting his site: "much planned capacity will never be built". Bankers and investors still have to put a number on these projects.
2. The feature in two sentences, then `![Panel](panel.png)`.
3. Why it fits Inframation, four bullets: near zero upkeep (the site stores no forecasts), works on every project record, the number is the user's so there is no broker conflict, adds the PJM prices the site lacks.
4. Paid build scope: the panel on solar and wind project pages, Excel export, PJM price feed.
5. Phase 2: gas, batteries, capacity revenue, more regions.
6. `Timeline: [Alex to fill]` and `Fee: [Alex to fill]`.

Use one real result from the demo (CVOW, default inputs) and say the inputs are defaults from public sources. No claim about Andrew's traffic, revenue, or customers. No em dashes.

- [ ] **Step 2: Check**

Run: `wc -w pitch/memo.md`
Expected: 350 or fewer.

- [ ] **Step 3: Show Alex and stop**

Ask him for the fee and timeline. Nothing is sent to Andrew by the builder.

---

### Task 7: Dominion README fix (separate repo)

**Files:**
- Modify: `README.md` in `/Users/opdime/Projects/dominionenergy_forecast`

- [ ] **Step 1: Move there and branch**

Move the session to that folder. Before the first edit, ask Alex for a branch name through the branch prompt.

- [ ] **Step 2: Compare README to the real tree**

Run: `git ls-files`
The GitHub tree on 2026-11-14 had no `src/`, no `Makefile`, no `config.yaml`, no `prompts/`, no `report/deck.pptx`, no `report/assumptions_register.csv`. Check whether those exist locally but are untracked.

- [ ] **Step 3: Decide with Alex**

If the files exist locally: ask Alex whether to add them to the repo or drop them from the README. If they do not exist: edit the README file list and run instructions to describe only what is there (the notebook, `data/`, `model/`, `outputs/`, `report/report.docx`).

- [ ] **Step 4: Show the diff and stop**

Run: `git diff`
Show Alex. No commit and no push until he says so.
