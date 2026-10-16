// Spanish copy gets the same approve-only and retired-offer guards as English.
// It covers the ES page dictionary (js/biz-lang.js), inline lang="es" text,
// and every Spanish-looking string literal in served JS and JSON.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { isExcluded, loadExclude } = require('./stage-site.cjs');
const { foldBanned } = require('./served-fold.cjs');
const { esHit, deaccent, RETIRED_ES, AUTONOMY_ES } = require('./approve-terms.cjs');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function served() {
  const exclude = loadExclude();
  const out = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === '.git') continue;
      const p = path.join(dir, e.name);
      const rel = path.relative(ROOT, p).split(path.sep).join('/');
      if (isExcluded(rel, exclude)) continue;
      if (e.isDirectory()) walk(p);
      else out.push(rel);
    }
  })(ROOT);
  return out;
}

function bizPages(src) {
  const m = String(src).match(/var pages = (\{[\s\S]*?\n {2}\});/);
  assert.ok(m, 'js/biz-lang.js has a pages dictionary');
  return vm.runInNewContext('(' + m[1] + ')');
}

const ES_WORDS = /\b(el|la|los|las|del|para|una|que|est[aá]|tu|tus|sin|por|se|con|p[aá]gina|negocio|correo)\b/gi;
const EN_WORDS = /\b(the|and|is|are|you|your|to|of|this|on)\b/gi;
function looksSpanish(s) {
  if (/[ñ¿¡]|[áéíóú]/i.test(s)) return true;
  return (s.match(ES_WORDS) || []).length >= 2 && (s.match(EN_WORDS) || []).length === 0;
}

function literals(src) {
  const out = [];
  const re = /"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g;
  for (const m of String(src).matchAll(re)) out.push(m[1] ?? m[2] ?? m[3]);
  return out;
}

function inlineEs(html) {
  const out = [];
  const re = /<([a-z][a-z0-9]*)\b[^>]*\blang\s*=\s*["']?es\b[^>]*>([\s\S]*?)<\/\1>/gi;
  for (const m of String(html).matchAll(re)) out.push(m[0]);
  return out;
}

// Every Spanish string the site can show, with where it came from.
function spanishStrings(files, readFile) {
  const out = [];
  for (const rel of files) {
    if (/\.html?$/i.test(rel)) for (const s of inlineEs(readFile(rel))) out.push([rel, s]);
    else if (/\.(m?js|json)$/i.test(rel)) for (const s of literals(readFile(rel))) if (looksSpanish(s)) out.push([rel, s]);
  }
  const biz = bizPages(readFile('js/biz-lang.js'));
  for (const [k, v] of Object.entries(biz)) for (const f of ['title', 'h1', 'lead']) if (v[f]) out.push(['js/biz-lang.js ' + k + ' ' + f, v[f]]);
  return out;
}

function esProblems(strings) {
  const hits = [];
  for (const [where, s] of strings) {
    const hit = esHit(foldBanned(s)) || esHit(s);
    if (hit) hits.push(where + ': ' + hit + ' | ' + s.slice(0, 120));
  }
  return hits;
}

test('every Spanish string passes the approve-only and retired-offer checks (incl. aria-label and placeholder)', () => {
  const files = served();
  const strings = spanishStrings(files, read);
  assert.ok(strings.length > 60, 'found the ES strings (' + strings.length + ')');
  for (const src of ['js/biz-lang.js', 'js/nav.js', 'js/plan-tool.js', 'preorder.html', '404.html'])
    assert.ok(strings.some(([w]) => w.startsWith(src)), 'ES strings found in ' + src);
  const hits = esProblems(strings);
  assert.deepEqual(hits, [], 'Spanish copy:\n' + hits.join('\n'));
});

test('no served file carries the retired writing offer or autonomy wording in Spanish, in any form', () => {
  const hits = [];
  for (const rel of served()) {
    if (!/\.(m?js|html?|json|md|txt|svg|xml|webmanifest)$/i.test(rel) || fs.statSync(path.join(ROOT, rel)).size > 5e6) continue;
    const t = deaccent(foldBanned(read(rel)));
    const m = t.match(RETIRED_ES) || t.match(AUTONOMY_ES);
    if (m) hits.push(rel + ': ' + m[0]);
  }
  assert.deepEqual(hits, [], hits.join('\n'));
});

test('ES page dictionary only has pages that load it, and each lead tracks its English page', () => {
  const biz = bizPages(read('js/biz-lang.js'));
  const LEGAL = ['/legal/terms.html', '/legal/privacy.html', '/legal/cookies.html', '/legal/refunds.html', '/legal/dmca.html'];
  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  // Entries that are full translations of the current English lead (links and dates must match).
  const TRANSLATED = ['/brand.html', '/donate.html', '/legal/terms.html', '/legal/refunds.html'];
  const files = new Set(served());
  for (const key of Object.keys(biz)) {
    const rel = key === '/' ? 'index.html' : key.replace(/^\//, '');
    assert.ok(files.has(rel), key + ' is served');
    const html = read(rel);
    assert.doesNotMatch(html, /http-equiv\s*=\s*["']?refresh/i, key + ' is a redirect; drop its ES entry');
    assert.match(html, /js\/nav\.js/, key + ' loads nav.js, which loads biz-lang.js');
    const lead = (html.match(/<p[^>]*class="[^"]*\b(?:lead|hero-copy|about-lede)\b[^"]*"[^>]*>([\s\S]*?)<\/p>/) || [])[1] || '';
    const hrefs = (s) => [...String(s).matchAll(/href="([^"]*)"/g)].map((m) => m[1]).sort();
    if (!TRANSLATED.includes(key)) continue;
    if (biz[key].lead && hrefs(lead).length) assert.deepEqual(hrefs(biz[key].lead), hrefs(lead), key + ' ES lead keeps the English links');
    const en = lead.match(/Last updated (\w+) (\d+), (\d{4})/);
    if (en && LEGAL.includes(key)) {
      const es = biz[key].lead.match(/(\d+) de (\w+) de (\d{4})/);
      assert.ok(es, key + ' ES date');
      assert.deepEqual([es[1], MONTHS.indexOf(es[2]), es[3]], [en[2], EN_MONTHS.indexOf(en[1]), en[3]], key + ' ES "last updated" matches the English date');
    }
  }
  for (const key of ['/brand.html', '/donate.html', '/legal/terms.html', '/legal/refunds.html']) {
    assert.ok(biz[key] && /actualizaci|DTRT Job Desk|propinas/.test(biz[key].lead), key + ' has the current ES lead');
  }
});

test('pages whose ES entries were dropped still redirect to a served target', () => {
  const files = new Set(served());
  const REDIRECTS = { 'company.html': '/#about', 'about.html': '/#about', 'shop.html': '/#prices', 'press.html': '/#about', 'faq.html': '/#faq', 'support.html': '/#prices', 'sample-plan.html': '/#job-desk', 'preorder.html': '/shop.html', 'history.html': '/' };
  for (const [rel, target] of Object.entries(REDIRECTS)) {
    const m = read(rel).match(/http-equiv\s*=\s*["']?refresh["']?\s+content\s*=\s*["']\s*0\s*;\s*url=([^"']+)["']/i);
    assert.ok(m, rel + ' redirects');
    assert.equal(m[1], target, rel + ' redirect target');
    const t = target.replace(/#.*$/, '').replace(/^\//, '') || 'index.html';
    assert.ok(files.has(t), rel + ' -> ' + t + ' is served');
  }
});
