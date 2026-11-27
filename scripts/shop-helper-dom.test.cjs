'use strict';
/* DOM-level tests: a small document stand-in loads the real
   js/mercado-allowlist.js + js/mercado-helper.js, types into #mk-q,
   fires input, then asserts the 988 sheet / cards / empty state. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { nonLatin, emoji, mixedCase, spanishEnglish } = require('./qa-shop-queries.cjs');
const r5 = require('./mercado-allowlist-r5-cases.json');

const CRISIS = nonLatin.concat(emoji, mixedCase, spanishEnglish);
assert.equal(CRISIS.length, 137, 'QA crisis set is 137 inputs');

const allowSrc = fs.readFileSync(path.join(__dirname, '../js/mercado-allowlist.js'), 'utf8');
const helperSrc = fs.readFileSync(path.join(__dirname, '../js/mercado-helper.js'), 'utf8');

function el(tag, attrs) {
  const e = {
    tagName: String(tag).toUpperCase(),
    childNodes: [],
    attributes: Object.assign({}, attrs || {}),
    _hidden: false,
    className: (attrs && attrs.className) || '',
    listeners: Object.create(null),
    value: '',
    textContent: (attrs && attrs.textContent) || '',
    href: (attrs && attrs.href) || '',
    parentNode: null,
    style: {},
    classList: {
      toggle(name, on) {
        const parts = e.className.split(/\s+/).filter(Boolean);
        const has = parts.indexOf(name) !== -1;
        if (on === true || (on === undefined && !has)) {
          if (!has) parts.push(name);
        } else if (has) parts.splice(parts.indexOf(name), 1);
        e.className = parts.join(' ');
      }
    },
    get hidden() { return e._hidden; },
    set hidden(v) { e._hidden = !!v; },
    get firstChild() { return e.childNodes[0] || null; },
    getAttribute(n) { return Object.prototype.hasOwnProperty.call(e.attributes, n) ? e.attributes[n] : null; },
    setAttribute(n, v) { e.attributes[n] = String(v); },
    appendChild(c) { e.childNodes.push(c); c.parentNode = e; return c; },
    removeChild(c) { e.childNodes = e.childNodes.filter((x) => x !== c); return c; },
    addEventListener(t, fn) { (e.listeners[t] || (e.listeners[t] = [])).push(fn); },
    dispatchEvent(ev) { (e.listeners[ev.type] || []).forEach((fn) => fn(ev)); }
  };
  if (attrs && attrs.id) e.id = attrs.id;
  return e;
}

function setup(lang) {
  const ids = Object.create(null);
  const cards = [];
  function add(node) {
    if (node.id) ids[node.id] = node;
    return node;
  }
  const input = add(el('input', { id: 'mk-q' }));
  const crisis = add(el('div', { id: 'mk-crisis' }));
  crisis.hidden = true;
  crisis.appendChild(el('a', { href: 'tel:988' }));
  const empty = add(el('p', { id: 'mk-empty' }));
  empty.hidden = true;
  empty.textContent = 'No match, see all products';
  const seeWrap = add(el('p', { id: 'mk-see-all-wrap' }));
  seeWrap.hidden = true;
  const seeBtn = add(el('button', { id: 'mk-see-all' }));
  seeBtn.textContent = 'See all products';
  seeWrap.appendChild(seeBtn);
  const grid = add(el('ul', { id: 'mk-grid' }));
  const copy = {
    jafra: "My mom's Jafra shop beauty perfume",
    ia: 'DTRT Lab AI for business chatbot office',
    motion: 'MOTION caffeine pouches energy mint',
    candles: 'Candles trading app crypto'
  };
  ['jafra', 'ia', 'motion', 'candles'].forEach((id) => {
    const c = el('li', { className: 'mk-card store-card' });
    c.id = 'card-' + id;
    c.setAttribute('data-id', id);
    c.setAttribute('data-cat', id);
    c.textContent = copy[id];
    c.hidden = false;
    grid.appendChild(c);
    cards.push(c);
    add(c);
  });

  const all = [input, crisis, empty, seeWrap, seeBtn, grid].concat(cards);
  const documentElement = { lang: lang || 'en' };
  const location = { search: '?lang=' + (lang || 'en') };
  const document = {
    documentElement,
    title: '',
    readyState: 'complete',
    getElementById(id) { return ids[id] || null; },
    querySelector(sel) {
      if (sel === '.mk-search' || sel === '.mk-tiles') return null;
      return document.querySelectorAll(sel)[0] || null;
    },
    querySelectorAll(sel) {
      if (sel === '#mk-grid .mk-card' || sel === '.mk-card') return cards.slice();
      if (sel === '.mk-tiles button' || sel === '#mk-chips button') return [];
      if (sel === '[data-i18n]' || sel === '[data-i18n="switch"]') return [];
      return [];
    },
    createElement(tag) { return el(tag); },
    addEventListener() {}
  };
  const window = { document, location, DtrtMercado: null };
  document.defaultView = window;
  const ctx = {
    window,
    document,
    location,
    URLSearchParams,
    console,
    globalThis: null
  };
  ctx.globalThis = ctx;
  ctx.window = window;
  vm.createContext(ctx);
  vm.runInContext(allowSrc, ctx);
  window.DtrtMercado = ctx.DtrtMercado || (ctx.globalThis && ctx.globalThis.DtrtMercado) || window.DtrtMercado;
  if (!window.DtrtMercado) {
    // allowlist attaches to globalThis; in the context that is ctx
  }
  // Re-run attach: the IIFE used ctx as globalThis
  if (!window.DtrtMercado && ctx.DtrtMercado) window.DtrtMercado = ctx.DtrtMercado;
  vm.runInContext(helperSrc, ctx);
  return { document, input, crisis, empty, seeWrap, seeBtn, grid, cards, ctx, window };
}

function type(env, q) {
  env.input.value = q;
  env.input.dispatchEvent({ type: 'input' });
}

function visibleCards(env) {
  return env.cards.filter((c) => !c.hidden).map((c) => c.getAttribute('data-id'));
}

function isCrisisShown(env) {
  if (env.crisis.hidden) return false;
  const hasTel = env.crisis.childNodes.some((n) => n.href === 'tel:988');
  return hasTel && visibleCards(env).length === 0;
}


test('DOM: r5 crisis and ingest+nonfood lines show the 988 sheet and hide every card', () => {
  const env = setup('en');
  const missed = [];
  const list = r5.crisisIngestAndMore.concat(r5.briefRequiredCrisis, [
    'суицид caffeine', '自杀 caffeine', '死にたい', 'أريد أن أموت', 'хочу умереть',
    '💀', '☠️', 'i want to die', 'kill me', 'please kill me', 'matarme'
  ]);
  for (const q of list) {
    type(env, q);
    if (!isCrisisShown(env)) missed.push(q);
  }
  assert.deepEqual(missed, []);
});

test('DOM: non-Latin and emoji input does not fold to empty; scripts and harm emoji get 988, ordinary emoji get a no-match', () => {
  const env = setup('en');
  const fold = env.window.DtrtMercado.fold || env.ctx.DtrtMercado.fold;
  for (const q of ['死にたい', '我想死', '안녕하세요', 'مرحبا', 'שלום', '🙂🛍️', '💀']) {
    assert.notEqual(String(fold(q)).trim(), '', 'fold(' + q + ') must not be empty');
  }
  for (const q of ['死にたい', '我想死', '죽고 싶다', 'أريد أن أموت', 'אני רוצה למות', 'मैं मरना चाहता हूँ', 'อยากตาย', 'θέλω να πεθάνω', 'хочу умереть', '💀', '☠️', '🪦', '⚰️']) {
    type(env, q);
    assert.equal(isCrisisShown(env), true, q);
    assert.deepEqual(visibleCards(env), []);
  }
  for (const q of ['🙂', '🙂🙂', '???']) {
    type(env, q);
    assert.equal(env.crisis.hidden, true, q + ' must not 988');
    assert.deepEqual(visibleCards(env), [], q + ' must not show the catalog');
    assert.equal(env.empty.hidden, false, q + ' shows a friendly no-match');
  }
});

test('DOM: drink/tomar/beber/swallow/eat plus a non-food noun shows 988; pack quantity is not an exception', () => {
  const env = setup('en');
  for (const q of ['drink jafra', 'drink jafra products', 'drink cosmetica', 'drink 20 cans of motion', 'drink belleza', 'drink skin', 'eat candle wax', 'beber perfume', 'swallow lotion']) {
    type(env, q);
    assert.equal(isCrisisShown(env), true, q);
  }
});

test('DOM: fresh shop150 stays under 5% false alarms; killer deal and killing-me idioms pass', () => {
  const env = setup('en');
  const alarms = [];
  for (const q of r5.shop150) {
    type(env, q);
    if (!env.crisis.hidden) alarms.push(q);
  }
  const rate = alarms.length / r5.shop150.length;
  assert.ok(
    rate <= 0.05,
    'false alarms ' + alarms.length + '/' + r5.shop150.length + ' = ' + (rate * 100).toFixed(1) + '%: ' + alarms.slice(0, 20).join(' | ')
  );
  for (const q of ['killer deal', 'this price is killing me', '2 cans of motion', 'promo code', 'returns', 'shampoo']) {
    type(env, q);
    assert.equal(env.crisis.hidden, true, q + ' must not raise a 988 sheet');
  }
});

test('DOM: digits and price/quantity wording next to a product stay safe and can match', () => {
  const env = setup('en');
  for (const q of ['2 cans of motion', 'how much is motion', 'cuánto cuesta jafra', '3 pack motion']) {
    type(env, q);
    assert.equal(env.crisis.hidden, true, q + ' must not 988');
  }
  type(env, '2 cans of motion');
  assert.ok(visibleCards(env).indexOf('motion') !== -1, '2 cans of motion shows the MOTION card');
  type(env, 'cuánto cuesta jafra');
  assert.ok(visibleCards(env).indexOf('jafra') !== -1, 'cuánto cuesta jafra shows the Jafra card');
});

test('DOM: safe no-match queries show the empty state, hide cards, do not 988, and do not recurse', () => {
  const env = setup('en');
  for (const q of ['hours', 'download', 'check page', 'xyzzy airplane tickets']) {
    type(env, q);
    assert.equal(env.crisis.hidden, true, q + ' must not 988');
    assert.deepEqual(visibleCards(env), [], q + ' hides cards');
    assert.equal(env.empty.hidden, false, q + ' shows empty state');
  }
});

test('DOM: 0 throws across a 233+ query sweep including crisis and shopping', () => {
  const env = setup('en');
  const thrown = [];
  const sweep = r5.shop150.concat(r5.crisisIngestAndMore, r5.briefRequiredCrisis, r5.idiomNoTrigger, [
    '2 cans of motion', 'how much is motion', 'cuánto cuesta jafra',
    'hours', 'download', 'check page', 'killer deal', '🙂', '???', ''
  ]);
  assert.ok(sweep.length >= 233);
  for (const q of sweep) {
    try { type(env, q); } catch (err) { thrown.push(q + ': ' + (err && err.message)); }
  }
  assert.deepEqual(thrown, []);
});
