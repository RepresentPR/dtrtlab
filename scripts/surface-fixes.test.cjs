// Homepage guide, sitemap redirects, and the Inside the Lab stamp.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, PAGE, contentCommit, formatStamp } = require('./lab-updated.cjs');

const read = (name) => fs.readFileSync(path.join(ROOT, name), 'utf8');

const PHONE_BUTTONS = ['Text us (number coming soon)', 'Call us (number coming soon)'];
const HOME_REDIRECTS = ['about', 'company', 'history', 'faq', 'sample-plan', 'support', 'press', 'preorder', 'shop'];

function guideProblems(html) {
  const stage = String(html).match(/<div class="story-stage"[\s\S]*?<section class="assistant"/)?.[0] || '';
  const problems = [];
  if (!stage) problems.push('story stage missing');
  for (const phrase of PHONE_BUTTONS) {
    if (stage.includes(phrase)) problems.push(phrase);
  }
  if (stage && !stage.includes('href="/map/"')) problems.push('story stage missing /map/');
  return problems;
}

function sitemapRedirects(xml) {
  const locs = [...String(xml).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
  return locs.filter((loc) => {
    const slug = loc.replace(/^https:\/\/dtrtlab\.com/i, '').replace(/\.html$/, '').replace(/\/$/, '').replace(/^\//, '');
    return HOME_REDIRECTS.includes(slug);
  });
}

test('homepage guide has no text or call placeholders and links to the free office map', () => {
  const html = read('index.html');
  assert.deepEqual(guideProblems(html), []);
  const planted = [
    '<div class="story-stage"><button>Text us (number coming soon)</button><section class="assistant">',
    '<div class="story-stage"><button>Call us (number coming soon)</button><a href="/map/">Get a free office map</a><section class="assistant">',
    '<div class="story-stage"><a href="/contact.html">Contact</a><section class="assistant">',
  ];
  assert.ok(guideProblems(planted[0]).includes('Text us (number coming soon)'));
  assert.ok(guideProblems(planted[1]).includes('Call us (number coming soon)'));
  assert.ok(guideProblems(planted[2]).includes('story stage missing /map/'));
});

test('sitemap omits homepage redirect URLs', () => {
  const xml = read('sitemap.xml');
  assert.deepEqual(sitemapRedirects(xml), []);
  for (const slug of HOME_REDIRECTS) {
    assert.equal(fs.existsSync(path.join(ROOT, slug + '.html')), true, slug + '.html redirect stays');
  }
  const planted = xml.replace(
    '<loc>https://dtrtlab.com/</loc>',
    '<loc>https://dtrtlab.com/</loc><loc>https://dtrtlab.com/about.html</loc>',
  );
  assert.deepEqual(sitemapRedirects(planted), ['https://dtrtlab.com/about.html']);
});

test('inside the lab no longer shows the old October 25 stamp', () => {
  const html = read(PAGE);
  const expected = formatStamp(contentCommit().iso);
  const found = html.match(/id="lab-updated">Updated ([^<]+)</);
  assert.ok(found, 'stamp missing');
  assert.equal(found[1], expected);
  assert.doesNotMatch(html, /Updated October 25, 2026/);
  const planted = html.replace(`Updated ${expected}`, 'Updated October 25, 2026');
  assert.match(planted, /Updated October 25, 2026/);
  assert.notEqual((planted.match(/id="lab-updated">Updated ([^<]+)</) || [])[1], expected);
});
