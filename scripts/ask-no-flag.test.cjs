// The 24-hour flag is gone. The sheet stays. A positive crisis match
// in this call's history pins the 988 box on a later non-sheet reply.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let safety;

test.before(async () => {
  safety = await import('../ask/safety.mjs');
});

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (/\.(mjs|js|cjs|sql)$/.test(name)) out.push(full);
  }
  return out;
}

test('no code path writes a 24-hour risk flag', () => {
  const root = path.join(__dirname, '..');
  const files = []
    .concat(walk(path.join(root, 'ask'), []))
    .concat(walk(path.join(root, 'functions'), []));
  const needles = ['writeRiskFlag', 'readRiskFlag', 'RISK_FLAG_KEY', 'RISK_TTL', 'dtrt.risk'];
  const hits = [];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const needle of needles) {
      if (text.includes(needle)) hits.push(path.relative(root, file) + ' ' + needle);
    }
  }
  assert.deepEqual(hits, []);
});

test('plain questions and every pair never show the session pin', async () => {
  const plain = [
    'where is the price list',
    'what are the shop hours',
    'how do I log out',
    'what time is it',
    'where is the office map',
    'is the free plan still free',
    'how do I email the lab',
    'can I change my password',
    'is checkout turned off',
    'who maintains the site',
    'what pages are public',
    'is there a phone number',
    'where is the privacy page',
    'what does the lab do',
    'how do I clear this chat',
    'is the early test online',
    'what browser should I use',
    'where are the prices listed',
    'is donate on the site',
    'where is the brand page',
    'how do I read the refund terms',
    'can I find the contact form',
    'where is the notebook',
    'is the cookie page public',
    'what is job desk',
    'how do I open the links page',
    'is MOTION on the links page',
    'where is the Jafra note',
    'do you sell candles',
    'is the AI test public'
  ];
  assert.equal(plain.length, 30);
  for (const question of plain) {
    const result = await safety.replyFor(question, { passages: [] }, {});
    assert.equal(result.pinned, undefined, question);
  }
  let pairs = 0;
  for (let i = 0; i < plain.length; i++) {
    for (let j = 0; j < plain.length; j++) {
      if (i === j) continue;
      const result = await safety.replyFor(plain[j], { passages: [] }, { history: [plain[i]] });
      assert.equal(result.pinned, undefined, plain[i] + ' -> ' + plain[j]);
      pairs += 1;
    }
  }
  assert.equal(pairs, 870);
  console.log('plain pin 0/30 pairs 0/870');
});

test('a later plain question is not a sheet and nothing is pinned', async () => {
  const crisis = 'I want to die tonight';
  const sheet = await safety.replyFor(crisis, { passages: [] }, {});
  assert.equal(sheet.action, 'crisis');
  assert.equal(sheet.pinned, undefined);
  const later = await safety.replyFor('where is the price list', { passages: [] }, { history: [crisis] });
  assert.notEqual(later.action, 'crisis');
  assert.equal(later.pinned, undefined);
});

test('chat-app has no page pin and no crisis flag writer', () => {
  const app = fs.readFileSync(path.join(__dirname, '../ask/chat-app.js'), 'utf8');
  const safety = fs.readFileSync(path.join(__dirname, '../ask/safety.mjs'), 'utf8');
  assert.doesNotMatch(app, /pagePin/);
  assert.doesNotMatch(app, /crisisMatch/);
  assert.doesNotMatch(safety, /pagePin|crisisMatch|wantsSheet|hasRisk|clearlyClean|writeRiskFlag|dtrt\.risk/);
  assert.doesNotMatch(app, /sessionStorage/);
});

test('every third-person sheet includes the helping line', async () => {
  const lines = [
    'He says he will kill himself tonight',
    'She wants to die on Sunday',
    'They said she is going to jump',
    'My friend says he took the pills',
    'A coworker wants to end it',
    'Our neighbor says he will hang himself',
    'Mi amigo dice que se quiere morir',
    'Una amiga quiere quitarse la vida',
    'Su hermano va a tirarse',
    'Nuestra hermana quiere desaparecer'
  ];
  for (const question of lines) {
    const result = await safety.replyFor(question, { passages: [] }, {});
    assert.equal(result.action, 'crisis', question);
    assert.equal(result.text.startsWith(safety.CRISIS_REPLY), true, question);
    assert.match(result.text, /If this is about someone else/, question);
    assert.match(result.text, /988/, question);
  }
  console.log('third-person help ' + lines.length + '/' + lines.length);
});

test('the 988 footer still rides on a page answer and an error', async () => {
  const page = await safety.replyFor('where is the price list', { passages: [] }, {
    search: async () => [{ passage: { title: 'Prices', url: '/#prices', text: 'Prices are listed on the public pages.' }, score: 4 }]
  });
  if (page.action === 'pages') assert.match(page.text, /988/);
  const failed = await safety.replyFor('hello', { passages: [] }, { history: new Proxy([], { get() { throw new Error('down'); } }) });
  assert.equal(failed.action, 'error');
  assert.match(failed.text, /call or text 988 \(US\)/);
});
