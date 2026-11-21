const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'ask/index.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'ask/ui.js'), 'utf8');

test('Ask log opt-in stays hidden until a date flag and an audit routine', () => {
  assert.match(html, /<p id="ask-keep-wrap" hidden>/);
  assert.match(html, /<input id="ask-keep" type="checkbox">/);
  assert.doesNotMatch(html, /Let Ian keep/);
  assert.match(source, /showAfter:\s*""/);
  assert.doesNotMatch(source, /fetch\(|docs\.google|formResponse/);

  const wrap = { hidden: false };
  const box = { checked: true };
  const registered = [];
  const context = {
    document: {
      getElementById(id) {
        if (id === 'ask-keep-wrap') return wrap;
        if (id === 'ask-keep') return box;
        return null;
      }
    },
    navigator: {
      serviceWorker: {
        register(url) {
          registered.push(url);
          return Promise.resolve();
        }
      }
    },
    location: { protocol: 'https:' },
    Date,
    isFinite
  };
  context.window = context;
  vm.runInNewContext(source, context, { filename: 'ask/ui.js' });
  assert.equal(wrap.hidden, true);
  assert.equal(box.checked, false);
  assert.equal(context.DTRTAskLogOptIn.showAfter, '');
  const open = context.DTRTAskLogOptIn.open;
  assert.equal(open({ showAfter: '' }, Date.now(), function () {}), false);
  assert.equal(open({ showAfter: '2099-01-01' }, Date.parse('2026-11-15'), function () {}), false);
  assert.equal(open({ showAfter: '2000-01-01' }, Date.parse('2026-11-15'), undefined), false);
  assert.equal(open({ showAfter: '2000-01-01' }, Date.parse('2026-11-15'), function () {}), true);
  assert.deepEqual(registered, ['/sw.js?v=20261121-ig1']);
});
