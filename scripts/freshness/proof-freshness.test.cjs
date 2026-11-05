// Fix 7 #4, live /proof age only. Kept outside scripts/*.test.cjs so the gate job
// stays about real breaks. Threshold and assertion are the same check as before.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const L = require('../fix7/lib.cjs');

const read = (f) => fs.readFileSync(path.join(L.ROOT, f), 'utf8');
function proofAgeHours(updatedEt, now = new Date()) { const t = L.parseEt(updatedEt); return t ? (now - t) / 3600e3 : NaN; }
const proofStale = (updatedEt, now) => { const a = proofAgeHours(updatedEt, now); return Number.isNaN(a) || a < -0.1 || a >= L.MAX_PROOF_AGE_H; };

test(`fix7/4 content/proof.json updated_et is under ${L.MAX_PROOF_AGE_H} h old (PR and daily schedule)`, () => {
  const proof = JSON.parse(read('content/proof.json'));
  const now = process.env.FIX7_NOW ? new Date(process.env.FIX7_NOW) : new Date();
  const age = proofAgeHours(proof.updated_et, now);
  assert.ok(!proofStale(proof.updated_et, now), `/proof data "${proof.updated_et}" is ${Number.isNaN(age) ? 'unparseable' : age.toFixed(1) + ' h old'}; limit ${L.MAX_PROOF_AGE_H} h. Live-refresh is not committing (OI-008).`);
});
