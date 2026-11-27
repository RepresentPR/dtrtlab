// Build the Cloudflare Pages upload for project "dtrtlab" from a staged site.
//   node scripts/stage-site.cjs _site && node scripts/cf-pages-bundle.cjs _site
// Adds the advanced-mode worker (cloudflare/_worker.js -> _site/_worker.js) and the
// gate-era static files (cloudflare/__gate/* -> _site/__gate/), then refuses to
// continue unless the upload keeps the 1-of-1 key auction (/auction, /bid) and
// keeps /private a 404. A deploy without them would silently delete the auction.
// Bindings (KV BIDS, env vars) live in the Pages project settings, so there must be
// no wrangler.toml / wrangler.json here: one would replace those bindings.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REQUIRED_GATE = ['auction-ui.js', 'figtree.woff2'];

function check(site, root = ROOT) {
  const errs = [];
  const cf = path.join(root, 'cloudflare');
  const worker = path.join(cf, '_worker.js');
  for (const name of ['wrangler.toml', 'wrangler.json', 'wrangler.jsonc']) {
    if (fs.existsSync(path.join(root, name))) errs.push(`${name} must not exist: it would replace the dashboard bindings (KV BIDS)`);
  }
  if (!fs.existsSync(worker)) {
    errs.push('cloudflare/_worker.js is missing: the auction (/auction, /bid) and the /private 404 live in it');
  } else {
    const src = fs.readFileSync(worker, 'utf8');
    if (!/['"]\/auction['"]/.test(src)) errs.push('cloudflare/_worker.js has no /auction route');
    if (!/['"]\/bid['"]/.test(src)) errs.push('cloudflare/_worker.js has no /bid route');
    if (!/['"]\/private['"]/.test(src) || !/404/.test(src)) errs.push('cloudflare/_worker.js has no /private 404 rule');
    if (!/env\.BIDS/.test(src)) errs.push('cloudflare/_worker.js does not use the BIDS KV binding');
  }
  for (const f of REQUIRED_GATE) {
    if (!fs.existsSync(path.join(cf, '__gate', f))) errs.push(`cloudflare/__gate/${f} is missing (auction page asset)`);
  }
  if (!fs.existsSync(path.join(site, 'index.html'))) errs.push(`${site}/index.html missing: run scripts/stage-site.cjs first`);
  if (!fs.existsSync(path.join(site, '404.html'))) errs.push(`${site}/404.html missing: Pages would serve index.html (200) for unknown paths`);
  for (const ent of fs.existsSync(site) ? fs.readdirSync(site) : []) {
    if (/^private(\.|$)/i.test(ent)) errs.push(`${site}/${ent} must not be published (/private stays 404)`);
  }
  if (fs.existsSync(path.join(site, 'cloudflare'))) errs.push(`${site}/cloudflare must not be published (add it to _config.yml exclude)`);
  return errs;
}

function bundle(site, root = ROOT) {
  const errs = check(site, root);
  if (errs.length) return errs;
  const cf = path.join(root, 'cloudflare');
  fs.copyFileSync(path.join(cf, '_worker.js'), path.join(site, '_worker.js'));
  fs.mkdirSync(path.join(site, '__gate'), { recursive: true });
  for (const f of fs.readdirSync(path.join(cf, '__gate'))) {
    fs.copyFileSync(path.join(cf, '__gate', f), path.join(site, '__gate', f));
  }
  return [];
}

if (require.main === module) {
  const site = path.resolve(process.argv[2] || '_site');
  const errs = bundle(site);
  if (errs.length) {
    for (const e of errs) console.log(`::error title=cloudflare bundle refused::${e}`);
    process.exit(1);
  }
  console.log(`cloudflare bundle ready in ${site} (_worker.js + __gate/)`);
}

module.exports = { check, bundle, REQUIRED_GATE };
