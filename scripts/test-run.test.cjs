const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const data = JSON.parse(read('content/test-run.json'));

test('every test-run number carries a valid as-of stamp', () => {
  const keys = ['revenue', 'orders', 'adSpend', 'visitors'];
  for (const k of keys) {
    const m = data.metrics[k];
    assert.ok(m, `missing metric ${k}`);
    assert.ok(typeof m.display === 'string' && m.display.length, `${k} display`);
    assert.match(String(m.asOf || ''), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?-0[45]:00$/, `${k} needs an ET as-of stamp`);
    assert.ok(!isNaN(new Date(m.asOf)), `${k} as-of parses`);
    assert.ok(m.source, `${k} source`);
  }
});

test('panel markup shows an as-of line for each number', () => {
  const html = read('lab.html');
  const panel = html.slice(html.indexOf('<section id="test-run"'), html.indexOf('</section>', html.indexOf('tr-metrics')) + 10);
  for (const k of ['revenue', 'orders', 'adSpend', 'visitors']) {
    const card = panel.split(`data-metric="${k}"`)[1];
    assert.ok(card, `card ${k}`);
    assert.match(card.split('</article>')[0], /class="as-of">As of /, `${k} card as-of`);
  }
});

test('panel script makes no refresh or outside requests', () => {
  const js = read('js/test-run.js');
  assert.doesNotMatch(js, /setInterval|setTimeout|https?:\/\//);
});

test('served panel copy stays labeled as a test', () => {
  const served = read('js/test-run.js') + read('css/test-run.css') + read('content/test-run.json');
  // Banned internal and place terms are enforced by private-terms.test.cjs.
  assert.doesNotMatch(served, /ruling/i);
  assert.match(read('lab.html'), /TEST RUN/);
  assert.strictEqual(JSON.parse(read('content/shop.json')).checkoutLive, false);
});
