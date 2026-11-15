const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const photo = path.join(root, 'img/ian/hero.jpg');
const recordPath = path.join(root, 'docs/studio/IAN-OK');

function jpegSize(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error('not a jpeg');
  let i = 2;
  while (i + 8 < buf.length) {
    if (buf[i] !== 0xff) throw new Error('bad jpeg marker');
    const marker = buf[i + 1];
    if (marker === 0xd8 || marker === 0xd9) { i += 2; continue; }
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc2) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  throw new Error('jpeg has no size');
}

test('the homepage shows the night gradient until Ian approves a photo', () => {
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const record = fs.readFileSync(recordPath, 'utf8');
  assert.match(record, /img\/ian\/hero\.jpg/);
  assert.doesNotMatch(home, /hero\.jpg|hero-photo|js\/hero-photo\.js/);
  assert.equal(fs.existsSync(path.join(root, 'js/hero-photo.js')), false);
  if (!fs.existsSync(photo)) {
    assert.match(home, /class="[^"]*\bdream-sky\b/);
    return;
  }
  const spec = JSON.parse(record.slice(record.indexOf('{')));
  const buf = fs.readFileSync(photo);
  const size = jpegSize(buf);
  const sha = crypto.createHash('sha256').update(buf).digest('hex');
  assert.ok(spec.sha256, 'studio IAN-OK needs a sha256');
  assert.equal(sha, spec.sha256);
  assert.equal(size.width, spec.width);
  assert.equal(size.height, spec.height);
});
