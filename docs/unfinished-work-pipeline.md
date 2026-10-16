# Company live status — unfinished-work pipeline

**Purpose:** Prove the company public surface is live and unbroken; only scheduled work and true Ian unlocks remain.  
**Rule:** Never put secrets, recovery codes, API tokens, or passwords in this file or any git-tracked path.  
**Last audited:** 2026-10-13 (agent live reaudit)  
**Vision filter:** `docs/vision.md`  
**Authority:** Ian Ferraro sets positioning, pricing, and scope. Agents execute inside the current offer and stop when unsure (`AGENTS.md`).

---

## Company LIVE (verified this audit)

| Surface | Status | Evidence |
| --- | --- | --- |
| **dtrtlab.com** homepage | LIVE | HTTP 200 |
| **/find.html** + find-me strip assets | LIVE | HTTP 200 · socials.js hub |
| **/company.html** · **/shop.html** · **/contact.html** | LIVE | HTTP 200 · `hello@` · checkout off · hiring false |
| **/live/** proof dashboard | LIVE | HTTP 200 |
| **Email receive** `hello@` / `ian@` | LIVE | Cloudflare MX · `check-business-email.py` |
| **Repo tests** | GREEN | `node --test scripts/*.test.cjs` — 67+ find-me tests |
| **Vision merges** | DONE | #29–#41 on main (site auto-deploys) |
| **Absorbed / parked PRs closed** | DONE | #32 absorbed · #25 CS2 parked closed · #28 already closed |

**Honest not-live (by design — not unfinished):** shop checkout · hiring · fundraising · AFTERLIGHT public download.

---

## Only SCHEDULED (allowed unfinished)

| Wave | Theme | UTC window | Status |
| --- | --- | --- | --- |
| 1 | Shop honesty | 2026-10-14 ~16:00–18:00 | QUEUE (IG/TT/YT) + **X keep 16:10** |
| 2 | Dual brand Lab vs DTRTC | 2026-10-15 ~16:00–20:00 | QUEUE + Twitch + **X keep 16:10** |
| 3 | Free plan intro | 2026-10-16 ~16:00–18:00 | QUEUE + **X keep 16:10** |

**X keep these only** (plain `dtrtlab.com` is stripped by Postiz/X — captions use “dtrtlab dot com”):

- https://platform.postiz.com/p/cmv6y73ir0lf7qw0ys8gicsyy?share=true  
- https://platform.postiz.com/p/cmv6y73s10lf8qw0y60a16176?share=true  
- https://platform.postiz.com/p/cmv6y73zf0lf9qw0yhb2ttzri?share=true  

**Ian Postiz UI (cannot delete via API):** discard DRAFT duplicates + every older X QUEUE at 16:00/16:05 (stripped domains). Keep QUEUE IG/TT/YT/Twitch + the three X 16:10 posts above.

---

## UNLOCK only (not company breakage)

Agent cannot finish these without your login/UI:

1. Paste bios from `brand-kit.md` (same text in `docs/social-bios-paste.md`) onto X, Instagram, TikTok, YouTube, and Twitch  
2. LinkedIn About / Featured — kept in private notes  
3. GitHub profile UI + `RepresentPR/RepresentPR` README  
4. Photos — `docs/visual-photo-scatter.md`  
6. Grok Bot email approve — the shortlist file was removed from the repo on 2026-10-16. Do not add a claim list back under `docs/`.  
7. Optional: Gmail Send-as `hello@` (receive already live)  
8. Postiz: delete DRAFT dupes + broken X QUEUE (see above)

---

## How this pipeline works

| Layer | Where | What belongs |
| --- | --- | --- |
| **A. Public track** | this file + open PRs | Live status, scheduled queue, unlocks |
| **B. Private vault** | agent store `secrets/` + local `secrets/` | Recovery codes, tokens |
| **C. Executive unlocks** | Ian UI only | Credential walls |
| **D. Social queue** | Postiz QUEUE | Lab face vs DTRTC — keep separate |

---

## Status legend

`LIVE` · `DONE` · `SCHEDULED` / `QUEUE` · `UNLOCK` · `PARK` · `DROPPED`

---

## Explicitly will not fake-finish

- Live shop checkout  
- Hiring / “available for hire” theater  
- Fortune-scale or fake follower claims  
- CS2 community ahead of Lab face  
- Committing secrets “just for backup”  
- Mass free-trial / discount-proxy company backbone (`docs/ai-spend-ops.md`)

---

## Session log

| Date (UTC) | What closed | What stayed open |
| --- | --- | --- |
| 2026-10-13 | Inventory; polished Lab VO scheduled (3 waves); pipeline file; secrets vault | Ian UI items |
| 2026-10-13 | Grok Bot shortlist + `@bot` claim on X | Ian approve first free handle |
| 2026-10-13 | Agent-first merges #34 #31 #33 #35 #36 #37 #29; #32 absorbed | Ian unlocks |
| 2026-10-13 | AI templates · Find-me live · AI spend ops | Bios paste · Postiz DRAFT cleanup |
| 2026-10-13 | **Company live reaudit:** site HTTP 200s, email MX, tests green, #32/#25 closed, audit-site path fixed, find-me tests, **X captions re-queued with plain dtrtlab.com** | SCHEDULED waves · Ian unlock list · Postiz DRAFT discard |
| 2026-10-14 | Business-first site revamp drafted: writing plans on Whop, hobby on `/lab.html`, `brand-kit.md` | Ian still pastes the bios into each social profile |
| 2026-10-15 | Agent floor: founder boundaries, Stage 1 freeze, “if unsure, ship” revoked for brand, price, and scope | Public catalog at that date was the free plan plus three Whop writing tiers. A flat writing audit was named in chat. Site rename waited for an explicit instruction. No claim of 3 paying clients |
| 2026-10-15 | Operating system: first-chair agents execute; Ian accepts, rejects, prices, commits, unlocks, and sets brand. Ops bandwidth was the writing studio’s paid offer. Hobby stays on `/lab.html` | Live Whop tier labels and prices unchanged on that date |
| 2026-10-15 | Vision: studio for local businesses. Offer at that date was a free plan plus a flat writing audit. Target by 2026-12-31: 10 free deliveries, 2–3 paid starts, 3 testimonials. Freeze adds `/live/` with streaming and AFTERLIGHT | Targets are not results. Site tier names and `/live/` URLs were unchanged pending an explicit site instruction |
| 2026-10-16 | Public offers are only DTRT Job Desk (free office map, then $1,500 setup + $250/mo) and the AI Visibility Fix (free AI check, then $250 one-time with a day-30 re-check). Older writing tiers are retired | Refund rights for past plans stay on the legal pages |
