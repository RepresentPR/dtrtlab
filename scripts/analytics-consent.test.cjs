// GoatCounter is the only visit counter. Google Analytics and its loader stay out.
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SELF = 'scripts/analytics-consent.test.cjs';
const NEEDLES = ['analytics.js', 'googletagmanager'];
const SKIP = new Set(['.git', 'node_modules']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

test('analytics.js and googletagmanager stay out of the repo', () => {
  assert.equal(fs.existsSync(path.join(ROOT, 'js/analytics.js')), false);
  const hits = [];
  for (const file of walk(ROOT)) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    if (rel === SELF) continue;
    const text = fs.readFileSync(file);
    if (text.includes(0)) continue;
    const source = text.toString('utf8');
    for (const needle of NEEDLES) {
      if (source.includes(needle)) hits.push(rel + ': ' + needle);
    }
  }
  assert.deepEqual(hits, []);
});
