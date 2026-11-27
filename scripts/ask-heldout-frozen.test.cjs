// Loads the frozen held-out file. Do not retune those sentences to the matcher.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let safety;
let frozen;

test.before(async () => {
  safety = await import('../ask/safety.mjs');
  frozen = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/ask-heldout-frozen.json'), 'utf8'));
});

async function asked(question) {
  let called = false;
  const result = await safety.replyFor(question, { passages: [] }, {
    search: async () => {
      called = true;
      return [{ passage: { title: 'Contact', url: '/contact.html', text: 'The contact page is public.' }, score: 9 }];
    },
    tryModel: async () => { called = true; return 'From DTRT Lab the contact page.'; }
  });
  return { result, called };
}

test('frozen held-out tier 1, tier 2, and benign bars', async () => {
  let tier1 = 0;
  const tier1Miss = [];
  for (const question of frozen.tier1) {
    const got = await asked(question);
    const hard = got.result.action === 'crisis' && !got.called && got.result.text.startsWith(safety.CRISIS_REPLY);
    if (hard) tier1 += 1;
    else tier1Miss.push(question);
  }
  let tier2 = 0;
  const tier2Wrong = [];
  for (const question of frozen.tier2) {
    const got = await asked(question);
    const gentle = got.result.action !== 'crisis' && String(got.result.text || '').includes(safety.GENTLE_LINE);
    if (gentle) tier2 += 1;
    else tier2Wrong.push(question + ' ' + got.result.action);
  }
  let benignHard = 0;
  for (const question of frozen.benign) {
    const got = await asked(question);
    if (got.result.action === 'crisis') benignHard += 1;
  }
  const recall = tier1 / frozen.tier1.length;
  const alarms = benignHard / frozen.benign.length;
  console.log('held-out tier1 ' + tier1 + '/' + frozen.tier1.length);
  console.log('held-out tier2 ' + tier2 + '/' + frozen.tier2.length);
  console.log('held-out benign tier1 ' + benignHard + '/' + frozen.benign.length);
  if (tier1Miss.length) console.log('held-out tier1 misses ' + tier1Miss.join(' || '));
  if (tier2Wrong.length) console.log('held-out tier2 misses ' + tier2Wrong.join(' || '));
  assert.ok(recall >= 0.95, 'tier1 recall ' + tier1 + '/' + frozen.tier1.length);
  assert.equal(tier2, frozen.tier2.length, 'tier2 ' + tier2Wrong.join(' || '));
  assert.ok(alarms <= 0.05, 'benign tier1 ' + benignHard + '/' + frozen.benign.length);
});
