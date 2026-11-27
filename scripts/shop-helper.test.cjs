const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const shop = require('./shop-helper.cjs');

test('shopping helper matches English keywords to catalog cards', () => {
  const energy = shop.search('energy caffeine', 'en');
  assert.ok(energy.length);
  assert.equal(energy[0].id, 'motion');
  assert.match(energy[0].why, /MOTION/i);
  assert.doesNotMatch(energy[0].why, /live AI|inteligencia artificial en vivo/i);
  const beauty = shop.search('skin perfume makeup', 'en');
  assert.equal(beauty[0].id, 'jafra');
  const ask = shop.search('chatbot', 'en');
  assert.equal(ask[0].id, 'ai');
  const biz = shop.search('negocio', 'en');
  assert.equal(biz[0].id, 'biz');
  const trade = shop.search('crypto trading', 'en');
  assert.equal(trade[0].id, 'candles');
  const bizEn = shop.search('office', 'en');
  assert.ok(bizEn.some((m) => m.id === 'biz'));
});

test('shopping helper matches Spanish keywords to catalog cards', () => {
  const energy = shop.search('energía cafeína', 'es');
  assert.equal(energy[0].id, 'motion');
  assert.match(energy[0].why, /Coincide con/);
  const beauty = shop.search('maquillaje belleza', 'es');
  assert.equal(beauty[0].id, 'jafra');
  const ask = shop.search('chatbot', 'es');
  assert.equal(ask[0].id, 'ai');
  const biz = shop.search('negocio', 'es');
  assert.equal(biz[0].id, 'biz');
  const trade = shop.search('trading cripto', 'es');
  assert.equal(trade[0].id, 'candles');
  const bizEs = shop.search('oficina', 'es');
  assert.ok(bizEs.some((m) => m.id === 'biz'));
});

test('shopping helper folds accents on known allowlist tokens', () => {
  assert.equal(shop.isSafeProductQuery('cafeína energía').ok, true);
  assert.equal(shop.search('cafeina energia', 'es')[0].id, 'motion');
  assert.equal(shop.isSafeProductQuery('i want to die').ok, false);
  assert.equal(shop.isSafeProductQuery('drink jafra').ok, false);
});

test('unknown or crisis tokens show no catalog cards (allowlist gate)', () => {
  assert.equal(shop.isSafeProductQuery('xyzzy airplane tickets').ok, true);
  assert.equal(shop.isSafeProductQuery('boletos de avion xyzzy').ok, true);
  assert.equal(shop.isSafeProductQuery('i want to die lol').ok, false);
  assert.equal(shop.isSafeProductQuery('quiero matarme').ok, false);
  assert.equal(shop.isSafeProductQuery('energy caffeine').ok, true);
});

test('shopping helper returns no matches and stays a catalog helper, not live AI', () => {
  assert.deepEqual(shop.search('xyzzy airplane tickets', 'en'), []);
  assert.deepEqual(shop.search('boletos de avion xyzzy', 'es'), []);
  const src = fs.readFileSync(path.join(__dirname, 'shop-helper.cjs'), 'utf8');
  assert.doesNotMatch(src, /fetch\(|XMLHttpRequest|openai|anthropic|generativelanguage/i);
  assert.match(src, /Not a live AI/);
  const home = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  assert.match(home, /Shopping helper \(beta\) — matches our catalog/);
  assert.match(home, /Asistente de compras \(beta\) — coincide con nuestro catálogo/);
  assert.doesNotMatch(home, /live AI shopping|AI is live/i);
  assert.doesNotMatch(home, /Añadir al carrito|Add to cart/i);
  assert.doesNotMatch(home, /\b(checkout cart|shopping cart)\b/i);
});
