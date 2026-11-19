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
test('valueBreakdown shows each step and ends at the same value', () => {
  const b = c.valueBreakdown({ ...inputs, capexPerKw: { low: 0, mid: 0, high: 0 } });
  assert.strictEqual(b.mwh, 219000);
  assert.strictEqual(b.revenue, 8760000);
  assert.strictEqual(b.runningCost, 1500000);
  assert.strictEqual(b.netCash, 7260000);
  assert.ok(Math.abs(b.annuity - 10.674776) < 1e-5);
  assert.ok(Math.abs(b.value - b.netCash * b.annuity) < 1e-6);
  assert.ok(Math.abs(b.value - (c.npvIfBuilt({ ...base, capexPerKw: 0 }))) < 1e-6);
});
test('formatMoney', () => {
  assert.strictEqual(c.formatMoney(1.24e9), '$1.2B');
  assert.strictEqual(c.formatMoney(17498875), '$17.5M');
  assert.strictEqual(c.formatMoney(-3.2e6), '-$3.2M');
  assert.strictEqual(c.formatMoney(950), '$950');
});
