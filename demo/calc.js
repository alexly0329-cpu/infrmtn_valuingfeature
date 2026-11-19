// Valuation maths. Loads as a classic browser script and as a Node module.

// Seeded generator, so the same inputs always give the same result.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Inverse CDF of a triangular distribution.
function triangular(u, low, mid, high) {
  if (high === low) return mid;
  const f = (mid - low) / (high - low);
  return u < f
    ? low + Math.sqrt(u * (high - low) * (mid - low))
    : high - Math.sqrt((1 - u) * (high - low) * (high - mid));
}

// Pre-tax, no debt. Cash arrives at each year end, build cost is paid at year 0.
function npvIfBuilt({ mw, capacityFactor, price, capexPerKw, fixedOmPerKwYr, lifeYears, discountRate }) {
  const yearlyCash = mw * capacityFactor * 8760 * price - mw * 1000 * fixedOmPerKwYr;
  const annuity = discountRate === 0
    ? lifeYears
    : (1 - Math.pow(1 + discountRate, -lifeYears)) / discountRate;
  return yearlyCash * annuity - mw * 1000 * capexPerKw;
}

// Mid-case steps for a plant that is already built: output x price, minus running cost,
// times the discount factor for the remaining life. Same value as npvIfBuilt with no build cost.
function valueBreakdown(inputs) {
  const mw = inputs.mw;
  const mwh = mw * inputs.capacityFactor.mid * 8760;
  const revenue = mwh * inputs.price.mid;
  const runningCost = mw * 1000 * inputs.fixedOmPerKwYr;
  const netCash = revenue - runningCost;
  const r = inputs.discountRate;
  const annuity = r === 0 ? inputs.lifeYears : (1 - Math.pow(1 + r, -inputs.lifeYears)) / r;
  return { mwh, revenue, runningCost, netCash, annuity, value: netCash * annuity };
}

function simulate(inputs,{ draws = 10000, seed = 1 } = {}) {
  const rand = mulberry32(seed);
  const values = new Float64Array(draws);
  let losses = 0;
  for (let i = 0; i < draws; i++) {
    const price = triangular(rand(), inputs.price.low, inputs.price.mid, inputs.price.high);
    const capexPerKw = triangular(rand(), inputs.capexPerKw.low, inputs.capexPerKw.mid, inputs.capexPerKw.high);
    const capacityFactor = triangular(rand(), inputs.capacityFactor.low, inputs.capacityFactor.mid, inputs.capacityFactor.high);
    values[i] = npvIfBuilt({ ...inputs, price, capexPerKw, capacityFactor });
    if (values[i] < 0) losses++;
  }
  const sorted = Float64Array.from(values).sort();
  const pct = (p) => sorted[Math.floor(p * (draws - 1))];
  const p50 = pct(0.5);
  return {
    p10: pct(0.1), p50, p90: pct(0.9),
    p50PerKw: p50 / (inputs.mw * 1000),
    riskWeightedP50: p50 * inputs.oddsBuilt,
    chanceOfLoss: losses / draws,
    values,
  };
}

// One message per bad field. Empty array means the inputs are usable.
function validateInputs(inputs) {
  const errors = [];
  const num = Number.isFinite;
  const between = (v, lo, hi) => num(v) && v >= lo && v <= hi;
  const single = (label, v, lo, hi) => {
    if (!between(v, lo, hi)) errors.push(`${label}: enter a number from ${lo} to ${hi}.`);
  };
  const range = (label, r, lo, hi) => {
    const vals = [r.low, r.mid, r.high];
    if (!vals.every(num)) errors.push(`${label}: enter a number for low, mid and high.`);
    else if (!vals.every((v) => v >= lo && v <= hi)) errors.push(`${label}: stay between ${lo} and ${hi}.`);
    else if (!(r.low <= r.mid && r.mid <= r.high)) errors.push(`${label}: low must be at most mid, and mid at most high.`);
  };
  if (!(num(inputs.mw) && inputs.mw > 0)) errors.push('Capacity: must be above 0 MW.');
  single('Plant life (years)', inputs.lifeYears, 1, 60);
  single('Discount rate', inputs.discountRate, 0, 0.5);
  single('Odds built', inputs.oddsBuilt, 0, 1);
  single('Running cost', inputs.fixedOmPerKwYr, 0, Infinity);
  range('Price', inputs.price, -Infinity, Infinity); // PJM prices can go below zero
  range('Build cost', inputs.capexPerKw, 0, Infinity);
  range('Output', inputs.capacityFactor, 0, 1);
  return errors;
}

function formatMoney(dollars) {
  const sign = dollars < 0 ? '-' : '';
  const abs = Math.abs(dollars);
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

if (typeof module !== 'undefined') {
  module.exports = { mulberry32, triangular, npvIfBuilt, valueBreakdown, simulate, validateInputs, formatMoney };
}
