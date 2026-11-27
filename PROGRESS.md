# Progress

Branch `design/neural-glow`, PR "Homepage redesign: neural glow (dream theme)". Base is main `29009944` (after #112).

Head: see the PR. This file is excluded from the published site (`_config.yml` exclude).

## What changed
- `css/neural-glow.css` (new): the dark dream theme, scoped to `body.dream`, loaded after `dream.css`. Near-black field, teal and violet glow, one node network in inline SVG. No images added, no inline styles, no inline scripts, CSP unchanged.
- `index.html`: new hero art (node network and Ian's existing headshot `img/company/ian-headshot.svg`, 29 KB), "Building in public." under "I'm Ian.", an EN/ES switch, and a short product strip that links to `/links/` (tea, MOTION, our AI, Candles). The strip has the disclosures only as text. It carries no affiliate or referral URLs.
- `js/home-lang.js` (new): `?lang=es` for the new copy, from `data-es` attributes, the same pattern as `/links/`.
- `blog/index.html`: loads the new stylesheet (shared header, footer and background match).
- `scripts/build-ask-index.cjs`: one line so the Ask index ignores `<!--ask-skip-->` blocks. The new hero art and the product strip are marked, so `ask/passages.*` do not change (that would force a cache-key cascade through sw.js, js/nav.js and 24 pages).
- `scripts/cache-manifest.json`: two new entries from `scripts/update-cache-manifest.cjs`.
- `_config.yml`: `PROGRESS.md` added to the exclude list.

## Tests
`FIX7_BASE_REF=origin/main node --test scripts/*.test.cjs scripts/*.test.mjs` on this branch alone: 358 tests, 355 pass, 2 fail, 1 skipped (Jekyll not installed locally).
The 2 failures are the link checks (`site-links`, `fix7/2`): `/links/#tea`, `#motion`, `#ai` and `#candles` do not exist on main. PR #114 adds `/links/`. This PR must merge after #114. With #114's head merged into it in a scratch tree (`FIX7_BASE_REF` set to #114's head): 358 tests, 357 pass, 0 fail, 1 skipped (Jekyll). With `FIX7_BASE_REF=origin/main` that merged tree shows 3 failures that come from #114's own diff (js/stats.js is unreferenced, and six legal pages were edited). They are not from this PR.
Browser tests ran in real headless Chromium.

## Merge notes
- Merged with `pr/114` head in a scratch tree: clean, no conflicts.
- Against `pr/111`: only `PROGRESS.md` conflicts (both add it). Keep both files' content when merging.
- `/links/` itself does not load `neural-glow.css` yet. After #114 merges, add one `<link>` line after its `dream.css` line (and bump the key) so it matches. `ask/index.html` is not touched because #111 replaces it.

## NOT checked
- done_gate.py: absent at `/home/box/dtrt-checks/gates/`, not run.
- The live site. dtrtlab.com is behind the Cloudflare key lock (401). Nothing here opens it.
- Real phones and Safari or Firefox. Chrome headless at 1440 and 390 only.
- Contrast ratios were judged by eye, not measured. No screen reader pass.
- Reduced-motion was checked in the CSS, not by emulating the setting in a browser.
- The other 18 pages that load `dream.css` without `body.dream`, and `ask/` (replaced by #111), still have their current look.
- The legacy homepage sections stay English under `?lang=es`. Only the new copy has Spanish. The Spanish wording is not reviewed by a native speaker.
- The Spanish strings are copied from #114 where the English matches. #114 itself has not passed QA.
- The video, the fire guide and the request form were restyled but not exercised.
- The two `officiallydtrt` links in `index.html` are left for #114, which changes them site-wide.
- No Cloudflare, DNS, or Pages settings touched. $0 spent.
