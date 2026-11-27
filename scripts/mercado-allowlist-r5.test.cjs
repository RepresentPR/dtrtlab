'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const allow = require('../js/mercado-allowlist.js');
const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'mercado-allowlist-r5-cases.json'), 'utf8'));
const overlap = JSON.parse(fs.readFileSync(path.join(__dirname, 'shop150-vs-qa-probes.json'), 'utf8'));

function fails(list, expectCrisis) {
  return list.filter((q) => allow.isCrisisText(q) !== expectCrisis);
}

test('r5 shop150 is a fresh 150+ EN/ES set with no QA probe overlap and under 5% false alarms', () => {
  assert.ok(cases.shop150.length >= 150, cases.shop150.length);
  assert.equal(overlap.exactOverlap.length, 0);
  assert.equal(overlap.foldedOverlap.length, 0);
  assert.equal(overlap.freshCount, cases.shop150.length);
  const fa = fails(cases.shop150, false);
  assert.ok((fa.length / cases.shop150.length) <= 0.05, 'false alarms: ' + JSON.stringify(fa.slice(0, 20)));
});

test('r5 ingest+nonfood and held-out crisis lines are crisis', () => {
  assert.deepEqual(fails(cases.crisisIngestAndMore, true), []);
});

test('r5 killing-me idioms are not crisis; kill me never uses that idiom', () => {
  assert.deepEqual(fails(cases.idiomNoTrigger, false), []);
  for (const q of ['kill me', 'please kill me', 'someone to kill me', 'i want someone to kill me']) {
    assert.equal(allow.isCrisisText(q), true, q);
  }
});

test('r5 brief-required crisis and safe queries hold', () => {
  assert.deepEqual(fails(cases.briefRequiredCrisis, true), []);
  assert.deepEqual(fails(cases.briefRequiredSafe, false), []);
});

test('contact pop-up shares isCrisisText; ingest next to a non-food noun is crisis', () => {
  assert.equal(typeof allow.isCrisisText, 'function');
  for (const q of ['drink jafra', 'drink cosmetica', 'drink 20 cans of motion', 'eat candle wax', 'tomar crema']) {
    assert.equal(allow.isCrisisText(q), true, q);
    assert.equal(allow.hasIngestNonfood(q), true, q);
  }
  assert.equal(allow.isCrisisText('2 cans of motion'), false);
  assert.equal(allow.isCrisisText('how much is motion'), false);
});

test('fold keeps non-Latin and emoji from collapsing to an empty string', () => {
  assert.notEqual(allow.fold('こんにちは').trim(), '');
  assert.notEqual(allow.fold('Привет').trim(), '');
  assert.notEqual(allow.fold('مرحبا').trim(), '');
  assert.notEqual(allow.fold('🙂🙂').trim(), '');
  assert.ok(allow.isCrisisText('こんにちは'));
  assert.ok(allow.isCrisisText('自杀'));
});
