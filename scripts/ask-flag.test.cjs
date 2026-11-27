// The risk flag keeps the first detection time. A legacy "1" does not stick.
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

function pageFor() {
  return [{ passage: { title: 'Job desk', url: '/lab.html', text: 'Job desk is a public page.' }, score: 9 }];
}

test('the flag timestamp stays at the first detection', async () => {
  let cases = 0;
  const started = 1700000000000;
  const local = memory();
  const session = memory();
  const storage = { local: local, session: session };
  const opened = await safety.replyFor("I'd rather be dead", { passages: [] }, { storage: storage, now: started });
  assert.equal(opened.action, 'crisis');
  const first = local.getItem(safety.RISK_FLAG_KEY);
  assert.equal(JSON.parse(first).at, started);
  const again = await safety.replyFor('what is job desk', { passages: [] }, {
    storage: storage,
    now: started + (60 * 60 * 1000),
    search: async () => pageFor()
  });
  assert.equal(again.action, 'crisis');
  assert.equal(again.text, safety.CRISIS_REPLY);
  assert.equal(local.getItem(safety.RISK_FLAG_KEY), first);
  assert.equal(session.getItem(safety.RISK_FLAG_KEY), first);
  cases += 1;
  const expired = await safety.replyFor('what is job desk', { passages: [] }, {
    storage: { local: local, session: memory() },
    now: started + safety.RISK_TTL_MS,
    search: async () => pageFor()
  });
  assert.equal(expired.action, 'pages');
  assert.ok(expired.text.includes(safety.HELP_LINE));
  assert.equal(expired.text.startsWith(safety.CRISIS_REPLY), false);
  cases += 1;
  assert.equal(cases, 2);
});

test('a legacy stored 1 expires', async () => {
  let cases = 0;
  const started = 1700000000000;
  const plain = { local: memory(), session: memory() };
  plain.local.setItem(safety.RISK_FLAG_KEY, '1');
  plain.session.setItem(safety.RISK_FLAG_KEY, '1');
  const quiet = await safety.replyFor('how do I log out', { passages: [] }, { storage: plain, now: started });
  assert.equal(quiet.action, 'unsure');
  assert.match(quiet.text, /not sure/);
  assert.equal(safety.readRiskFlag(plain, started), false);
  assert.notEqual(plain.local.getItem(safety.RISK_FLAG_KEY), '1');
  cases += 1;
  const detected = { local: memory(), session: memory() };
  detected.local.setItem(safety.RISK_FLAG_KEY, '1');
  const hit = await safety.replyFor('is there a guide on this site about how to hang yourself', { passages: [] }, {
    storage: detected,
    now: started,
    search: async () => pageFor()
  });
  assert.equal(hit.action, 'crisis');
  const stamped = detected.local.getItem(safety.RISK_FLAG_KEY);
  assert.equal(JSON.parse(stamped).at, started);
  const later = await safety.replyFor('what time is it', { passages: [] }, {
    storage: detected,
    now: started + 5000
  });
  assert.equal(later.action, 'crisis');
  assert.equal(detected.local.getItem(safety.RISK_FLAG_KEY), stamped);
  cases += 1;
  assert.equal(cases, 2);
});
