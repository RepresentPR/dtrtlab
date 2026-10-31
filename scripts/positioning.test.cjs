const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { isExcluded, loadExclude } = require('./stage-site.cjs');

const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
// Locked 2026-10-15 (Co-Founder): we do the work, Ian is accountable, you see your numbers at 30 days.
// Research method stays internal; public pages never lead with it.
// docs/ is omitted only when _config.yml excludes it. versions, media, and clips
// stay off the company-face lead check even though Pages still serves them.
const METHOD = /public data|playbooks?|filings|earnings calls?/i;
const PUBLIC_EXCLUDE = /^(scripts|tools|versions|media|clips|node_modules)\//;
const EXCLUDE = loadExclude();

function publicPages() {
  return execFileSync('git', ['ls-files', '*.html'], { cwd: root, encoding: 'utf8' })
    .split('\n').filter(Boolean).filter(file => !PUBLIC_EXCLUDE.test(file) && !isExcluded(file, EXCLUDE));
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

test('homepage notebook preserves scoped offers and routes visitors to inquiry', () => {
  const home = read('index.html');
  assert.doesNotMatch(home, METHOD, 'homepage keeps the research method internal');
  const main = home.match(/<main[\s\S]*?<\/main>/)[0];
  // The owner approved the notebook lead on October 24. Retired prices stay off this page.
  const hero = main.match(/<section\b[^>]*class="[^"]*\bhero\b[^"]*"[^>]*>[\s\S]*?<\/section>/)?.[0] || '';
  assert.ok(hero, 'homepage has a hero section');
  assert.match(hero.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '), /An open record\s+of what we\s+build/i);
  assert.match(main, /href="\/map\/"/, 'existing map inquiry route remains available');
  assert.doesNotMatch(hero, /mailto:/, 'hero CTA is the on-site form, not a mailto link');
  assert.doesNotMatch(home, /Reply SYSTEM/, 'Reply SYSTEM stays off the website');
  assert.doesNotMatch(hero.replace(/<a [^>]*>/g, ''), /\$\s?\d/, 'no price in the hero');
  assert.doesNotMatch(hero, /plan_HAGSLXXUeGkcz|plan_RVDjSToI7vKOM|Mini|Week Pack/, 'Mini and Week Pack are off the hero');
  const nav = home.match(/<nav\b[^>]*aria-label="Main navigation"[^>]*>[\s\S]*?<\/nav>/)?.[0] || '';
  assert.ok(nav, 'main navigation has an accessible label');
  assert.doesNotMatch(nav, /\$50|plan_HAGSLXXUeGkcz/, 'Mini is off the nav');
  const desk = main.match(/<section\b[^>]*id="job-desk"[^>]*>[\s\S]*?<\/section>/)?.[0] || '';
  assert.ok(desk, 'existing Job Desk anchor remains available');
  const mainText = main.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  assert.doesNotMatch(mainText, /\$1,500|\$250/, 'retired prices stay off the homepage');
  for (const item of ['nightly report card', 'job tracking', 'customer updates', 'quote follow-up']) assert.match(desk, new RegExp(item, 'i'));
  assert.match(desk, /Never a password/);
  if (/add me as a user or manager/i.test(desk)) assert.match(desk, /remove (?:me|access) (?:at )?any\s*time/i);
  assert.match(main, /can't promise revenue/i);
  assert.doesNotMatch(desk, /\$50|\$129|Mini|Week Pack/, 'small plans stay out of the Job Desk section');
  for (const id of ['job-desk', 'prices', 'about', 'faq']) assert.match(main, new RegExp('\\bid="' + id + '"'), 'shared navigation anchor ' + id);
  assert.doesNotMatch(main, /id="how"|id="free-rewrite"/, '30-day numbers section and free rewrite are retired');
  // Mini Social Pack and Week Pack retired 2026-10-15 (Co-Founder; 0 Whop memberships).
  const offers = [...main.matchAll(/<article\b[^>]*class="[^"]*\boffer\b[^"]*"[^>]*>[\s\S]*?<\/article>/g)].map(m => m[0]);
  assert.equal(offers.length, 2, 'Job Desk and AI Visibility Fix');
  const names = offers.map(o => o.match(/<h3>([^<]+)<\/h3>/)[1]);
  assert.deepEqual(names, ['DTRT Job Desk', 'AI Visibility Fix']);
  for (const o of offers) assert.doesNotMatch(o, /numbers check/i, 'the day-30 numbers pitch is retired');
  assert.doesNotMatch(main, /Mini Social Pack|Week Pack|Writing Retainer|plan_HAGSLXXUeGkcz|plan_RVDjSToI7vKOM|plan_kZqq0jgr6VrGG/);
  assert.match(main, /\bAI\b/);
  assert.doesNotMatch(main, /mailto:hello@dtrtlab\.com\?subject=CHECK/);
  const fix = offers.find(o => /AI Visibility Fix/.test(o));
  assert.doesNotMatch(home, /https:\/\/whop\.com\/checkout\//, 'payment invitation waits for seller readiness');
  assert.match(fix, /href="\/map\/\?want=check"/, 'Fix routes to the existing inquiry form');
  assert.doesNotMatch(fix, /\$\s?\d|day[- ]30 re[- ]check/i, 'the Visibility Fix shows no retired price or day-30 re-check');
  assert.match(main, /href="\/job-desk\/how-it-works\/"/, 'existing service explanation remains reachable');
  assert.doesNotMatch(home, /Ian\s+Ferraro/i, 'public homepage brand is Ian');
  assert.match(home, /Answer 3 short questions and we'll reply\./, 'homepage uses the exact reply line');
  assert.doesNotMatch(home, /(?:within|in)\s+3\s+business days/i, 'homepage does not promise an unapproved turnaround');
  assert.doesNotMatch(home, /by email/i, 'homepage does not promise a reply channel');
  assert.doesNotMatch(main, /Reply CHECK/);
  assert.match(main, /review (?:replies|requests?|ask)/i);
  assert.doesNotMatch(main, /Review Desk/);
  assert.match(main, /can't promise/i, 'no guaranteed results (FTC-safe)');
  for (const file of ['index.html', 'find.html', 'contact.html', 'brand-kit.md', 'content/company.json', 'content/site.json', 'legal/terms.html']) {
    assert.doesNotMatch(read(file), /body shop|auto ?body|collision repair/i, file + ' has no body-shop examples');
  }
  const kit = read('brand-kit.md');
  assert.ok(!kit.split('\n').some((l) => /^- Bio:/.test(l) && /\$50/.test(l) && /Google listing/.test(l) && !/1 hook \+ 5 captions/.test(l)), 'a listing bio that names $50 must say what it buys');
  assert.doesNotMatch(read('AGENTS.md'), /Ian gives an explicit instruction|unless Ian explicitly instructs/, 'positioning sign-off moved to DTRT Co-Founder');
  assert.match(read('AGENTS.md'), /never merge positioning/);
  for (const m of main.matchAll(/>([^<>]+)<\/(?:p|h1|h2|h3|li|summary|a)>/g)) {
    assert.doesNotMatch(m[1].trim(), /:$/, 'copy never ends on a colon: ' + m[1].trim());
  }
});
