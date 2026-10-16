const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');

test('partnership notes go through the map form instead of a mailto button', () => {
  const html = read('partners.html');
  assert.match(html, /href="\/map\/\?want=partner"/);
  assert.match(html, /hello@dtrtlab\.com/);
  assert.doesNotMatch(html, /Prepare email/);
  assert.doesNotMatch(html, /<form\b/i);
  assert.doesNotMatch(html, /<a\b[^>]*href="mailto:[^"]*"[^>]*class="[^"]*(?:btn|button|cta)/i);
  assert.doesNotMatch(html, /<a\b[^>]*class="[^"]*(?:btn|button|cta)[^"]*"[^>]*href="mailto:/i);
  assert.doesNotMatch(read('js/partners.js'), /mailto:/);
});
