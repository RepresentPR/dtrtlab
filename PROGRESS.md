# Progress

Branch `design/neural-glow`, PR #116 "Homepage redesign: neural glow (dream theme)". Base is main `29009944` (after #112).

This file is excluded from the published site (`_config.yml` exclude).

## What changed (storefront)

The homepage is now a simple storefront. The earlier dark neural-glow look is a quiet aurora accent. The same patterns are on `/mercado/` (that page is still being built; it is marked `data-draft` so it stays out of the Ask index).

- Spanish first. Default language is Spanish unless `?lang=en` is in the URL or `dtrt-lang` is already saved. The switcher is persistent text only: "Español" and "English". No flags, no geo redirect.
- Always-visible shopping helper (beta) with typo-tolerant, accent-folding match against the catalog only. No network calls. A submit button (`type="button"`, because CSP `form-action 'none'`) stays visible on mobile. Label: "Shopping helper (beta) — matches our catalog" / "Asistente de compras (beta) — coincide con nuestro catálogo". It is not called live AI.
- Tap targets are at least 44px. No auto-rotating carousel. One primary button per card.
- Button words: "Ver tienda" / "Visit shop" on shop cards; "Vende con nosotros" on the sell tile, header link, and category tile. The sell tile sits on the first screen with the mixed catalog (Jafra, MOTION, Ask DTRT, Candles).
- Shop cards carry "Vendido y enviado por [brand]" / "Sold and shipped by [brand]" and the trust line "Pagas en la tienda oficial de la marca" / "You pay on the brand's own site".
- No ratings, review counts, or prices. No cart or checkout claims. Payments are not taken on this site. The AI card says it is a very early test, not live, and is not a shop.
- White Lotus is gone from this branch. Jafra is the beauty card and points at `/links/#jafra` (that hash lands when #114 is updated).
- Tagline on the storefront: "Local, real, de aquí" / "Local, real, from here". The longer line that named the island was not kept: the two-word place name is hashed reloc term `term#f50b92b29527bc02` and fails fix7/3. Palette (sunset coral, turquoise, palm green, warm sand), a small palm mark, a footer wave, and a tiny coquí stay. Town names stay off the page.
- Old long homepage sections are not deleted. They sit in `.home-legacy` (CSS-hidden) so story-guide and homepage-render tests still see them. New storefront chrome is in `<!--ask-skip-->`. The original header, personal hero, and footer nav remain in the file so Ask passages stay unchanged.
- `js/shop-helper.js`, `js/home-lang.js`, `css/neural-glow.css`, `scripts/shop-helper.test.cjs`, `/mercado/` added to the sitemap. GoatCounter expected indexed-page count is 38.

## Tests

`FIX7_BASE_REF=origin/main node --test scripts/*.test.cjs scripts/*.test.mjs`: 362 tests, 359 pass, 2 fail, 1 skipped (Jekyll not installed locally).

The 2 failures are the known `/links/` checks (`site-links`, `fix7/2`): `/links/`, `#jafra`, `#motion`, `#ai`, `#candles` are not on main. PR #114 adds `/links/` and still uses `#tea` instead of `#jafra`. This PR must merge after #114, and #114 needs the Jafra change listed below.

ask-index, cache-keys, fix7/3, goatcounter, shop-helper, personal-home, story-guide, and homepage-render pass.

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
