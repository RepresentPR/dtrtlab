const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');

const pages = [
  { name: 'contact', file: 'contact.html', script: () => read('js/contact.js') },
  { name: 'partner', file: 'partners.html', script: () => read('js/partners.js') }
];

for (const page of pages) {
  test(`${page.name} inquiry has no enabled submission fields without JavaScript`, () => {
    const html = read(page.file);
    const form = html.match(new RegExp(`<form\\b[^>]*id="${page.name}-form"[^>]*>([\\s\\S]*?)<\\/form>`))[1];
    const fieldset = form.match(/<fieldset\b[^>]*\bdisabled(?:\s|>)[\s\S]*?<\/fieldset>/);
    assert.ok(fieldset, 'all editable fields must start in a disabled fieldset');
    assert.doesNotMatch(form.replace(fieldset[0], ''), /<(?:input|select|textarea|button)\b/i, 'no control can submit outside the disabled fieldset');
    assert.doesNotMatch(fieldset[0], /<legend\b/i, 'controls in a fieldset legend are not disabled by their ancestor');
    assert.match(html, /<noscript>[\s\S]*?<a\b[^>]*href="mailto:DTRTCollision@outlook\.com[^\"]*"[\s\S]*?<\/noscript>/, 'no-script readers retain the direct business email path');
  });

  function initialize(failRegistration = false) {
    let submit;
    let disabled = true;
    const fields = {
      get disabled() { return disabled; },
      set disabled(value) {
        assert.equal(typeof submit, 'function', 'do not expose fields until the submit guard is attached');
        disabled = value;
      }
    };
    const form = {
      reportValidity: () => true,
      addEventListener(type, handler) {
        if (failRegistration) throw new Error('registration unavailable');
        if (type === 'submit') submit = handler;
      }
    };
    const values = { name: 'Example Person', email: 'private@example.test', message: 'Private inquiry', category: 'Other', subject: 'Example', brand: 'Example Brand' };
    const controls = new Map();
    const control = id => {
      if (!controls.has(id)) controls.set(id, { value: values[id.replace('contact-', '')] || '', textContent: '', addEventListener() {} });
      return controls.get(id);
    };
    form.elements = { namedItem: name => control('contact-' + name) };
    const location = { href: '', search: '' };
    const status = { textContent: '' };
    const context = vm.createContext({
      document: { getElementById: id => id === `${page.name}-form` ? form : id === `${page.name}-fields` ? fields : id === 'partner-status' ? status : control(id) },
      window: { location },
      URLSearchParams,
      FormData: class { get(key) { return values[key] || ''; } }
    });
    return { run: () => vm.runInContext(page.script(), context), fields, form, location, submit: () => submit };
  }

  test(`${page.name} enables fields only after the email-only submit handler is attached`, () => {
    const ui = initialize();
    ui.run();
    assert.equal(ui.fields.disabled, false);
    let prevented = false;
    ui.submit()({ target: ui.form, preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
    assert.match(ui.location.href, /^mailto:DTRTCollision@outlook\.com\?/);
    assert.match(new URL(ui.location.href).searchParams.get('body'), /Private inquiry/);
  });

  test(`${page.name} leaves fields disabled when initialization fails`, () => {
    const ui = initialize(true);
    assert.throws(ui.run, /registration unavailable/);
    assert.equal(ui.fields.disabled, true);
    assert.equal(ui.location.href, '');
  });
}
