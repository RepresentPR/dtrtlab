// Guard: retired offers, old guarantees, and the terms below must not
// come back on the served site. Pages publishes the staged tree
// (scripts/stage-site.cjs), not the whole repo. This guard scans every served
// html, js, json, md, css, txt, webmanifest, svg, and xml file, plus
// sitemap.xml, netlify.toml, _headers, and every served file with no
// extension, such as CNAME. docs/ is skipped only
// because _config.yml lists it under exclude.
// brand-kit.md is not served (_config.yml exclude), but the repo is public,
// so it is still scanned.
// Filename exemptions are exact paths only. These files hold the ban lists:
// scripts/demo-page.test.cjs, scripts/business-brand.test.cjs,
// scripts/retired-copy.test.cjs, and scripts/private-terms.test.cjs.
// There is no legal-page exception and no fiction exception for these phrases.
// File names treat "." inside a name like a space or hyphen (Silver.Spring.jpg)
// and also match the joined form with no separator (reviewdesk.png).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { isExcluded, loadExclude } = require('./stage-site.cjs');
const { loosen, joinedNameHits } = require('./served-fold.cjs');

const ROOT = path.join(__dirname, '..');
const EXCLUDE = loadExclude();
const EXEMPT = new Set([
  'scripts/demo-page.test.cjs',
  'scripts/business-brand.test.cjs',
  'scripts/retired-copy.test.cjs',
  'scripts/private-terms.test.cjs',
]);
const GROK_BOT = 'Grok bot';
const SERVED = /\.(html?|js|mjs|json|md|css|txt|webmanifest|svg|xml|toml)$|^(_headers|netlify\.toml|sitemap\.xml)$/i;
const TYPES = ['html', 'js', 'json', 'md', 'css', 'txt', 'webmanifest', 'svg', 'xml', 'toml'];

const PHRASES = [
  /first-line rewrite/i,
  /Stay on the chair/i,
  /We write your posts/i,
  /\bpublic data\b/i,
  /from public sources/i,
  /Writing plans/i,
  /30-day numbers/i,
  /day-30 numbers/i,
  /Start at \$50/i,
  /\$50(?!\d)/,
  /Starter Fix/i,
  new RegExp(String.fromCharCode(103, 114, 111, 107, 98, 111, 116), 'i'),
  /mailto:/i,
  /Reply SYSTEM/i,
  /DM SYSTEM/i,
  /Reply CHECK/i,
  /the Mini plan/i,
  /CCC ONE/i,
  /Ops Trax/i,
  /Mini Social Pack/i,
  /Week Pack/i,
  /Writing Retainer/i,
  /Review Desk/i,
  /Review-Desk/i,
  /7-Day Do-It-Right Guarantee/i,
  /\bwrites? for local businesses/i,
  /\bwritten deliverables/i,
  /\bgrowth studio/i,
  /7-Day Guarantee/i,
  /I rewrite it free/i,
  /rewrite it free/i,
  /rewrite free/i,
  /free rewrites/i,
  /fix it for free/i,
  /7-DAY/,
  /DO-IT-RIGHT/,
  /plan_HAGSLXXUeGkcz/,
  /plan_RVDjSToI7vKOM/,
  /plan_kZqq0jgr6VrGG/,
  /plan_Vn0gQGFWQx9CA/,
  /dtrtlab-retainer/,
  /dtrtlab-free-rewrite/,
  /\bClinton\b/i,
  /Southern Maryland/i,
  /\bSoMD\b/i,
  /Southern MD\b/i,
  /So\.\s*MD\b/i,
  /\bSo\s+MD\b/i,
  /\bNoVA\b/,
  /St\.?\s*Mary['’]s/i,
  /\bCalvert\b/i,
  /\bTysons\b/i,
  /\bBowie\b/i,
  /\bLanham\b/i,
  /\bLargo\b/i,
  /\bWaldorf\b/i,
  /Silver Spring/i,
  /\bBaltimore\b/i,
  /\bArlington\b/i,
  /\bAnnapolis\b/i,
  /\bGreenbelt\b/i,
  /\bBeltsville\b/i,
  /\bLaurel\b/i,
  /\bHyattsville\b/i,
  /College Park/i,
  /Glenn Dale/i,
  /\bMitchellville\b/i,
  /\bRockville\b/i,
  /\bBethesda\b/i,
  /\bAlexandria\b/i,
  /\bFairfax\b/i,
  /\bFrederick\b/i,
  /\bGaithersburg\b/i,
  /\bGermantown\b/i,
  // Region names. DC, MD, and VA stay case-sensitive so markdown
  // extensions and lowercase JavaScript identifiers are not hits.
  /\bDMV\b/i,
  /Washington,?\s+D\.?C\.?/i,
  /\bD\.C\./,
  /\bMaryland\b/i,
  /\bVirginia\b/i,
  /\bDC\b/,
  /\bMD\b/,
  /\bVA\b/,
];

const PLANTS = [
  ['first-line', 'first-line rewrite'],
  ['writes-local', 'DTRT Lab writes for local businesses'],
  ['written-deliverables', 'with written deliverables, such as captions'],
  ['growth-studio', 'an independent growth-studio'],
  ['chair', 'Stay on the chair'],
  ['posts', 'We write your posts'],
  ['public-data', 'public data'],
  ['public-sources', 'from public sources'],
  ['writing-plans', 'Writing plans'],
  ['numbers-30', '30-day numbers'],
  ['numbers-day', 'day-30 numbers'],
  ['start-50', 'Start at $50'],
  ['bare-50', 'It costs $50 flat'],
  ['starter', 'Starter Fix'],
  ['handle', String.fromCharCode(103, 114, 111, 107, 98, 111, 116)],
  ['mailto', 'mailto:hello@example.test'],
  ['reply-system', 'Reply SYSTEM'],
  ['reply-quoted', 'Reply "SYSTEM"'],
  ['dm-system', 'DM SYSTEM'],
  ['reply-check', 'Reply CHECK'],
  ['mini-plan', 'the Mini plan'],
  ['ccc-one', 'CCC ONE'],
  ['ops-trax', 'Ops Trax'],
  ['mini', 'Mini Social Pack'],
  ['week', 'Week Pack'],
  ['retainer', 'Writing Retainer'],
  ['review-desk', 'Review Desk'],
  ['review-desk-gap', 'Review  Desk'],
  ['review-desk-hyphen', 'Review-Desk'],
  ['guarantee-name', '7-Day Do-It-Right Guarantee'],
  ['guarantee-short', '7-Day Guarantee'],
  ['rewrite-free-sentence', 'I rewrite it free'],
  ['rewrite-it-free', 'rewrite it free'],
  ['rewrite-free', 'rewrite free'],
  ['free-rewrites', 'free rewrites'],
  ['fix-free', 'fix it for free'],
  ['seal-a', '7-DAY'],
  ['seal-b', 'DO-IT-RIGHT'],
  ['plan-mini', 'plan_HAGSLXXUeGkcz'],
  ['plan-week', 'plan_RVDjSToI7vKOM'],
  ['plan-retainer', 'plan_kZqq0jgr6VrGG'],
  ['plan-rewrite', 'plan_Vn0gQGFWQx9CA'],
  ['slug-retainer', 'dtrtlab-retainer'],
  ['slug-rewrite', 'dtrtlab-free-rewrite'],
  ['clinton', 'Clinton'],
  ['southern-maryland', 'Southern Maryland'],
  ['somd', 'SoMD'],
  ['southern-md', 'Southern MD'],
  ['so-md', 'So. MD'],
  ['so-md-plain', 'So MD'],
  ['nova', 'NoVA'],
  ['st-marys', "St. Mary's"],
  ['calvert', 'Calvert'],
  ['tysons', 'Tysons'],
  ['bowie', 'Bowie'],
  ['lanham', 'Lanham'],
  ['largo', 'Largo'],
  ['waldorf', 'Waldorf'],
  ['silver-spring', 'Silver Spring'],
  ['silver-spring-hyphen', 'Silver-Spring'],
  ['baltimore', 'Baltimore'],
  ['arlington', 'Arlington'],
  ['annapolis', 'Annapolis'],
  ['greenbelt', 'Greenbelt'],
  ['beltsville', 'Beltsville'],
  ['laurel', 'Laurel'],
  ['hyattsville', 'Hyattsville'],
  ['college-park', 'College Park'],
  ['glenn-dale', 'Glenn Dale'],
  ['mitchellville', 'Mitchellville'],
  ['rockville', 'Rockville'],
  ['bethesda', 'Bethesda'],
  ['alexandria', 'Alexandria'],
  ['fairfax', 'Fairfax'],
  ['frederick', 'Frederick'],
  ['gaithersburg', 'Gaithersburg'],
  ['germantown', 'Germantown'],
  ['dmv', 'DMV Area'],
  ['washington-dc', 'Washington DC'],
  ['washington-dc-comma', 'Washington, D.C.'],
  ['dc-dots', 'D.C.'],
  ['maryland', 'Maryland'],
  ['virginia', 'Virginia'],
  ['abbr-dc', 'in DC today'],
  ['abbr-md', 'in MD today'],
  ['abbr-va', 'in VA today'],
];

const JOINED = [
  'first-line rewrite',
  'Stay on the chair',
  'We write your posts',
  'public data',
  'from public sources',
  'Writing plans',
  '30-day numbers',
  'day-30 numbers',
  'Starter Fix',
  'Reply SYSTEM',
  'DM SYSTEM',
  'Reply CHECK',
  'the Mini plan',
  'CCC ONE',
  'Ops Trax',
  'Mini Social Pack',
  'Week Pack',
  'Writing Retainer',
  'Review Desk',
  '7-Day Do-It-Right Guarantee',
  '7-Day Guarantee',
  'I rewrite it free',
  'rewrite it free',
  'rewrite free',
  'free rewrites',
  'fix it for free',
  'Southern Maryland',
  'Southern MD',
  'So MD',
  "St Mary's",
  'Silver Spring',
  'College Park',
  'Glenn Dale',
  'DMV Area',
  'Washington DC',
  'Washington D.C',
  'Maryland',
  'Virginia',
];

function scanPatterns(rel, text, patterns, foldUnderscore) {
  if (EXEMPT.has(rel)) return [];
  const hits = [];
  const body = String(text).split(GROK_BOT).join('');
  const loose = loosen(body, foldUnderscore);
  for (const rx of patterns) {
    const m = body.match(rx) || loose.match(rx);
    if (m) hits.push(rel + ': ' + m[0]);
  }
  return hits;
}

function scanText(rel, text) {
  return scanPatterns(rel, text, PHRASES, false);
}

function scanJoined(rel) {
  if (EXEMPT.has(rel)) return [];
  return joinedNameHits(rel, JOINED);
}

function scanName(rel) {
  return scanPatterns(rel, rel, PHRASES, 'name').concat(scanJoined(rel));
}

function isServedFile(name) {
  return SERVED.test(name) || path.extname(name) === '';
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git') continue;
    const p = path.join(dir, e.name);
    const rel = path.relative(ROOT, p).split(path.sep).join('/');
    if (isExcluded(rel, EXCLUDE)) continue;
    if (e.isDirectory()) walk(p, out);
    else if (isServedFile(e.name) && !EXEMPT.has(rel) && fs.statSync(p).size < 5e6) out.push(p);
  }
  return out;
}

function walkNames(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git') continue;
    const p = path.join(dir, e.name);
    const rel = path.relative(ROOT, p).split(path.sep).join('/');
    if (isExcluded(rel, EXCLUDE)) continue;
    if (e.isDirectory()) walkNames(p, out);
    else if (!EXEMPT.has(rel)) out.push(rel);
  }
  return out;
}

test('retired copy stays off every served file', () => {
  const files = walk(ROOT);
  const rels = files.map((f) => path.relative(ROOT, f).split(path.sep).join('/'));
  assert.ok(rels.includes('versions/index.html'), 'versions/ is served and checked');
  assert.ok(rels.includes('live/dashboard.js'), 'live/dashboard.js is served and checked');
  assert.ok(rels.includes('legal/terms.html'), 'legal pages are checked, not skipped');
  assert.equal(rels.includes('brand-kit.md'), false, 'brand-kit.md is not served');
  files.push(path.join(ROOT, 'brand-kit.md'));
  assert.ok(rels.includes('clips/index.html'), 'hobby pages are checked');
  assert.ok(rels.includes('afterlight.html'), 'fiction pages are checked');
  assert.ok(rels.includes('sitemap.xml'), 'sitemap.xml is checked');
  assert.ok(rels.includes('netlify.toml'), 'netlify.toml is checked');
  assert.ok(rels.includes('_headers'), '_headers is checked');
  assert.ok(rels.includes('CNAME'), 'extensionless CNAME is checked');
  assert.ok(rels.some((rel) => rel.endsWith('.svg')), 'svg files are checked');
  assert.ok(EXCLUDE.includes('docs'), 'docs skip comes from _config.yml exclude');
  assert.equal(isExcluded('docs/vision.md', EXCLUDE), true);
  assert.equal(isExcluded('docs/vision.md', EXCLUDE.filter((item) => item !== 'docs')), false, 'docs is scanned when it leaves the exclude list');
  assert.equal(rels.includes('docs/vision.md'), false, 'docs/ is not served');
  for (const rel of EXEMPT) assert.equal(rels.includes(rel), false, rel);
  const hits = [];
  for (const file of files) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    hits.push(...scanText(rel, fs.readFileSync(file, 'utf8')));
  }
  assert.deepEqual(hits, [], 'retired copy found:\n' + hits.join('\n'));
});

test('the product name Grok bot stays allowed by that exact string', () => {
  const handle = String.fromCharCode(103, 114, 111, 107, 98, 111, 116);
  assert.deepEqual(scanText('cs2.html', 'The Grok bot answers in chat.'), []);
  assert.ok(scanText('cs2.html', handle).length);
  assert.ok(scanText('cs2.html', handle[0].toUpperCase() + handle.slice(1)).length);
});

test('only the ban-list files are exempt, by exact path', () => {
  const sample = 'Clinton mailto: Reply SYSTEM $50';
  for (const rel of EXEMPT) assert.deepEqual(scanText(rel, sample), [], rel);
  assert.ok(scanText('scripts/map-form.test.cjs', 'Clinton').length);
  assert.ok(scanText('scripts/homepage-render.test.cjs', 'Clinton').length);
  assert.ok(scanText('scripts/other-demo.test.cjs', 'Clinton').length);
  assert.ok(scanText('demo/sample.html', 'Clinton').length);
});

test('a planted ban in CNAME fails the scan', () => {
  assert.ok(scanText('CNAME', 'Clinton').length);
});

test('served file names are checked against the full ban list', () => {
  assert.ok(scanName('img/clinton.jpg').length, 'img/clinton.jpg');
  assert.ok(scanName('img/Silver-Spring.webp').length, 'Silver-Spring');
  assert.ok(scanName('img/Silver_Spring.jpg').length, 'Silver_Spring');
  assert.ok(scanName('img/Silver.Spring.jpg').length, 'Silver.Spring');
  assert.ok(scanName('img/silverspring.jpg').length, 'silverspring');
  assert.ok(scanName('img/review-desk.png').length, 'review-desk');
  assert.ok(scanName('img/reviewdesk.png').length, 'reviewdesk');
  assert.ok(scanName('img/plan_HAGSLXXUeGkcz.png').length, 'plan id');
  const bot = String.fromCharCode(103, 114, 111, 107, 98, 111, 116);
  assert.ok(scanName('img/' + bot + '.png').length, 'bot name');
  assert.ok(scanName('img/so-md.png').length, 'so-md');
  assert.ok(scanName('img/somd.png').length, 'somd');
  assert.equal(scanName('img/ransomdemand.png').length, 0, 'somd inside a longer word');
  assert.equal(scanName('img/afterlight/cabo.jpg').length, 0);
  assert.equal(scanName('content/music-credits.json').length, 0);
  const hits = [];
  for (const rel of walkNames(ROOT)) hits.push(...scanName(rel));
  assert.deepEqual(hits, [], 'banned term in a served filename:\n' + hits.join('\n'));
});

test('fiction filenames do not lift these bans', () => {
  assert.ok(scanText('afterlight.html', 'Clinton').length);
  assert.ok(scanText('stories/afterlight/island.html', 'Southern Maryland').length);
  assert.ok(scanText('clips/index.html', 'SoMD').length);
  assert.ok(scanText('content/afterlight.json', 'Review Desk').length);
});

test('legal pages get no exception for the old guarantee or Review Desk', () => {
  assert.ok(scanText('legal/terms.html', 'The 7-Day Do-It-Right Guarantee covered a past plan.').length);
  assert.ok(scanText('legal/refunds.html', 'Review Desk refunds followed a previous plan.').length);
  assert.ok(scanText('legal/privacy.html', 'I rewrite it free').length);
});

for (const [id, text] of PLANTS) {
  test('planted ' + id + ' fails in every served file type', () => {
    for (const ext of TYPES) {
      const hits = scanText('plant.' + ext, text);
      assert.ok(hits.length, id + ' was allowed in .' + ext);
    }
  });
}

test('the removed clips stay off the served site', () => {
  for (const name of ['why-dont-you', 'move-it']) {
    assert.equal(fs.existsSync(path.join(ROOT, 'img/thumbs/' + name + '.jpg')), false, name);
    assert.equal(fs.existsSync(path.join(ROOT, 'watch/media/' + name + '.mp4')), false, name);
  }
  const clips = fs.readFileSync(path.join(ROOT, 'clips/index.html'), 'utf8');
  assert.doesNotMatch(clips, /why-dont-you|move-it/);
  const hits = [];
  for (const file of walk(ROOT)) {
    const text = fs.readFileSync(file, 'utf8');
    if (/why-dont-you|move-it/.test(text)) hits.push(path.relative(ROOT, file));
  }
  assert.deepEqual(hits, []);
});
