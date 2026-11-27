const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const shop = require('../js/shop-helper.js');

test('shopping helper matches English keywords to catalog cards', () => {
  const energy = shop.search('energy caffeine', 'en');
  assert.ok(energy.length);
  assert.equal(energy[0].id, 'motion');
  assert.match(energy[0].why, /MOTION/i);
  assert.doesNotMatch(energy[0].why, /live AI|inteligencia artificial en vivo/i);
  const beauty = shop.search('skin perfume makeup', 'en');
  assert.equal(beauty[0].id, 'jafra');
  const ai = shop.search('chatbot for my business', 'en');
  assert.equal(ai[0].id, 'ai');
  const trade = shop.search('crypto trading', 'en');
  assert.equal(trade[0].id, 'candles');
  const sell = shop.search('sell with you', 'en');
  assert.ok(sell.some((m) => m.id === 'sell'));
});

test('shopping helper matches Spanish keywords to catalog cards', () => {
  const energy = shop.search('energía cafeína', 'es');
  assert.equal(energy[0].id, 'motion');
  assert.match(energy[0].why, /Coincide con/);
  const beauty = shop.search('maquillaje belleza', 'es');
  assert.equal(beauty[0].id, 'jafra');
  const ai = shop.search('negocio chatbot', 'es');
  assert.equal(ai[0].id, 'ai');
  const trade = shop.search('trading cripto', 'es');
  assert.equal(trade[0].id, 'candles');
  const sell = shop.search('quiero vender', 'es');
  assert.ok(sell.some((m) => m.id === 'sell'));
});

test('shopping helper is typo-tolerant after accent folding', () => {
  assert.equal(shop.search('caffiene', 'en')[0].id, 'motion');
  assert.equal(shop.search('maquilaje', 'es')[0].id, 'jafra');
  assert.equal(shop.search('cafeina energia', 'es')[0].id, 'motion');
});

test('shopping helper returns no matches and stays a catalog helper, not live AI', () => {
  assert.deepEqual(shop.search('xyzzy airplane tickets', 'en'), []);
  assert.deepEqual(shop.search('boletos de avion xyzzy', 'es'), []);
  const src = fs.readFileSync(path.join(__dirname, '../js/shop-helper.js'), 'utf8');
  assert.doesNotMatch(src, /fetch\(|XMLHttpRequest|openai|anthropic|generativelanguage/i);
  assert.match(src, /Not a live AI/);
  const home = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  assert.match(home, /Shopping helper \(beta\) — matches our catalog/);
  assert.match(home, /Asistente de compras \(beta\) — coincide con nuestro catálogo/);
  assert.doesNotMatch(home, /live AI shopping|AI is live/i);
  assert.doesNotMatch(home, /Añadir al carrito|Add to cart/i);
  assert.doesNotMatch(home, /\b(checkout cart|shopping cart)\b/i);
});
