const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const catalog = read('storefront-preview.html');
const data = JSON.parse(read('content/storefront-candidates.json'));
const CLAIMS = /hydrat|weight[- ]?loss|\bdetox\b|anti-?anxiety|\banxiety\b|stress relief|\bcalming\b|\btherapeutic\b|\bmedical\b|\bcure\b|\bwellness\b|\bfocus\b|\bhealth\b/i;
const SUPPLIERS = /mysellerhub|spocket|\bdoba\b|aliexpress|amazonaws/i;

function checkLinks(file, html) {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, file + ' has duplicate ids');
  for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
    const [pathPart, frag] = href.split('#');
    if (frag) assert.ok(ids.includes(frag) || pathPart !== '', file + ' missing #' + frag);
    if (!pathPart) {
      assert.ok(ids.includes(frag), file + ' missing #' + frag);
      continue;
    }
    const rel = pathPart.replace(/^\//, '').split('?')[0];
    assert.ok(fs.existsSync(path.join(root, rel === '' ? 'index.html' : rel)), file + ' ' + href);
    if (frag && (rel === '' || rel.endsWith('.html'))) {
      const target = read(rel === '' ? 'index.html' : rel);
      assert.ok(target.includes('id="' + frag + '"'), file + ' anchor #' + frag);
    }
  }
  for (const [, src] of html.matchAll(/\bsrc="([^"]+)"/g)) {
    assert.ok(fs.existsSync(path.join(root, src.replace(/^\//, ''))), file + ' ' + src);
  }
}

test('draft catalog cannot collect money and keeps checkout off', () => {
  const shop = JSON.parse(read('content/shop.json'));
  assert.equal(shop.checkoutLive, false);
  assert.equal(shop.interestOpen, true);
  assert.equal(data.checkoutLive, false);
  assert.equal(data.preordersEnabled, false);
  assert.equal(data.ordersOpen, false);
  assert.equal(data.supplierCostConfirmed, false);
  assert.equal(data.supplierAgreementsVerified, false);
  assert.equal(data.visuals, 'illustrative_placeholder');
  const pages = ['storefront-preview.html', ...data.products.map(p => p.page)];
  for (const file of pages) {
    const html = read(file);
    assert.match(html, /name="robots" content="noindex,nofollow"/, file);
    assert.match(html, /script-src 'none'/, file);
    assert.match(html, /form-action 'none'/, file);
    assert.doesNotMatch(html, /<(?:script|form|input|iframe|button)\b/i, file);
    assert.doesNotMatch(html, /href="(?:https?:|mailto:)|schema\.org\/(?:Offer|Product)/i, file);
    assert.match(html, /Orders are not open\. Checkout is off\./, file);
    assert.doesNotMatch(html, /Add to cart|In stock|Buy now/i, file);
    checkLinks(file, html);
  }
  for (const name of ['Water bottle', 'Sunset lamp', 'Kinetic desk ball', 'HMBMO fidget slider', 'Flip-cube timer']) {
    assert.ok(!shop.products.some(p => p.name === name), name + ' stays out of shop.json');
  }
});

test('five brief products keep their prices, shipping, returns and illustrative art', () => {
  assert.equal(data.products.length, 5);
  assert.deepEqual(data.products.map(p => [p.name, p.priceUsd]), [
    ['Water bottle', 29.99],
    ['Sunset lamp', 29.99],
    ['Kinetic desk ball', 24.99],
    ['HMBMO fidget slider', 22.99],
    ['Flip-cube timer', 24.99]
  ]);
  assert.match(data.shipping, /Ships from the US in 1–3 business days/);
  assert.match(data.shipping, /about 3 days/);
  assert.match(data.shipping, /about 3–7 days/);
  assert.equal(data.returns, 'Full refund if the item is damaged or not delivered.');
  const active = catalog.slice(catalog.indexOf('id="collection"'), catalog.indexOf('id="held"'));
  const held = catalog.slice(catalog.indexOf('id="held"'));
  for (const p of data.products) {
    const page = read(p.page);
    const price = '$' + p.priceUsd.toFixed(2);
    assert.equal(p.orderable, false, p.id);
    assert.ok(page.includes(p.name), p.id);
    assert.ok(page.includes(price), p.id + ' price');
    assert.ok(page.includes(data.shipping), p.id + ' shipping');
    assert.ok(page.includes(data.returns), p.id + ' returns');
    assert.ok(page.includes(data.returnsLimit), p.id + ' returns limit');
    assert.match(page, /Illustrative\. Not a supplier photo\./, p.id);
    assert.match(page, /alt="Illustrative[^"]*Not a supplier photo\."/, p.id);
    assert.ok(fs.existsSync(path.join(root, p.image)), p.image);
    assert.ok(p.image.endsWith('.svg'), p.image);
    assert.doesNotMatch(read(p.image), /<image\b|xlink:href|\.jpe?g|\.png|\.webp/i, p.image);
    assert.ok(catalog.includes('id="' + p.id + '"'), p.id);
    assert.ok(catalog.includes(price), p.id + ' on catalog');
    const blob = page + '\n' + read(p.image);
    assert.doesNotMatch(blob, CLAIMS, p.id + ' claim');
    assert.doesNotMatch(blob, SUPPLIERS, p.id + ' supplier asset');
    const dollars = [...page.matchAll(/\$\d+(?:\.\d{2})?/g)].map(m => m[0]);
    assert.deepEqual([...new Set(dollars)], [price], p.id + ' unexpected price');
  }
  assert.ok(!active.includes('id="hmbmo-fidget-slider"'), 'slider stays out of the active grid');
  assert.ok(held.includes('id="hmbmo-fidget-slider"'));
  assert.match(held, /Coming soon/);
  const slider = data.products.find(p => p.id === 'hmbmo-fidget-slider');
  assert.equal(slider.hidden, true);
  assert.equal(slider.visibility, 'coming_soon');
  assert.match(read(slider.page), /Coming soon\. Not listed for sale\. Magnets and any hub logo are not verified\./);
  const ball = data.products.find(p => p.id === 'kinetic-desk-ball');
  assert.equal(ball.ageLabel, '14+');
  assert.match(read(ball.page), /Sold for ages 14 and up/);
  assert.match(read(ball.page), /Not marketed to children/);
  assert.doesNotMatch(catalog + read(ball.page), /\bunder 12\b|\bfor kids\b/i);
  assert.doesNotMatch(catalog, CLAIMS);
  assert.doesNotMatch(JSON.stringify(data), CLAIMS);
});

test('homepage snapshot and rollback hash preserve current production source', () => {
  const manifest = JSON.parse(read('docs/archive/2026-10-22-storefront/manifest.json'));
  const archive = read(manifest.homepageSnapshot);
  assert.equal(archive, read('index.html'));
  assert.equal(crypto.createHash('sha256').update(archive).digest('hex'), manifest.homepageSha256);
  assert.equal(manifest.productionHomepageChanged, false);
  assert.equal(manifest.checkoutLive, false);
});
