const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
// Locked 2026-10-15 (Co-Founder): we do the work, Ian is accountable, you see your numbers at 30 days.
// Research method stays internal; public pages never lead with it.
const METHOD = /public data|playbooks?|filings|earnings calls?/i;
const PUBLIC_EXCLUDE = /^(docs|scripts|tools|versions|media|clips|node_modules)\//;

function publicPages() {
  return execFileSync('git', ['ls-files', '*.html'], { cwd: root, encoding: 'utf8' })
    .split('\n').filter(Boolean).filter(file => !PUBLIC_EXCLUDE.test(file));
}

function leadText(html) {
  const parts = [];
  const title = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (title) parts.push(title[1]);
  for (const m of html.matchAll(/<meta\s+(?:name|property)="(?:description|og:description|og:title|twitter:description)"\s+content="([^"]*)"/gi)) parts.push(m[1]);
  for (const m of html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)) parts.push(m[1]);
  const hero = html.match(/<section class="hero"[\s\S]*?<\/section>/i);
  if (hero) parts.push(hero[0]);
  return parts.join('\n');
}

test('no public page leads with public data, playbooks, filings or earnings calls', () => {
  const pages = publicPages();
  assert.ok(pages.length > 20, 'found the public pages');
  for (const file of pages) {
    const lead = leadText(read(file));
    assert.doesNotMatch(lead, /public data only/i, file + ' leads with "public data only"');
    assert.doesNotMatch(lead, METHOD, file + ' leads with the research method instead of the work');
  }
});

test('homepage sells the work, the person and the 30-day numbers', () => {
  const home = read('index.html');
  assert.doesNotMatch(home, METHOD, 'homepage keeps the research method internal');
  const main = home.match(/<main[\s\S]*?<\/main>/)[0];
  assert.match(main, /I'm Ian\. I fix your Google listing, reviews and posts, then show you the numbers 30 days later\. You don't need to learn AI, because I do the work\. Try me for \$50: 1 hook \+ 5 captions\./);
  // The $50 Mini stays exactly 1 hook + 5 captions; Google listing work lives only in the $250 Fix.
  const offers = [...main.matchAll(/<article class="offer[^"]*"[\s\S]*?<\/article>/g)].map(m => m[0]);
  assert.equal(offers.length, 4, 'Mini, Week Pack, Review Desk, AI Visibility Fix');
  const mini = offers.find(o => /Mini Social Pack/.test(o));
  assert.match(mini, /1 hook \+ 5 captions/);
  assert.doesNotMatch(mini, /Google listing|listing/i, 'no listing work at $50');
  for (const o of offers.filter(o => !/AI Visibility Fix/.test(o))) assert.match(o, /numbers check/i, 'every tier has a day-30 numbers check');
  assert.match(main, /<h3>Writing Retainer · Review Desk<\/h3>/);
  assert.match(main, /Do you use AI\?/);
  assert.match(main, /mailto:hello@dtrtlab\.com\?subject=CHECK/);
  const fix = offers.find(o => /AI Visibility Fix/.test(o));
  assert.match(fix, /class="btn" href="https:\/\/whop\.com\/checkout\/plan_yuDiw93Zp6Uvr"/, 'Fix button goes to its Whop checkout');
  assert.match(fix, /href="mailto:[^"]*subject=CHECK[^"]*"[^>]*>Reply CHECK and I'll run it on your business free\.<\/a>/, 'CHECK mailto is only the free check');
  assert.match(main, /<h2 id="how-title">Fix\. Measure\. Report\.<\/h2>/);
  assert.match(main, /AI Visibility Fix[\s\S]*?\$250[\s\S]*?Day-30 re-check/);
  assert.match(main, /Reply CHECK and I'll run it on your business free\./);
  assert.match(main, /Review Desk/);
  assert.match(main, /can't promise/i, 'no guaranteed results (FTC-safe)');
  for (const file of ['index.html', 'find.html', 'contact.html', 'brand-kit.md', 'content/company.json', 'content/site.json', 'legal/terms.html']) {
    assert.doesNotMatch(read(file), /body shop|auto ?body|collision repair/i, file + ' has no body-shop examples');
  }
  const kit = read('brand-kit.md');
  for (const line of kit.split('\n').filter(l => /^- Bio:/.test(l) && /\$50/.test(l) && /Google listing/.test(l))) {
    assert.match(line, /1 hook \+ 5 captions/, 'a bio that mentions listing work and $50 must say what $50 buys');
  }
  assert.doesNotMatch(read('AGENTS.md'), /Ian gives an explicit instruction|unless Ian explicitly instructs/, 'positioning sign-off moved to DTRT Co-Founder');
  assert.match(read('AGENTS.md'), /never merge positioning/);
  for (const m of main.matchAll(/>([^<>]+)<\/(?:p|h1|h2|h3|li|summary|a)>/g)) {
    assert.doesNotMatch(m[1].trim(), /:$/, 'copy never ends on a colon: ' + m[1].trim());
  }
});
