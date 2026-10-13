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
    if (!nodes.has(id)) nodes.set(id, { value: '', textContent: '', hidden: false, required: false, disabled: true, attributes: {}, validity: { typeMismatch: false }, handlers: {}, addEventListener(k, fn) { this.handlers[k] = fn; }, setAttribute(k,v) { this.attributes[k]=v; }, removeAttribute(k) { delete this.attributes[k]; }, setCustomValidity(message) { this.validationMessage=message; }, focus() { this.focused = true; }, select() { this.selected = true; } });
    return nodes.get(id);
  }
  const names = ['category', 'subject', 'name', 'email', 'message', 'project', 'goal'];
  const controls = Object.fromEntries(names.map(n => [n, node('contact-' + n)]));
  const form = node('contact-form');
  form.elements = { namedItem: name => controls[name] };
  form.reportValidity = () => !Object.values(controls).some(control => control.validationMessage);
  controls.category.options = ['', 'Free plan', 'Paid project inquiry', 'Highlight', 'Partner', 'Work opportunity', 'Website', 'Other'].map(value => ({ value, textContent: value }));
  const copied = [];
  const urls = [];
  const location = { search, href: '' };
  const document = { getElementById: node, documentElement: { lang: 'en' }, title: '' };
  const context = vm.createContext({ document, window: { location, history: { replaceState(state,unused,url) { urls.push(url); } } }, URLSearchParams,
    navigator: { clipboard: { writeText: async text => { if (clipboardFails) throw Error('unavailable'); copied.push(text); } } },
    FormData: class { get(name) { return node('contact-fields').disabled ? '' : controls[name]?.value || ''; } }
  });
  vm.runInContext(source, context);
  return { node, controls, location, copied, urls, document, submit() { form.handlers.submit({target:form,preventDefault(){}}); }, change() { controls.category.handlers.change?.(); }, input() { form.handlers.input?.(); }, language(lang) { node('language-' + lang).handlers.click?.({ preventDefault() {} }); } };
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
  assert.equal(email.pathname, 'hello@dtrtlab.com');
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
  assert.equal(email.pathname,'hello@dtrtlab.com');
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

test('Spanish free-plan route localizes the actual email draft and keeps stable category values', () => {
  const p=page('?intent=free-plan&lang=es');
  assert.equal(p.document.documentElement.lang,'es');
  assert.equal(p.controls.category.value,'Free plan');
  assert.equal(p.controls.category.options.find(o=>o.value==='Free plan').textContent,'Plan gratuito');
  p.controls.project.value='Una panadería de barrio'; p.controls.goal.value='Explicar nuestra idea';
  p.submit();
  const email=new URL(p.location.href);
  assert.equal(email.pathname,'hello@dtrtlab.com');
  assert.equal(email.searchParams.get('subject'),'[Plan gratuito] Plan gratuito — negocio o idea');
  assert.match(email.searchParams.get('body'),/Enlace del negocio o idea: Una panadería de barrio\nObjetivo: Explicar nuestra idea/);
  assert.match(p.node('email-message').value,/Para: hello@dtrtlab.com\nAsunto: \[Plan gratuito\]/);
  assert.match(p.node('contact-status').textContent,/no ha enviado.*ni.*recepción/);
});

test('language switch retains typed information and a custom subject without putting it in the URL', () => {
  const p=page('?intent=paid-project');
  p.controls.subject.value='Mi proyecto & sus detalles'; p.controls.message.value='Privado: revisar el contenido';
  p.controls.name.value='Ejemplo'; p.controls.email.value='reply@example.test';
  p.language('es');
  assert.equal(p.document.documentElement.lang,'es');
  assert.equal(p.controls.subject.value,'Mi proyecto & sus detalles');
  assert.equal(p.controls.message.value,'Privado: revisar el contenido');
  assert.equal(p.controls.name.value,'Ejemplo');
  assert.equal(p.controls.email.value,'reply@example.test');
  assert.equal(p.urls.at(-1),'/contact.html?intent=paid-project&lang=es');
  assert.equal(p.node('contact-free-route').href,'/contact.html?intent=free-plan&lang=es');
  assert.equal(p.node('contact-support-route').href,'/support.html?lang=es');
  p.language('en');
  assert.equal(p.controls.category.value,'Paid project inquiry');
  assert.equal(p.controls.subject.value,'Mi proyecto & sus detalles');
  assert.equal(p.node('free-plan-fields').hidden,true);
  assert.equal(p.node('language-en').attributes['aria-current'],'page');
  assert.equal(p.node('language-es').attributes['aria-current'],undefined);
  assert.ok(p.urls.every(url=>!url.includes('Privado')&&!url.includes('reply')&&!url.includes('detalles')));
});

test('auto subjects translate both ways and category changes keep the chosen language', () => {
  const p=page('?intent=free-plan&lang=es');
  p.language('en');
  assert.equal(p.controls.subject.value,'Free plan — business or idea');
  p.language('es');
  assert.equal(p.controls.subject.value,'Plan gratuito — negocio o idea');
  p.controls.category.value='Paid project inquiry'; p.change();
  assert.equal(p.controls.subject.value,'Consultar sobre un proyecto de pago');
  assert.equal(p.urls.at(-1),'/contact.html?intent=paid-project&lang=es');
  assert.equal(p.controls.project.required,false);
  assert.equal(p.controls.message.required,true);
  assert.match(p.node('contact-context').textContent,/por escrito.*alcance.*presupuesto/);
});

test('Spanish optional email validation blocks a malformed address and clears after correction', () => {
  const p=page('?intent=paid-project&lang=es');
  p.controls.message.value='Un proyecto pequeño';
  p.controls.email.value='invalid'; p.controls.email.validity.typeMismatch=true; p.input();
  assert.match(p.controls.email.validationMessage,/correo.*válida/);
  p.submit(); assert.equal(p.location.href,'');
  p.controls.email.value='reply@example.test'; p.controls.email.validity.typeMismatch=false; p.input();
  assert.equal(p.controls.email.validationMessage,'');
  p.submit(); assert.match(p.location.href,/^mailto:/);
});

test('Spanish whitespace validation and copy denial give translated honest feedback', async () => {
  const p=page('?intent=free-plan&lang=es',true);
  p.controls.project.value=' '; p.controls.goal.value='Una meta'; p.submit();
  assert.equal(p.location.href,'');
  assert.match(p.node('contact-status').textContent,/negocio o idea.*objetivo/);
  p.controls.project.value='Un café'; p.input();
  await p.node('copy-message').handlers.click();
  assert.equal(p.node('email-message').selected,true);
  assert.match(p.node('contact-status').textContent,/c[óo]pialo manualmente/i);
  assert.match(p.node('contact-status').textContent,/no ha enviado/);
});

test('Spanish other-category inquiries translate labels without changing visitor text', async () => {
  const p=page('?lang=es');
  p.controls.category.value='Website'; p.controls.subject.value='Una pregunta'; p.controls.message.value='¿Cómo funciona?'; p.change();
  await p.node('copy-message').handlers.click();
  assert.match(p.copied[0],/Asunto: \[Sitio web\] Una pregunta/);
  assert.match(p.copied[0],/Categoría: Sitio web\n\n¿Cómo funciona\?/);
  assert.match(p.node('contact-status').textContent,/copiado.*no ha enviado/);
  assert.equal(p.location.href,'');
  assert.equal(p.urls.at(-1),'/contact.html?lang=es');
});

test('unsupported language values use English without a new recipient or language-service claim', () => {
  const p=page('?intent=free-plan&lang=fr&to=other@example.test');
  assert.equal(p.document.documentElement.lang,'en');
  assert.equal(p.controls.subject.value,'Free plan — business or idea');
  assert.equal(p.node('language-es').href,'/contact.html?intent=free-plan&lang=es');
});
