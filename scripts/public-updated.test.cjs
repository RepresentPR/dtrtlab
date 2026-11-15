const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  isPublicPath, newestPublicCommit, readStamp, requiredImprovementDate, loadImprovements, formatContentDate, dateOnlyCommit
} = require('./public-updated.cjs');

const root = path.join(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

test('public paths ignore docs, scripts, tests, workflows, and proof.json', () => {
  assert.equal(isPublicPath('index.html'), true);
  assert.equal(isPublicPath('content/improvements.json'), true);
  assert.equal(isPublicPath('docs/vision.md'), false);
  assert.equal(isPublicPath('scripts/notebook.cjs'), false);
  assert.equal(isPublicPath('scripts/notebook.test.cjs'), false);
  assert.equal(isPublicPath('.github/workflows/tests.yml'), false);
  assert.equal(isPublicPath('content/proof.json'), false);
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
