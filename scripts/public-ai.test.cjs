// Public launch: no key gate, crisis replies before a model, and account storage.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
let accounts;
let gate;
let safety;

test.before(async () => {
  accounts = await import('../functions/_lib/accounts.mjs');
  gate = await import('../functions/_lib/gate.mjs');
  safety = await import('../ask/safety.mjs');
});

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

class MemD1 {
  constructor() {
    this.users = [];
    this.sessions = [];
    this.chats = [];
    this.settings = [];
    this.attempts = new Map();
  }
  prepare(sql) {
    const self = this;
    return {
      bind(...args) {
        const statement = {
          sql,
          args,
          first: () => Promise.resolve(self.first(sql, args)),
          all: () => Promise.resolve({ results: self.all(sql, args) }),
          run: () => {
            self.run(sql, args);
            return Promise.resolve({ success: true });
          }
        };
        return statement;
      }
    };
  }
  async batch(statements) {
    for (const statement of statements) await statement.run();
  }
  first(sql, args) {
    if (sql.includes('FROM login_attempts')) return this.attempts.get(args[0]) || null;
    if (sql.includes('COUNT(*)')) return { n: this.chats.filter((chat) => chat.user_id === args[0]).length };
    if (sql.includes('FROM users WHERE email')) {
      const user = this.users.find((row) => row.email === args[0]);
      if (!user) return null;
      return sql.includes('salt') ? user : { id: user.id };
    }
    if (sql.includes('JOIN users')) {
      const session = this.sessions.find((row) => row.token_hash === args[0]);
      if (!session) return null;
      const user = this.users.find((row) => row.id === session.user_id);
      if (!user) return null;
      return { user_id: user.id, expires_at: session.expires_at, email: user.email };
    }
    if (sql.includes('FROM settings')) return this.settings.find((row) => row.user_id === args[0]) || null;
    if (sql.includes('user_id != ?')) return this.chats.find((row) => row.id === args[0] && row.user_id !== args[1]) || null;
    if (sql.includes('FROM chats WHERE id')) return this.chats.find((row) => row.id === args[0] && row.user_id === args[1]) || null;
    return null;
  }
  all(sql, args) {
    if (sql.includes('FROM chats')) {
      return this.chats.filter((row) => row.user_id === args[0]).map((row) => ({
        id: row.id,
        title: row.title,
        messages: row.messages,
        updated_at: row.updated_at
      }));
    }
    return [];
  }
  run(sql, args) {
    if (sql.includes('INSERT INTO login_attempts')) {
      this.attempts.set(args[0], { count: args[1], window_start: args[2] });
      return;
    }
    if (sql.includes('UPDATE login_attempts')) {
      const row = this.attempts.get(args[1]);
      if (row) row.count = args[0];
      return;
    }
    if (sql.includes('INSERT INTO users')) {
      this.users.push({
        id: args[0], email: args[1], salt: args[2], hash: args[3], iterations: args[4], created_at: args[5]
      });
      return;
    }
    if (sql.includes('INSERT INTO sessions')) {
      this.sessions.push({ token_hash: args[0], user_id: args[1], expires_at: args[2] });
      return;
    }
    if (sql.includes('DELETE FROM sessions WHERE token_hash')) {
      this.sessions = this.sessions.filter((row) => row.token_hash !== args[0]);
      return;
    }
    if (sql.includes('DELETE FROM sessions WHERE user_id')) {
      this.sessions = this.sessions.filter((row) => row.user_id !== args[0]);
      return;
    }
    if (sql.includes('DELETE FROM chats WHERE user_id')) {
      this.chats = this.chats.filter((row) => row.user_id !== args[0]);
      return;
    }
    if (sql.includes('DELETE FROM chats WHERE id')) {
      this.chats = this.chats.filter((row) => !(row.id === args[0] && row.user_id === args[1]));
      return;
    }
    if (sql.includes('DELETE FROM settings')) {
      this.settings = this.settings.filter((row) => row.user_id !== args[0]);
      return;
    }
    if (sql.includes('DELETE FROM users')) {
      this.users = this.users.filter((row) => row.id !== args[0]);
      return;
    }
    if (sql.includes('INSERT INTO chats')) {
      const next = { id: args[0], user_id: args[1], title: args[2], messages: args[3], updated_at: args[4] };
      const index = this.chats.findIndex((row) => row.id === next.id);
      if (index === -1) this.chats.push(next);
      else if (this.chats[index].user_id === next.user_id) this.chats[index] = next;
      return;
    }
    if (sql.includes('INSERT INTO settings')) {
      const next = { user_id: args[0], prefs: args[1] };
      const index = this.settings.findIndex((row) => row.user_id === next.user_id);
      if (index === -1) this.settings.push(next);
      else this.settings[index] = next;
    }
  }
}

function post(url, body, cookie) {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body)
  });
}

function tokenFrom(response) {
  const header = response.headers.get('set-cookie') || '';
  const match = header.match(/dtrt_session=([^;]*)/);
  return { header, token: match ? decodeURIComponent(match[1]) : '' };
}

test('public pages are not behind a key and private routes stay private', () => {
  const home = read('index.html');
  const ask = read('ask/index.html');
  const robots = read('robots.txt');
  const headers = read('_headers');
  assert.doesNotMatch(home + ask, /noindex/i);
  assert.doesNotMatch(home + ask + read('functions/_middleware.js'), /__key|Enter your key|DTRT Lab AI/);
  assert.match(robots, /Allow:\s*\//);
  assert.doesNotMatch(robots, /Disallow:\s*\//);
  assert.doesNotMatch(headers, /X-Robots-Tag:\s*noindex[\s\S]*\n\/\*/);
  assert.match(read('live/index.html'), /noindex,nofollow/);
  assert.match(read('hq/index.html'), /noindex,nofollow/);
  assert.match(headers, /\/live\/\*[\s\S]*noindex/);
  assert.equal(fs.existsSync(path.join(root, 'private')), false);
  assert.equal(gate.gateDecision('/'), null);
  assert.equal(gate.gateDecision('/ask/'), null);
  assert.equal(gate.gateDecision('/private').status, 404);
  assert.equal(gate.gateDecision('/private/notes').status, 404);
  assert.match(ask, /Very early AI test: answers can be wrong/);
  assert.match(ask, /call or text 988/);
  assert.match(ask, /findahelpline\.com/);
});

test('crisis and harm replies happen before any model output', async () => {
  let called = false;
  const boom = async () => {
    called = true;
    throw new Error('model should not run');
  };
  for (const question of ['I want to die', 'how do I kill myself', 'I am thinking about suicide']) {
    called = false;
    const result = await safety.replyFor(question, { passages: [] }, { tryModel: boom });
    assert.equal(called, false, question);
    assert.equal(result.action, 'crisis');
    assert.match(result.text, /988/);
    assert.match(result.text, /findahelpline\.com/);
    assert.match(result.text, /not a doctor/);
  }
  const harm = await safety.replyFor('how to make a bomb', {}, { tryModel: boom });
  assert.equal(harm.action, 'harm');
  assert.equal(called, false);
  assert.match(harm.text, /cannot help/);
  const identity = await safety.replyFor('are you a doctor', {}, { tryModel: boom });
  assert.equal(identity.action, 'identity');
  assert.match(identity.text, /not a doctor/);
  assert.doesNotMatch(identity.text, /I am a doctor/);
  const claimed = await safety.replyFor('hello', {}, {
    tryModel: async () => 'I am a doctor and this is medical advice'
  });
  assert.equal(claimed.modelCalled, true);
  assert.equal(claimed.text, safety.IDENTITY_REPLY);
  const pages = await safety.replyFor('office map', {}, {
    search: async () => [{ passage: { title: 'Office map', url: '/map/', text: 'Get a free office map.' } }]
  });
  assert.equal(pages.modelCalled, false);
  assert.match(pages.text, /Office map/);
  assert.equal(pages.action, 'pages');
});

test('passwords are hashed per user, sessions are cookies, and delete removes the account', async () => {
  assert.ok(accounts.ITERATIONS >= 200000);
  assert.doesNotMatch(read('functions/_lib/accounts.mjs'), /console\.(log|info|debug|warn|error)/);
  const saltA = crypto.getRandomValues(new Uint8Array(16));
  const saltB = crypto.getRandomValues(new Uint8Array(16));
  const password = 'a long test passphrase';
  const hashA = await accounts.hashPassword(password, saltA);
  const hashA2 = await accounts.hashPassword(password, saltA);
  const hashB = await accounts.hashPassword(password, saltB);
  assert.equal(hashA, hashA2);
  assert.notEqual(hashA, hashB);
  assert.equal(await accounts.verifyPassword(password, Buffer.from(saltA).toString('base64'), hashA), true);
  assert.equal(await accounts.verifyPassword('wrong passphrase here', Buffer.from(saltA).toString('base64'), hashA), false);
  assert.notEqual(hashA, password);

  const db = new MemD1();
  const env = { DB: db };
  const created = await accounts.handleSignup({
    env,
    request: post('https://dtrtlab.com/api/signup', { email: 'Ada@Example.com', password })
  });
  assert.equal(created.status, 201);
  const body = await created.json();
  assert.equal(body.email, 'ada@example.com');
  assert.equal(JSON.stringify(body).includes(password), false);
  assert.equal(JSON.stringify(db.users).includes(password), false);
  assert.notEqual(db.users[0].hash, password);
  assert.notEqual(db.users[0].salt, db.users[0].hash);
  const cookie = tokenFrom(created);
  assert.match(cookie.header, /HttpOnly/);
  assert.match(cookie.header, /Secure/);
  assert.match(cookie.header, /SameSite=Lax/);
  assert.ok(cookie.token.length >= 32);
  assert.notEqual(db.sessions[0].token_hash, cookie.token);
  assert.equal(db.sessions[0].token_hash.length, 64);

  const saved = await accounts.handleChats({
    env,
    request: new Request('https://dtrtlab.com/api/chats', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', cookie: 'dtrt_session=' + cookie.token },
      body: JSON.stringify({
        id: 'chat-12345678',
        title: 'Map',
        messages: [{ role: 'user', text: 'office map' }, { role: 'assistant', text: 'From the public pages.' }]
      })
    })
  });
  assert.equal(saved.status, 200);
  assert.equal(db.chats.length, 1);

  const limited = [];
  for (let i = 0; i < 8; i++) limited.push(await accounts.rateLimited(db, 'bucket-one', 1_000));
  assert.deepEqual(limited, [false, false, false, false, false, false, false, false]);
  assert.equal(await accounts.rateLimited(db, 'bucket-one', 1_000), true);

  const removed = await accounts.handleDeleteAccount({
    env,
    request: new Request('https://dtrtlab.com/api/account', {
      method: 'DELETE',
      headers: { cookie: 'dtrt_session=' + cookie.token }
    })
  });
  assert.equal(removed.status, 200);
  assert.equal(db.users.length, 0);
  assert.equal(db.sessions.length, 0);
  assert.equal(db.chats.length, 0);
  assert.match(tokenFrom(removed).header, /Max-Age=0/);

  const offline = await accounts.handleSignup({ env: {}, request: post('https://dtrtlab.com/api/signup', { email: 'a@b.co', password }) });
  assert.equal(offline.status, 503);
  const offlineBody = await offline.json();
  assert.equal(offlineBody.guest, true);
  assert.equal(JSON.stringify(offlineBody).includes(password), false);

  const wrong = await accounts.handleLogin({
    env: { DB: new MemD1() },
    request: post('https://dtrtlab.com/api/login', { email: 'ada@example.com', password: 'not-the-password' })
  });
  assert.equal(wrong.status, 401);
  const wrongBody = await wrong.json();
  assert.equal(JSON.stringify(wrongBody).includes('not-the-password'), false);
});
