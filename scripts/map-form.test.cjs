const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { isExcluded, loadExclude } = require('./stage-site.cjs');
const root = path.join(__dirname, '..');
const CANONICAL = "Answer 3 short questions and you'll get a free one-page office map within 3 business days.";
const exclude = loadExclude();

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).split(path.sep).join('/');
    if (isExcluded(rel, exclude)) return [];
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
  assert.equal(html.split(CANONICAL).length - 1, 3, 'map metas and subline use the canonical sentence');
  assert.match(html, /Prefer email\?/);
  assert.match(html, /id="hello-email">hello@dtrtlab\.com</);
  assert.match(html, /class="btn line sm"[^>]*id="copy-email"/);
  assert.match(html, /<span class="ask">Phone \(optional\)<\/span>/);
  assert.doesNotMatch(html, /<a\b[^>]*href="mailto:/i, 'the map page does not use a mailto link');
  assert.match(html, /value="Free office map" required checked/);
  assert.match(html, /value="Free AI visibility check" required/);
  assert.match(html, /value="Partnership" required/);
  const wantJs = fs.readFileSync(path.join(root, 'js/map-want.js'), 'utf8');
  assert.match(wantJs, /want === 'check'[\s\S]*Free AI visibility check/);
  assert.match(wantJs, /want === 'partner'[\s\S]*Partnership/);

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
  assert.equal(attr(byName.get('_subject'), 'value'), 'New request (dtrtlab.com)');
  assert.ok(byName.has('What do you want'), 'missing field What do you want');
  assert.equal(attr(byName.get('_captcha'), 'value'), 'false');
  assert.equal(attr(byName.get('_template'), 'value'), 'table');
  assert.equal(attr(byName.get('_next'), 'value'), 'https://dtrtlab.com/map/thanks/');
  for (const option of ['HVAC', 'Plumbing', 'Electrical', 'Property management', 'Remodeling', 'Other']) {
    assert.match(form, new RegExp('<option>' + option + '</option>'));
  }
  assert.doesNotMatch(form, /name="[^"]*(town|address)[^"]*"/i, 'no town or address field');

  const thanks = fs.readFileSync(path.join(root, 'map/thanks/index.html'), 'utf8');
  assert.match(thanks, /Got it\. Watch your inbox\. You'll hear back within 3 business days\./);
  assert.doesNotMatch(thanks, /Your map is on the way/);
  assert.match(thanks, /<a\b[^>]*href="\/"[^>]*>Back home<\/a>/);

  const privacy = fs.readFileSync(path.join(root, 'legal/privacy.html'), 'utf8');
  assert.match(privacy, /The form on \/map\/ sends your answers by email through FormSubmit \(formsubmit\.co\) so we can write your map, run the free AI check, or reply to a partnership note\. We use those answers only for that\./);
});

test('the FormSubmit inbox address is not in any served file', () => {
  const host = ['mail', String.fromCharCode(103, 114, 111, 107, 98, 111, 116), 'com'].join('.');
  const inbox = ['dtrt', host].join('@');
  const skip = new Set(['node_modules']);
  function walkServed(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || skip.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walkServed(full, out);
      else if (fs.statSync(full).size < 5e6) out.push(full);
    }
    return out;
  }
  const hits = walkServed(root).filter((file) => fs.readFileSync(file, 'utf8').includes(inbox));
  assert.deepEqual(hits.map((file) => path.relative(root, file)), []);
});

test('the free-map promise uses one canonical sentence', () => {
  const required = ['index.html', 'map/index.html', 'job-desk/how-it-works/index.html', 'contact.html'];
  for (const name of required) {
    assert.ok(fs.readFileSync(path.join(root, name), 'utf8').includes(CANONICAL), name);
  }
  const near = /3 short questions|written map arrives|one-page map of your office|asks 3 short questions|free one-page map:/i;
  for (const file of walk(root)) {
    const rest = fs.readFileSync(file, 'utf8').split(CANONICAL).join('');
    assert.doesNotMatch(rest, near, path.relative(root, file));
  }
});

test('CHECK and partnership CTAs use the map form', () => {
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const find = fs.readFileSync(path.join(root, 'find.html'), 'utf8');
  const partners = fs.readFileSync(path.join(root, 'partners.html'), 'utf8');
  assert.match(home, /href="\/map\/\?want=check"[^>]*>Get my free AI check<\/a>/);
  assert.match(find, /href="\/map\/\?want=check"[^>]*>Get my free AI check<\/a>/);
  assert.match(partners, /href="\/map\/\?want=partner"/);
  assert.doesNotMatch(home + find + partners, /Reply CHECK|Prepare email/);
  assert.equal(fs.existsSync(path.join(root, 'js/partners.js')), false);
});

test('brand kit social lines use the canonical map sentence and no retired offer', () => {
  const kit = fs.readFileSync(path.join(root, 'brand-kit.md'), 'utf8');
  assert.match(kit, /Answer 3 short questions and you'll get a free one-page office map within 3 business days\./);
  assert.doesNotMatch(kit, /DM SYSTEM|Reply SYSTEM|Writing Retainer|Review Desk|Starter Fix/);
});

test('contact.html posts to the form alias', () => {
  const html = fs.readFileSync(path.join(root, 'contact.html'), 'utf8');
  const formMatch = html.match(/<form\b[\s\S]*?<\/form>/i);
  assert.ok(formMatch, 'contact.html has a form');
  const form = formMatch[0];
  assert.match(form, /\bmethod="POST"/);
  assert.match(form, /\baction="https:\/\/formsubmit\.co\/b40eb14cdacd80c1b58eebb8ec124fe3"/);
  assert.doesNotMatch(form, /@/);
  assert.match(form, /name="_honey"/);
  assert.match(form, /name="email"[^>]*\brequired\b|\brequired\b[^>]*name="email"/);
  for (const topic of ['General', 'DMCA notice', 'Privacy request', 'Refund or billing', 'Other']) {
    assert.match(form, new RegExp('<option[^>]*>' + topic + '</option>'));
  }
  assert.match(form, /name="Name"/);
  assert.match(form, /name="Message"/);
  assert.equal(attr([...form.matchAll(/<input\b[^>]*name="_next"[^>]*>/gi)][0][0], 'value'), 'https://dtrtlab.com/contact/thanks/');
  const topicJs = fs.readFileSync(path.join(root, 'js/contact-topic.js'), 'utf8');
  assert.match(topicJs, /dmca:\s*"DMCA notice"/);
  assert.match(topicJs, /privacy:\s*"Privacy request"/);
  assert.match(topicJs, /refund:\s*"Refund or billing"/);
  const thanks = fs.readFileSync(path.join(root, 'contact/thanks/index.html'), 'utf8');
  assert.match(thanks, /Thanks\. We'll read this and reply by email\./);
  const dmca = fs.readFileSync(path.join(root, 'legal/dmca.html'), 'utf8');
  assert.match(dmca, /Send notices through our <a href="\/contact\.html\?topic=dmca">contact form<\/a> \(choose DMCA notice\)\./);
  assert.match(fs.readFileSync(path.join(root, 'legal/privacy.html'), 'utf8'), /href="\/contact\.html\?topic=privacy"/);
  assert.match(fs.readFileSync(path.join(root, 'legal/refunds.html'), 'utf8'), /href="\/contact\.html\?topic=refund"/);
  for (const file of walk(root)) {
    const page = fs.readFileSync(file, 'utf8');
    for (const anchor of anchors(page)) {
      if (!/contact form/i.test(anchor.text)) continue;
      const href = attr('<a ' + anchor.attrs + '>', 'href');
      assert.match(href, /^\/contact\.html(?:\?|$)/, path.relative(root, file) + ' contact form href ' + href);
    }
  }
});

test('a bug report has its own thanks page', () => {
  const bug = fs.readFileSync(path.join(root, 'bug.html'), 'utf8');
  assert.match(bug, /_next" value="https:\/\/dtrtlab\.com\/bug\/thanks\/"/);
  const thanks = fs.readFileSync(path.join(root, 'bug/thanks/index.html'), 'utf8');
  assert.match(thanks, /Thanks\. If you left an email, we'll follow up there\./);
  assert.doesNotMatch(thanks, /Watch your inbox/);
});

test('served docs and scripts do not name the bot mail host', () => {
  const needle = String.fromCharCode(103, 114, 111, 107, 98, 111, 116);
  const skip = new Set(['node_modules', '__pycache__']);
  const hits = [];
  function walkNamed(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || skip.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      const rel = path.relative(root, full);
      if (rel.toLowerCase().includes(needle)) hits.push(rel);
      if (entry.isDirectory()) walkNamed(full);
      else if (fs.statSync(full).size < 5e6 && fs.readFileSync(full, 'utf8').toLowerCase().includes(needle)) hits.push(rel);
    }
  }
  walkNamed(path.join(root, 'docs'));
  walkNamed(path.join(root, 'scripts'));
  assert.deepEqual(hits, []);
});

test('served docs and owner-dashboard tiles omit retired small-plan names', () => {
  const banned = ['$50', 'Starter Fix', 'Mini'];
  function walkMd(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walkMd(full, out);
      else if (entry.name.endsWith('.md')) out.push(full);
    }
    return out;
  }
  for (const file of walkMd(path.join(root, 'docs'))) {
    const text = fs.readFileSync(file, 'utf8');
    for (const phrase of banned) {
      assert.equal(text.includes(phrase), false, path.relative(root, file) + ' still says ' + phrase);
    }
  }
  const dash = fs.readFileSync(path.join(root, 'live/dashboard.js'), 'utf8');
  const tiles = [...dash.matchAll(/tile\('([^']*)'/g)].map((match) => match[1]);
  assert.ok(tiles.length > 5, 'found dashboard tiles');
  for (const label of tiles) {
    for (const phrase of banned) {
      assert.equal(label.includes(phrase), false, 'tile still says ' + phrase + ': ' + label);
    }
  }
});

test('theme A buttons inherit the page font and the form hover stays readable', () => {
  const css = fs.readFileSync(path.join(root, 'css/theme-a.css'), 'utf8');
  assert.match(css, /\.btn\{[^}]*font-family:inherit/);
  assert.match(css, /\.map-form \.btn:hover\{background:var\(--navy\);color:var\(--white\)/);
  assert.match(css, /\.map-form \.ask\{white-space:nowrap\}/);
  assert.doesNotMatch(css, /\.fallback \.btn\{width:100%\}/);
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
