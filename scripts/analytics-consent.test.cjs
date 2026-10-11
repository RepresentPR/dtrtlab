const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const analytics = fs.readFileSync(path.join(__dirname, '..', 'js/analytics.js'), 'utf8');

async function privacyPage(initialChoice, browser = { tabs: [], saved: new Map() }) {
  const buttons = {
    'analytics-allow': { hidden: true, addEventListener(type, callback) { this[type] = callback; } },
    'analytics-withdraw': { hidden: true, addEventListener(type, callback) { this[type] = callback; } }
  };
  const status = { textContent: '' };
  const scripts = [];
  const saved = browser.saved;
  if (initialChoice) saved.set('dtrt-ga', initialChoice);
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
  const listeners = {};
  const window = { location, addEventListener(type, callback) { listeners[type] = callback; } };
  const localStorage = {
    getItem: key => saved.get(key) || null,
    setItem(key, value) {
      const oldValue = saved.get(key) || null;
      saved.set(key, value);
      if (oldValue === value) return;
      for (const tab of browser.tabs) {
        if (tab.localStorage === localStorage) continue;
        setImmediate(() => tab.listeners.storage?.({ key, oldValue, newValue: value, storageArea: tab.localStorage }));
      }
    }
  };
  browser.tabs.push({ localStorage, listeners });
  const context = vm.createContext({
    window, document, location,
    navigator: { globalPrivacyControl: false },
    localStorage,
    fetch: async () => ({ ok: true, json: async () => ({ gaMeasurementId: 'G-TEST' }) })
  });
  vm.runInContext(analytics, context);
  await new Promise(resolve => setImmediate(resolve));
  return { buttons, status, scripts, saved, window, document, localStorage, listeners, reloads: () => reloads };
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

test('withdrawing consent stops Google events in an already-open second tab', async () => {
  const browser = { tabs: [], saved: new Map([['dtrt-ga', 'yes']]) };
  const privacy = await privacyPage(null, browser);
  const otherTab = await privacyPage(null, browser);
  otherTab.window.dtrtTrackEvent('BeforeWithdrawal');
  assert.equal(otherTab.window.dataLayer.some(args => args[0] === 'event' && args[1] === 'BeforeWithdrawal'), true);

  privacy.buttons['analytics-withdraw'].click();
  await new Promise(setImmediate);
  otherTab.window.dtrtTrackEvent('AfterOtherTabWithdrawal');

  assert.equal(otherTab.window.dataLayer.some(args => args[0] === 'event' && args[1] === 'AfterOtherTabWithdrawal'), false);
  assert.equal(otherTab.window['ga-disable-G-TEST'], true);
  assert.match(otherTab.document.cookie, /Max-Age=0/);
  assert.equal(otherTab.reloads(), 1);
  assert.equal(otherTab.buttons['analytics-withdraw'].hidden, true);
  assert.equal(privacy.reloads(), 1);
  assert.equal(browser.saved.get('dtrt-ga'), 'no');
});
