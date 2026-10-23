import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { update, parseCsv, DATA, bucket } from './update-live.mjs';
const seed = JSON.parse(fs.readFileSync(DATA, 'utf8'));

test('seed holds no invented numbers', () => {
  assert.deepEqual(seed.candles, []);
  assert.equal(seed.headline.growthPct7d, null);
  assert.equal(seed.headline.firstSale, false);
  for (const e of seed.log) { assert.equal(e.pos, null); assert.equal(e.neg, null); }
});
test('public board files carry no banned terms', () => {
  for (const f of ['live/board/live.json', 'live/board/index.html', 'live/board/board.js', 'live/board/board.css']) {
    assert.doesNotMatch(fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8'), /revenue|\$\d|mailto:|password|every 4 hours/i, f);
  }
});
test('board is hand-updated, unindexed, and the down candle clears 4.5:1', () => {
  const page = fs.readFileSync(new URL('../live/board/index.html', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../live/board/board.css', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../live/board/board.js', import.meta.url), 'utf8');
  assert.match(page, /<meta name="robots" content="noindex, nofollow">/);
  assert.doesNotMatch(page, /rel="canonical"/);
  assert.match(page, /Updated by hand<span id="asof">/);
  assert.doesNotMatch(page + css, /class="pill"|pill:before/);
  const red = (css.match(/--r:(#[0-9A-Fa-f]{6})/) || [])[1];
  assert.equal(red, '#FF7A7A');
  assert.match(js, new RegExp(red));
  const lin = (c) => (c /= 255, c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const blend = (fg, bg, a) => '#' + [16, 8, 0].map((s) => Math.round((parseInt(fg.slice(1), 16) >> s & 255) * a + (parseInt(bg.slice(1), 16) >> s & 255) * (1 - a)).toString(16).padStart(2, '0')).join('');
  for (const bg of ['#0a1f3b', blend('#0f2f57', '#0B2545', 0.7), blend('#0f2f57', '#13406f', 0.7)]) {
    assert.ok(ratio(red, bg) >= 4.5, `${red} on ${bg} is ${ratio(red, bg).toFixed(2)}`);
  }
});
test('blank score adds no candle; numeric score adds one per 4h bucket', () => {
  assert.equal(update(seed, { scores: parseCsv('date,dis\n2026-10-23,\n'), now: '2026-10-23T21:00:00Z' }).candles.length, 0);
  let d = update(seed, { scores: [{ date: '2026-10-23', dis: '100' }], now: '2026-10-23T21:00:00Z' });
  d = update(d, { scores: [{ date: '2026-10-23', dis: '110' }], now: '2026-10-23T22:00:00Z' });
  assert.equal(d.candles.length, 1); assert.deepEqual(d.candles[0], { t: bucket('2026-10-23T21:00:00Z'), o: 100, h: 110, l: 100, c: 110 });
  d = update(d, { scores: [{ date: '2026-10-24', dis: '95' }], now: '2026-10-24T01:00:00Z' });
  assert.equal(d.candles.length, 2); assert.equal(d.candles[1].o, 110);
});
test('changelog merges by date+title and blocks banned text (planted violation)', () => {
  const d = update(seed, { changes: [{ date: '2026-10-24', title: 'New CTA', pos: 3, neg: 1 }, { date: '2026-10-24', title: 'New CTA', pos: 4, neg: 1 }] });
  assert.equal(d.log.filter((e) => e.title === 'New CTA').length, 1);
  for (const bad of ['price $5', 'mail x@y.com', 'see https://x.test', 'api key abc']) {
    assert.throws(() => update(seed, { changes: [{ date: '2026-10-24', title: bad, pos: 1, neg: 0 }] }), /blocked/, bad);
  }
});
