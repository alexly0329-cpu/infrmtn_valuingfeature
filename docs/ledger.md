# SDD ledger — plan: docs/2026-11-14-valuation-calculator-demo-plan.md

Setup: Ruling: no git, no worktree, no ledger scripts — Alex said no commits before he sees the work, and this folder is not a repository — cost if wrong: no commit history per task; this file is the only record.
Setup: Ruling: stop after tasks 5, 6 and 7 as the plan says, instead of running straight through — Alex asked to see the work first — cost if wrong: slower.
Pre-flight: Task 3 consumes `simulate`, `validateInputs`, `formatMoney` (Task 1) and `PROJECTS` (Task 2); Task 4 consumes `inputs`, result, `readInputs()`, `lastResult`. Names and shapes match across tasks. No conflicts.

Task 1: complete (no commits, tests: `node --test demo/tests/calc.test.js` → 7 pass, 0 fail). Watched fail first (module missing).
Task 1: Ruling: `formatMoney` also has a "$12K" tier between $1,000 and $1M — the plan's tests fix only B, M and under 1,000 — cost if wrong: cosmetic.

Task 2: complete (no commits, tests: `node --test demo/tests/` → 9 pass, 0 fail). Watched fail first (module missing).
Task 2: Ruling: price default is the PJM-wide 2025 real-time load-weighted average ($50.73/MWh, IMM release 2026-03-12), not DOM zone day-ahead — DOM zone data needs a PJM Data Miner download or API key, and no zonal figure was found in readable public text — cost if wrong: pre-filled price is not zone-specific; it is editable and the panel shows a note.
Task 2: Ruling: `sourceDate` is the date the source was checked (2026-11-14), not its publication date — publication dates were not all confirmable — cost if wrong: none for the maths.
Task 2: Ruling: odds built = 13% for the three solar projects (Berkeley Lab Queued Up 2026: capacity requested 2000-2020 operating by end 2025, all technologies) — the latest edition's by-technology rate was not readable — cost if wrong: default is not technology-specific; editable.
Task 2: Ruling: CVOW build cost is project-specific ($11.5B / 2,640 MW = $4,356/kW, Dominion filing 2026-01-30) and capacity factor 42% (Dominion's stated expectation), instead of ATB offshore values, which sit in charts that could not be read — cost if wrong: none; more specific than the plan asked.
Task 2: Ruling: CVOW running cost ($110/kW-yr), life (30 years) and odds built (90%) are labelled `assumption` — no readable source found — cost if wrong: Alex or Andrew may challenge them; the panel labels them.
Task 2: Ruling: solar capacity factor 25.1% is ATB class 7; choosing class 7 for Virginia is an assumption and the note says so — cost if wrong: class 6 would be 26.5%.
Task 2: Ruling: defaults carry an optional `note` field and projects a `company` field, not in the plan's shape — needed to show the caveats above — cost if wrong: none.
Task 2: Ruling: four projects, no onshore wind — Inframation lists no active onshore wind project in Virginia — cost if wrong: none.

Task 4 (sheets.js only): tests `node --test demo/tests/` → 12 pass, 0 fail. Watched fail first (module missing). Export button wired in index.html, NOT yet checked in a browser.
Task 3: `demo/index.html` written. Browser checks from the plan NOT yet run, apart from one load check. Not complete.
Task 3: Ruling: sheets.js was built before index.html so the page could be written once with the export button — cost if wrong: none.
Task 3: Ruling: facts column has one "Inframation project page" link instead of a link on every fact — cost if wrong: cosmetic.
OPEN for Alex: with default inputs every project shows a negative value (energy revenue only, no tax credits, no capacity or REC income). CVOW is roughly -$9B. Decide before the memo: add "other revenue" and "tax credit" inputs, or keep and explain.
STOPPED HERE: usage limit. Remaining: Task 3 browser checks, Task 4 export check, Task 5 (build.py, single file, screenshot, show Alex), Task 6 memo, Task 7 README.

CHANGE 2026-11-14 (Alex): focus on plants that already produce cash today, value positive, show how it is reached. Replaces planned and under-construction projects, build cost and odds built.
Change: Ruling: demo now values 4 OPERATING Virginia solar plants (Pleinmont Solar 2, Skipjack Solar Center, Fort Powhatan Solar, Colonial Trail West) — Alex's instruction; supersedes the design's "planned or under construction" scope — cost if wrong: the pitch story changes from "projects that may not get built" to "operating asset value".
Change: Ruling: output default = actual 2025 net generation / (MW x 8,760), from each plant's Inframation page (EIA data) — cost if wrong: one year can be unrepresentative (weather).
Change: Ruling: remaining life = 30 years (ATB) minus years since commissioning — cost if wrong: Pleinmont 25 years, Colonial Trail West 23; editable.
Change: Ruling: price still PJM-wide 2025 real-time average ($50.73), assumes the plant sells at market. Many plants sell under a contract price. This is the biggest driver of the value; the panel says so — cost if wrong: values could be well off for contracted plants.
Change: Ruling: build cost = 0 and odds = 1 for these plants, kept in the Excel sheet with labels "already built, not counted" and "already operating" so cell addresses did not move — cost if wrong: a little clutter in the workbook.
Change: added `valueBreakdown` (tested) and a 5-step "How the mid value is reached" table on the panel.
Verified in browser: default Pleinmont value $173.6M step 5 matches hand calc; p50 $172.4M; bad price and bad range give a message, no NaN; 0% discount works; 4 projects load; no new console errors. Export download NOT clicked yet. Phone width NOT checked.
Tests: `node --test demo/tests/` → 15 pass, 0 fail.
