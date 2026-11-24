const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let store;

test.before(async () => {
  store = await import('../ask/chat-store.mjs');
});

test('login does not upload another account\'s local threads', () => {
  const chats = [
    { id: 'a', owner: 'ada@example.com', messages: [{ role: 'user', text: 'private' }] },
    { id: 'g', owner: '', messages: [{ role: 'user', text: 'guest' }] },
    { id: 'b', owner: 'Bea@Example.com', messages: [{ role: 'user', text: 'mine' }] }
  ];
  const split = store.splitForAccount(chats, 'bea@example.com');
  assert.deepEqual(split.mine.map((chat) => chat.id), ['b']);
  assert.deepEqual(split.held.map((chat) => chat.id), ['a', 'g']);
  const upload = store.chatsToUpload(split.mine, new Set());
  assert.deepEqual(upload.map((chat) => chat.id), ['b']);
  assert.equal(upload.some((chat) => chat.owner === 'ada@example.com'), false);
  assert.match(store.quarantineStatus(split.held), /another account/);
  assert.equal(store.quarantineStatus([{ id: 'g', owner: '' }]), '');
  const app = fs.readFileSync(path.join(__dirname, '../ask/chat-app.js'), 'utf8');
  assert.match(app, /splitForAccount/);
  assert.match(app, /chatsToUpload/);
  assert.match(app, /retryDeletes/);
});

test('a failed delete stays hidden and says so after repeated failures', () => {
  const chats = [
    { id: 'keep', owner: 'ada@example.com', messages: [{ role: 'user', text: 'stay' }] },
    { id: 'gone', owner: 'ada@example.com', messages: [{ role: 'user', text: 'remove' }] }
  ];
  let tombs = store.noteDelete([], 'gone');
  assert.deepEqual(store.hideDeleted(chats, tombs).map((chat) => chat.id), ['keep']);
  tombs = store.recordDeleteResult(tombs, 'gone', false);
  tombs = store.recordDeleteResult(tombs, 'gone', false);
  assert.match(store.deleteStatus(tombs), /tried again/);
  tombs = store.recordDeleteResult(tombs, 'gone', false);
  assert.match(store.deleteStatus(tombs), /could not be deleted/);
  assert.deepEqual(store.hideDeleted(chats, tombs).map((chat) => chat.id), ['keep']);
  tombs = store.recordDeleteResult(tombs, 'gone', true);
  assert.equal(store.deleteStatus(tombs), '');
  assert.equal(tombs.length, 0);
});
