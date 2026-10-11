const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

test('public campaign export contains no company revenue data or target', () => {
  const campaign = JSON.parse(read('content/campaign.json'));
  assert.equal(Object.hasOwn(campaign.campaign, 'revenueGoalUsd'), false);
  assert.equal(Object.hasOwn(campaign.campaign, 'deadlineAt'), false);
  assert.equal(Object.hasOwn(campaign.results, 'revenue'), false);
  assert.doesNotMatch(JSON.stringify(campaign), /revenue|payment|refund|receipt|donation|profit/i);
});

test('public pages and scripts contain no revenue meter or amount', () => {
  for (const name of ['index.html', 'live/index.html', 'js/campaign-home.js', 'live/performance.js']) {
    assert.doesNotMatch(read(name), /revenueGoalUsd|results\.revenue|revenue-value|revenue-goal|revenue-progress|Verified campaign revenue|\$10(?:,000|K)/i, name);
  }
});

test('old public finance dashboard and JSON are absent', () => {
  assert.deepEqual(fs.readdirSync(path.join(root, 'content')).filter(name => /^ads-.*\.json$/i.test(name)), []);
  assert.deepEqual(fs.readdirSync(path.join(root, 'live')).filter(name => /^ads-/i.test(name)), []);
});
