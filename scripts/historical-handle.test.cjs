const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

// campaign.json still records the handle that was live when that evidence was
// taken (@officiallydtrt). Go-live r7 replaced the handle in
// content/live-performance.json with @dtrt.xyng (Co-Founder should-fix).
// Current-facing /links/ uses @dtrt.xyng.
const root = path.join(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const json = (name) => JSON.parse(read(name));

test('campaign.json historical Instagram evidence keeps @officiallydtrt', () => {
  const c = json('content/campaign.json');
  const insights = c.results.platformPeriodInsights.observations.find(o => o.platform === 'Instagram' && o.windowStart === '2026-09-12' && o.windowEnd === '2026-10-11');
  assert.ok(insights, 'Sep 12 - Oct 11 Instagram Insights observation present');
  assert.equal(insights.handle, '@officiallydtrt');
  assert.match(c.results.views.coverage, /signed-in officiallydtrt Reels grid read on Nov 15, 2026/);
  assert.match(c.results.pendingFirstMeasurement.note, /signed-in officiallydtrt Reels grid on Nov 15, 2026/);
  assert.match(c.results.signedInInstagramGrid.source, /^signed-in officiallydtrt Reels grid/);
  assert.match(c.results.signedInInstagramGrid.note, /^Signed-in officiallydtrt Reels grid read on Nov 15, 2026/);
  assert.ok(c.evidenceNotes.some(n => n.startsWith('Signed-in officiallydtrt Reels grid read on Nov 15, 2026.')));
  assert.doesNotMatch(JSON.stringify(c), /dtrt\.xyng/, 'campaign.json has no current-facing handle field');
});

test('live-performance.json uses the current @dtrt.xyng handle', () => {
  const raw = read('content/live-performance.json');
  const lp = JSON.parse(raw);
  const ig = lp.posts.filter(p => /instagram\.com\//.test(p.url || ''));
  assert.ok(ig.length > 0);
  const withHandle = ig.filter(p => !/instagram\.com\/reel\//.test(p.url) || /instagram\.com\/[^/]+\/reel\//.test(p.url));
  assert.ok(withHandle.length > 0);
  for (const p of withHandle) {
    if (/instagram\.com\/[^/]+\/reel\//.test(p.url)) {
      assert.match(p.url, /^https:\/\/www\.instagram\.com\/dtrt\.xyng\/reel\//, p.url);
    }
  }
  assert.match(raw, /dtrt\.xyng/);
  assert.doesNotMatch(raw, /officiallydtrt/);
});

test('current-facing Instagram link on /links/ uses @dtrt.xyng', () => {
  const html = read('links/index.html');
  assert.match(html, /href="https:\/\/www\.instagram\.com\/dtrt\.xyng\/"/);
  assert.doesNotMatch(html, /officiallydtrt/);
});
