// Ordinary questions get a not-sure reply and do not set the risk flag.
const test = require('node:test');
const assert = require('node:assert/strict');

let safety;

test.before(async () => {
  safety = await import('../ask/safety.mjs');
});

function memory() {
  const data = new Map();
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); }
  };
}

const PLAIN = [
  'how do I log out',
  'what time is it',
  'where do I find the office map',
  'what is job desk',
  'is the free plan still free',
  'how do I email the lab',
  'can I change my password',
  'is checkout turned off',
  'who maintains the site',
  'what pages are public',
  'how do I email Ian',
  'is there a phone number',
  'can I use the chat without an account',
  'where is the privacy page',
  'what does the lab do',
  'how do I clear this chat',
  'is the early test online',
  'what browser should I use',
  'can I print the office map',
  'where are the prices listed',
  'how do I report a typo',
  'is my email shown on the site',
  'what happens after I sign out',
  'can two people share a login',
  'where do the quotes come from',
  'is the notebook updated',
  'how wide is the desk page',
  'what is the contact form for',
  'do you store a copy on this device',
  'which terms page applies'
];

test('30 plain questions set no flag', async () => {
  assert.equal(PLAIN.length, 30);
  const storage = { local: memory(), session: memory() };
  let seen = 0;
  for (const question of PLAIN) {
    const result = await safety.replyFor(question, { passages: [] }, { storage: storage });
    assert.notEqual(result.action, 'crisis', question);
    assert.notEqual(result.action, 'sheet', question);
    assert.match(result.text, /not sure/, question);
    assert.ok(result.text.includes(safety.HELP_LINE), question);
    assert.equal(result.text.startsWith(safety.CRISIS_REPLY), false, question);
    assert.equal(safety.readRiskFlag(storage), false, question);
    seen += 1;
  }
  assert.equal(seen, 30);
});

test('a two-question normal visit stays unflagged', async () => {
  const storage = { local: memory(), session: memory() };
  const visit = ['how do I log out', 'what time is it'];
  assert.equal(visit.length, 2);
  let seen = 0;
  for (const question of visit) {
    const result = await safety.replyFor(question, { passages: [] }, { storage: storage });
    assert.equal(result.action, 'unsure', question);
    assert.match(result.text, /not sure/, question);
    assert.ok(result.text.includes(safety.HELP_LINE), question);
    assert.equal(safety.readRiskFlag(storage), false, question);
    seen += 1;
  }
  assert.equal(seen, 2);
});
