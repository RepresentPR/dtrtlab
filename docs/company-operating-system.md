# DTRT Lab — company operating system

**Purpose:** Close the gap between a strong solo-founder presence and a company that can scale toward top-tier global standards — without pretending we are already there.

**Vision alignment:** Personal + company north star live in [`docs/vision.md`](vision.md). Every checklist item below must serve that document, not viral tools or fake scale.

**Last reviewed:** 2026-10-13

## Honest baseline

DTRT Lab is Ian Ferraro’s independent creator studio: public free-plan consulting offer, multi-platform content, dated results dashboard, and **DTRT AFTERLIGHT** in development. Personal aim: do the right thing, make useful stuff, show the process, and eventually use Lab revenue to help Puerto Rico businesses. A “top 50 global company” also requires entity, capital, people, compliance, distribution, and multi-year product market fit. Those are **operating steps**, not website copy.

## What “full company” means here (phased)

| Phase | Outcome | Status |
| --- | --- | --- |
| **A. Public foundation** | Legal pages, press kit, brand kit, security contact, careers/investors honesty, schema, sitemap, company inbox | In progress on site (this branch) |
| **B. Operating company** | Registered entity, bank, accounting, insurance, trademarks, send-as `@dtrtlab.com`, DMARC hygiene | External — owner actions |
| **C. Product company** | Live store/preorder or Steam, support SLAs, status page, privacy program | Not ready until AFTERLIGHT / paid offers ship |
| **D. Scaled company** | Hiring, fundraising or profit engine, multi-person leadership, formal security/compliance | Future — do not fake on site |

## P0 gaps closed in the repo (this work)

- Indexable **Terms**, **Cookies**, **DMCA** pages + footer legal cluster
- **Press kit** + **Brand** page with downloadable marks
- **Careers** (not hiring) + **Company** overview (entity/fundraising honesty)
- **security.txt** + security contact
- **Organization / WebSite JSON-LD** on home + about
- Sitemap expansion; company facts in `content/company.json`
- Public mail: `hello@` / `ian@` (Cloudflare → Gmail)

## Owner checklist (external — cannot be faked in git)

1. Form a legal entity (e.g. Puerto Rico / US LLC) and put `legalName` into `content/company.json`
2. Register trademarks for **DTRT** / **DTRT Lab** / **AFTERLIGHT** where budget allows
3. Enable **send as** `hello@dtrtlab.com` (Zoho free or Google Workspace)
4. Add Cloudflare aliases: `press@`, `support@`, `security@` → Gmail (optional; site can keep `hello@` until then)
5. Google Search Console verification → paste into `site.json` `googleSiteVerification`
6. Counsel review of Terms / Privacy / Cookies / DMCA agent address
7. When selling: tax, refunds counsel, payments (`PAYMENTS.md` / sandbox) — keep store off until ready
8. Insurance (general liability / media) before large partnerships
9. First hire or contractor only with written scope + entity bank account

## North-star metrics (company, not vanity)

Track weekly in `/live/` or private notes:

- Useful plans delivered (free + paid) — usefulness pillar
- Public evidence quality (dated, honest, attributable)
- AFTERLIGHT: readable chapters shipped / playtest readiness — Puerto Rico story world
- Inbound trust: press replies, partner briefs, zero bounced `@dtrtlab.com` mail
- Cash: runway months (private) — precondition for any Puerto Rico business-help program
- Vision filter passes: no clone-hacks, no fake scale (see `docs/vision.md`)

## What we will never put on the site

- Fake headcount, fake clients, fake “Fortune” claims, fake live store
- Counsel-approved badges without counsel
- Investor pages that imply an open raise when none exists
- Promises of a Puerto Rico funding program before revenue and a real program design exist

## Tooling policy (aligned with vision)

Adopt tools that help **our** free plans, **our** evidence, or **our** AFTERLIGHT builds. Decline tools whose primary pitch is reverse-engineering or cloning third-party products. Trending ≠ aligned.
