const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

// Google Analytics is gone. These checks keep the public support paths from
// growing a collector, a checkout link, or a prepared mailto.
async function page() {
  const location = { hostname: 'dtrtlab.com', pathname: '/partners.html', href: '' };
  const window = { location };
  return {
    window, location, scripts: [],
    click: () => {},
    plausibleEvents: () => [],
    gaEvents: () => []
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
