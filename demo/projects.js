// Operating Virginia solar plants, copied from Inframation's public asset pages on 2026-11-14.
// Output is each plant's 2025 net generation (EIA data shown by Inframation).
// Every default carries the page it came from and the date it was checked.
// source: 'assumption' means no public source was found; the panel says so.

const CHECKED = '2026-11-14';
const THIS_YEAR = 2026;
const ATB_PV = 'https://atb.nlr.gov/electricity/2025/utility-scale_pv';
const PJM_IMM = 'https://www.prnewswire.com/news-releases/market-monitor-finds-pjm-wholesale-electricity-markets-competitive-302712500.html';

// shortcut: PJM-wide 2025 real-time average sold at market, not the DOM zone price and not the
// plant's contract price. Upgrade with a PJM Data Miner DOM export and the plant's real PPA.
const price = {
  value: 50.73, source: PJM_IMM, sourceDate: CHECKED,
  note: 'PJM-wide 2025 average, used in place of the DOM zone. Assumes the plant sells at market; many plants have a contract price instead.',
};

function plant({ id, name, mw, commissioned, netGenMWh2025, county, company, slug }) {
  const url = 'https://inframation.io/assets/' + slug;
  return {
    id, name, type: 'solar', status: 'operating', mw, commissioned, netGenMWh2025, county, company,
    inframationUrl: url,
    defaults: {
      capexPerKw: { value: 0, source: url, sourceDate: CHECKED, note: 'Already built. Build cost is spent and is not counted.' },
      fixedOmPerKwYr: { value: 24.66, source: ATB_PV, sourceDate: CHECKED, note: '2025 ATB, 2024 price.' },
      capacityFactor: {
        value: netGenMWh2025 / (mw * 8760), source: url, sourceDate: CHECKED,
        note: `Actual 2025 output: ${netGenMWh2025.toLocaleString('en-US')} MWh from ${mw} MW.`,
      },
      lifeYears: {
        value: Math.max(1, 30 - (THIS_YEAR - commissioned)), source: ATB_PV, sourceDate: CHECKED,
        note: `30-year life from the ATB, minus the years since it began operating in ${commissioned}.`,
      },
      oddsBuilt: { value: 1, source: url, sourceDate: CHECKED, note: 'Already operating.' },
      price,
    },
  };
}

const PROJECTS = [
  plant({ id: 'pleinmont-2', name: 'Pleinmont Solar 2', mw: 240, commissioned: 2021, netGenMWh2025: 437148,
    county: 'Spotsylvania County, VA', company: 'AES Distributed Energy', slug: 'pleinmont-solar-2-us-va' }),
  plant({ id: 'skipjack', name: 'Skipjack Solar Center', mw: 175, commissioned: 2022, netGenMWh2025: 298427,
    county: 'Charles City County, VA', company: 'AES Distributed Energy', slug: 'skipjack-solar-center-us-va' }),
  plant({ id: 'fort-powhatan', name: 'Fort Powhatan Solar', mw: 150, commissioned: 2022, netGenMWh2025: 306961,
    county: 'Prince George County, VA', company: 'Dominion Renewable Energy', slug: 'fort-powhatan-solar-us-va' }),
  plant({ id: 'colonial-trail-west', name: 'Colonial Trail West', mw: 142.4, commissioned: 2019, netGenMWh2025: 283404,
    county: 'Surry County, VA', company: 'Dominion Energy Inc.', slug: 'colonial-trail-west-us-va' }),
];

if (typeof module !== 'undefined') module.exports = { PROJECTS };
