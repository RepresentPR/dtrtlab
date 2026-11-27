// A 4-word run in the shared classifier must not be a line from QA's export.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SOURCE = path.join(__dirname, '..', 'js', 'safety-core.mjs');
const EXPORTS = [
  '/cursor/stores/bot/qa-handoff/pr111/sets',
  '/home/box/qa-reports/pr111/sets'
];

function wordsOf(text) {
  return String(text || '').toLowerCase().match(/[a-z]{2,}/g) || [];
}

function runs(words, size) {
  const found = [];
  for (let i = 0; i + size <= words.length; i += 1) found.push(words.slice(i, i + size).join(' '));
  return found;
}

test('safety-core has no 4-word run from the exported sets', () => {
  const dir = EXPORTS.find((item) => fs.existsSync(item));
  if (!dir) {
    console.log('verbatim-run skipped, export not mounted');
    return;
  }
  const hay = [];
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.json') || name === 'manifest.json') continue;
    const rows = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
    for (const row of rows) {
      const text = Array.isArray(row.text) ? row.text.join(' ') : row.text;
      hay.push(String(text || '').toLowerCase());
    }
  }
  const blob = hay.join('\n');
  const sourceWords = wordsOf(fs.readFileSync(SOURCE, 'utf8'));
  const hits = [];
  for (let size = 4; size <= 8; size += 1) {
    for (const phrase of new Set(runs(sourceWords, size))) {
      if (blob.includes(phrase)) hits.push(phrase);
    }
  }
  const unique = [...new Set(hits)].filter((phrase) => !hits.some((other) => other !== phrase && other.includes(phrase) && other.length > phrase.length));
  assert.deepEqual(unique, [], 'verbatim runs:\n' + unique.slice(0, 40).join('\n'));
});
