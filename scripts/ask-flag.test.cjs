// The stored 24-hour flag is gone. A positive crisis match pins the
// 988 box only for a later reply in the same in-memory history.
const test = require('node:test');
const assert = require('node:assert/strict');

let safety;

test.before(async () => {
  safety = await import('../ask/safety.mjs');
});

test('the session pin follows history and is not stored', async () => {
  const crisis = "I'd rather be dead";
  const opened = await safety.replyFor(crisis, { passages: [] }, {});
  assert.equal(opened.action, 'crisis');
  assert.equal(opened.pinned, undefined);
  const again = await safety.replyFor('what is job desk', { passages: [] }, {
    history: [crisis],
    search: async () => [{ passage: { title: 'Job desk', url: '/lab.html', text: 'Job desk is a public page.' }, score: 9 }]
  });
  assert.notEqual(again.action, 'crisis');
  assert.equal(again.pinned, undefined);
  const fresh = await safety.replyFor('what is job desk', { passages: [] }, {
    search: async () => [{ passage: { title: 'Job desk', url: '/lab.html', text: 'Job desk is a public page.' }, score: 9 }]
  });
  assert.equal(fresh.pinned, undefined);
});
