// Lays out the Excel export as plain arrays. A formula cell is { f: '...' }.
// Inputs!B2:B9 are fixed addresses: the CashFlow formulas point at them.

const DEFAULT_LABELS = {
  capexPerKw: 'Build cost ($/kW)',
  fixedOmPerKwYr: 'Running cost ($/kW-year)',
  capacityFactor: 'Capacity factor (fraction)',
  lifeYears: 'Plant life (years)',
  oddsBuilt: 'Odds built (fraction)',
  price: 'Price ($/MWh)',
};

function buildSheets(project, inputs, result) {
  const Inputs = [
    ['Input', 'Value', 'Unit'],
    ['Capacity', inputs.mw, 'MW'],
    ['Capacity factor (mid)', inputs.capacityFactor.mid, 'fraction'],
    ['Price (mid)', inputs.price.mid, '$/MWh'],
    ['Build cost (already built, not counted)', inputs.capexPerKw.mid, '$/kW'],
    ['Running cost', inputs.fixedOmPerKwYr, '$/kW-year'],
    ['Plant life', inputs.lifeYears, 'years'],
    ['Discount rate', inputs.discountRate, 'fraction'],
    ['Odds built (already operating)', inputs.oddsBuilt, 'fraction'],
    [],
    ['Project', project.name],
    ['Type', project.type],
    ['Stage', project.stage],
    ['In service', project.inService],
    [],
    ['Range', 'Low', 'High'],
    ['Price ($/MWh)', inputs.price.low, inputs.price.high],
    ['Build cost ($/kW)', inputs.capexPerKw.low, inputs.capexPerKw.high],
    ['Capacity factor (fraction)', inputs.capacityFactor.low, inputs.capacityFactor.high],
    [],
    ['From 10,000 simulated draws'],
    ['Value if built, 10th percentile ($)', result.p10],
    ['Value if built, 50th percentile ($)', result.p50],
    ['Value if built, 90th percentile ($)', result.p90],
    ['Chance of loss (fraction)', result.chanceOfLoss],
    [],
    ['Your assumptions, your number. Not advice.'],
    ['Pre-tax, no debt, no tax credits.'],
  ];

  const CashFlow = [['Year', 'Revenue', 'Running cost', 'Net cash', 'Discounted']];
  for (let year = 1; year <= inputs.lifeYears; year++) {
    const r = year + 1;
    CashFlow.push([
      year,
      { f: 'Inputs!$B$2*Inputs!$B$3*8760*Inputs!$B$4' },
      { f: 'Inputs!$B$2*1000*Inputs!$B$6' },
      { f: `B${r}-C${r}` },
      { f: `D${r}/(1+Inputs!$B$8)^A${r}` },
    ]);
  }
  const last = inputs.lifeYears + 1;
  CashFlow.push(
    [],
    ['Build cost', { f: 'Inputs!$B$2*1000*Inputs!$B$5' }],
    ['Value if built (mid case)', { f: `SUM(E2:E${last})-B${last + 2}` }],
    ['Risk-weighted', { f: `B${last + 3}*Inputs!$B$9` }],
  );

  const Sources = [['Input', 'Value', 'Source', 'Date checked', 'Note']];
  for (const key of Object.keys(DEFAULT_LABELS)) {
    const d = project.defaults[key];
    Sources.push([DEFAULT_LABELS[key], d.value, d.source, d.sourceDate, d.note || '']);
  }
  Sources.push(['Project record', project.name, project.inframationUrl, '', '']);

  return { Inputs, CashFlow, Sources };
}

if (typeof module !== 'undefined') module.exports = { buildSheets };
