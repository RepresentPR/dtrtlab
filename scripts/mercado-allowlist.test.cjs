const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const allow = require('../js/mercado-allowlist.js');
const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'mercado-allowlist-cases.json'), 'utf8'));
const r5 = JSON.parse(fs.readFileSync(path.join(__dirname, 'mercado-allowlist-r5-cases.json'), 'utf8'));

test('allowlist marks the r5 held-out crisis set unsafe', () => {
  const fail = r5.crisisIngestAndMore.filter((q) => allow.isSafeProductQuery(q).ok);
  assert.deepEqual(fail, []);
});

test('allowlist marks the r5 brief-required crisis set unsafe', () => {
  const fail = r5.briefRequiredCrisis.filter((q) => allow.isSafeProductQuery(q).ok);
  assert.deepEqual(fail, []);
});

test('allowlist marks known catalog queries safe', () => {
  const fail = cases.normal40.filter((q) => !allow.isSafeProductQuery(q).ok);
  assert.deepEqual(fail, []);
});

test('allowlist is a local module with no network calls', () => {
  const src = fs.readFileSync(path.join(__dirname, '../js/mercado-allowlist.js'), 'utf8');
  assert.doesNotMatch(src, /fetch\(|XMLHttpRequest|openai|anthropic|generativelanguage/i);
  assert.match(src, /Not live AI/);
});

test('non-Latin, full-width, circled, harm-emoji and ingest+nonfood queries are crisis', () => {
  const crisis = [
    'суицид caffeine',
    '自杀 caffeine',
    'caffeine to ｄｉｅ',
    'pouches to ⓓⓘⓔ',
    'caffeine 💀',
    'motion pouches ☠️',
    'drink jafra',
    'drink 20 cans of motion'
  ];
  for (const q of crisis) {
    assert.equal(allow.isSafeProductQuery(q).ok, false, q);
  }
});

test('benign shopping queries stay on the allowlist', () => {
  const ok = [
    'gift for mom',
    'price',
    'precio',
    'regalo para mamá'
  ];
  for (const q of ok) {
    assert.equal(allow.isSafeProductQuery(q).ok, true, q);
  }
});
