# DTRT Lab brand playbook

**Last reviewed:** 2026-10-13  
**Public kit:** [Brand](https://dtrtlab.com/brand.html) · [Press](https://dtrtlab.com/press.html)

## Names

| Name | Use |
| --- | --- |
| **DTRT Lab** | Company / studio |
| **DTRT** | Short brand in UI |
| **DTRTC** | Stream channel name (Twitch/Kick) |
| **DTRT AFTERLIGHT** | Game / story world (always AFTERLIGHT in caps when full title) |
| **Ian Ferraro** | Founder (first public credit) |

Do not invent a legal-entity suffix in public copy until `content/company.json` `entityStatus` is updated after registration.

## Voice

- Direct, useful, a little playful — never corporate fluff.
- Show evidence with dates. Separate **live** from **in development**.
- Spanish appears on journey pages; mark AI-assisted copy until native review.
- Anchor lines: **Do the right thing. Make useful stuff. Have fun doing it.** Long-term: Lab revenue → help small businesses (not active yet — do not overclaim).
- **Made for all:** any age, any size business or idea, global by design. Do not age-gate free plans or shop interest.
- Shop: interest catalog at `/shop.html` — digital + POD snowball path; never imply a live cart until `checkoutLive` is true in `content/shop.json`.
- Full alignment filter: `docs/vision.md`.

## Visual

- Monochrome first: near-black `#080808`, ink `#fafafa`, line `#303030` (`css/identity.css`).
- Accent is white, not purple gradients or cream/terracotta defaults.
- Mark: `img/brand/mark.svg`. Social share: `img/brand/dtrt-social.png`. Avatar: `img/brand/dtrt-avatar.png`.
- Prefer edge-to-edge photography/stills of real work over abstract decoration.

## Social handles (canonical)

**Hub:** [dtrtlab.com/find.html](https://dtrtlab.com/find.html) — one digest page. Source of truth: `content/socials.js`.

| Surface | Handle | URL |
| --- | --- | --- |
| **Lab** X | @DTRTLab | https://x.com/DTRTLab |
| **Lab** Instagram | @officiallydtrt | https://www.instagram.com/officiallydtrt/ |
| **Lab** YouTube | @DTRTLabYT | https://www.youtube.com/@DTRTLabYT |
| **Lab** TikTok | @iananthonyfc | https://www.tiktok.com/@iananthonyfc |
| **Stream** Twitch | dtrtc | https://www.twitch.tv/dtrtc |
| **Stream** Kick | movebro | https://kick.com/movebro |
| **Career** LinkedIn | Ian Ferraro | https://www.linkedin.com/in/ian-ferraro-578784419/ |
| **Career** GitHub | RepresentPR | https://github.com/RepresentPR |

Site pattern: quiet Find-me strip above footers (`js/find-me.js`) + nav icons — not floating promo pills.

## Presence map (vs top brands — what we take / skip)

Compared against Linear / OpenAI (site calm), Higgsfield (work-as-hero), Twitch / cinematic creators (heat for live):

| Surface | Pattern we keep | What we skip |
| --- | --- | --- |
| **dtrtlab.com (company)** | Studio Identity: full-bleed real work, brand-first hero, one primary CTA (Free plan), monochrome + white accent | Orange heat as company chrome; dashboard clutter in first viewport; clone-shop aesthetics |
| **YouTube / workshop shorts** | Lab Files energy on *work labels* only (formalin eyebrows on mosaic) — proof, not chrome | Chartreuse CTAs everywhere; motion-first landing that hides the free plan |
| **Twitch / Kick (DTRTC)** | Orange + cinema heat stays on the *stream* surface | Using stream chrome as the company website face |
| **X / Instagram / TikTok** | Same voice as site: useful, dated, bilingual where needed; link to Free plan or one proof piece | Fake scale, trending-tool bait, or implying entity/store that is not live |

**Bio template (all company handles):** `DTRT Lab — Make useful stuff. Free plan at dtrtlab.com · EN/ES`

**Stream bio (DTRTC):** Keep entertainment-first; point viewers to the Lab for useful work, not the other way around.

## Email

- Public / press / support: `hello@dtrtlab.com`
- Founder: `ian@dtrtlab.com`
- Backend destination stays private Gmail — do not publish personal Gmail on the site.

## Do / don’t (press & partners)

**Do:** link to dtrtlab.com; use provided marks; say independent / in development when describing AFTERLIGHT.  
**Don’t:** imply a live store, team size, funding round, or console deal that is not public; stretch logos; recolor the mark into neon gradients.
