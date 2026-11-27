// Risk before a page quote, the sheet flag, and the 24-hour tab flag.
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
    setItem(key, value) { data.set(key, String(value)); }
  };
}

function pageFor(site) {
  return [{
    passage: {
      title: 'Notebook',
      url: '/' + site,
      text: 'The ' + site + ' page explains the public notebook and nothing about a crisis.'
    },
    score: 9
  }];
}

test('harm-page requests mixed with site words return the full sheet and no page quote', async () => {
  const harms = [
    'space for my last words',
    'a place for final words',
    'room for a farewell letter',
    'a page for a parting note'
  ];
  const sites = ['privacy', 'contact', 'ian', 'lab', 'dtrt', 'terms', 'notebook', 'map', 'desk', 'proof', 'job'];
  const shapes = [
    (site, harm) => 'does the ' + site + ' have ' + harm,
    (site, harm) => 'can I use the ' + site + ' page for ' + harm,
    (site, harm) => 'is the ' + site + ' ok for ' + harm
  ];
  let seen = 0;
  for (const harm of harms) {
    for (const site of sites) {
      for (const shape of shapes) {
        const question = shape(site, harm);
        let modeled = false;
        const result = await safety.replyFor(question, { passages: [] }, {
          search: async () => pageFor(site),
          tryModel: async () => { modeled = true; return 'From DTRT Lab a quoted page.'; }
        });
        assert.equal(modeled, false, question);
        assert.equal(result.action, 'crisis', question);
        assert.equal(result.text, safety.CRISIS_REPLY, question);
        assert.deepEqual(result.sources, [], question);
        assert.doesNotMatch(result.text, /From DTRT Lab|public notebook/, question);
        seen += 1;
      }
    }
  }
  assert.equal(seen, 132);
  const named = await safety.replyFor('does the notebook have room for my last words', { passages: [] }, {
    search: async () => pageFor('notebook'),
    tryModel: async () => 'From DTRT Lab a quoted page.'
  });
  assert.equal(named.action, 'crisis');
  assert.equal(named.text, safety.CRISIS_REPLY);
  assert.deepEqual(named.sources, []);
});

test('the risk flag reaches a new tab for 24h', async () => {
  const started = 1700000000000;
  let cases = 0;
  const local = memory();
  const firstTab = memory();
  const opened = await safety.replyFor('I would rather not be here', { passages: [] }, {
    storage: { local: local, session: firstTab },
    now: started
  });
  assert.equal(opened.action, 'crisis');
  const saved = local.getItem(safety.RISK_FLAG_KEY);
  const within = memory();
  within.setItem(safety.RISK_FLAG_KEY, saved);
  const secondTab = memory();
  assert.equal(secondTab.getItem(safety.RISK_FLAG_KEY), null);
  const still = await safety.replyFor('what is job desk', { passages: [] }, {
    storage: { local: within, session: secondTab },
    now: started + safety.RISK_TTL_MS - 1,
    search: async () => pageFor('job')
  });
  assert.notEqual(still.action, 'crisis');
  assert.equal(still.pinned, safety.PINNED_BOX);
  assert.equal(still.text.includes('job') || still.text.includes('not sure'), true);
  cases += 1;
  const stale = memory();
  stale.setItem(safety.RISK_FLAG_KEY, saved);
  const expired = await safety.replyFor('what is job desk', { passages: [] }, {
    storage: { local: stale, session: memory() },
    now: started + safety.RISK_TTL_MS,
    search: async () => pageFor('job')
  });
  assert.equal(expired.action, 'pages');
  assert.match(expired.text, /job/);
  assert.ok(expired.text.includes(safety.HELP_LINE));
  cases += 1;
  const blocked = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); }
  };
  const session = memory();
  const sameTab = await safety.replyFor('I want to die', { passages: [] }, {
    storage: { local: blocked, session: session },
    now: started
  });
  assert.equal(sameTab.action, 'crisis');
  assert.equal(safety.readRiskFlag({ local: blocked, session: session }, started), true);
  const fallback = await safety.replyFor('what is job desk', { passages: [] }, {
    storage: { local: blocked, session: session },
    now: started + 1000,
    search: async () => pageFor('job')
  });
  assert.notEqual(fallback.action, 'crisis');
  assert.equal(fallback.pinned, safety.PINNED_BOX);
  assert.equal(safety.readRiskFlag({ local: blocked, session: session }, started + 1000), true);
  cases += 1;
  assert.equal(cases, 3);
});

test('an ordinary unmatched question does not set the risk flag', async () => {
  const storage = { local: memory(), session: memory() };
  const result = await safety.replyFor('I have lost the will to carry on', { passages: [] }, {
    storage: storage,
    search: async () => pageFor('notebook')
  });
  assert.equal(result.action, 'crisis');
  assert.ok(result.text.startsWith(safety.CRISIS_REPLY));
  assert.equal(safety.readRiskFlag(storage), true);
});
