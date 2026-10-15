# DTRT Lab — agent instructions

Portable floor for Cursor, Codex, Copilot, and other coding agents.  
Canonical vision: `docs/vision.md` · Ops authority: `docs/company-operating-system.md`  
Prompt pack: `docs/templates/`

## 1. Founder boundaries

Ian Ferraro is the sole Founder and second-chair decision maker.

AI agents are operational execution engines. Agents must not alter company positioning, pricing tiers, or product scope, and must not delete founder portfolio or résumé pages, unless Ian gives an explicit instruction in that chat.

The “if unsure, ship” fallback is revoked for brand positioning, pricing, and scope. When an agent is unsure about those, it stops and asks Ian. Ordinary execution inside the current public offer — bugs, tests, honesty fixes, and docs that do not change the offer — still ships.

## 2. Brand honesty

- Honest status and dated proof.
- No fake scale, fake team size, hiring theater, fake store checkouts, or cold spam.
- Shipped code and live pages must match public claims.
- Unshipped software, including AFTERLIGHT, stays labeled “in development / not for sale.”

## 3. Single-offer focus (Plan A + Stage 1 freeze)

Ian set the commercial focus, in chat on 2026-10-15, as **The Starter Fix ($50 flat writing audit)** plus the **Free Plan**, with the paid writing offer checked out on Whop.

Stage 1 freeze: entertainment, streaming infrastructure, and AFTERLIGHT stay on `/lab.html` as personal creative work until the writing studio has its first 3 paying clients. Do not claim those 3 clients exist. Do not put stream chrome or the game on the company face.

Public catalog as of 2026-10-15, which agents must not rewrite on their own: Free plan, plus three named Whop writing plans — Mini Social Pack $50, Week Pack $129, and Writing Retainer — Starter $250/30 days. Do not rename those to “The Starter Fix,” delete a tier, or change a price unless Ian explicitly instructs that site change in chat.

## Stack

- Static public site for **dtrtlab.com** (HTML / CSS / vanilla JS)
- Content facts in `content/*.json` (company, site, campaign, shop)
- Tests: Node test runner via `node --test scripts/*.test.cjs`
- Dual brand: **DTRT Lab** (usefulness) vs **DTRTC** (entertainment / stream, sequestered under the Stage 1 freeze)

## Commands

```bash
node --test scripts/*.test.cjs
node scripts/audit-site.cjs
python3 scripts/check-business-email.py   # needs network; optional
```

## Authority

1. **Ian** — second-chair founder. Absolute authority over acceptance, rejection, pricing, commitments, credential unlocks, and brand positioning.
2. **Agent** — first-chair operations inside those boundaries: ordinary tasks, drafts, builds, pull requests, and pipeline tracking. No unilateral pivot of company identity, pricing structure, or professional portfolios.

Do not park ordinary bugfixes as “blocked on Ian.” Do not decide brand, price, or scope when unsure.

## Hard constraints (do not violate)

- No fake scale, Fortune claims, fake clients, fake headcount, or “we're hiring” theater.
- No cold spam.
- Shop checkout stays **off** until payment + fulfillment are real (`checkoutLive: false`). Whop checkout for the named writing plans is the paid path already on the site.
- Do not put secrets, recovery codes, API tokens, or passwords in git (`secrets/`, `*recovery-codes*` are gitignored).
- Do not reverse-engineer / clone third-party apps as a growth strategy.
- Keep **company AI** (this Cursor agent + Postiz) separate from **experiment** API wallets; see `docs/ai-spend-ops.md`. Never put company secrets on young discount proxies.
- Keep Lab usefulness surfaces separate from DTRTC stream chrome. Stage 1 freeze keeps entertainment on `/lab.html`.
- AFTERLIGHT / game status stays honest (“in development / not for sale”).
- Public contact is `hello@dtrtlab.com` (not Outlook on the site).

## Vision filter (every change)

1. More useful **or** story world more real?  
2. Dated evidence without lying?  
3. Puerto Rico–aligned craft/revenue or trust/foundation?  
4. Proud if a local business owner or journalist read it tomorrow?

If no → skip. Long-term vision stays in `docs/vision.md`. Stage 1 freeze still keeps entertainment off the company face until 3 paying writing clients are real and dated.

## Conventions

- Minimal diffs; match surrounding code style.
- One purpose per PR when possible; conventional commits (`feat`, `fix`, `docs`, `chore`).
- Prefer real workshop/product imagery over abstract decoration on Lab face.
- EN/ES journey where the site already supports it; don’t invent fake localization coverage.
- When writing copy or prompts, use `docs/templates/` — don’t invent hype patterns.

## Do not touch without an explicit ask

- Company positioning, pricing tiers, and product scope
- Founder portfolio or résumé pages (do not delete them)
- `.env`, `secrets/`, recovery-code files
- Live payment / PayPal client IDs
- Forced “live checkout” or hiring pages
- Mass CS2 clutter posted as Lab company face

## Done means

- Relevant `node --test` scripts pass for touched surfaces
- Vision filter checked
- Brand, pricing, and scope questions asked instead of guessed
- Unfinished loops logged in `docs/unfinished-work-pipeline.md` when work spans sessions
