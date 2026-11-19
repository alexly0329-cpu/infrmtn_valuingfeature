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
