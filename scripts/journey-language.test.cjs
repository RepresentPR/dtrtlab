const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

test('unused journey-language and contact scripts stay off the site', () => {
  assert.equal(fs.existsSync(path.join(root, 'js/journey-language.js')), false);
  assert.equal(fs.existsSync(path.join(root, 'js/contact.js')), false);
  for (const file of walk(root)) {
    const html = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(html, /journey-language\.js|\/js\/contact\.js|src="js\/contact\.js/, path.relative(root, file));
  }
});
