const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');

function page(search = '', clipboardFails = false) {
  const html = fs.readFileSync(path.join(root, 'contact.html'), 'utf8');
  const scriptPath = html.match(/<script src="(\/js\/contact\.js)[^"]*"/);
  const source = scriptPath ? fs.readFileSync(path.join(root, scriptPath[1]), 'utf8') : html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const nodes = new Map();
  function node(id) {
    if (!nodes.has(id)) nodes.set(id, { value: '', textContent: '', hidden: false, required: false, disabled: true, handlers: {}, addEventListener(k, fn) { this.handlers[k] = fn; }, focus() { this.focused = true; }, select() { this.selected = true; } });
    return nodes.get(id);
  }
  const names = ['category', 'subject', 'name', 'email', 'message', 'project', 'goal'];
  const controls = Object.fromEntries(names.map(n => [n, node('contact-' + n)]));
  const form = node('contact-form');
  form.elements = { namedItem: name => controls[name] };
  form.reportValidity = () => true;
  const copied = [];
  const location = { search, href: '' };
  const context = vm.createContext({ document: { getElementById: node }, window: { location }, URLSearchParams,
    navigator: { clipboard: { writeText: async text => { if (clipboardFails) throw Error('unavailable'); copied.push(text); } } },
    FormData: class { get(name) { return node('contact-fields').disabled ? '' : controls[name]?.value || ''; } }
  });
  vm.runInContext(source, context);
  return { node, controls, location, copied, submit() { form.handlers.submit({target:form,preventDefault(){}}); }, change() { controls.category.handlers.change?.(); }, input() { form.handlers.input?.(); } };
}

test('homepage free-plan intent survives as category, subject and two labeled details in the email draft', () => {
  const p = page('?intent=free-plan');
  assert.equal(p.controls.category.value, 'Free plan');
  assert.equal(p.controls.subject.value, 'Free plan — business or idea');
  assert.match(p.node('email-message').value, /Subject: \[Free plan\] Free plan — business or idea/,'initial fallback must preserve context even before typing');
  assert.equal(p.controls.project.required, true);
  assert.equal(p.controls.goal.required, true);
  p.controls.project.value = 'A café idea & a community garden';
  p.controls.goal.value = 'Find one useful first offer';
  p.submit();
  const email = new URL(p.location.href);
  assert.equal(email.protocol, 'mailto:');
  assert.equal(email.pathname, 'DTRTCollision@outlook.com');
  assert.equal(email.searchParams.get('subject'), '[Free plan] Free plan — business or idea');
  assert.match(email.searchParams.get('body'), /Business link or idea: A café idea & a community garden\nGoal: Find one useful first offer/);
  assert.match(p.node('contact-status').textContent, /not sent/i);
});

test('blank or whitespace-only free-plan details cannot open an email draft', () => {
  for (const [project,goal] of [['  ','A goal'], ['An idea','\n ']]) {
    const p = page('?intent=free-plan');
    p.controls.project.value = project;
    p.controls.goal.value = goal;
    p.submit();
    assert.equal(p.location.href, '');
    assert.match(p.node('contact-status').textContent, /link or idea.*goal/i);
  }
});

test('paid inquiry preserves its own context and does not require free-plan fields', () => {
  const p = page('?intent=paid-project');
  assert.equal(p.controls.category.value, 'Paid project inquiry');
  assert.equal(p.controls.subject.value, 'Discuss a paid project');
  assert.equal(p.controls.project.required, false);
  assert.equal(p.node('free-plan-fields').hidden, true);
  p.controls.message.value = 'Discuss a small project';
  p.submit();
  assert.equal(new URL(p.location.href).searchParams.get('subject'), '[Paid project inquiry] Discuss a paid project');
});

test('unknown query input cannot inject email recipients or override the default route', () => {
  const p = page('?intent=not-an-offer&subject=stolen&to=other@example.test');
  assert.equal(p.controls.category.value, '');
  assert.equal(p.controls.subject.value, '');
  p.controls.category.value='Website'; p.controls.subject.value='A question\r\nBcc: other@example.test'; p.controls.message.value='A site question';
  p.submit();
  const email=new URL(p.location.href);
  assert.equal(email.pathname,'DTRTCollision@outlook.com');
  assert.doesNotMatch(email.searchParams.get('subject'), /[\r\n]/);
  assert.equal(email.searchParams.has('bcc'),false);
});

test('copy fallback includes current details but never opens an email or claims delivery', async () => {
  const p = page('?intent=free-plan');
  p.controls.project.value='A useful idea'; p.controls.goal.value='Explain it clearly'; p.input();
  assert.equal(typeof p.node('copy-message').handlers.click,'function','copy fallback must be usable');
  await p.node('copy-message').handlers.click();
  assert.match(p.copied[0], /Subject: \[Free plan\] Free plan — business or idea/);
  assert.match(p.copied[0], /Business link or idea: A useful idea\nGoal: Explain it clearly/);
  assert.equal(p.location.href,'');
  assert.match(p.node('contact-status').textContent,/not sent/i);
});

test('clipboard denial selects a readable fallback instead of claiming a successful copy', async () => {
  const p=page('?intent=free-plan',true);
  assert.equal(typeof p.node('copy-message').handlers.click,'function','copy fallback must be usable');
  await p.node('copy-message').handlers.click();
  assert.equal(p.node('email-message').selected,true);
  assert.match(p.node('contact-status').textContent,/copy manually/i);
  assert.doesNotMatch(p.node('contact-status').textContent,/copied/i);
  assert.equal(p.location.href,'');
});
