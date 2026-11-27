// The git repo is public on GitHub. Pages publishes only the staged site
// (scripts/stage-site.cjs, _config.yml), which omits docs/ and other internal
// notes. This guard still scans tracked text, because the repo itself stays public.
// Matches are stored as truncated SHA-256 hashes so this file does not repeat them.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const h = (t) => crypto.createHash('sha256').update(t).digest('hex').slice(0, 16);
const SINGLE = new Set(['cf6f0c3063e089ac', '5571bf8f246a2931', 'e424dce6bf0bec35', '0ab3f317e98a3b62', '05ef130c628dac68', 'fe01ce351aec9c1e', 'adaadd3c60c44e4a', '2f07555d3e64c04d', 'cc72610c2a2a7312', '5fb2fdb1225d36a6', '5bcc90c3fbdf6f53', 'b95650ceb482a474', 'e602c1e0fd248939', '1ffc0406b9891fcd', 'c06dc8cc17251ea4', '72b978cf9608f1ed', 'f0cd63a491438eb0', '8d002b8524b688cd', '45f43b33da941900', '5699322bbd0e3374', '56a5deb4a33ec689', 'd374b7957d914441', '80f62f3dae7789a4', 'c45b25cebbfe88b1', '682a4851da0c4e36']);
const PAIRS = new Set(['4140ea46ab618ff1', '2c15efaff108ba54', 'f980fb0d42a0e7b3', 'a3b410d9e8b85bfc', '80cb3f0913768a2b']);
// Filename allowlist. It lifts only the hashes in FICTION_OK.
// It does not lift the terms enforced by retired-copy.test.cjs.
const FICTION_OK = new Set(['cf6f0c3063e089ac', '2f07555d3e64c04d', 'cc72610c2a2a7312', '5fb2fdb1225d36a6', '5bcc90c3fbdf6f53', 'b95650ceb482a474', 'e602c1e0fd248939', '72b978cf9608f1ed', 'f0cd63a491438eb0', '8d002b8524b688cd', '45f43b33da941900', '5699322bbd0e3374', '56a5deb4a33ec689', 'd374b7957d914441', '80f62f3dae7789a4', 'c45b25cebbfe88b1', '682a4851da0c4e36']);
const FICTION_FILES = [
  /^afterlight\.html$/,
  /^story\.html$/,
  /^game\.html$/,
  /^worlds\.html$/,
  /^stories\/afterlight\//,
  /^content\/afterlight\.json$/,
  /^content\/product\.json$/,
  /^media\.html$/,
  /^tools\/build_afterlight\.py$/,
];
const PLACE_PAIRS = new Set(['f50b92b29527bc02', '76fe6138e7cacf54', 'c297e3f1030288ee', '4d0a1d7083938f2b', 'c1075b2f40136c10', 'afeacc461eaa9436']);
const ISLAND_OK = new Set(['cf6f0c3063e089ac', 'c45b25cebbfe88b1', '682a4851da0c4e36', 'f50b92b29527bc02', '76fe6138e7cacf54']);
const MARKETPLACE_PATH = /(?:^|\/)(?:es|en)\/(?:mercado|store|tienda)(?:\/|$|\.)|(?:^|\/)(?:mercado|store|tienda)(?:\/|$|\.)/i;
const HOME_PATH = /^(?:es\/|en\/)?(?:index|home)(?:\.es)?\.html$/i;
const STORE_CLASS = /\b(?:storefront|store-page|store-hero|store-grid|store-card|store-top|store-nav|store-cats|store-section|store-helper|shop-grid|mercado|tienda)\b/i;
const STORE_ID = /\b(?:store|shop|mercado|tienda|store-title)\b/i;
const ALLOWED_NEXT = { '1ffc0406b9891fcd': 'deductible' }; // donation disclaimer; js/journey-language.js was removed 2026-10-16
const TEXT = /\.(html?|js|mjs|cjs|json|md|txt|css|xml|yml|yaml|toml|webmanifest|py|sh|ps1|svg)$|^(_headers|CNAME|robots\.txt|security\.txt)$/i;
const SKIP_DIRS = new Set(['.git', 'node_modules']);
const EXEMPT = new Set([
  'scripts/demo-page.test.cjs',
  'scripts/business-brand.test.cjs',
  'scripts/retired-copy.test.cjs',
  'scripts/private-terms.test.cjs',
]);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (TEXT.test(e.name) && fs.statSync(p).size < 5e6) out.push(p.split(path.sep).join('/'));
  }
  return out;
}

function walkPaths(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkPaths(p, out);
    else out.push(p.split(path.sep).join('/').replace(/^\.\//, ''));
  }
  return out;
}

function fold(text) {
  return String(text).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}


function tokensWithSpans(text) {
  const out = [];
  const s = String(text);
  let i = 0;
  while (i < s.length) {
    const base = s[i].normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
    if (base && /[a-z0-9]/.test(base[0])) {
      const start = i;
      let tok = base;
      i += 1;
      while (i < s.length) {
        const next = s[i].normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
        if (next && /[a-z0-9]/.test(next[0])) {
          tok += next;
          i += 1;
          continue;
        }
        if (next) break;
        i += 1;
      }
      out.push({ t: tok, start, end: i });
      continue;
    }
    i += 1;
  }
  return out;
}

function matchingEnd(text, start, tag) {
  const openRe = new RegExp('<' + tag + '\\b', 'gi');
  const closeRe = new RegExp('</' + tag + '\\s*>', 'gi');
  let i = start;
  let depth = 0;
  while (i < text.length) {
    openRe.lastIndex = i;
    closeRe.lastIndex = i;
    const mOpen = openRe.exec(text);
    const mClose = closeRe.exec(text);
    if (mClose && (!mOpen || mClose.index < mOpen.index)) {
      depth -= 1;
      i = mClose.index + mClose[0].length;
      if (depth === 0) return i;
      continue;
    }
    if (!mOpen) return text.length;
    if (depth === 0 && mOpen.index === start) {
      depth = 1;
      const gt = text.indexOf('>', mOpen.index);
      i = gt === -1 ? mOpen.index + mOpen[0].length : gt + 1;
      continue;
    }
    depth += 1;
    const gt = text.indexOf('>', mOpen.index);
    i = gt === -1 ? mOpen.index + mOpen[0].length : gt + 1;
  }
  return text.length;
}

function storeRegions(text) {
  const src = String(text);
  const body = src.match(/<body\b[^>]*>/i);
  if (body) {
    const cls = body[0].match(/\bclass="([^"]*)"/i);
    if (cls && STORE_CLASS.test(cls[1])) return [[0, src.length]];
  }
  const regions = [];
  const openRe = /<(section|div|main|article|ul|ol|nav|header|aside)(\s[^>]*)?>/gi;
  let m;
  while ((m = openRe.exec(src))) {
    const attrs = m[2] || '';
    const cls = attrs.match(/\bclass="([^"]*)"/i);
    const id = attrs.match(/\bid="([^"]*)"/i);
    if (!((cls && STORE_CLASS.test(cls[1])) || (id && STORE_ID.test(id[1])))) continue;
    regions.push([m.index, matchingEnd(src, m.index, m[1])]);
  }
  regions.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [lo, hi] of regions) {
    if (merged.length && lo <= merged[merged.length - 1][1]) {
      merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], hi);
    } else merged.push([lo, hi]);
  }
  return merged;
}

function inRegions(pos, regions) {
  return regions.some(([lo, hi]) => pos >= lo && pos < hi);
}

function islandOk(rel, text, pos) {
  if (MARKETPLACE_PATH.test(rel) || FICTION_FILES.some((rx) => rx.test(rel))) return true;
  if (HOME_PATH.test(rel) && inRegions(pos, storeRegions(text))) return true;
  return false;
}

function offenses(file, text) {

  const rel = String(file).replace(/^\.\//, '');
  if (EXEMPT.has(rel)) return [];
  const fiction = FICTION_FILES.some((rx) => rx.test(rel));
  const hits = [];
  const toks = tokensWithSpans(text);
  for (let i = 0; i < toks.length; i++) {
    const s = h(toks[i].t);
    const nextT = toks[i + 1] ? toks[i + 1].t : undefined;
    const liftIsland = ISLAND_OK.has(s) && islandOk(rel, text, toks[i].start);
    if (SINGLE.has(s) && !liftIsland && !(fiction && FICTION_OK.has(s)) && !(ALLOWED_NEXT[s] && ALLOWED_NEXT[s] === nextT)) hits.push(`${file}: term#${s}`);
    if (i + 1 >= toks.length) continue;
    const pair = h(toks[i].t + ' ' + toks[i + 1].t);
    const liftPair = ISLAND_OK.has(pair) && islandOk(rel, text, toks[i].start);
    if (PAIRS.has(pair) && !liftPair) hits.push(`${file}: pair#${pair}`);
    else if (PLACE_PAIRS.has(pair) && !fiction && !liftPair) hits.push(`${file}: pair#${pair}`);
  }
  return hits;
}

test('banned hashes stay out of public files', () => {
  const hits = [];
  for (const file of walk('.').map((f) => f.replace(/^\.\//, ''))) hits.push(...offenses(file, fs.readFileSync(file, 'utf8')));
  for (const file of walkPaths('.')) hits.push(...offenses(file, file));
  assert.deepStrictEqual(hits, [], 'banned hash found:\n' + hits.join('\n'));
});

test('fiction filenames lift only the allowlisted hashes', () => {
  const setting = String.fromCharCode(80, 117, 101, 114, 116, 111, 32, 82, 105, 99, 111);
  const town = String.fromCharCode(82, 105, 110, 99, 243, 110);
  const small = String.fromCharCode(80, 82, 32, 115, 109, 97, 108, 108);
  const demonym = String.fromCharCode(98, 111, 114, 105, 99, 117, 97);
  // Brain §3: the island name is allowed only on marketplace pages (mercado and
  // store, including ES versions), the home store section, and fiction pages.
  // Personal town names stay banned on non-fiction files (fiction still lifts those).
  for (const file of ['afterlight.html', 'story.html', 'game.html', 'worlds.html', 'stories/afterlight/island.html', 'stories/afterlight/volume-one/index.html', 'content/afterlight.json', 'content/product.json', 'media.html', 'tools/build_afterlight.py']) {
    assert.deepStrictEqual(offenses(file, setting), [], file);
    assert.deepStrictEqual(offenses(file, town), [], file);
    assert.deepStrictEqual(offenses(file, small), [], file);
    assert.deepStrictEqual(offenses(file, demonym), [], file);
  }
  const CHECKED = ['index.html', 'clips/index.html', 'content/history.json', 'content/promo.json', 'js/live-extras.js', 'docs/vision.md', 'brand-kit.md', 'about.html', 'img/afterlight/yard.jpg', 'img/afterlight/cabo.jpg', 'img/afterlight/rincon.avif', 'img/afterlight/rincon.jpg', 'img/afterlight/rincon.webp'];
  for (const file of CHECKED) {
    assert.ok(offenses(file, setting).length, file + ' setting');
    assert.ok(offenses(file, town).length, file + ' town');
    assert.ok(offenses(file, small).length, file + ' small');
    assert.ok(offenses(file, demonym).length, file + ' demonym');
  }
  const MARKET = ['mercado/index.html', 'es/mercado/index.html', 'store/index.html', 'es/store/index.html', 'tienda/index.html'];
  for (const file of MARKET) {
    assert.deepStrictEqual(offenses(file, setting), [], file);
    assert.ok(offenses(file, town).length, file);
    assert.deepStrictEqual(offenses(file, small), [], file);
    assert.deepStrictEqual(offenses(file, demonym), [], file);
  }
  const store = '<section class="store-grid"><p>' + setting + '</p></section>';
  const other = '<section class="about"><p>' + setting + '</p></section>';
  const front = '<body class="dream storefront"><p>' + setting + '</p></body>';
  assert.deepStrictEqual(offenses('index.html', store), []);
  assert.deepStrictEqual(offenses('es/index.html', store), []);
  assert.deepStrictEqual(offenses('index.html', front), []);
  assert.ok(offenses('index.html', other).length);
  assert.ok(offenses('index.html', setting).length);
  assert.ok(offenses('about.html', setting).length);
  assert.ok(offenses('docs/vision.md', setting).length);
  const PLACE_NAMES = ['clinton', 'bowie', 'somd', 'baltimore', 'annapolis', 'greenbelt', 'hyattsville', 'beltsville'];
  for (const townName of PLACE_NAMES) {
    assert.equal(FICTION_OK.has(h(townName)), false, townName);
    assert.equal(SINGLE.has(h(townName)), false, townName);
  }
  assert.ok(!offenses('afterlight.html', 'Clinton').length);
  assert.ok(!offenses('index.html', 'SoMD').length);
  for (const rel of EXEMPT) assert.deepStrictEqual(offenses(rel, setting), [], rel);
  assert.ok(offenses('scripts/map-form.test.cjs', setting).length);
});

test('docs/applications is not in the repo', () => {
  assert.ok(!fs.existsSync('docs/applications'), 'docs/applications must stay out of the public repo');
});

// Personal webmail addresses never belong in this public repo. The company
// domain is fine; example/test domains are ignored.
test('no personal webmail addresses in any public file', () => {
  const PERSONAL = /[a-z0-9._%+-]+@(gmail|googlemail|outlook|hotmail|live|msn|icloud|me|mac|yahoo|aol|proton|protonmail|pm|gmx|zoho)\.[a-z.]{2,}/gi;
  const hits = [];
  for (const file of walk('.').map((f) => f.replace(/^\.\//, ''))) {
    for (const m of fs.readFileSync(file, 'utf8').matchAll(PERSONAL)) hits.push(`${file}: ${h(m[0].toLowerCase())}`);
  }
  assert.deepStrictEqual(hits, [], 'personal email found (hashed):\n' + hits.join('\n'));
});
