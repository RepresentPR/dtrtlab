# cloudflare/: what the Pages deploy adds on top of the staged site

`.github/workflows/deploy-cloudflare.yml` deploys `main` to the Cloudflare Pages project **dtrtlab**. It does this only after tests, site-gate and gates pass, and only while the `CF_DEPLOY_ENABLED` repo variable is `true`. The deploy steps are:

1. `node scripts/stage-site.cjs _site`: the public files. This folder is excluded in `_config.yml`.
2. `node scripts/cf-pages-bundle.cjs _site`, which copies
   - `cloudflare/_worker.js` → `_site/_worker.js`: the advanced-mode worker with `/auction`, `/bid`, the BIDS KV offers and the **/private 404**
   - `cloudflare/__gate/auction-ui.js`, `figtree.woff2` → `_site/__gate/`

   It **refuses to deploy** if any of these is missing, so a deploy can't silently drop the auction.
3. `wrangler pages deploy _site --project-name=dtrtlab --branch=main`.
4. `node scripts/site-probe.cjs smoke <deployment-url>`: checks that `/` is 200 and not the key page, `/private` is 404, `/auction` is 200, and `/bid` doesn't 404 or 5xx.

## Still to add (handoff from the 11/27 go-live work)
These files aren't in the repo yet. Once the go-live worker build passes QA and is live, commit:
- `cloudflare/_worker.js`: the assets-mode worker (`/home/box/dtrt-work/golive/bundle/worker/`). Use the version that serves static files from `env.ASSETS`, so files come from this upload instead of being streamed from GitHub.
- `cloudflare/__gate/auction-ui.js`, `cloudflare/__gate/figtree.woff2`, plus the auction page if the worker reads it from a file instead of embedding it.

## Never
- **No `wrangler.toml` / `wrangler.json` in the repo.** The KV bindings (BIDS) and env vars live in the Pages project settings, and a wrangler config would replace them.
- **No secret values in this folder.** Bindings and secrets stay in the Cloudflare dashboard.
