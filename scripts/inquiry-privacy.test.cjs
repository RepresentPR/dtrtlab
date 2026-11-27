const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');

test('partnership page is retired and points at the shop, not a mailto or map form', () => {
  const html = read('partners.html');
  assert.match(html, /href="\/mercado\/"/);
  assert.doesNotMatch(html, /href="\/map\//);
  assert.doesNotMatch(html, /Email hello@dtrtlab\.com or prepare a brief/);
  assert.doesNotMatch(html, /Or write hello@dtrtlab\.com/);
  assert.doesNotMatch(html, /Prepare email/);
  assert.doesNotMatch(html, /<form\b/i);
  assert.doesNotMatch(html, /mailto:/);
  assert.equal(fs.existsSync(path.join(__dirname, '..', 'js/partners.js')), false);
});
