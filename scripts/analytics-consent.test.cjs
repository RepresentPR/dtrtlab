const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const analytics = fs.readFileSync(path.join(__dirname, '..', 'js/analytics.js'), 'utf8');

async function privacyPage(initialChoice) {
  const buttons = {
    'analytics-allow': { hidden: true, addEventListener(type, callback) { this[type] = callback; } },
    'analytics-withdraw': { hidden: true, addEventListener(type, callback) { this[type] = callback; } }
  };
  const status = { textContent: '' };
  const scripts = [];
  const saved = new Map(initialChoice ? [['dtrt-ga', initialChoice]] : []);
  let reloads = 0;
  const location = { hostname: 'dtrtlab.com', pathname: '/legal/privacy.html', reload() { reloads++; } };
  const document = {
    title: 'Privacy',
    cookie: '_ga=visitor-id; _ga_TEST=activity-id',
    head: { appendChild: script => scripts.push(script) },
    body: { appendChild: () => {} },
    createElement: () => ({ setAttribute: () => {}, addEventListener: () => {} }),
    addEventListener: () => {},
    getElementById: id => id === 'analytics-status' ? status : buttons[id] || null
  };
  const window = { location };
  const context = vm.createContext({
    window, document, location,
    navigator: { globalPrivacyControl: false },
    localStorage: {
      getItem: key => saved.get(key) || null,
      setItem: (key, value) => saved.set(key, value)
    },
    fetch: async () => ({ ok: true, json: async () => ({ gaMeasurementId: 'G-TEST' }) })
  });
  vm.runInContext(analytics, context);
  await new Promise(resolve => setImmediate(resolve));
  return { buttons, status, scripts, saved, window, reloads: () => reloads };
}

test('a visitor can withdraw saved Google consent and stop further events', async () => {
  const page = await privacyPage('yes');
  assert.equal(page.buttons['analytics-withdraw'].hidden, false);
  assert.equal(page.scripts.some(script => String(script.src).includes('googletagmanager.com')), true);
  page.buttons['analytics-withdraw'].click();
  assert.equal(page.saved.get('dtrt-ga'), 'no');
  assert.equal(page.window['ga-disable-G-TEST'], true);
  assert.equal(page.reloads(), 1);
  page.window.dtrtTrackEvent('AfterWithdrawal');
  assert.equal((page.window.dataLayer || []).some(args => args[0] === 'event' && args[1] === 'AfterWithdrawal'), false);
  const nextVisit = await privacyPage(page.saved.get('dtrt-ga'));
  assert.equal(nextVisit.scripts.some(script => String(script.src).includes('googletagmanager.com')), false);
});
