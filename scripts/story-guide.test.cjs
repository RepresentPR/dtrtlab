const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

test('homepage fire guide is scripted, local, and has no phone number', () => {
  const html = read('index.html');
  const js = read('js/story-guide.mjs');
  const css = read('css/story-stage.css');
  const stage = html.match(/<div class="story-stage"[\s\S]*?<section class="assistant"/)?.[0] || '';
  assert.ok(stage, 'story stage is present before the existing assistant');
  assert.match(stage, /Curious\? Click/);
  assert.match(stage, /Text us \(number coming soon\)/);
  assert.match(stage, /Call us \(number coming soon\)/);
  assert.match(stage, /id="story-fire"/);
  assert.match(stage, /role="dialog"/);
  assert.match(stage, /aria-controls="story-guide"/);
  assert.match(html, /\/css\/story-stage\.css\?v=20261030-fire3/);
  assert.match(html, /\/js\/story-guide\.mjs\?v=20261030-fire3/);
  assert.match(css, /#0B2545/);
  assert.match(css, /#13C27A/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /animation:\s*none/);
  assert.match(css, /:focus-visible/);
  for (const file of [stage, js, css]) {
    assert.doesNotMatch(file, /tel:|sms:/i, 'no telephone or text-message links');
    assert.doesNotMatch(file, /\b\d{3}[-.\s)]\d{3}[-.\s]\d{4}\b/);
    assert.doesNotMatch(file, /\$\s?\d/);
  }
  assert.doesNotMatch(js, /fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|document\.cookie|WebSocket|innerHTML/);
  assert.equal(fs.existsSync(path.join(root, 'private.html')), false);
  assert.equal(fs.existsSync(path.join(root, 'private', 'index.html')), false);
});
