const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ask = require('../ask/ask.js');
const { build, jsSource, jsonSource } = require('./build-ask-index.cjs');

const root = path.join(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

const CHIPS = [
  ['Where is the free office map?', '/map/'],
  ['What does Job Desk do?', '/job-desk/how-it-works/'],
  ['Where is the free AI visibility check?', '/map/'],
  ['What is the refund policy?', '/legal/refunds.html']
];

test('ask passages match a fresh build', () => {
  const corpus = build();
  assert.equal(read('ask/passages.js'), jsSource(corpus));
  assert.equal(read('ask/passages.json'), jsonSource(corpus));
});

test('homepage hero and chip text stay out of the Ask index', () => {
  const corpus = build();
  const home = corpus.passages.filter((passage) => passage.url === '/').map((passage) => passage.text).join('\n');
  assert.doesNotMatch(home, /I'm Ian/);
  assert.doesNotMatch(home, /What dream are you chasing/);
  for (const [chip] of CHIPS) assert.equal(home.includes(chip), false, chip);
});

test('each Ask chip top hit is a public page that answers it', () => {
  const corpus = build();
  for (const [chip, url] of CHIPS) {
    const hits = ask.search(chip, corpus, 1);
    assert.ok(hits.length, chip);
    assert.equal(hits[0].passage.url, url, chip + ' -> ' + hits[0].passage.url);
  }
});
