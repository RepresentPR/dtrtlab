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
  assert.match(app, /syncOnLogin\(/);
  assert.match(app, /applyDelete\(/);
  assert.match(app, /keepAfterExpiredSession\(/);
  assert.doesNotMatch(app, /if \(!seen\.has\(local\.id\) && local\.messages/);
});

test('a 401 leftover thread is not shown or uploaded for the next account', () => {
  assert.equal(store.STORE_KEY, 'dtrt.chat.v1');
  const raw = JSON.stringify({
    chats: [{ id: 'left', title: 'From A', messages: [{ role: 'user', text: 'secret' }] }],
    activeId: 'left'
  });
  const loaded = store.readStore(raw);
  const expired = store.keepAfterExpiredSession(loaded);
  assert.equal(expired.user, null);
  assert.equal(expired.chats[0].id, 'left');
  const login = store.syncOnLogin(expired, 'b@example.com', []);
  assert.equal(login.visible.some((chat) => chat.id === 'left'), false);
  assert.equal(login.puts.some((chat) => chat.id === 'left'), false);
  const owned = store.readStore(JSON.stringify({
    owner: 'a@example.com',
    chats: [{ id: 'left', owner: 'a@example.com', title: 'From A', messages: [{ role: 'user', text: 'secret' }] }],
    activeId: 'left'
  }));
  const again = store.syncOnLogin(store.keepAfterExpiredSession(owned), 'b@example.com', []);
  assert.equal(again.visible.some((chat) => chat.id === 'left'), false);
  assert.equal(again.puts.some((chat) => chat.id === 'left'), false);
});

test('logout does not stamp guest threads with the previous account', () => {
  const loggedOut = store.logoutStore({
    chats: [],
    held: [
      { id: 'g', owner: '', messages: [{ role: 'user', text: 'guest' }] },
      { id: 'a', owner: 'a@example.com', messages: [{ role: 'user', text: 'ada' }] }
    ],
    tombstones: [],
    activeId: '',
    owner: 'a@example.com'
  });
  assert.equal(loggedOut.owner, '');
  assert.equal(loggedOut.chats[0].owner, '');
  const loaded = store.readStore(JSON.stringify(loggedOut));
  assert.equal(loaded.chats[0].owner || '', '');
  const login = store.syncOnLogin(loaded, 'a@example.com', []);
  assert.equal(login.visible.some((chat) => chat.id === 'g'), false);
  assert.equal(login.puts.some((chat) => chat.id === 'g'), false);
});

test('a failed chat fetch still hides the previous account', () => {
  const synced = store.syncOnLogin({
    chats: [{ id: 'a', owner: 'a@example.com', messages: [{ role: 'user', text: 'secret' }] }],
    held: [],
    tombstones: [],
    activeId: 'a',
    owner: 'a@example.com'
  }, 'b@example.com', []);
  assert.equal(synced.visible.some((chat) => chat.id === 'a'), false);
  assert.equal(synced.puts.length, 0);
  const app = fs.readFileSync(path.join(__dirname, '../ask/chat-app.js'), 'utf8');
  assert.match(app, /syncOnLogin\(snapshot\(\), data\.email, remote\)/);
  assert.match(app, /logoutStore\(snapshot\(\)\)/);
});

test('a 500 delete stays hidden when the session refresh returns the thread', () => {
  const open = store.syncOnLogin(store.readStore(JSON.stringify({
    owner: 'b@example.com',
    chats: [{ id: 't', owner: 'b@example.com', title: 'T', messages: [{ role: 'user', text: 'hi' }] }],
    activeId: 't'
  })), 'b@example.com', [{ id: 't', title: 'T', messages: [{ role: 'user', text: 'hi' }] }]);
  assert.equal(open.visible.some((chat) => chat.id === 't'), true);
  const failed = store.applyDelete({
    chats: open.visible,
    held: open.held,
    tombstones: open.tombstones,
    activeId: 't',
    owner: 'b@example.com'
  }, 't', 500);
  assert.equal(failed.visible.some((chat) => chat.id === 't'), false);
  assert.match(failed.error, /could not be deleted/);
  const refreshed = store.syncOnLogin(failed.store, 'b@example.com', [{ id: 't', title: 'T', messages: [{ role: 'user', text: 'hi' }] }]);
  assert.equal(refreshed.visible.some((chat) => chat.id === 't'), false);
  assert.equal(refreshed.puts.some((chat) => chat.id === 't'), false);
});
