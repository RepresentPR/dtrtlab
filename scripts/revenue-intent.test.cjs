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
  vm.runInContext(read('js/partners.js'), context);
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
  const support = read('support.html');
  const buttons = Array.from(support.matchAll(/<a\b([^>]*data-event="Support(?:Watch|Share)Intent"[^>]*)>/g));
  assert.equal(buttons.length, 2, 'watch and share paths replace tip buttons');
  for (const [, attributes] of buttons) ui.click(attributes.match(/data-event="([^"]+)"/)?.[1]);
  assert.deepEqual(ui.plausibleEvents().map(args => args[0]), ['SupportWatchIntent', 'SupportShareIntent']);
  assert.deepEqual(ui.gaEvents(), [], 'declining GA must not send GA events');
  const donate = JSON.parse(read('content/donate.json'));
  assert.equal(donate.url, '');
  assert.equal(donate.methods.filter(method => method.url).length, 0);
  assert.doesNotMatch(read('donate.html'), /donate-qr\.svg/, 'retired checkout QR must not render');
});

test('a valid prepared partnership email emits one intent and no private form fields', async () => {
  const ui = await page({ consent: 'yes' });
  ui.submit();
  const email = new URL(ui.location.href);
  assert.equal(email.protocol, 'mailto:');
  assert.equal(email.pathname, 'DTRTCollision@outlook.com');
  assert.match(email.searchParams.get('body'), /EMAIL: private@example\.test/);
  assert.deepEqual(ui.plausibleEvents(), [['PartnershipBriefPrepared', undefined]]);
  assert.deepEqual(ui.gaEvents(), [['event', 'PartnershipBriefPrepared']]);
  assert.match(ui.status.textContent, /has not sent your enquiry/);
});

test('invalid partnership forms neither navigate nor record a prepared brief', async () => {
  const ui = await page({ valid: false });
  ui.submit();
  assert.equal(ui.location.href, '');
  assert.deepEqual(ui.plausibleEvents(), []);
  assert.deepEqual(ui.gaEvents(), []);
});

test('privacy opt-out blocks support and brief events even with a pre-existing collector', async () => {
  const ui = await page({ optedOut: true, consent: 'yes' });
  const calls = [];
  ui.window.plausible = (...args) => calls.push(args);
  ui.click('SupportTipIntent');
  ui.submit();
  assert.deepEqual(calls, []);
  assert.deepEqual(ui.gaEvents(), []);
  assert.equal(ui.scripts.length, 0);
  assert.match(ui.location.href, /^mailto:/, 'privacy choice must not disable the enquiry');
});

test('missing or failed analytics never prevents preparing the email', async () => {
  for (const analytics of [undefined, () => { throw new Error('collector blocked'); }]) {
    const ui = await page();
    ui.window.dtrtTrackEvent = analytics;
    assert.doesNotThrow(() => ui.submit());
    assert.match(ui.location.href, /^mailto:/);
    assert.match(ui.status.textContent, /has not sent your enquiry/);
  }
});
