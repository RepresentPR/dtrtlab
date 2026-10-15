const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

test('shop catalog keeps checkout off and lists digital + merch interest products', () => {
  const shop = JSON.parse(read('content/shop.json'));
  assert.equal(shop.checkoutLive, false);
  assert.equal(shop.interestOpen, true);
  assert.equal(shop.positioning.madeForAll, true);
  assert.equal(shop.positioning.globalAudience, true);
  assert.ok(shop.products.some(p => p.status === 'free_now'));
  assert.ok(shop.products.some(p => p.kind === 'digital' && p.status === 'interest'));
  assert.ok(shop.products.some(p => p.kind === 'merch' && p.status === 'interest'));
  assert.ok(shop.snowball[0].toLowerCase().includes('digital'));
});

test('company facts expose Made for all audience and honest shop flags', () => {
  const company = JSON.parse(read('content/company.json'));
  assert.equal(company.audience.madeForAll, true);
  assert.equal(company.audience.ageInclusive, true);
  assert.equal(company.shop.checkoutLive, false);
  assert.equal(company.shop.interestOpen, true);
  assert.equal(company.preorderLive, false);
  assert.match(company.mission, /any age|all ages/i);
});

test('shop page never claims a live cart or checkout', () => {
  const html = read('shop.html');
  assert.match(html, /http-equiv="refresh" content="0; url=\/#prices"/);
  assert.doesNotMatch(html, /Add to cart|In stock/i);
  assert.match(read('js/shop.js'), /checkoutLive/);
  assert.doesNotMatch(read('js/shop.js'), /paypal|stripe|checkout\.session/i);
});

test('preorder page points at shop interest catalog', () => {
  const html = read('preorder.html');
  assert.match(html, /shop\.html/);
  assert.match(html, /Checkout is not live/i);
});
