const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { isExcluded, loadExclude } = require('./stage-site.cjs');
const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

test('brand kit has the public paste text and a short bio', () => {
  const kit = read('brand-kit.md');
  // Theme A palette (locked 2026-10-15): navy primary, green accent, white/light neutrals.
  const colors = kit.slice(kit.indexOf('## Colors'), kit.indexOf('## Fonts'));
  assert.match(colors, /Primary \| `#0B2545`/);
  assert.match(colors, /Accent \| `#13C27A`/);
  assert.match(colors, /`#FFFFFF`/);
  assert.match(colors, /`#DCE6F2`/);
  assert.match(colors, /`#0A8754`[^\n]*chart/i, 'darker green is documented for light-background charts only');
  assert.doesNotMatch(colors, /#080808|#fafafa|#b6b6b6|#303030|#141414|#cfe35a/i, 'old black/white palette is retired');
  assert.match(fs.readFileSync(path.join(root, 'css/theme-a.css'), 'utf8'), /--navy:#0B2545;--green:#13C27A/, 'kit matches the site CSS');
  assert.match(kit, /Source Sans 3/);
  assert.match(kit, /Source Serif 4/);
  const oneLine = kit.match(/I'm Ian\. I build the AI office manager for DMV service businesses\. Get a free office map at dtrtlab\.com\./);
  assert.ok(oneLine, 'one-line bio is present');
  assert.ok(oneLine[0].length < 150);
  for (const name of ['X', 'Instagram', 'TikTok', 'YouTube', 'Twitch']) {
    assert.match(kit, new RegExp('### ' + name));
  }
  assert.match(kit, /https:\/\/x\.com\/DTRTLab/);
  assert.match(kit, /https:\/\/www\.instagram\.com\/officiallydtrt\//);
  // Mini Social Pack and Week Pack retired 2026-10-15 (Co-Founder): no links to their Whop plans.
  assert.doesNotMatch(kit, /plan_HAGSLXXUeGkcz|plan_RVDjSToI7vKOM/);
  assert.doesNotMatch(kit, /plan_kZqq0jgr6VrGG|DM SYSTEM/);
  assert.match(kit, /Answer 3 short questions and you'll get a free one-page office map within 3 business days\./);
  assert.doesNotMatch(kit, /Reply SYSTEM|Writing Retainer|Review Desk|Starter Fix|\$50|Writing Retainer · Review Desk|\$250\/30 days/);
  assert.match(kit, /plan_yuDiw93Zp6Uvr/);
  assert.doesNotMatch(kit, /@gmail\.com|PayPal/);
});

test('business pages show theme A offers and keep hobby off the company face', () => {
  const home = read('index.html');
  const main = home.match(/<main[\s\S]*?<\/main>/)[0];
  assert.match(main, /I build the AI office manager <span>for DMV service businesses\.<\/span>/);
  assert.match(main, /<h2 id="cta-title">Do the right thing\.<\/h2>/);
  assert.doesNotMatch(home, /We help businesses grow/);
  assert.match(main, /DMV Area/);
  assert.doesNotMatch(main, /Fix\. Measure\. Report\./, 'the 30-day numbers section is retired');
  assert.match(home, /"name": "Washington DC metropolitan area \(DMV\)"/);
  const place = /\bClinton\b|Southern Maryland|\bSoMD\b|Southern MD\b|So\.\s*MD\b|St\.?\s*Mary['’]s|\bCalvert\b|\bTysons\b|\bBowie\b|\bLanham\b|\bLargo\b|\bWaldorf\b|Silver Spring|\bBaltimore\b|\bArlington\b|\bAnnapolis\b|\bGreenbelt\b|\bBeltsville\b|\bLaurel\b|\bHyattsville\b|College Park|Glenn Dale|\bMitchellville\b|\bRockville\b|\bBethesda\b|\bAlexandria\b|\bFairfax\b|\bFrederick\b|\bGaithersburg\b|\bGermantown\b/i;
  const nova = /\bNoVA\b/;
  const exclude = loadExclude();
  const served = [];
  (function walkPlaces(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(root, full).split(path.sep).join('/');
      if (isExcluded(rel, exclude)) continue;
      if (rel === 'scripts/demo-page.test.cjs' || rel === 'scripts/business-brand.test.cjs' || rel === 'scripts/retired-copy.test.cjs' || rel === 'scripts/private-terms.test.cjs') continue;
      if (entry.isDirectory()) walkPlaces(full);
      else if ((/\.(html?|js|mjs|json|md|css|txt|webmanifest|svg|xml|toml)$/i.test(entry.name) || /^(?:_headers|netlify\.toml|sitemap\.xml)$/i.test(entry.name) || path.extname(entry.name) === '') && fs.statSync(full).size < 5e6) served.push(full);
    }
  })(root);
  assert.ok(exclude.includes('docs'), 'docs stays unpublished only while _config.yml excludes it');
  assert.ok(served.some(f => f.endsWith(path.join('clips', 'index.html'))), 'clips/index.html is checked');
  assert.ok(served.some(f => f.endsWith('brand-kit.md')), 'brand-kit.md is served and checked');
  assert.equal(served.some(f => f.endsWith(path.join('docs', 'vision.md'))), false);
  assert.ok(served.length > 20, 'place guard scans served HTML, JS and JSON');
  for (const file of served) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    assert.doesNotMatch(read(rel), place, rel);
    assert.doesNotMatch(read(rel), nova, rel);
  }
  assert.match(main, /plan_yuDiw93Zp6Uvr/);
  assert.doesNotMatch(main, /plan_kZqq0jgr6VrGG/);
  for (const id of ['plan_HAGSLXXUeGkcz', 'plan_RVDjSToI7vKOM', 'plan_Vn0gQGFWQx9CA']) assert.doesNotMatch(home, new RegExp(id), 'retired offer link: ' + id);
  assert.doesNotMatch(home, /7-Day Do-It-Right Guarantee|I rewrite it free|7-DAY|DO-IT-RIGHT/);
  assert.match(main, /If it's not right, I fix it at no charge\./);
  assert.doesNotMatch(home, /free plan|PayPal|Stripe|twitch\.tv|\/cs2\.html|\/afterlight\.html|#080808|cfe35a/i);
  assert.doesNotMatch(main, /\/careers\.html/i);
  for (const file of ['find.html', 'contact.html']) {
    const html = read(file);
    assert.match(html, /theme-a\.css/, file);
    assert.doesNotMatch(html, /free plan|@gmail\.com|PayPal/i, file);
  }
  const cs2 = read('cs2.html');
  for (const id of ['votes', 'tabs', 'account', 'notes']) {
    assert.match(cs2, new RegExp('id="' + id + '"[^>]*hidden|hidden[^>]*id="' + id + '"'));
  }
  assert.match(read('brand.html'), /brand-kit\.md/);
});
