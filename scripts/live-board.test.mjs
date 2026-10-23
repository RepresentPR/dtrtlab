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
  for (const f of ['live/board/live.json', 'live/board/index.html', 'live/board/board.js']) {
    assert.doesNotMatch(fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8'), /revenue|\$\d|mailto:|password/i, f);
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
