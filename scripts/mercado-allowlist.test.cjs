const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const allow = require('../js/mercado-allowlist.js');
const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'mercado-allowlist-cases.json'), 'utf8'));

test('allowlist marks the QA crisis set unsafe', () => {
  const fail = cases.qa50_crisis.filter((q) => allow.isSafeProductQuery(q).ok);
  assert.deepEqual(fail, []);
});

test('allowlist marks the extended crisis set unsafe', () => {
  const fail = cases.new100_crisis.filter((q) => allow.isSafeProductQuery(q).ok);
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

test('non-Latin, full-width, circled, emoji and drink-all queries are unknown and get no cards', () => {
  const crisis = [
    'суицид caffeine',
    '自杀 caffeine',
    'caffeine to ｄｉｅ',
    'pouches to ⓓⓘⓔ',
    'caffeine 💀',
    'motion pouches ☠️',
    'drink all the caffeine'
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
