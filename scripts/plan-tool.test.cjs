const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const plan = require('../js/plan-tool.js');
const root = path.join(__dirname, '..');

test('plan tool exposes guided steps, draft helpers, and contact handoff URL', () => {
  assert.deepEqual(plan.STEPS, ['type', 'project', 'goal', 'ready']);
  assert.equal(plan.DRAFT_KEY, 'dtrt-plan-draft');
  assert.equal(plan.contactHandoffUrl('es'), '/contact.html?intent=free-plan&lang=es#free-plan-fields');
  assert.equal(plan.contactHandoffUrl('en'), '/contact.html?intent=free-plan&lang=en#free-plan-fields');
  assert.ok(plan.strings.en.goals.length >= 4);
  assert.equal(plan.strings.en.goals.length, plan.strings.es.goals.length);
});

test('draft save/read/clear round-trips public plan fields only', () => {
  const store = new Map();
  const storage = {
    getItem: key => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(key, String(value)); },
    removeItem: key => { store.delete(key); }
  };
  assert.equal(plan.saveDraft({ type: 'idea', project: '  A café idea  ', goal: ' Clearer hours ' }, 'es', storage), true);
  const draft = plan.readDraft(storage);
  assert.deepEqual(draft, { type: 'idea', project: 'A café idea', goal: 'Clearer hours' });
  plan.clearDraft(storage);
  assert.equal(plan.readDraft(storage), null);
});

test('homepage mounts plan tool markup without network or form posts', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const tool = html.match(/id="plan-tool"[\s\S]*?<\/div>\s*<div class="free-plan-intake"/)?.[0] || html.match(/id="plan-tool"[\s\S]*?data-plan-next[\s\S]*?<\/div>/)?.[0];
  assert.ok(tool || html.includes('id="plan-tool"'));
  assert.match(html, /data-plan-prepare/);
  assert.match(html, /class="app-tabs"/);
  assert.match(html, /data-app-more-open/);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'js/plan-tool.js'), 'utf8'), /fetch\(|XMLHttpRequest|sendBeacon|mailto:/);
  assert.match(fs.readFileSync(path.join(root, 'js/plan-tool.js'), 'utf8'), /sessionStorage/);
});

test('contact page consumes plan draft into free-plan fields then clears it', () => {
  const store = { 'dtrt-plan-draft': JSON.stringify({ project: 'https://example.com', goal: 'More clarity', lang: 'en' }) };
  const storage = {
    getItem: key => store[key] || null,
    removeItem: key => { delete store[key]; }
  };
  const fields = {
    project: { value: '' },
    goal: { value: '' }
  };
  const document = {
    getElementById: id => id === 'contact-project' ? fields.project : id === 'contact-goal' ? fields.goal : null
  };
  assert.equal(plan.applyContactDraft(document, storage), true);
  assert.equal(fields.project.value, 'https://example.com');
  assert.equal(fields.goal.value, 'More clarity');
  assert.equal(store['dtrt-plan-draft'], undefined);
});
