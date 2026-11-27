// Frozen before the family rewrite. Do not edit the fixture lines to make this pass.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let classifyCrisis;

test.before(async () => {
  ({ classifyCrisis } = await import('../js/safety-core.mjs'));
});

function load(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8'));
}

test('fresh holdout bars: 0 neither, tier1 recall, benign tier1 cap', () => {
  const risk = load('ask-fresh-risk-person.json').concat(load('ask-fresh-risk-means.json'));
  const benign = load('ask-fresh-benign.json');
  let tier1 = 0;
  let neither = 0;
  let benignTier1 = 0;
  for (const row of risk) {
    const got = classifyCrisis(row.text);
    if (got === 'tier1') tier1 += 1;
    if (got === 'none') neither += 1;
  }
  for (const row of benign) {
    if (classifyCrisis(row.text) === 'tier1') benignTier1 += 1;
  }
  console.log('fresh risk tier1 ' + tier1 + '/' + risk.length + ' neither ' + neither);
  console.log('fresh benign tier1 ' + benignTier1 + '/' + benign.length);
  assert.equal(neither, 0);
  assert.ok(tier1 / risk.length >= 0.95, 'recall ' + tier1 + '/' + risk.length);
  assert.ok(benignTier1 / benign.length <= 0.05, 'benign ' + benignTier1 + '/' + benign.length);
});
