# DTRT Lab — company operating system

**Purpose:** Run a small writing studio with a clear executive split. Scale only with dated proof. Do not pretend the studio is already a large company.

**Vision alignment:** Long-term filter lives in [`docs/vision.md`](vision.md). Day-to-day execution obeys [`AGENTS.md`](../AGENTS.md). Stage 1 keeps the public face on the B2B writing studio.

**Last reviewed:** 2026-10-15

## 1. Executive split and decision authority

| Seat | Who | Does |
| --- | --- | --- |
| **First chair — operations** | AI agents | Ordinary tasks, social drafts, code builds, GitHub pull requests, and pipeline tracking in [`docs/unfinished-work-pipeline.md`](unfinished-work-pipeline.md). Strictly obey [`AGENTS.md`](../AGENTS.md). |
| **Second chair — founder** | Ian Ferraro | Absolute authority over acceptance, rejection, pricing, commitments, credential unlocks, and brand positioning. |

**No autonomous overrides.** Agents may not unilaterally pivot company identity, modify pricing structures, or remove professional portfolios.

Ordinary bugfixes, tests, and honesty fixes still ship. Do not park that work as “blocked on Ian.” Do not decide acceptance, price, a client commitment, or brand when unsure — stop and ask Ian.

**Agent executes:** PR merges that stay inside the current offer, conflict resolution, docs that do not change the offer, site fixes, Postiz drafts of writing-studio work, Gmail action digests, vault hygiene, audits.

**Ian unlocks:** acceptance or rejection of work and clients, pricing, commitments, GitHub profile UI, LinkedIn paste, photo dump from phone/iCloud, Workday/Caliber logins, Grok Bot approval cards, legal entity / counsel / bank, and any brand-positioning change.

Track file: [`docs/unfinished-work-pipeline.md`](unfinished-work-pipeline.md).  
AI templates: [`docs/templates/`](templates/README.md) · root [`AGENTS.md`](../AGENTS.md).  
AI spend (company vs experiments): [`docs/ai-spend-ops.md`](ai-spend-ops.md).

## 2. Execution velocity and conversion

- Remove unnecessary tool bloat and multi-tier complexity from operations. Do not add dashboards, offer tiers, or tools that do not move the writing pipeline.
- Put operational bandwidth on the **Free Plan** and **The Starter Fix** ($50 flat writing audit delivered in 48 hours).
- Stage 1 target by 2026-12-31, as a goal and not a result: 10 Free Plans, 2–3 paid Starter Fixes, 3 testimonials. Do not publish those numbers as done.
- Freeze `/live/`, streaming, and AFTERLIGHT onto `/lab.html` until the first 3 paying clients. AFTERLIGHT stays “in development / not for sale.” Do not claim those clients exist.

Public catalog as of 2026-10-15, which this operating-system note does not rewrite: Free plan, Mini Social Pack $50, Week Pack $129, and Writing Retainer — Starter $250/30 days on Whop. Driving the $50 offer does not include renaming or deleting those tiers. That is a pricing-structure change and waits for an explicit site instruction from Ian.

## Honest baseline

DTRT Lab’s Stage 1 operating identity is Ian Ferraro’s writing studio for local businesses: Free Plan, then the $50 Starter Fix. Hobby, streaming, and AFTERLIGHT stay on `/lab.html`. Personal aim: do the right thing, make useful stuff, show the process, and eventually use studio revenue to help Puerto Rico businesses. Entity, capital, people, and compliance are operating steps, not website copy. Do not claim a top-50 company, a team, or paying-client counts that are not dated.

## What “full company” means here (phased)

| Phase | Outcome | Status |
| --- | --- | --- |
| **A. Public foundation** | Legal pages, press kit, brand kit, security contact, careers/investors honesty, schema, sitemap, company inbox | Shipped on site (keep honest as facts change) |
| **B. Operating company** | Registered entity, bank, accounting, insurance, trademarks, send-as `@dtrtlab.com`, DMARC hygiene | External — owner actions |
| **C. Product company** | One paid writing offer with real delivery, then a store only when fulfillment is real | $50 writing path is the operating focus. `/shop.html` stays an interest catalog (`checkoutLive: false`) |
| **D. Scaled company** | Hiring, fundraising or profit engine, multi-person leadership, formal security/compliance | Future — do not fake on site |

## Visitor pipeline (dummy-proof, one-click)

Public production rule: **never make a visitor hunt for 30 minutes**. The path is Free Plan, then the $50 writing offer. Do not add steps.

| Action | One-click destination |
| --- | --- |
| **Free plan** | `/contact.html?intent=free-plan` |
| **$50 writing offer** | Existing $50 Whop plan, still labeled Mini Social Pack until Ian renames it |
| **Company hub** | `/company.html` (press / brand / careers / proof) |
| **Contact** | `/contact.html` |

Homepage: header, sticky dock, and hero lead with the Free Plan and must not bury it under hobby. Ops evidence and the gaming archive stay collapsed. Global nav CTA is the writing studio, not Twitch Follow. Hobby links point at `/lab.html`.

## P0 gaps closed in the repo (this work)

- Indexable **Terms**, **Cookies**, **DMCA** pages + footer legal cluster
- **Press kit** + **Brand** page with downloadable marks
- **Careers** (not hiring) + **Company** overview (entity/fundraising honesty)
- **security.txt** + security contact
- **Organization / WebSite JSON-LD** on home + about
- Sitemap expansion; company facts in `content/company.json`
- Public mail: `hello@` / `ian@` (Cloudflare → Gmail)
- One-click visitor pipeline (header / dock / company hub)

## Owner checklist (external — cannot be faked in git)

1. Form a legal entity (e.g. Puerto Rico / US LLC) and put `legalName` into `content/company.json`
2. Register trademarks for **DTRT** / **DTRT Lab** / **AFTERLIGHT** where budget allows
3. Enable **send as** `hello@dtrtlab.com` (Zoho free or Google Workspace)
4. Add Cloudflare aliases: `press@`, `support@`, `security@` → Gmail (optional; site can keep `hello@` until then)
5. Google Search Console verification → paste into `site.json` `googleSiteVerification`
6. Counsel review of Terms / Privacy / Cookies / DMCA agent address
7. When selling: tax, refunds counsel, payment sandbox — keep store off until ready; publish live refund/preorder terms before first charge
8. Insurance (general liability / media) before large partnerships
9. First hire or contractor only with written scope + entity bank account

## North-star metrics (company, not vanity)

Track weekly in private notes, and publish only figures that are dated and real:

- Free Plans delivered, and paid $50 Starter Fixes actually delivered, against the 2026-12-31 target (10 free, 2–3 paid, 3 testimonials). Record a count only when the work is done.
- Public evidence quality (dated, honest, attributable)
- Inbound trust: real replies to `hello@dtrtlab.com`, zero bounced `@dtrtlab.com` mail
- Cash: runway months (private) — precondition for any Puerto Rico business-help program
- Vision filter: no clone-hacks, no fake scale, no invented client count (see `docs/vision.md`)

AFTERLIGHT chapter counts are hobby notes, not the studio’s operating metric during Stage 1.

## What we will never put on the site

- Fake headcount, fake clients, fake “Fortune” claims, fake live store
- Counsel-approved badges without counsel
- Investor pages that imply an open raise when none exists
- Promises of a Puerto Rico funding program before revenue and a real program design exist

## Tooling policy

Adopt a tool only when it speeds the Free Plan or the $50 Starter Fix pipeline. Decline extra suites, cloned-product pitches, and anything whose main job is entertainment infrastructure on the company face. Trending is not a reason to add a tool.
