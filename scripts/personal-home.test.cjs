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
  'https://www.instagram.com/officiallydtrt/',
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

test('home leads with Ian, posts, Ask, and Instagram as the main platform', () => {
  const home = read('index.html');
  const main = home.match(/<main[\s\S]*?<\/main>/)[0];
  assert.match(main, /<h1[^>]*>I'm Ian\./);
  assert.match(main, /href="\/blog\/"/);
  assert.match(main, /href="\/ask\/"/);
  assert.match(main, /id="work-with-me"/);
  assert.match(main, /Instagram is the main platform/);
  assert.match(home, /href="\/map\/"/);
  assert.match(home, /id="job-desk"/);
  assert.match(home, /id="videos"/);
  assert.doesNotMatch(read('blog/a-placeholder/index.html'), /Ian Ferraro/);
  assert.match(read('blog/a-placeholder/index.html'), /DRAFT EXAMPLE/);
  assert.match(read('blog/a-placeholder/index.html'), /noindex/);
  assert.match(read('blog/a-placeholder/index.html'), /data-draft="example"/);
  assert.equal(fs.existsSync(path.join(root, 'private')), false);
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
  }
  assert.deepEqual(missing, []);
});

test('Ask answers from public pages only, in the browser', () => {
  const corpus = build();
  const bundled = read('ask/passages.js');
  assert.match(read('ask/ask.js'), /local-bm25/);
  assert.doesNotMatch(read('ask/ask.js') + read('ask/ui.js'), /fetch\(|api\.openai|anthropic|generativelanguage/i);
  assert.ok(corpus.passages.length > 10);
  const urls = corpus.passages.map((passage) => passage.url);
  assert.ok(urls.includes('/map/'));
  assert.ok(!urls.some((url) => /\/private|\/live\/|\/hq\/|a-placeholder/.test(url)));
  assert.match(bundled, /window\.DTRT_ASK_CORPUS/);
  const matches = ask.search('free office map', corpus, 3);
  assert.ok(matches.length);
  assert.equal(matches[0].passage.url, '/map/');
  const draft = corpus.passages.map((passage) => passage.text).join('\n');
  assert.doesNotMatch(draft, /Nothing in it is a fact about Ian/);
});
