const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const html = read('storefront-preview.html');
const data = JSON.parse(read('content/storefront-candidates.json'));
test('candidate preview cannot collect money, reservations or personal information', () => {
  assert.match(html, /name="robots" content="noindex,nofollow"/);
  assert.match(html, /script-src 'none'/);
  assert.match(html, /form-action 'none'/);
  assert.doesNotMatch(html, /<(?:script|form|input|iframe|button)\b/i);
  assert.doesNotMatch(html, /href="(?:https?:|mailto:)|\$\d|schema\.org\/(?:Offer|Product)/i);
  assert.equal((html.match(/Sourcing in progress \/ not available to order/g) || []).length, 5);
});
test('all five candidate records are unpriced and unavailable', () => {
  assert.equal(data.checkoutLive, false);
  assert.equal(data.preordersEnabled, false);
  assert.equal(data.supplierAgreementsVerified, false);
  assert.equal(data.products.length, 5);
  assert.equal(new Set(data.products.map(p => p.id)).size, 5);
  for (const p of data.products) {
    assert.equal(p.priceUsd, null);
    assert.equal(p.sku, null);
    assert.equal(p.supplier, null);
    assert.equal(p.stockVerified, false);
    assert.equal(p.shippingPromise, null);
    assert.ok(html.includes('id="' + p.id + '"'));
    assert.ok(html.includes(p.name));
  }
});
test('homepage snapshot and rollback hash preserve current production source', () => {
  const manifest = JSON.parse(read('docs/archive/2026-10-22-storefront/manifest.json'));
  const archive = read(manifest.homepageSnapshot);
  assert.equal(archive, read('index.html'));
  assert.equal(crypto.createHash('sha256').update(archive).digest('hex'), manifest.homepageSha256);
  assert.equal(manifest.productionHomepageChanged, false);
});
test('preview local links and fragment targets resolve', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
    if (href.startsWith('#')) assert.ok(ids.includes(href.slice(1)), href);
    else assert.ok(fs.existsSync(path.join(root, href === '/' ? 'index.html' : href)), href);
  }
});
