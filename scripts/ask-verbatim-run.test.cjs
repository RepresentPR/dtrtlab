// A 4-word run in the shared classifier must not be a run from the export.
// The export stays off the repo. CI checks salted hashes of those runs.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const SOURCE = path.join(__dirname, '..', 'js', 'safety-core.mjs');
const HASHES = path.join(__dirname, 'fixtures', 'ask-export-4gram.sha256');
const SALT = 'dtrt-pr111-4gram-v1';

function wordsOf(text) {
  return String(text || '').toLowerCase().match(/[a-z]{2,}/g) || [];
}

function digest(phrase) {
  return crypto.createHash('sha256').update(SALT + '\n' + phrase).digest('hex');
}

test('safety-core has no 4-word run from the exported sets', () => {
  assert.ok(fs.existsSync(HASHES), 'salted 4-word hashes are missing');
  const lines = fs.readFileSync(HASHES, 'utf8').trim().split('\n');
  assert.ok(lines.length > 1000, 'hash list is too small to be the export');
  for (const line of lines) assert.match(line, /^[a-f0-9]{64}$/);
  const known = new Set(lines);
  const words = wordsOf(fs.readFileSync(SOURCE, 'utf8'));
  const hits = [];
  for (let i = 0; i + 4 <= words.length; i += 1) {
    const phrase = words.slice(i, i + 4).join(' ');
    if (known.has(digest(phrase))) hits.push(phrase);
  }
  assert.deepEqual([...new Set(hits)], [], 'verbatim runs:\n' + hits.slice(0, 40).join('\n'));
});
