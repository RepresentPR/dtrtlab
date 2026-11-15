// The committed Ask index must match a fresh build of the public pages it indexes.
// Run `node scripts/build-ask-index.cjs` when this fails.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { build, jsSource, jsonSource } = require('./build-ask-index.cjs');

const root = path.join(__dirname, '..');

test('Ask search index matches the public pages it indexes', () => {
  const fresh = build();
  const jsonPath = path.join(root, 'ask/passages.json');
  const jsPath = path.join(root, 'ask/passages.js');
  assert.equal(fs.readFileSync(jsonPath, 'utf8'), jsonSource(fresh),
    'ask/passages.json is behind the public pages. Run node scripts/build-ask-index.cjs');
  assert.equal(fs.readFileSync(jsPath, 'utf8'), jsSource(fresh),
    'ask/passages.js is behind the public pages. Run node scripts/build-ask-index.cjs');
  assert.ok(fresh.passages.length > 10);
});
