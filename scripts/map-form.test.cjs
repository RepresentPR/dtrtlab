const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const skip = new Set(['docs', 'scripts', 'tools', 'node_modules', 'brand-assets']);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.') || skip.has(entry.name)) return [];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.name.endsWith('.html') ? [full] : [];
  });
}

function anchors(html) {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((match) => ({
    attrs: match[1],
    text: match[2].replace(/<[^>]+>/g, '').trim()
  }));
}

function attr(tag, name) {
  const found = tag.match(new RegExp('\\b' + name + '\\s*=\\s*"([^"]*)"', 'i'));
  return found ? found[1] : '';
}

test('served HTML has no Reply SYSTEM text and no mailto button or CTA', () => {
  const pages = walk(root);
  assert.ok(pages.length > 20, 'found served HTML pages');
  for (const file of pages) {
    const html = fs.readFileSync(file, 'utf8');
    const rel = path.relative(root, file);
    assert.doesNotMatch(html, /Reply SYSTEM/, rel + ' still says Reply SYSTEM');
    for (const anchor of anchors(html)) {
      const href = attr('<a ' + anchor.attrs + '>', 'href');
      const cls = attr('<a ' + anchor.attrs + '>', 'class');
      if (/^mailto:/i.test(href) && /btn|button|cta/i.test(cls)) {
        assert.fail(rel + ' has a mailto CTA (' + cls + '): ' + href);
      }
    }
  }
});

test('/map/ posts the free office map form to FormSubmit', () => {
  const html = fs.readFileSync(path.join(root, 'map/index.html'), 'utf8');
  const formMatch = html.match(/<form\b[\s\S]*?<\/form>/i);
  assert.ok(formMatch, 'map page has a form');
  const form = formMatch[0];
  assert.match(form, /\bmethod="POST"/);
  assert.match(form, /\baction="https:\/\/formsubmit\.co\/b40eb14cdacd80c1b58eebb8ec124fe3"/);
  assert.doesNotMatch(form, /@/);
  assert.match(html, /Get your free office map/);
  assert.match(html, /Answer 3 short questions\. Your written map arrives within 3 business days\. No calls\./);
  assert.match(html, /Prefer email\?/);
  assert.match(html, /id="hello-email">hello@dtrtlab\.com</);
  assert.match(html, /id="copy-email"/);
  assert.doesNotMatch(html, /<a\b[^>]*href="mailto:/i, 'the map page does not use a mailto link');

  const tags = [...form.matchAll(/<(input|select|textarea)\b[^>]*>/gi)].map((match) => match[0]);
  const byName = new Map(tags.map((tag) => [attr(tag, 'name'), tag]));
  for (const name of ['Business name', 'Type of business', 'What eats most of your week?', 'email', 'Phone', '_honey', '_subject', '_captcha', '_template', '_next']) {
    assert.ok(byName.has(name), 'missing field ' + name);
  }
  assert.match(byName.get('Business name'), /\brequired\b/);
  assert.match(byName.get('Type of business'), /^<select\b/i);
  assert.match(byName.get('Type of business'), /\brequired\b/);
  assert.match(byName.get('What eats most of your week?'), /^<textarea\b/i);
  assert.match(byName.get('What eats most of your week?'), /\brequired\b/);
  assert.match(byName.get('email'), /\btype="email"/);
  assert.match(byName.get('email'), /\brequired\b/);
  assert.doesNotMatch(byName.get('Phone'), /\brequired\b/);
  assert.equal(attr(byName.get('_honey'), 'name'), '_honey');
  assert.equal(attr(byName.get('_subject'), 'value'), 'New office map request (dtrtlab.com)');
  assert.equal(attr(byName.get('_captcha'), 'value'), 'false');
  assert.equal(attr(byName.get('_template'), 'value'), 'table');
  assert.equal(attr(byName.get('_next'), 'value'), 'https://dtrtlab.com/map/thanks/');
  for (const option of ['HVAC', 'Plumbing', 'Electrical', 'Property management', 'Remodeling', 'Other']) {
    assert.match(form, new RegExp('<option>' + option + '</option>'));
  }
  assert.doesNotMatch(form, /name="[^"]*(town|address)[^"]*"/i, 'no town or address field');

  const thanks = fs.readFileSync(path.join(root, 'map/thanks/index.html'), 'utf8');
  assert.match(thanks, /Got it\. Your map is on the way within 3 business days\. Watch your inbox\./);
  assert.match(thanks, /<a\b[^>]*href="\/"[^>]*>Back home<\/a>/);

  const privacy = fs.readFileSync(path.join(root, 'legal/privacy.html'), 'utf8');
  assert.match(privacy, /The free office map form sends your answers by email through FormSubmit \(formsubmit\.co\) so we can write your map\. We use those answers only for that\./);
});

test('AGENTS.md and README.md do not publish retired offers', () => {
  const banned = ['$50', 'Mini Social Pack', 'Week Pack', 'Starter Fix', 'writing plan'];
  for (const name of ['AGENTS.md', 'README.md']) {
    const text = fs.readFileSync(path.join(root, name), 'utf8').toLowerCase();
    for (const phrase of banned) {
      assert.equal(text.includes(phrase.toLowerCase()), false, name + ' still says ' + phrase);
    }
  }
});
