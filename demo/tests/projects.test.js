const test = require('node:test');
const assert = require('node:assert');
const { PROJECTS } = require('../projects.js');

test('3 to 5 operating plants with real 2025 output', () => {
  assert.ok(PROJECTS.length >= 3 && PROJECTS.length <= 5);
  for (const p of PROJECTS) {
    assert.strictEqual(p.status, 'operating');
    assert.ok(p.mw > 0 && p.netGenMWh2025 > 0 && p.commissioned >= 2000);
    assert.ok(p.inframationUrl.startsWith('https://inframation.io/assets/'));
  }
});
test('output default is 2025 generation divided by capacity', () => {
  for (const p of PROJECTS) {
    const cf = p.netGenMWh2025 / (p.mw * 8760);
    assert.ok(Math.abs(p.defaults.capacityFactor.value - cf) < 1e-9, p.id);
  }
});
test('remaining life is 30 years minus age, at least 1', () => {
  for (const p of PROJECTS) {
    assert.strictEqual(p.defaults.lifeYears.value, Math.max(1, 30 - (2026 - p.commissioned)), p.id);
  }
});
test('every default has a number, a source and a date', () => {
  const keys = ['capexPerKw', 'fixedOmPerKwYr', 'capacityFactor', 'lifeYears', 'oddsBuilt', 'price'];
  for (const p of PROJECTS) {
    for (const k of keys) {
      const d = p.defaults[k];
      assert.ok(Number.isFinite(d.value), `${p.id}.${k}`);
      assert.ok(d.source === 'assumption' || d.source.startsWith('https://'), `${p.id}.${k}`);
      assert.match(d.sourceDate, /^\d{4}-\d{2}-\d{2}$/);
    }
    assert.strictEqual(p.defaults.capexPerKw.value, 0);
    assert.strictEqual(p.defaults.oddsBuilt.value, 1);
  }
});
