// HTTP probes shared by the post-deploy smoke test and the production regression check.
//   node scripts/site-probe.cjs smoke <deployment-url>   # after a Cloudflare Pages deploy
//   node scripts/site-probe.cjs prod                     # dtrtlab.com is public (no 401 / key page)
// Exit 1 with ::error:: lines on any failure. Retries cover edge propagation.
const KEY_PAGE = /action=["']\/__key["']/i;

const SMOKE = [
  { path: '/', expect: [200], publicPage: true },
  { path: '/private', expect: [404] },
  { path: '/private/', expect: [404] },
  { path: '/auction', expect: [200] },
  { path: '/bid', expect: [200, 400, 405] }, // GET on the POST endpoint: never 404 or 5xx
];
const PROD_BASES = ['https://dtrtlab.com', 'https://www.dtrtlab.com'];
const PROD = [
  { path: '/', expect: [200], publicPage: true },
  { path: '/ask/', expect: [200], publicPage: true },
  { path: '/private', expect: [404] },
];

async function probe(base, item, { fetchImpl = fetch, tries = 3, waitMs = 5000 } = {}) {
  const url = base.replace(/\/$/, '') + item.path;
  let last = '';
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetchImpl(url, { redirect: 'follow', headers: { 'User-Agent': 'dtrtlab-site-probe', 'Cache-Control': 'no-cache' } });
      const body = item.publicPage ? await res.text() : '';
      if (res.status === 401) last = `${url} returned 401 (key lock is on)`;
      else if (!item.expect.includes(res.status)) last = `${url} returned ${res.status}, expected ${item.expect.join(' or ')}`;
      else if (item.publicPage && KEY_PAGE.test(body)) last = `${url} returned the key page (form posting to /__key)`;
      else return null;
    } catch (err) {
      last = `${url} failed: ${err && err.name ? err.name : 'Error'}`;
    }
    if (i + 1 < tries) await new Promise((r) => setTimeout(r, waitMs));
  }
  return last;
}

async function run(bases, items, opts) {
  const errors = [];
  for (const base of bases) for (const item of items) {
    const e = await probe(base, item, opts);
    if (e) errors.push(e);
  }
  return errors;
}

async function main(argv) {
  const [mode, url] = argv;
  let errors;
  if (mode === 'smoke' && url) errors = await run([url], SMOKE);
  else if (mode === 'prod') errors = await run(PROD_BASES, PROD);
  else { console.log('usage: site-probe.cjs smoke <url> | prod'); return 2; }
  for (const e of errors) console.log(`::error title=site probe (${mode}) failed::${e}`);
  if (!errors.length) console.log(`site probe (${mode}) passed`);
  return errors.length ? 1 : 0;
}

if (require.main === module) main(process.argv.slice(2)).then((code) => process.exit(code));

module.exports = { probe, run, main, KEY_PAGE, SMOKE, PROD, PROD_BASES };
