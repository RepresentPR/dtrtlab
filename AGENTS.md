# DTRT Lab — agent instructions

Portable floor for Cursor, Codex, Copilot, and other coding agents.  
Canonical vision: `docs/vision.md` · Ops authority: `docs/company-operating-system.md`  
Prompt pack: `docs/templates/`

## 1. Founder boundaries

Ian Ferraro is the sole Founder. On 2026-10-15 Ian delegated all DTRTLab decisions to **DTRT Co-Founder** (the company's lead agent).

AI agents are operational execution engines. Positioning, pricing and tier changes (names, prices, scope) need DTRT Co-Founder's sign-off. Outside AIs (Muse, ChatGPT, ChatGPT dot, Cursor and similar) may propose these by pull request but never merge positioning, pricing or tier changes. Agents must not delete founder portfolio or résumé pages unless Ian asks.

The “if unsure, ship” fallback is revoked for brand positioning, pricing, and scope. When an agent is unsure about those, it stops and asks DTRT Co-Founder. Ordinary execution inside the current public offer — bugs, tests, honesty fixes, and docs that do not change the offer — still ships.

## 2. Brand honesty

- Honest status and dated proof.
- No fake scale, fake team size, hiring theater, fake store checkouts, or cold spam.
- Shipped code and live pages must match public claims.
- Unshipped software, including AFTERLIGHT, stays labeled “in development / not for sale.”

## 3. Single-offer focus (Plan A + Stage 1 freeze)

Ian set the commercial offer, in chat on 2026-10-15, as the **Free Plan** (diagnostic storefront review) plus **The Starter Fix** ($50 flat writing audit delivered in 48 hours).

Stage 1 target by 2026-12-31, recorded as a goal and not a result: 10 Free Plans, 2–3 paid Starter Fixes, and 3 testimonials. Do not claim any of those counts.

Stage 1 freeze: the public results dashboard (moved from `/live/` to `/lab.html#public-results` on 2026-10-15), streaming, and AFTERLIGHT stay on `/lab.html` until the writing studio closes its first 3 paying clients. Do not claim those clients exist. Do not put the dashboard, stream chrome, or the game on the company face. AFTERLIGHT stays “in development / not for sale.”

Public catalog as of 2026-10-15, which agents must not rewrite on their own: Free plan, plus three named Whop writing plans — Mini Social Pack $50, Week Pack $129, and Writing Retainer · Review Desk $250/30 days, plus the AI Visibility Fix $250 one-time (added 2026-10-15). Every tier includes a day-30 numbers check. Do not rename, delete or reprice a tier without DTRT Co-Founder's sign-off.

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

1. **Ian** — Founder. Logins, money movement, legal and credential unlocks. **DTRT Co-Founder** holds Ian's delegated authority over positioning, pricing, tiers and commitments (since 2026-10-15).
2. **Agent** — first-chair operations inside those boundaries: ordinary tasks, drafts, builds, pull requests, and pipeline tracking. No unilateral pivot of company identity, pricing structure, or professional portfolios.

Do not park ordinary bugfixes as “blocked on Ian.” Do not decide brand, price, or scope when unsure.

## Hard constraints (do not violate)

- No fake scale, Fortune claims, fake clients, fake headcount, or “we're hiring” theater.
- No cold spam.
- Shop checkout stays **off** until payment + fulfillment are real (`checkoutLive: false`). Whop checkout for the named writing plans is the paid path already on the site.
- Do not put secrets, recovery codes, API tokens, or passwords in git (`secrets/`, `*recovery-codes*` are gitignored).
- Do not reverse-engineer / clone third-party apps as a growth strategy.
- Keep **company AI** (this Cursor agent + Postiz) separate from **experiment** API wallets; see `docs/ai-spend-ops.md`. Never put company secrets on young discount proxies.
- Keep Lab usefulness surfaces separate from DTRTC stream chrome. Stage 1 freeze keeps the public results dashboard, streaming, and AFTERLIGHT on `/lab.html`. `/live/` is now the private owner dashboard: encrypted aggregates only (`live/owner.enc.json`), unlinked and `noindex`; `/hq/` redirects to it. Never commit its plaintext data or password.
- AFTERLIGHT / game status stays honest (“in development / not for sale”).
- Public contact is `hello@dtrtlab.com` (not Outlook on the site).
- Bot data commits go straight to `main` by design. The stats-refresh bot (`.github/workflows/live-refresh.yml`, commits as `dtrt-live-bot`, message `chore(live): refresh aggregates`) pushes only the encrypted owner data file (`live/owner.enc.json` today; `hq/owner.enc.json` if the dashboard ever moves back to `/hq/`) and `content/proof.json`, every 2 hours. Outside AIs (Muse, ChatGPT, Cursor, etc.) should not flag those commits or open PRs to revert them. The existing `stats: refresh` commits that touch only `content/stats.json` / `content/clips.json` are also expected. Anything else pushed directly to `main` without a PR is worth flagging.
- GitHub Pages cannot send security headers, so every public page carries a meta Content-Security-Policy (`scripts/security-meta.test.cjs`). If you change an inline `<script>` on `/live/` or `/proof/`, update its `sha256-` hash in that page's CSP. Pin workflow actions to full commit SHAs and keep `permissions:` minimal.
- Do not add `.nojekyll`. With it, Pages serves the whole repo, including `docs/`. Internal notes stay out of the published site (`_config.yml`, `scripts/stage-site.cjs`). `brand-kit.md` stays published because `/brand.html` links to it.

## Vision filter (every change)

1. Clearer Free Plan or a real $50 Starter Fix for a local business?  
2. Dated evidence without lying?  
3. Durable craft/revenue or trust/foundation for the company?  
4. Proud if a local business owner or journalist read it tomorrow?

If no → skip. Canonical strategy is `docs/vision.md`. During the freeze, do not spend company time on the public results dashboard, streaming, or AFTERLIGHT.

## Conventions

- Minimal diffs; match surrounding code style.
- One purpose per PR when possible; conventional commits (`feat`, `fix`, `docs`, `chore`).
- Prefer real workshop/product imagery over abstract decoration on Lab face.
- EN/ES journey where the site already supports it; don’t invent fake localization coverage.
- When writing copy or prompts, use `docs/templates/` — don’t invent hype patterns.

## Do not touch without an explicit ask

- Company positioning, pricing tiers, and product scope (DTRT Co-Founder signs off)
- Founder portfolio or résumé pages (do not delete them)
- `.env`, `secrets/`, recovery-code files
- Live payment / PayPal client IDs
- Forced “live checkout” or hiring pages
- Mass CS2 clutter posted as Lab company face

## Done means

- Relevant `node --test` scripts pass for touched surfaces
- Vision filter checked
- Brand, pricing, and scope questions asked of DTRT Co-Founder instead of guessed
- Unfinished loops logged in `docs/unfinished-work-pipeline.md` when work spans sessions
