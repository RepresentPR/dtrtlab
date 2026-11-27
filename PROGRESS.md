# Progress

Branch `design/neural-glow`, PR #116, merge-updated with main `8caf895` (includes #114 `/links/` at `a13f7000` and later #122).

## TODO

- Binary commit: add `img/brand/og-mercado.png` (neutral 1200×630 share image, 13,890 bytes, already on disk in this box; no location) to `design/neural-glow`. The GitHub-xai and cursor-github connectors have no base64/binary blob or encoding field (`push_files` and `create_or_update_file` are text-only; `$file:` rejects a PNG; there is no create-blob/create-tree tool). Until that commit lands, homepage and `/mercado/` share tags use the in-repo mark `img/brand/avatar-a.png` (512×512, no location) so they do not 404.

## 11/27 — QA FAIL on c6254fc9, helper updated to the r5 design

FIXED: shop search shows 988 only on a positive isCrisisText match or an ingest verb next to a non-food noun — js/mercado-allowlist.js and scripts/mercado-allowlist-r5.test.cjs.

FIXED: the non-food list includes jafra, cosmetica, belleza, beauty, skin, piel, perfume, shampoo, nail polish, esmalte, lotion, candles/velas, and wax/cera; "drink 20 cans of motion" and "drink jafra" are crisis — scripts/mercado-allowlist-r5-cases.json and scripts/shop-helper-dom.test.cjs.

FIXED: there is no drink allowlist and no number+pack exception that lets ingest phrasing through — js/mercado-allowlist.js.

FIXED: everything else gets results or a friendly no-match, never 988 — scripts/shop-helper-dom.test.cjs.

FIXED: ES crisis phrases ("acabar con mi vida", "no quiero seguir viviendo", "me voy a quitar la vida", "matarme") are crisis; the "killing me" idiom never covers "kill me", "please kill me", or "someone to kill me" — scripts/mercado-allowlist-r5.test.cjs.

FIXED: non-Latin and emoji input does not fold to empty. Other scripts and harm emoji show 988; ordinary emoji shows a no-match, not the catalog — scripts/shop-helper-dom.test.cjs.

FIXED: false alarms stay at or under 5% on the fresh 172-query EN/ES shop150 set, which has 0 exact and 0 folded overlap with collected QA probe lines — scripts/shop150-vs-qa-probes.json and scripts/mercado-allowlist-r5.test.cjs.

FIXED: safe no-match queries show the empty state, with 0 throws across a 233+ query sweep — scripts/shop-helper-dom.test.cjs.

FIXED: MOTION disclosure is the first line of the card; the claims are the motionpouches.com/shop lines "Zero nicotine and zero tobacco, too." and "40mg caffeine per pouch. Adults 18+." in index.html and mercado/index.html.

FIXED: the Candles disclosure sits on the same line as the View link in index.html and mercado/index.html: Referral link. We earn from fees. Trading is risky, not financial advice.

FIXED: at 390 px all four product cards, including the business AI card, sit fully inside the first 844 px in EN and ES (lowest card bottom 615 px; AI card bottom 378 px) — index.html and mercado/index.html (phone shots also at /tmp/pr116-shots/home-en-phone.png on the builder box).

FIXED: home and `/mercado/` load the shared r5 helper js/mercado-helper.js and js/mercado-allowlist.js (the contact pop-up uses the same isCrisisText).

DONE: title and og copy are about shopping; footer More has no /ask/, /blog/, or /notebook/; the mercado "being built" meta and data-draft are gone; the hidden #ask-home block is gone; the "Local, real, from here" tagline is gone; og still points at img/brand/avatar-a.png — index.html and mercado/index.html.

DONE: brand.html no longer offers the two download links at the old lines 58–59; the image files stay on disk.

DONE: /partners.html, /partner/, #prices, and #job-desk are unlinked from the homepage, its nav, and footer. The #prices and #job-desk sections remain in index.html so existing redirects still resolve.

READY for QA on PR #116 after this r5 fix round — scripts/shop-helper-dom.test.cjs and /tmp/pr116-shots/home-en-phone.png. See NOT checked below.

## 11/27 afternoon — money-first, SpaceX/Amazon phone layout

Visible homepage and `/mercado/` now show four offers: Jafra, DTRT Lab AI for business (contact), MOTION, and Candles. The Ask Pronto tile is no longer on the catalog. Blog, notebook, lab, stories, clips, news, and music stay off the storefront nav; they are not listed under footer More. Card buttons go to the buying pages (Jafra consultant, MOTION affiliate, Candles referral, `/contact.html` for the business product). MOTION's affiliate line opens the card; the Candles disclosure sits on the same line as View.

Copy rulings kept: MOTION wording from motionpouches.com/shop (checked November 27, 2026) word for word, with a faithful ES translation; "Things we build or link to. Some links earn us a commission." / "Cosas que construimos o enlazamos. Algunos enlaces nos pagan comisión."; share tags currently use the in-repo mark `/img/brand/avatar-a.png` (see TODO for `og-mercado.png`); shopping helper uses the shared `js/mercado-allowlist.js` gate. 988 also stays in the footer.

## Merge with main

#114 is on main, so `/links/` exists. This branch was updated with GitHub's update-branch merge commit (no rebase, no force-push). The #116 storefront on `/` and `/mercado/` is kept. `#114` / nav-only files follow main, including the sitewide Instagram handle `@dtrt.xyng`. Main's #115 live-refresh handoff stays on main; it is not duplicated here.

## NOT checked

- The live site. dtrtlab.com is behind the Cloudflare key lock (401). Nothing here opens it.
- Real phones and Safari or Firefox. Chrome headless at 390 (and earlier 1440) only.
- Contrast was measured earlier for the sand/ink pairs, not re-measured on the final dark storefront CSS.
- Reduced-motion was checked in the CSS, not by emulating the setting in a browser.
- Spanish wording is not reviewed by a native speaker.
- No Cloudflare, DNS, or Pages settings touched. $0 spent.
