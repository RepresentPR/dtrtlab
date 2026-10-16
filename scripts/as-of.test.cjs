const test = require('node:test');
const assert = require('node:assert/strict');
const { parseEt, asOfLabel } = require('../js/as-of.js');

test('a stale proof timestamp is labeled as of that time and is not called live', () => {
  const stamp = '2026-10-15 19:36 ET';
  const at = parseEt(stamp);
  assert.equal(typeof at, 'number');
  const stale = asOfLabel(stamp, at + 3 * 60 * 60 * 1000);
  assert.equal(stale, 'as of 2026-10-15 19:36 ET');
  assert.doesNotMatch(stale, /live|every 2 hours/i);
  const edge = asOfLabel(stamp, at + 2 * 60 * 60 * 1000);
  assert.equal(edge, 'as of 2026-10-15 19:36 ET');
});

test('a timestamp under 2 hours old may say the refresh is current', () => {
  const stamp = '2026-10-15 19:36 ET';
  const at = parseEt(stamp);
  const fresh = asOfLabel(stamp, at + 30 * 60 * 1000);
  assert.match(fresh, /^live · updated every 2 hours · as of 2026-10-15 19:36 ET$/);
  assert.equal(at, Date.parse('2026-10-15T23:36:00Z'));
  const winter = '2026-01-15 12:00 ET';
  const winterAt = parseEt(winter);
  assert.equal(winterAt, Date.parse('2026-01-15T17:00:00Z'));
  assert.match(asOfLabel(winter, winterAt + 1000), /live · updated every 2 hours · as of 2026-01-15 12:00 ET/);
});

test('a missing or future timestamp is not called live', () => {
  assert.equal(asOfLabel(''), 'as of unknown');
  assert.equal(asOfLabel('not a time'), 'as of not a time');
  const stamp = '2026-10-15 19:36 ET';
  const future = asOfLabel(stamp, parseEt(stamp) - 60 * 1000);
  assert.equal(future, 'as of 2026-10-15 19:36 ET');
});
