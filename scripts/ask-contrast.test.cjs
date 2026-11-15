const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'css/dream.css'), 'utf8');

function lin(channel) {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
function lum(hex) {
  const n = hex.replace('#', '');
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function ratio(fg, bg) {
  const hi = Math.max(lum(fg), lum(bg));
  const lo = Math.min(lum(fg), lum(bg));
  return (hi + 0.05) / (lo + 0.05);
}

test('new hero text is at least 4.5:1 on its background', () => {
  const pairs = [
    ['#f7fafc', '#070b18', '.hero-quiet'],
    ['#f7fafc', '#070b18', '.ask-note'],
    ['#f7fafc', '#070b18', '.ask-chips button'],
    ['#102c46', '#ffffff', '.ask-bubble'],
    ['#07111c', '#9ee6c5', '.ask-form button'],
    ['#102c46', '#ffffff', '#ask-keep-wrap']
  ];
  for (const [fg, bg, needle] of pairs) {
    assert.ok(css.includes(fg), needle + ' ' + fg);
    assert.ok(css.includes(bg) || bg === '#ffffff', needle + ' ' + bg);
    assert.ok(ratio(fg, bg) >= 4.5, needle + ' ' + ratio(fg, bg).toFixed(2));
  }
  assert.match(css, /\.dream-sky \.ask-bubble[\s\S]*color: #102c46/);
  assert.match(css, /\.ask-note[\s\S]*color: #f7fafc/);
  assert.match(css, /\.ask-note[\s\S]*background: #070b18/);
});
