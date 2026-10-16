const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

// The browser boundary is simulated; both production scripts run unchanged.
async function page({ consent = 'no', optedOut = false, valid = true } = {}) {
  const listeners = {};
  const scripts = [];
  const status = { textContent: '' };
  const form = {
    reportValidity: () => valid,
    addEventListener: (name, fn) => { listeners['form:' + name] = fn; }
  };
  const document = {
    title: 'Support and partner',
    head: { appendChild: script => scripts.push(script) },
    body: { appendChild: () => {} },
    createElement: () => ({ setAttribute: () => {}, addEventListener: () => {} }),
    addEventListener: (name, fn) => { listeners[name] = fn; },
    getElementById: id => id === 'partner-form' ? form : status
  };
  const values = { name: 'Test Person', brand: 'Example Brand', email: 'private@example.test', placement: 'Website ad placement', budget: '100 USD', dates: 'November', message: 'Private brief text' };
  const location = { hostname: 'dtrtlab.com', pathname: '/partners.html', href: '' };
  const window = { location };
  const context = vm.createContext({
    window, document, location,
    navigator: { globalPrivacyControl: optedOut },
    localStorage: { getItem: () => consent },
    fetch: async () => ({ ok: true, json: async () => ({ gaMeasurementId: 'G-TEST' }) }),
    FormData: class { get(key) { return values[key]; } }
  });
  vm.runInContext(read('js/analytics.js'), context);
  await new Promise(resolve => setImmediate(resolve));
  return {
    window, location, status, scripts,
    click: eventName => listeners.click({ target: { closest: () => eventName ? { getAttribute: () => eventName } : null } }),
    submit: () => listeners['form:submit']({ preventDefault: () => {} }),
    plausibleEvents: () => Array.from(window.plausible?.q || [], args => Array.from(args)),
    gaEvents: () => Array.from(window.dataLayer || [], args => Array.from(args)).filter(args => args[0] === 'event')
  };
}

test('public support paths do not send visitors to the paused Ko-fi checkout', async () => {
  const ui = await page();
  for (const name of ['about.html', 'donate.html', 'faq.html', 'index.html', 'support.html', 'content/donate.json', 'content/site.json', 'content/socials.js']) {
    assert.doesNotMatch(read(name), /https:\/\/ko-fi\.com\//, name);
  }
  assert.deepEqual(ui.gaEvents(), [], 'declining GA must not send GA events');
  const donate = JSON.parse(read('content/donate.json'));
  assert.equal(donate.url, '');
  assert.equal(donate.methods.filter(method => method.url).length, 0);
  assert.doesNotMatch(read('donate.html'), /donate-qr\.svg/, 'retired checkout QR must not render');
});

test('a partnership note is the map form, not a prepared mailto', async () => {
  const ui = await page({ consent: 'yes' });
  assert.match(read('partners.html'), /href="\/map\/\?want=partner"/);
  assert.equal(fs.existsSync(path.join(root, 'js/partners.js')), false);
  assert.equal(ui.location.href, '');
  assert.deepEqual(ui.plausibleEvents(), []);
  assert.deepEqual(ui.gaEvents(), []);
});

test('loading the partnership script neither navigates nor records a brief', async () => {
  const ui = await page({ valid: false });
  assert.equal(ui.location.href, '');
  assert.deepEqual(ui.plausibleEvents(), []);
  assert.deepEqual(ui.gaEvents(), []);
});

test('privacy opt-out blocks support and brief events even with a pre-existing collector', async () => {
  const ui = await page({ optedOut: true, consent: 'yes' });
  const calls = [];
  ui.window.plausible = (...args) => calls.push(args);
  ui.click('SupportTipIntent');
  assert.deepEqual(calls, []);
  assert.deepEqual(ui.gaEvents(), []);
  assert.equal(ui.scripts.length, 0);
  assert.equal(ui.location.href, '');
  assert.match(read('partners.html'), /href="\/map\/\?want=partner"/, 'privacy choice must not remove the enquiry');
});

test('missing or failed analytics never blocks the partnership page', async () => {
  for (const analytics of [undefined, () => { throw new Error('collector blocked'); }]) {
    const ui = await page();
    ui.window.dtrtTrackEvent = analytics;
    assert.equal(ui.location.href, '');
    assert.match(read('partners.html'), /href="\/map\/\?want=partner"/);
  }
});
