// Logo A ("D/ Refined") rollout: every icon size exists at the right pixel size, in Theme A colors.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const pngSize = (f) => { const b = fs.readFileSync(path.join(ROOT, f)); assert.strictEqual(b.toString('ascii', 1, 4), 'PNG', f); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
test('favicon, app icon, avatar and share-card sizes', () => {
  const want = {
    'img/brand/favicon-16.png': 16, 'img/brand/favicon-32.png': 32, 'img/brand/favicon-48.png': 48,
    'apple-touch-icon.png': 180, 'img/brand/apple-touch-icon.png': 180, 'img/brand/icon-192.png': 192, 'img/brand/icon-512.png': 512,
    'img/brand/avatar-a.png': 512, 'img/brand/avatar-a-400.png': 400, 'img/brand/avatar-a-1080.png': 1080,
  };
  for (const [f, n] of Object.entries(want)) assert.deepStrictEqual(pngSize(f), [n, n], f);
  for (const f of ['img/brand/og-theme-a.png', 'img/brand/og-owner-dashboard.png', 'img/brand/dtrt-social.png']) assert.deepStrictEqual(pngSize(f), [1200, 630], f);
  assert.ok(fs.statSync(path.join(ROOT, 'favicon.ico')).size > 0);
});
test('mark SVGs are Logo A in locked Theme A colors', () => {
  for (const f of ['img/brand/mark.svg', 'favicon.svg', 'img/icon.svg', 'img/brand/avatar-a.svg']) {
    const s = fs.readFileSync(path.join(ROOT, f), 'utf8');
    assert.match(s, /#0B2545/i, f); assert.match(s, /#13C27A/i, f);
    assert.match(s, /M288 448 L352 448 L480 64 L416 64 Z/, `${f}: Logo A slash`);
    assert.ok(!/#080808|#000000|#fafafa/i.test(s), `${f}: old black/white colorway`);
  }
  assert.match(fs.readFileSync(path.join(ROOT, 'img/brand/avatar-a.svg'), 'utf8'), /scale\(0\.68\)/);
});
test('head tags use the Logo A cache-buster', () => {
  const s = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(s, /mark\.svg\?v=la20261015/);
  assert.ok(!/\?v=ta20261015/.test(s));
});
