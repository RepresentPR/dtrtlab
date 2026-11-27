# Progress

## TODO

- Binary commit: add `img/brand/og-mercado.png` (neutral 1200×630 share image, 13,890 bytes, already on disk in this box; no location) to `design/neural-glow`. The GitHub-xai and cursor-github connectors have no base64/binary blob or encoding field (`push_files` and `create_or_update_file` are text-only; `$file:` rejects a PNG; there is no create-blob/create-tree tool). Until that commit lands, homepage and `/mercado/` share tags use the in-repo mark `img/brand/avatar-a.png` (512×512, no location) so they do not 404.

Candles cards keep the exact disclosure: Referral link. We earn from fees. Trading is risky, not financial advice.

Branch `design/neural-glow`, PR #116. Head will be the latest push after this note.

## 11/27 afternoon — money-first, SpaceX/Amazon phone layout

Visible homepage and `/mercado/` now show only five offers: Jafra, DTRT Lab AI for business (contact), MOTION, Candles, and Ask DTRT Lab (Pronto, no link until #111). No Vende tile. Blog, notebook, lab, stories, clips, news, and music are off the nav and home; they sit under a footer **More** disclosure. Card buttons go to the buying pages (Jafra consultant, MOTION affiliate, Candles referral, `/contact.html` for the business product). Disclosures stay as small text under the button.

Copy rulings kept: MOTION wording from motionpouches.com/shop (checked November 27, 2026) word for word, with a faithful ES translation; Ask card is "Prueba de IA muy temprana, todavía no está en vivo" + Pronto; "Things we build or link to. Some links earn us a commission." / "Cosas que construimos o enlazamos. Algunos enlaces nos pagan comisión."; share tags currently use the in-repo mark `/img/brand/avatar-a.png` (see TODO for `og-mercado.png`); tagline stays "Local, real, de aquí" until the copy_lint list PR merges; shopping helper uses the shared `js/mercado-allowlist.js` gate (products only when every token is known; anything else shows the 988 box and 0 cards). 988 also stays in the footer.

Phone homepage height in Chrome 390 shots: 1318px (EN) and 1403px (ES), under two 844px screens.

## Tests

`FIX7_BASE_REF=origin/main node --test scripts/*.test.cjs scripts/*.test.mjs`: 367 tests, 364 pass, 2 fail, 1 skipped (Jekyll). The 2 failures are the known `/links/` 404s (`site-links`, `fix7/2`) until #114 merges.

ask-index, cache-keys, shop-helper, allowlist (50+100 crisis + 40 normal), personal-home, story-guide, and homepage-render pass.


## #114 `/links/` tea article — required changes (do not edit #114 in this PR)

Current on #114:
- `id="tea"`, class `tea`, heading "White Lotus Tea Company"
- body "My mom's tea company." / "La empresa de té de mi mamá."
- link `https://www.whitelotusteacompany.com/`
- small "Not an affiliate link. We don't earn from this one." / "No es un enlace de afiliado. No ganamos nada con este."
- label "01 / TEA" / "01 / TÉ", status FAMILY
- meta description mentions mom's tea company
- IDs on the page: `tea`, `motion`, `ai`, `candles`

Needed:
- Change `id="tea"` (and in-page `/links/#tea`) to `id="jafra"` / `#jafra`
- Heading and copy: "My mom's Jafra shop" / "La tienda Jafra de mi mamá"
- Official shop URL belongs on `/links/` (consultant link: `https://www.jafra.com/es/?pws=sabrinacrespo`). Homepage cards only point at `/links/#jafra`.
- Disclosure: "My mom's Jafra consultant link. She earns from sales." / "Enlace de consultora Jafra de mi mamá. Ella gana de las ventas."
- Drop every White Lotus mention, the `.tea` class if it is tea-specific, and any tests that look for `#tea` or White Lotus
- Keep FAMILY (or the honest equivalent)

## Merge notes

- Merge #114 (after the Jafra update) before this PR. Homepage and `/mercado/` already point at `/links/#jafra`.
- Against `pr/111`: only `PROGRESS.md` is expected to conflict (both add it).
- `/links/` does not load `neural-glow.css` yet. After #114 merges, add one `<link>` after its `dream.css` line (and bump the key).

## NOT checked

- done_gate.py: absent at `/home/box/dtrt-checks/gates/`, not run.
- The live site. dtrtlab.com is behind the Cloudflare key lock (401). Nothing here opens it.
- Real phones and Safari or Firefox. Chrome headless at 1440 and 390 only.
- Contrast was measured earlier for the sand/ink/navy/palm/teal/coral pairs, not re-measured on the final CSS.
- Reduced-motion was checked in the CSS, not by emulating the setting in a browser.
- The other pages that load `dream.css` without `body.storefront` keep their current layout; blog loads the new stylesheet.
- Spanish wording is not reviewed by a native speaker.
- #114 still has the tea article; `/links/#jafra` will 404 until that PR is updated and merged.
- The two `officiallydtrt` Instagram links in `index.html` are left for #114, which changes them site-wide.
- `/mercado/` is a public sitemap page but omitted from the Ask index until it is no longer a draft.
- No Cloudflare, DNS, or Pages settings touched. $0 spent.
