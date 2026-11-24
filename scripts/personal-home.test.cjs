const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { isExcluded, loadExclude } = require('./stage-site.cjs');
const ask = require('../ask/ask.js');
const { build } = require('./build-ask-index.cjs');

const root = path.join(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const PROFILES = [
  'https://www.instagram.com/dtrt.xyng/',
  'https://x.com/DTRTLab',
  'https://www.tiktok.com/@iananthonyfc',
  'https://www.youtube.com/@DTRTLabYT',
  'https://www.twitch.tv/dtrtc'
];

function pages() {
  const exclude = loadExclude();
  const out = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(root, full).split(path.sep).join('/');
      if (isExcluded(rel, exclude) || entry.name.startsWith('.')) continue;
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.html')) out.push(rel);
    }
  })(root);
  return out;
}

test('home leads with Ian, an empty posts page, and Ask', () => {
  const home = read('index.html');
  const main = home.match(/<main[\s\S]*?<\/main>/)[0];
  const blog = read('blog/index.html');
  assert.match(main, /<h1[^>]*>I'm Ian\./);
  assert.match(main, /Instagram and X are where I post most\./);
  assert.doesNotMatch(main, /id="posts"|First post coming soon/);
  assert.doesNotMatch(home + blog, /DRAFT EXAMPLE|a-placeholder|placeholder post/i);
  assert.match(blog, /Posts live here\./);
  assert.doesNotMatch(blog, /coming soon/i);
  assert.match(blog, /href="https:\/\/www\.instagram\.com\/dtrt\.xyng\/"/);
  assert.match(blog, /href="https:\/\/x\.com\/DTRTLab"/);
  assert.match(main, /href="\/blog\/"/);
  assert.match(main, /href="\/ask\/"/);
  assert.match(main, /id="work-with-me"/);
  assert.match(home, /href="\/map\/"/);
  assert.match(home, /id="job-desk"/);
  assert.match(home, /id="videos"/);
  assert.equal(fs.existsSync(path.join(root, 'blog/a-placeholder/index.html')), false);
  assert.equal(fs.existsSync(path.join(root, 'private')), false);
  const visit = read('js/visit.js');
  assert.doesNotMatch(visit, /pointerdown|keydown/);
  assert.doesNotMatch(visit, /Waiting for a tap/);
  assert.match(visit, /saved == null \|\| saved === "" \|\| !isFinite\(volume\)\) volume = 40/);
  const decision = read('docs/decisions/2026-11-15-social-row.md');
  assert.match(decision, /ensure all my social media acc are easily link for anyone who goes on my website/);
  assert.match(decision, /instagram and x are the main focus/);
  assert.doesNotMatch(decision, /Later the same day he said Instagram and X are where he posts most/);
  assert.doesNotMatch(read('news.html') + read('content/releases.json'), /Atlantic|UTC−4|UTC-4/);
  assert.doesNotMatch(read('sitemap.xml'), /dtrtlab\.com\/blog\//);
  const scene = read('js/scene-nav.js');
  assert.match(scene, /"instagram", "x", "tiktok", "youtube", "twitch"/);
  assert.match(scene, /rel="me noopener noreferrer"/);
  assert.match(read('cs2.html') + read('tab.html'), /scene-nav\.js\?v=20261123-links2/);
  assert.doesNotMatch(read('cs2.html') + read('tab.html'), /js\/nav\.js/);
});

test('every visitor page links the five profiles, with Instagram marked as main', () => {
  const skip = new Set(['live/extras.html', 'live/upnext.html']);
  const missing = [];
  for (const rel of pages()) {
    if (skip.has(rel)) continue;
    const html = read(rel);
    for (const url of PROFILES) {
      if (!html.includes(url)) missing.push(rel + ' missing ' + url);
    }
    if (!html.includes('class="social-main"') || !html.includes('rel="me noopener noreferrer"')) {
      missing.push(rel + ' missing the main Instagram link');
    }
    const rows = html.match(/class="site-socials"/g) || [];
    if (rows.length !== 1) missing.push(rel + ' has ' + rows.length + ' social rows');
    if (html.includes('/js/visit.js') && !html.includes('dream.css')) missing.push(rel + ' loads music without dream.css');
    if (!html.includes('dream.css') && html.includes('/js/visit.js')) missing.push(rel + ' keeps the music control');
    if (html.includes('class="site-socials"') && !html.includes('socials.css')) missing.push(rel + ' social row has no stylesheet');
  }
  assert.deepEqual(missing, []);
  for (const rel of ['legal/terms.html', 'legal/privacy.html', 'legal/cookies.html', 'legal/refunds.html', 'legal/dmca.html', 'legal/preorder-terms.html']) {
    const html = read(rel);
    assert.match(html, /Last updated November 15, 2026 — added profile links; legal text unchanged/);
    assert.match(html, /Last updated November 15, 2026/);
    assert.doesNotMatch(html, /visit\.js/);
  }
});

test('Ask answers from public pages only, in the browser', () => {
  const corpus = build();
  const bundled = read('ask/passages.js');
  assert.match(read('ask/ask.js'), /local-bm25/);
  assert.doesNotMatch(read('ask/ask.js') + read('ask/ui.js'), /fetch\(|api\.openai|anthropic|generativelanguage/i);
  assert.ok(corpus.passages.length > 10);
  const urls = corpus.passages.map((passage) => passage.url);
  assert.ok(urls.includes('/map/'));
  assert.ok(!urls.some((url) => /\/private|\/live\/|\/hq\/|a-placeholder|afterlight|\/story\.html|\/worlds\.html|\/game\.html|\/media\.html|\/news\.html|\/training\.html|\/catalog\.html|\/radio\.html|\/preorder\.html/.test(url)));
  assert.doesNotMatch(corpus.passages.map((passage) => passage.title + ' ' + passage.text).join('\n'), /Atlantic/);
  assert.match(bundled, /window\.DTRT_ASK_CORPUS/);
  const matches = ask.search('free office map', corpus, 3);
  assert.ok(matches.length);
  assert.equal(matches[0].passage.url, '/map/');
  const draft = corpus.passages.map((passage) => passage.text).join('\n');
  assert.doesNotMatch(draft, /Nothing in it is a fact about Ian/);
});
