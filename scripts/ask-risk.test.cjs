// Session pin is history only. A plain question with no crisis in
// history does not show it.
const test = require('node:test');
const assert = require('node:assert/strict');

let safety;

test.before(async () => {
  safety = await import('../ask/safety.mjs');
});

function pageFor(name) {
  return [{ passage: { title: name, url: '/' + name, text: 'The ' + name + ' page is public.' }, score: 9 }];
}

test('a positive crisis match in history pins the next plain answer', async () => {
  const crisis = 'I would rather not be here';
  const opened = await safety.replyFor(crisis, { passages: [] }, {});
  assert.equal(opened.action, 'crisis');
  const still = await safety.replyFor('what is job desk', { passages: [] }, {
    history: [crisis],
    search: async () => pageFor('job')
  });
  assert.notEqual(still.action, 'crisis');
  assert.equal(still.pinned, undefined);
  const alone = await safety.replyFor('what is job desk', { passages: [] }, {
    search: async () => pageFor('job')
  });
  assert.equal(alone.pinned, undefined);
});

test('an ordinary unmatched question does not show the session pin', async () => {
  const result = await safety.replyFor('I have lost the will to carry on', { passages: [] }, {
    search: async () => pageFor('notebook')
  });
  assert.equal(result.action, 'crisis');
  assert.ok(result.text.startsWith(safety.CRISIS_REPLY));
  assert.equal(result.pinned, undefined);
});
