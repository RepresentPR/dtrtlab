# DTRT Lab — company operating system

**Purpose:** Run the existing local-service studio offers with a clear executive split. Scale only with dated proof. Do not pretend the studio is already a large company. October 22 recovery workflow: [operations-recovery.md](operations-recovery.md).

**Vision alignment:** Long-term filter lives in [`docs/vision.md`](vision.md). Day-to-day execution obeys [`AGENTS.md`](../AGENTS.md). Stage 1 keeps the public face on the B2B writing studio.

**Last reviewed:** 2026-10-22 (recovery workflow and authority reconciliation only; external readiness is not established)

## 1. Executive split and decision authority

| Seat | Who | Does |
| --- | --- | --- |
| **First chair — operations** | AI agents | Ordinary tasks, social drafts, code builds, GitHub pull requests, and pipeline tracking in [`docs/unfinished-work-pipeline.md`](unfinished-work-pipeline.md). Strictly obey [`AGENTS.md`](../AGENTS.md). |
| **Second chair — founder** | Ian Ferraro | Absolute authority over acceptance, rejection, pricing, commitments, credential unlocks, and brand positioning. |

Ian's ultimate authority is unchanged. His October 15 delegation to Co-Founder covers positioning, pricing, tiers and commitments within its explicit scope, as AGENTS.md records. The founder seat above identifies ultimate authority, not revocation of that delegation. Newer explicit Ian instructions prevail. When Co-Founder is unavailable, preserve existing public terms and hold unresolved offer changes; continue ordinary private repair work.

**No autonomous overrides.** Agents may not unilaterally pivot company identity, modify pricing structures, or remove professional portfolios.

Ordinary bugfixes, tests, and honesty fixes still proceed through reviewable pull requests. Do not park that work as “blocked on Ian.” Do not guess acceptance, price, a client commitment, or brand: use the existing offer and delegated authority, or hold that change for the accountable owner.

**Agent executes:** conflict resolution, docs that do not change the offer, site fixes, tests and pull requests, Postiz drafts within the current offer, authorized Gmail action digests, vault hygiene, audits. A document's task list is not itself permission to merge, send, publish or spend; use current owner authorization for the concrete action.

**Ian unlocks:** acceptance or rejection of work and clients, pricing, commitments, GitHub profile UI, LinkedIn paste, photo dump from phone/iCloud, Grok Bot approval cards, legal entity / counsel / bank, and any brand-positioning change.

Track file: [`docs/unfinished-work-pipeline.md`](unfinished-work-pipeline.md).  
AI templates: [`docs/templates/`](templates/README.md) · root [`AGENTS.md`](../AGENTS.md).  
AI spend (company vs experiments): [`docs/ai-spend-ops.md`](ai-spend-ops.md).

## 2. Execution velocity and conversion

- Remove unnecessary tool bloat and multi-tier complexity from operations. Do not add dashboards, offer tiers, or tools that do not move the writing pipeline.
- Put operational bandwidth on the free office map, **DTRT Job Desk** ($1,500 setup + $250/mo), and the **AI Visibility Fix** (free AI check, then $250 one-time with a day-30 re-check).
- Stage 1 target by 2026-12-31, as a goal and not a result: 10 free office maps, 2–3 paid starts, 3 testimonials. Do not publish those numbers as done.
- Freeze `/live/`, streaming, and AFTERLIGHT onto `/lab.html` until the first 3 paying clients. AFTERLIGHT stays “in development / not for sale.” Do not claim those clients exist.

Public catalog as of 2026-10-16: DTRT Job Desk (free office map, then $1,500 setup + $250/mo) and the AI Visibility Fix (free AI check, then $250 one-time with a day-30 re-check). Older writing tiers are retired.

## Honest baseline

DTRT Lab’s Stage 1 operating identity is Ian Ferraro’s studio for local service businesses: a free office map, then DTRT Job Desk or the AI Visibility Fix. Hobby, streaming, and AFTERLIGHT stay on `/lab.html`. Personal aim: do the right thing, make useful stuff, show the process, and eventually reinvest studio revenue in local usefulness. Entity, capital, people, and compliance are operating steps, not website copy. Do not claim a top-50 company, a team, or paying-client counts that are not dated.

## What “full company” means here (phased)

| Phase | Outcome | Status |
| --- | --- | --- |
| **A. Public foundation** | Legal pages, press kit, brand kit, security contact, careers/investors honesty, schema, sitemap, company inbox | Shipped on site (keep honest as facts change) |
| **B. Operating company** | Registered entity, bank, accounting, insurance, trademarks, send-as `@dtrtlab.com`, DMARC hygiene | External — owner actions |
| **C. Product company** | Two public offers with real delivery, then a store only when fulfillment is real | Job Desk and the AI Visibility Fix are the operating focus. `/shop.html` stays an interest catalog (`checkoutLive: false`) |
| **D. Scaled company** | Hiring, fundraising or profit engine, multi-person leadership, formal security/compliance | Future — do not fake on site |

## Visitor pipeline (dummy-proof, one-click)

Public production rule: **never make a visitor hunt for 30 minutes**. The path is the free office map, then Job Desk or the AI Visibility Fix. Do not add steps.

| Action | One-click destination |
| --- | --- |
| **Free office map** | `/map/` |
| **Free AI check** | `/map/?want=check` |
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

1. Form a legal entity and put `legalName` into `content/company.json`
2. Register trademarks for **DTRT** / **DTRT Lab** / **AFTERLIGHT** where budget allows
3. Enable **send as** `hello@dtrtlab.com` (Zoho free or Google Workspace)
4. Add Cloudflare aliases: `press@`, `support@`, `security@` → Gmail (optional; site can keep `hello@` until then)
5. Google Search Console verification → paste into `site.json` `googleSiteVerification`
6. Counsel review of Terms / Privacy / Cookies / DMCA agent address
7. When selling: refunds counsel, payment sandbox — keep store off until ready; publish live refund/preorder terms before first charge
8. Insurance (general liability / media) before large partnerships
9. First hire or contractor only with written scope + entity bank account

## North-star metrics (company, not vanity)

Track weekly in private notes, and publish only figures that are dated and real:

- Free office maps delivered, and paid Job Desk or AI Visibility Fix work actually delivered, against the 2026-12-31 target (10 free, 2–3 paid, 3 testimonials). Record a count only when the work is done.
- Public evidence quality (dated, honest, attributable)
- Inbound trust: real replies to `hello@dtrtlab.com`, zero bounced `@dtrtlab.com` mail
- Cash: runway months (private) — precondition for any small-business help program
- Vision filter: no clone-hacks, no fake scale, no invented client count (see `docs/vision.md`)

AFTERLIGHT chapter counts are hobby notes, not the studio’s operating metric during Stage 1.

## What we will never put on the site

- Fake headcount, fake clients, fake “Fortune” claims, fake live store
- Counsel-approved badges without counsel
- Investor pages that imply an open raise when none exists
- Promises of a funding program before revenue and a real program design exist

## Tooling policy

Adopt a tool only when it speeds the free office map, Job Desk, or AI Visibility Fix pipeline. Decline extra suites, cloned-product pitches, and anything whose main job is entertainment infrastructure on the company face. Trending is not a reason to add a tool.
