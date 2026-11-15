const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  isPublicPath, newestPublicCommit, readStamp, requiredImprovementDate, loadImprovements, formatContentDate, dateOnlyCommit,
  countsAsPublicChange, isLiveRefreshAuthor
} = require('./public-updated.cjs');

const root = path.join(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

test('public paths follow the Pages exclude list, plus owner data and proof.json', () => {
  const yml = read('_config.yml');
  assert.match(yml, /^exclude:/m);
  assert.equal(isPublicPath('index.html'), true);
  assert.equal(isPublicPath('content/improvements.json'), true);
  assert.equal(isPublicPath('docs/vision.md'), false);
  assert.equal(isPublicPath('scripts/notebook.cjs'), false);
  assert.equal(isPublicPath('scripts/notebook.test.cjs'), false);
  assert.equal(isPublicPath('.github/workflows/tests.yml'), false);
  assert.equal(isPublicPath('brand-kit.md'), false);
  assert.equal(isPublicPath('live/README.md'), false);
  assert.equal(isPublicPath('content/proof.json'), false);
  assert.equal(isPublicPath('live/owner.enc.json'), false);
  assert.equal(isPublicPath('hq/owner.enc.json'), false);
});

test('a proof-only commit does not set the homepage stamp', () => {
  assert.equal(dateOnlyCommit('c4efa25'), true);
  const found = newestPublicCommit();
  assert.ok(found);
  assert.notEqual(found.hash.slice(0, 7), 'c4efa25');
  const home = read('index.html');
  const stamp = readStamp(home);
  assert.equal(stamp.iso, found.date);
  assert.equal(stamp.text, formatContentDate(found.date));
  assert.match(home, /href="\/improvements\/"/);
});

test('a public-content change adds an improvements entry for that day', () => {
  const entries = loadImprovements();
  assert.ok(entries.length >= 5 && entries.length <= 10);
  const dates = entries.map((entry) => entry.date);
  const sorted = dates.slice().sort((a, b) => b.localeCompare(a));
  assert.deepEqual(dates, sorted);
  for (const entry of entries) {
    assert.match(entry.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(typeof entry.text, 'string');
    assert.ok(entry.text.length > 20);
  }
  const page = read('improvements/index.html');
  let at = 0;
  for (const entry of entries) {
    const found = page.indexOf(entry.text, at);
    assert.ok(found > at, entry.text);
    at = found;
  }
  const day = requiredImprovementDate();
  if (day) assert.ok(dates.includes(day), 'improvements entry for ' + day);
});

test('a stamp line plus a blank line does not count, and neither does whitespace', () => {
  const stamp = [
    '-id="notebook-updated" data-content-date="2026-11-12">Updated November 12, 2026</span>',
    '+id="notebook-updated" data-content-date="2026-11-15">Updated November 15, 2026</span>',
    '+',
    '+   '
  ].join('\n');
  assert.equal(countsAsPublicChange(stamp), false);
  assert.equal(countsAsPublicChange('-\n+\n+ \t'), false);
  assert.equal(countsAsPublicChange('+    <lastmod>2026-11-15</lastmod>'), false);
  assert.equal(countsAsPublicChange('+ <p>A real sentence for visitors.</p>'), true);
  assert.equal(countsAsPublicChange(stamp + '\n+ <p>A real sentence for visitors.</p>'), true);
});

test('a live-refresh bot commit does not set the homepage stamp', () => {
  assert.equal(isLiveRefreshAuthor({ name: 'dtrt-live-bot', email: 'live-bot@users.noreply.github.com' }), true);
  assert.equal(isLiveRefreshAuthor({ name: 'Someone', email: 'live-bot@users.noreply.github.com' }), true);
  assert.equal(isLiveRefreshAuthor({ name: 'DTRT', email: '155593871+RepresentPR@users.noreply.github.com' }), false);
});
