// Fix 7 site gate, browser half: headless Chromium against a local copy of the site.
//   node --test scripts/fix7-browser.test.cjs           (skips if Playwright isn't installed)
//   FIX7_REQUIRE_BROWSER=1 node --test scripts/*.test.cjs   (CI: a missing browser FAILS)
// Checks: (1) no fixed/sticky overlay (cookie bar, Sound off, docks, banners) paints over a
// clickable button or link at 390x844 and 1440x900 on every page and header type, first visit;
// (2) every link/CTA in the RENDERED DOM (incl. JS-injected nav/footer) resolves (no 404),
// no rendered CTA is mailto:, and every CTA is actually clicked and lands on a working page;
// (4) /proof renders "as of <time>"; (5) edited JS/CSS is actually requested by a page.
// External requests are never made: navigations off-site get a stub page, everything else is aborted.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('./fix7/lib.cjs');
const { start } = require('./fix7/server.cjs');

let playwright = null;
try { playwright = require('playwright'); } catch { try { playwright = require('playwright-core'); } catch {} }
const REQUIRE = process.env.FIX7_REQUIRE_BROWSER === '1';
const VIEWPORTS = [
  { name: '390', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: '1440', viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
];
const CONCURRENCY = Number(process.env.FIX7_CONCURRENCY || 6);
const SETTLE_MS = 350;
// Explicit overlay allowlist: [page regex, overlay selector regex, covered-element regex, reason].
const OVERLAY_ALLOW = [
  // e.g. [/^live\//, /\.ticker/, /.*/, 'owner-only page behind a password'],
];

const pages = L.htmlPages();
const SEEDED = 'scripts/fix7/fixtures/overlay-bad.html'; // seeded bad case; scripts/ is not crawled
// Pages are loaded as https://dtrtlab.com/... and every dtrtlab.com request is answered from the
// local server by request interception (nothing leaves the machine). The real hostname matters:
// js/analytics.js only shows the cookie bar on dtrtlab.com, and the pages' CSP upgrades
// http subresources to https.
const SITE_HOST = /^(www\.)?dtrtlab\.com$/i;
async function routeAll(context, origin, local, requested) {
  await context.route('**/*', async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    if (SITE_HOST.test(u.hostname)) {
      if (requested) requested.add(u.pathname);
      const r = await fetch(local + u.pathname + u.search, { redirect: 'manual' });
      const headers = Object.fromEntries(r.headers);
      if (headers.location) headers.location = new URL(headers.location, origin + u.pathname).href;
      return route.fulfill({ status: r.status, headers, body: Buffer.from(await r.arrayBuffer()) });
    }
    let topNav = false;
    try { topNav = req.isNavigationRequest() && (!req.frame().parentFrame()); } catch { topNav = req.isNavigationRequest(); } // popups: frame not attached yet
    if (topNav) return route.fulfill({ status: 200, contentType: 'text/html', body: '<title>external stub</title>external' });
    return route.abort();
  });
}
const isSite = (abs) => { try { return SITE_HOST.test(new URL(abs).hostname); } catch { return false; } };
let ctx = null; // { browser, origin, server, results }

async function pool(items, n, fn) {
  const out = [];
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } }));
  return out;
}

// Runs in the page. Returns overlay intersections, header type, rendered links/CTAs.
function inPage() {
  const vw = innerWidth, vh = innerHeight;
  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0 || el.closest('[hidden],[aria-hidden="true"][inert]')) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1 && r.bottom > 0 && r.right > 0 && r.top < vh && r.left < vw;
  };
  const desc = (el) => {
    const id = el.id ? '#' + el.id : '';
    const cls = typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
    const txt = (el.innerText || el.getAttribute('aria-label') || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return `${el.tagName.toLowerCase()}${id}${cls}${txt ? ' "' + txt + '"' : ''}`;
  };
  const overlays = [...document.querySelectorAll('body *')].filter((el) => {
    const p = getComputedStyle(el).position;
    return (p === 'fixed' || p === 'sticky') && visible(el);
  }).filter((el, _, arr) => !arr.some((o) => o !== el && o.contains(el))); // outermost only
  const clickSel = 'a[href], button, [role="button"], input[type="submit"], input[type="button"], summary, label[for], select';
  const clickables = [...document.querySelectorAll(clickSel)].filter(visible);
  const hits = [];
  for (const c of clickables) {
    const cr = c.getBoundingClientRect();
    for (const o of overlays) {
      if (o === c || o.contains(c) || c.contains(o)) continue;
      const orr = o.getBoundingClientRect();
      const x1 = Math.max(cr.left, orr.left, 0), y1 = Math.max(cr.top, orr.top, 0);
      const x2 = Math.min(cr.right, orr.right, vw), y2 = Math.min(cr.bottom, orr.bottom, vh);
      if (x2 - x1 < 4 || y2 - y1 < 4) continue; // ignore sub-4px edge touches (anti-aliasing, borders)
      // Only count it if the overlay actually paints on top of the clickable somewhere in the overlap.
      const pts = [[(x1 + x2) / 2, (y1 + y2) / 2], [x1 + 1, y1 + 1], [x2 - 1, y1 + 1], [x1 + 1, y2 - 1], [x2 - 1, y2 - 1]];
      const covered = pts.filter(([x, y]) => { const top = document.elementFromPoint(x, y); return top && o.contains(top) && !c.contains(top); }).length;
      if (covered) hits.push({ overlay: desc(o), target: desc(c), overlap: `${Math.round(x2 - x1)}x${Math.round(y2 - y1)}px`, points: covered });
    }
  }
  const header = document.querySelector('header.nav, .nav') ? '.nav' : document.querySelector('.site-header') ? '.site-header' : document.querySelector('header.top, .top') ? '.top' : document.querySelector('header') ? 'header' : 'none';
  const isCta = (a) => /\b(btn|button|cta|ghost|pill|dock)\b/i.test(a.className || '') || a.getAttribute('role') === 'button' || a.hasAttribute('data-event');
  const links = [...document.querySelectorAll('a[href], area[href], form[action]')].map((a) => {
    const raw = a.getAttribute(a.tagName === 'FORM' ? 'action' : 'href');
    return { raw, abs: a.tagName === 'FORM' ? a.action : a.href, cta: a.tagName === 'FORM' || isCta(a), inFooter: !!a.closest('footer'), text: desc(a), target: a.getAttribute('target') || '', visible: visible(a) };
  });
  return { hits, header, overlays: overlays.map(desc), links, stamp: document.getElementById('stamp')?.textContent || null };
}

async function visit(browser, origin, local, page, vp) {
  const context = await browser.newContext({ viewport: vp.viewport, isMobile: vp.isMobile, hasTouch: vp.hasTouch, deviceScaleFactor: vp.deviceScaleFactor, reducedMotion: 'reduce', serviceWorkers: 'block' });
  const requested = new Set();
  const bad = [];
  await routeAll(context, origin, local, requested);
  const p = await context.newPage();
  p.on('response', (r) => { if (isSite(r.url()) && r.status() >= 400 && r.request().resourceType() !== 'document') bad.push(`${r.status()} ${new URL(r.url()).pathname}`); });
  const url = origin + '/' + page.replace(/(^|\/)index\.html$/, '$1');
  let res;
  try { res = await p.goto(url, { waitUntil: 'networkidle', timeout: 20000 }); } catch (e) { await context.close(); return { page, vp: vp.name, error: e.message.split('\n')[0] }; }
  // Pages that redirect themselves with JS (location.replace / meta refresh) are measured
  // where they land; the landing URL is recorded.
  const evalSafe = async (fn) => {
    for (let i = 0; i < 3; i++) {
      try { return await p.evaluate(fn); } catch (e) {
        if (!/context was destroyed|navigat/i.test(e.message)) throw e;
        await p.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      }
    }
    return p.evaluate(fn);
  };
  try {
  // Determinism: if the page loads analytics.js, wait for its cookie bar (it appears after a
  // fetch of content/site.json), then for web fonts, then a short settle.
  await p.waitForFunction(() => !document.querySelector('script[src*="analytics.js"]') || document.querySelector('.consent'), null, { timeout: 4000 }).catch(() => {});
  await p.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
  await p.waitForTimeout(SETTLE_MS);
  const data = await evalSafe(inPage);
  // Second pass, same page: a returning visitor who already answered the cookie bar. Catches
  // overlays (e.g. Sound off) that the cookie bar was hiding in the first pass.
  await evalSafe(() => { try { localStorage.setItem('dtrt-ga', 'no'); } catch {} document.querySelectorAll('.consent').forEach((e) => e.remove()); });
  await p.waitForTimeout(50);
  const after = await evalSafe(inPage);
  const key = (h) => h.overlay + '|' + h.target;
  const firstKeys = new Set(data.hits.map(key));
  const hits = data.hits.map((h) => ({ ...h, pass: 'first visit' })).concat(after.hits.filter((h) => !firstKeys.has(key(h))).map((h) => ({ ...h, pass: 'after cookie choice' })));
  const landed = p.url();
  await context.close();
  return { page, vp: vp.name, status: res && res.status(), landed, requested: [...requested], badSub: bad, ...data, hits };
  } catch (e) { await context.close().catch(() => {}); return { page, vp: vp.name, error: 'measure failed: ' + e.message.split('\n')[0] }; }
}

async function clickCtas(browser, origin, local, visits, vpName) {
  // Click each distinct internal CTA (desktop, no mail handler) and require a working landing page.
  const seen = new Set();
  const jobs = [];
  const vp = VIEWPORTS.find((x) => x.name === vpName);
  for (const v of visits.filter((x) => x.vp === vpName && x.links)) {
    v.links.forEach((l, idx) => {
      if (!l.cta || !l.visible || l.raw == null || /^(#|javascript:)/i.test(l.raw) || !/^(https?|mailto):/.test(l.abs)) return;
      const key = v.page + '|' + l.abs;
      if (seen.has(key)) return;
      seen.add(key);
      jobs.push({ page: v.page, link: l });
    });
  }
  const problems = [];
  await pool(jobs, CONCURRENCY, async ({ page, link }) => {
    if (/^mailto:/i.test(link.raw)) { problems.push(`${page}@${vpName}: CTA ${link.text} is mailto: (does nothing without a mail app)`); return; }
    if (link.text.startsWith('form')) return; // forms checked by action resolution; submit is NOT exercised
    const context = await browser.newContext({ viewport: vp.viewport, isMobile: vp.isMobile, hasTouch: vp.hasTouch, reducedMotion: 'reduce', serviceWorkers: 'block', acceptDownloads: true });
    await routeAll(context, origin, local);
    const p = await context.newPage();
    try {
      await p.goto(origin + '/' + page.replace(/(^|\/)index\.html$/, '$1'), { waitUntil: 'load', timeout: 20000 });
      // dismiss consent so the click test is about the CTA, the overlay test covers the bar.
      // Pages that re-navigate themselves right after load (redirect, reload) destroy the JS
      // context; settle and retry instead of reporting a harness error as a CTA failure.
      for (let i = 0; ; i++) {
        try { await p.evaluate(() => { try { localStorage.setItem('dtrt-ga', 'no'); } catch {} document.querySelectorAll('.consent').forEach((e) => e.remove()); }); break; } catch (e) {
          if (i >= 6 || !/context was destroyed|navigat/i.test(e.message)) throw e;
          await p.waitForTimeout(300); // meta-refresh chains (preorder -> shop -> /#prices)
          await p.waitForLoadState('load', { timeout: 10000 }).catch(() => {});
        }
      }
      const loc = p.locator(`a[href="${link.raw.replace(/"/g, '\\"')}"]`).filter({ visible: true }).first();
      if (!(await loc.count())) { await context.close(); return; } // only rendered after interaction
      const before = p.url();
      const popupP = context.waitForEvent('page', { timeout: 4000 }).catch(() => null);
      const navP = p.waitForNavigation({ timeout: 4000 }).catch(() => null);
      const dlP = p.waitForEvent('download', { timeout: 4000 }).catch(() => null);
      let clicked = true;
      await loc.click({ timeout: 4000 }).catch((e) => { clicked = false; problems.push(`${page}@${vpName}: CTA ${link.text} could not be clicked: ${e.message.split('\n')[0]}`); });
      const [popup, nav, dl] = await Promise.all([popupP, navP, dlP]);
      if (popup) await popup.waitForLoadState('load').catch(() => {});
      const selfLink = new URL(link.abs).pathname === new URL(before).pathname;
      if (!clicked || dl || selfLink) { /* download started, or a link to the page you are on */ }
      else if (!popup && !nav && !link.raw.includes('#')) problems.push(`${page}@${vpName}: clicking CTA ${link.text} -> ${link.raw} did nothing`);
      else if (nav && nav.status() >= 400) problems.push(`${page}@${vpName}: CTA ${link.text} -> ${link.raw} landed on HTTP ${nav.status()}`);
    } catch (e) { problems.push(`${page}@${vpName}: CTA ${link.text}: ${e.message.split('\n')[0]}`); }
    await context.close();
  });
  return { problems, clicked: jobs.length };
}

test.before(async () => {
  if (!playwright) return;
  // Launch first: if Chromium is missing the hook fails fast and leaves no server holding the run open.
  const browser = await playwright.chromium.launch();
  let server, local;
  try { ({ server, origin: local } = await start()); } catch (e) { await browser.close(); throw e; }
  const origin = 'https://dtrtlab.com';
  ctx = { browser, server, origin, local, visits: [], clicks: { problems: [], clicked: 0 }, seeded: { hits: [], links: [] } };
  const work = [];
  for (const vp of VIEWPORTS) for (const page of pages) work.push([page, vp]);
  const visits = await pool(work, CONCURRENCY, ([page, vp]) => visit(browser, origin, local, page, vp));
  const seeded = await visit(browser, origin, local, SEEDED, VIEWPORTS[0]);
  const c1 = await clickCtas(browser, origin, local, visits, '1440');
  const c2 = await clickCtas(browser, origin, local, visits, '390');
  const clicks = { problems: [...c1.problems, ...c2.problems], clicked: c1.clicked + c2.clicked };
  ctx = { browser, server, origin, local, visits, clicks, seeded };
});
test.after(async () => {
  if (!ctx) return;
  const guard = (p) => Promise.race([p, new Promise((ok) => setTimeout(ok, 10000).unref())]);
  await guard(ctx.browser.close());
  ctx.server.closeAllConnections?.();
  ctx.server.close();
});

const needBrowser = (t) => {
  if (ctx) return true;
  if (REQUIRE) assert.fail('Playwright/Chromium not available but FIX7_REQUIRE_BROWSER=1');
  t.skip('playwright not installed (CI sets FIX7_REQUIRE_BROWSER=1)');
  return false;
};

test('fix7/1 planted: the overlay check flags a fixed chip over MENU and a cookie bar over a CTA, and ignores links inside a sticky header', (t) => {
  if (!needBrowser(t)) return;
  const hits = ctx.seeded.hits.map((h) => h.overlay + ' > ' + h.target);
  assert.ok(hits.some((h) => /div\.chip/.test(h) && /button\.menu/.test(h)), 'chip over MENU not flagged: ' + hits.join('; '));
  assert.ok(hits.some((h) => /div\.bar/.test(h) && /a\.cta/.test(h)), 'bar over CTA not flagged: ' + hits.join('; '));
  assert.ok(!hits.some((h) => /header\.nav/.test(h)), 'links inside the sticky header itself must not count');
  assert.ok(ctx.seeded.links.some((l) => l.cta && /^mailto:/.test(l.raw)), 'mailto CTA is classified as a CTA');
});

test('fix7/1 every page loads in headless Chromium at 390 and 1440', (t) => {
  if (!needBrowser(t)) return;
  const errs = ctx.visits.filter((v) => v.error || (v.status && v.status >= 400 && v.page !== '404.html')).map((v) => `${v.page}@${v.vp}: ${v.error || 'HTTP ' + v.status}`);
  assert.deepEqual(errs, []);
});

test('fix7/1 no fixed or sticky overlay covers a button or link at 390x844 and 1440x900 (first visit, every page, every header type)', (t) => {
  if (!needBrowser(t)) return;
  const headers = {};
  for (const v of ctx.visits) if (v.header) (headers[v.header] ||= new Set()).add(v.page);
  t.diagnostic('header types seen: ' + Object.entries(headers).map(([h, s]) => `${h}=${s.size} pages`).join(', '));
  for (const h of ['.nav', '.site-header', '.top']) assert.ok(headers[h], `no page with header type ${h} was tested`);
  const problems = [];
  for (const v of ctx.visits) for (const h of v.hits || []) {
    if (OVERLAY_ALLOW.some(([p, o, c]) => p.test(v.page) && o.test(h.overlay) && c.test(h.target))) continue;
    problems.push(`${v.page}@${v.vp} [${v.header}] (${h.pass}): ${h.overlay} covers ${h.target} (${h.overlap})`);
  }
  // Summary by overlay so the failure message is readable.
  const byOverlay = {};
  for (const pr of problems) { const o = pr.match(/\): (.*?) covers/)[1].replace(/ ".*/, ''); byOverlay[o] = (byOverlay[o] || 0) + 1; }
  t.diagnostic('collisions by overlay: ' + JSON.stringify(byOverlay));
  assert.equal(problems.length, 0, `${problems.length} overlay collisions:\n` + problems.join('\n'));
});

// Rendered-DOM link audit (also used on the planted fixture). Every mailto: fails (checklist:
// flag EVERY mailto link); every same-site target must not 404.
async function linkAudit(visits) {
  const targets = new Map();
  const mailto = [];
  for (const v of visits) for (const l of v.links || []) {
    if (l.raw == null) continue;
    if (/^mailto:/i.test(l.raw)) { mailto.push(`${v.page}@${v.vp}: ${l.cta ? 'CTA' : 'link'} ${l.text} -> ${l.raw.slice(0, 50)}`); continue; }
    if (!l.abs || !isSite(l.abs)) continue;
    const key = new URL(l.abs).pathname;
    if (!targets.has(key)) targets.set(key, new Set());
    targets.get(key).add(v.page);
  }
  const broken = [];
  await pool([...targets.keys()], 8, async (p) => {
    const r = await fetch(ctx.local + p, { redirect: 'follow' });
    if (r.status >= 400) broken.push(`${p} -> HTTP ${r.status} (linked from ${[...targets.get(p)].slice(0, 4).join(', ')})`);
  });
  return { mailto: [...new Set(mailto)], broken: broken.sort(), targets: targets.size };
}
test('fix7/2 planted: the rendered-link audit fails on a planted mailto link and a planted 404 CTA', async (t) => {
  if (!needBrowser(t)) return;
  const r = await linkAudit([ctx.seeded]);
  assert.ok(r.mailto.some((m) => /mailto:hello@dtrtlab\.com/.test(m)), 'planted mailto not flagged');
  assert.ok(r.broken.some((b) => b.startsWith('/__fix7_planted_missing__/')), 'planted 404 CTA not flagged');
});
test('fix7/2 every rendered internal link, CTA and form target resolves (no 404), and no rendered link is mailto:', async (t) => {
  if (!needBrowser(t)) return;
  const r = await linkAudit(ctx.visits);
  t.diagnostic(`crawled ${r.targets} distinct internal targets from ${ctx.visits.length} page renders`);
  const sub = [...new Set(ctx.visits.flatMap((v) => (v.badSub || []).map((b) => `${v.page}: ${b}`)))];
  assert.deepEqual(r.mailto.concat(r.broken, sub), []);
});

test('fix7/2 clicking every primary CTA (1440 desktop and 390 phone, no mail app) lands on a working page', (t) => {
  if (!needBrowser(t)) return;
  t.diagnostic(`clicked ${ctx.clicks.clicked} distinct CTAs`);
  assert.deepEqual([...new Set(ctx.clicks.problems)].sort(), []);
});

test('fix7/4 rendered /proof stamp reads "as of <time>"', (t) => {
  if (!needBrowser(t)) return;
  for (const v of ctx.visits.filter((x) => x.page === 'proof/index.html')) {
    assert.ok(v.stamp, '/proof has a #stamp');
    assert.match(v.stamp, /^as of \S.+/i, `/proof@${v.vp} stamp reads "${v.stamp}"`);
  }
});

test('fix7/5 every edited JS/CSS file is actually requested by at least one page in the browser', (t) => {
  if (!needBrowser(t)) return;
  const edited = L.editedFiles();
  if (!edited) return t.skip('no FIX7_BASE_REF; the static test reports all unreferenced files');
  const loaded = new Set(ctx.visits.flatMap((v) => v.requested || []).map((p) => p.replace(/^\//, '')));
  const scope = edited.filter((f) => /\.(m?js|css)$/.test(f) && !/^(scripts|tools|\.github)\//.test(f));
  t.diagnostic(`edited JS/CSS: ${scope.join(', ') || 'none'}`);
  const missing = scope.filter((f) => !loaded.has(f) && !L.UNREFERENCED_ALLOW.some(([rx]) => rx.test(f)));
  assert.deepEqual(missing, [], 'edited but never loaded by any page at first paint:\n' + missing.join('\n'));
});
