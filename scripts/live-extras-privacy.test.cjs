const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'js/live-extras.js'), 'utf8');

async function renderSupporters(supporters, events = []) {
  const element = { dataset: {}, innerHTML: '' };
  const live = { events };
  const timers = new Map();
  const context = vm.createContext({
    document: { getElementById: id => id === 'lfx' ? element : null },
    window: { LabLive: live },
    LabLive: live,
    fetch: async url => ({
      ok: true,
      json: async () => String(url).includes('supporters.json') ? supporters : {}
    }),
    setInterval: (callback, delay) => timers.set(delay, callback)
  });
  vm.runInContext(script, context);
  await new Promise(setImmediate);
  return { element, refresh: () => timers.get(1000)() };
}

test('legacy financial fields and donation/bits events never reach supporter HTML', async () => {
  const events = [
    { type: 'donation', user: 'PrivateDonor', amount: '$982.31' },
    { type: 'bits', user: 'PrivateCheerer', amount: 78123, unit: 'bits' }
  ];
  const page = await renderSupporters({
    follower: { name: 'SavedFollower', amount: '$111.22' },
    subscriber: { name: 'SavedSubscriber', amount: '$333.44' },
    donation: { name: 'SavedDonor', amount: '$555.66' },
    bits: { name: 'SavedCheerer', amount: 87654 },
    revenue: '$9999', payment_status: 'paid'
  }, events);
  assert.match(page.element.innerHTML, /SavedFollower/);
  assert.match(page.element.innerHTML, /SavedSubscriber/);
  assert.doesNotMatch(page.element.innerHTML, /donation|bits|donor|cheerer|revenue|payment|paid|\$|982\.31|78123|87654|none yet/i);

  events.push({ type: 'follow', user: 'Live<Follower>', amount: '$222' });
  events.push({ type: 'gift', user: 'LiveSubscriber', amount: '$444' });
  events.push({ type: 'follow', user: 'TestFollower', test: true });
  events.push({ type: 'donation', user: 'NewestPrivateDonor', amount: '$123456' });
  page.refresh();
  assert.match(page.element.innerHTML, /Live&lt;Follower&gt;/);
  assert.match(page.element.innerHTML, /LiveSubscriber/);
  assert.doesNotMatch(page.element.innerHTML, /SavedFollower|SavedSubscriber|TestFollower|donation|donor|cheerer|bits|\$|123456|none yet/i);
});

test('missing names and money-only input produce no supporter status or empty card', async () => {
  for (const supporters of [{}, { follower: null, subscriber: null, donation: null }, { donation: { name: 'PrivateDonor', amount: '$5' } }]) {
    const page = await renderSupporters(supporters, [{ type: 'bits', user: 'PrivateCheerer', amount: 100 }]);
    assert.equal(page.element.innerHTML, '');
  }
});

test('public supporter data exposes only follower and subscriber fields', () => {
  const supporters = JSON.parse(fs.readFileSync(path.join(root, 'content/supporters.json'), 'utf8'));
  assert.deepEqual(Object.keys(supporters).sort(), ['_help', 'follower', 'subscriber']);
  assert.doesNotMatch(JSON.stringify(supporters), /donation|bits|amount|revenue|payment|none yet/i);
});
