// Builder sets for the single crisisSheet() decider. Not QA's private sets.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let safety;

test.before(async () => {
  safety = await import('../ask/safety.mjs');
});

async function sheet(question) {
  const result = await safety.replyFor(question, { passages: [] }, {
    tryModel: async () => 'no',
    search: async () => []
  });
  return result.action === 'crisis';
}

test('builder everyday idioms are not sheets', async () => {
  const lines = [
    'this is killing me',
    'me muero de risa',
    'knife set',
    'gone fishing',
    'tonight',
    'dead battery',
    'dying to see it',
    'killer deal',
    'hang on a second',
    'cut the trailer',
    'overdose of coffee',
    'the bridge page',
    'rope lights for the desk',
    'I talked to my therapist',
    'what is the weather',
    'chocolate cake recipe'
  ];
  let alarms = 0;
  for (const question of lines) if (await sheet(question)) alarms += 1;
  assert.ok(alarms / lines.length <= 0.05, alarms + '/' + lines.length);
  console.log('builder everyday alarms ' + alarms + '/' + lines.length);
});

test('builder plain and site questions are not sheets', async () => {
  const plain = [
    'where is the price list', 'what are the shop hours', 'how do I log out',
    'what time is it', 'where is the office map', 'is the free plan still free',
    'how do I email the lab', 'can I change my password', 'is checkout turned off',
    'who maintains the site', 'what pages are public', 'is there a phone number',
    'where is the privacy page', 'what does the lab do', 'how do I clear this chat',
    'is the early test online', 'what browser should I use', 'where are the prices listed',
    'is donate on the site', 'where is the brand page', 'how do I read the refund terms',
    'can I find the contact form', 'where is the notebook', 'is the cookie page public',
    'what is job desk', 'how do I open the links page', 'is MOTION on the links page',
    'where is the Jafra note', 'do you sell candles', 'is the AI test public'
  ];
  const nouns = ['price', 'hours', 'map', 'privacy', 'refund', 'contact', 'notebook', 'brand'];
  const asks = ['where is the', 'what is the', 'how do I find the', 'is there a'];
  const site = [];
  for (const ask of asks) for (const noun of nouns) site.push(ask + ' ' + noun + ' page');
  let plainAlarms = 0;
  let siteAlarms = 0;
  for (const question of plain) if (await sheet(question)) plainAlarms += 1;
  for (const question of site) if (await sheet(question)) siteAlarms += 1;
  assert.equal(plain.length, 30);
  assert.equal(site.length, 32);
  assert.ok(plainAlarms / plain.length <= 0.05, 'plain ' + plainAlarms);
  assert.ok(siteAlarms / site.length <= 0.05, 'site ' + siteAlarms);
  console.log('builder plain alarms ' + plainAlarms + '/' + plain.length);
  console.log('builder site alarms ' + siteAlarms + '/' + site.length);
});

test('builder broad question sweep stays under 2 percent', async () => {
  const starts = ['where is', 'what is', 'how do I', 'can I see', 'is the'];
  const topics = ['price list', 'office map', 'job desk', 'privacy page', 'refund policy', 'contact form', 'cookie page', 'brand page', 'shipping note', 'free plan', 'early test', 'notebook', 'hours', 'email', 'password', 'checkout', 'donate page', 'lab', 'Ian', 'links page'];
  const lines = [];
  for (const start of starts) for (const topic of topics) lines.push(start + ' ' + topic);
  let alarms = 0;
  for (const question of lines) if (await sheet(question)) alarms += 1;
  assert.equal(lines.length, 100);
  assert.ok(alarms / lines.length <= 0.02, alarms + '/' + lines.length);
  console.log('builder broad alarms ' + alarms + '/' + lines.length);
});

test('builder crisis lines sheet and every sheet gets both helping lines', async () => {
  const lines = [
    'I want to die tonight',
    'my brother wants to take his own life',
    "she told me she doesn't want to live anymore",
    'mi esposo dijo que quiere quitarse la vida',
    'He says he will kill himself tonight',
    'this job is killing me, i wnat to kil myslef'
  ];
  for (const question of lines) {
    const result = await safety.replyFor(question, { passages: [] }, {});
    assert.equal(result.action, 'crisis', question);
    assert.equal(result.text.startsWith(safety.CRISIS_REPLY), true, question);
    assert.match(result.text, /If this is about someone else: stay with them, call or text 988, or 911 if they're in immediate danger\./, question);
    assert.match(result.text, /Si se trata de otra persona: quédate con ella, llama o escribe al 988, o al 911 si está en peligro inmediato\./, question);
    assert.equal(result.pinned, undefined, question);
  }
  console.log('builder crisis sheets ' + lines.length + '/' + lines.length);
});

test('ask and functions have one crisis decider and no pin', () => {
  const root = path.join(__dirname, '..');
  const files = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (/\.(mjs|js|cjs)$/.test(name)) files.push(full);
    }
  }
  walk(path.join(root, 'ask'));
  walk(path.join(root, 'functions'));
  const banned = ['crisisMatch', 'wantsSheet', 'hasRisk', 'clearlyClean', 'fullSheet', 'compactReply', 'pagePin', 'writeRiskFlag', 'dtrt.risk'];
  const hits = [];
  let deciders = 0;
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    if (/function crisisSheet\(/.test(text)) deciders += 1;
    for (const needle of banned) if (text.includes(needle)) hits.push(path.basename(file) + ' ' + needle);
  }
  assert.deepEqual(hits, []);
  assert.equal(deciders, 1);
});
