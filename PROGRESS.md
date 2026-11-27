# Progress

Branch `design/neural-glow`, PR #116, merge-updated with main `8caf895` (includes #114 `/links/` at `a13f7000` and later #122).

## TODO

- Binary commit: add `img/brand/og-mercado.png` (neutral 1200×630 share image, 13,890 bytes, already on disk in this box; no location) to `design/neural-glow`. The GitHub-xai and cursor-github connectors have no base64/binary blob or encoding field (`push_files` and `create_or_update_file` are text-only; `$file:` rejects a PNG; there is no create-blob/create-tree tool). Until that commit lands, homepage and `/mercado/` share tags use the in-repo mark `img/brand/avatar-a.png` (512×512, no location) so they do not 404.

Candles cards keep the exact disclosure: Referral link. We earn from fees. Trading is risky, not financial advice.

## 11/27 afternoon — money-first, SpaceX/Amazon phone layout

Visible homepage and `/mercado/` now show only five offers: Jafra, DTRT Lab AI for business (contact), MOTION, Candles, and Ask DTRT Lab (Pronto, no link until #111). No Vende tile. Blog, notebook, lab, stories, clips, news, and music are off the nav and home; they sit under a footer **More** disclosure. Card buttons go to the buying pages (Jafra consultant, MOTION affiliate, Candles referral, `/contact.html` for the business product). Disclosures stay as small text under the button.

Copy rulings kept: MOTION wording from motionpouches.com/shop (checked November 27, 2026) word for word, with a faithful ES translation; Ask card is "Prueba de IA muy temprana, todavía no está en vivo" + Pronto; "Things we build or link to. Some links earn us a commission." / "Cosas que construimos o enlazamos. Algunos enlaces nos pagan comisión."; share tags currently use the in-repo mark `/img/brand/avatar-a.png` (see TODO for `og-mercado.png`); tagline stays "Local, real, de aquí" until the copy_lint list PR merges; shopping helper uses the shared `js/mercado-allowlist.js` gate (products only when every token is known; anything else shows the 988 box and 0 cards). 988 also stays in the footer.

## Merge with main

#114 is on main, so `/links/` exists. This branch was updated with GitHub's update-branch merge commit (no rebase, no force-push). The #116 storefront on `/` and `/mercado/` is kept. `#114` / nav-only files follow main, including the sitewide Instagram handle `@dtrt.xyng`. Main's #115 live-refresh handoff stays on main; it is not duplicated here.

## NOT checked

- The live site. dtrtlab.com is behind the Cloudflare key lock (401). Nothing here opens it.
- Real phones and Safari or Firefox. Chrome headless at 390 (and earlier 1440) only.
- Contrast was measured earlier for the sand/ink pairs, not re-measured on the final dark storefront CSS.
- Reduced-motion was checked in the CSS, not by emulating the setting in a browser.
- Spanish wording is not reviewed by a native speaker.
- No Cloudflare, DNS, or Pages settings touched. $0 spent.
