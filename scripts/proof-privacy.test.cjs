const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
test('public proof.json carries only non-sensitive aggregate counts', (t) => {
  if (!fs.existsSync('content/proof.json')) return t.skip('proof page not added yet');
  const p = JSON.parse(fs.readFileSync('content/proof.json', 'utf8'));
  const allowed = ['updated_et', 'days_running', 'companies_studied', 'sources_collected', 'knowledge_notes', 'posts_published', 'audience_total', 'history'];
  for (const k of Object.keys(p)) assert.ok(allowed.includes(k), `unexpected key ${k}`);
  const s = JSON.stringify(p).toLowerCase();
  for (const bad of ['revenue', 'usd', '$', 'email', '@', 'lead', 'whop']) assert.ok(!s.includes(bad), `proof.json mentions ${bad}`);
});
test('live owner data is committed only as ciphertext', (t) => {
  if (!fs.existsSync('live/owner.enc.json')) return t.skip('owner dashboard not added yet');
  assert.ok(!fs.existsSync('live/owner.json'), 'plaintext owner data must not be committed');
  const e = JSON.parse(fs.readFileSync('live/owner.enc.json', 'utf8'));
  assert.deepStrictEqual(Object.keys(e).sort(), ['ct', 'iter', 'iv', 'kdf', 'salt', 'v']);
  assert.ok(e.iter >= 600000);
});
