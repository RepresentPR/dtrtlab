# Unfinished-work pipeline — secure, vision-filtered

**Purpose:** Stop valuable work from vanishing when agents or humans get pulled away.  
**Rule:** Track outcomes here; **never** put secrets, recovery codes, API tokens, or passwords in this file or any git-tracked path.  
**Last audited:** 2026-10-13  
**Vision filter:** `docs/vision.md`

---

## How this pipeline works

| Layer | Where | What belongs |
| --- | --- | --- |
| **A. Public track** | this file + open PRs | Goals, blockers, merge order, publish status (no secrets) |
| **B. Private vault** | agent store `secrets/` + local `secrets/` (gitignored) | Recovery codes, tokens, credentials |
| **C. Ian inbox** | Gmail drafts / sent action mails | Things only Ian can click (LinkedIn, GitHub profile, job apps) |
| **D. Social queue** | Postiz drafts + scheduled | Lab face vs DTRTC entertainment — keep separate |

**Agent handoff checklist (every session end)**

1. Update the tables below (status + date).  
2. Confirm secrets still gitignored (`git check-ignore secrets/`).  
3. If something is publish-ready, schedule it or mark `READY` with a preview URL.  
4. If Ian-blocked, keep one consolidated action mail — don’t spawn ten overlapping drafts.  
5. Commit + push the track file on the active PR branch.

---

## Status legend

`DONE` · `SCHEDULED` · `READY` (needs Ian click) · `BLOCKED` · `PARK` · `DROPPED`

---

## A. Open PRs (dtrtlab) — vision merge order

| Order | PR | Branch | Status | Notes |
| --- | --- | --- | --- | --- |
| 1 | [#34](https://github.com/RepresentPR/dtrtlab/pull/34) | `cursor/vision-fit-revamp-9a53` | READY | Studio Identity company face — not draft |
| 2 | [#31](https://github.com/RepresentPR/dtrtlab/pull/31) | `cursor/hello-email-cutover-9a53` | READY | hello@ cutover |
| 3 | [#32](https://github.com/RepresentPR/dtrtlab/pull/32) | `cursor/company-foundation-9a53` | READY | company foundation |
| 4 | [#33](https://github.com/RepresentPR/dtrtlab/pull/33) | `cursor/dummy-proof-actions-9a53` | READY | one-click visitor pipeline |
| 5 | [#35](https://github.com/RepresentPR/dtrtlab/pull/35) | `cursor/mobile-app-tool-9a53` | READY | mobile free-plan tool |
| 6 | [#36](https://github.com/RepresentPR/dtrtlab/pull/36) | `cursor/made-for-all-shop-9a53` | READY | Made for all + shop interest |
| 7 | [#37](https://github.com/RepresentPR/dtrtlab/pull/37) | `cursor/career-social-align-9a53` | READY | career + social + GitHub audit + this pipeline |
| 8 | [#29](https://github.com/RepresentPR/dtrtlab/pull/29) | `cursor/live-numbers-reaudit-9a53` | READY | /live numbers honesty |
| — | [#28](https://github.com/RepresentPR/dtrtlab/pull/28) | `cursor/social-vision-audit-9a53` | PARK | social vision audit — absorb or close after #37 |
| — | [#25](https://github.com/RepresentPR/dtrtlab/pull/25) | `cursor/cs2-community-heaven-656a` | PARK | CS2 community room — don’t bury Lab |

**Ian action:** Merge in order above. Expect conflict resolution as each lands on `main`.

---

## B. Social publish queue (quality-only Lab VO)

| Wave | Theme | Voice / media | Target UTC | Status |
| --- | --- | --- | --- | --- |
| 1 | Shop honesty (checkout not live) | Will · `Ug9DA6DTc6.mp4` | 2026-10-14 16:00–18:00 | SCHEDULED (polished; discard older DRAFT duplicates in Postiz) |
| 2 | Dual brand Lab vs DTRTC | Roger · `AxzqWNbzmv.mp4` | 2026-10-15 16:00–20:00 | SCHEDULED |
| 3 | Free plan intro | Chris · `P6OFBe1NwF.mp4` | 2026-10-16 16:00–18:00 | SCHEDULED |

**Channels:** X · Instagram · TikTok (`video_made_with_ai=true`, `DIRECT_POST`) · YouTube unlisted · Twitch (wave 2 only).  
**Do not publish:** CS2 draft clutter as Lab face · “live checkout” · “we're hiring”.  
**X note:** HTTPS links get stripped — captions use plain `dtrtlab.com`.  
**Cleanup:** ~30 non-Lab DRAFTs remain (songs, CS2 clips) — keep or delete in Postiz UI; not Lab priority.  
**Errors:** 4 TikTok OpenAPI rate-limit ERRORs (music/barrio) — retry later via app if wanted. 1 IG ERROR (fictional lunch) — drop.

---

## C. Career / LinkedIn / photos

| Item | Status | Owner |
| --- | --- | --- |
| Career kit (SA / Manager / Creative) | DONE in repo | `docs/career-linkedin-kit.md` |
| LinkedIn paste (headline / About / Open to Work) | BLOCKED | Ian — authwall |
| Photo scatter from iCloud/phone | BLOCKED | Ian send → `docs/visual-photo-scatter.md` |
| Workday / Caliber applications | BLOCKED | Ian login |
| Cover notes (SA / ops / creative / estimator) | DONE in kit | Ian paste when applying |

---

## D. GitHub profile (RepresentPR)

| Item | Status | Owner |
| --- | --- | --- |
| Vision audit doc | DONE | `docs/github-vision-alignment-audit.md` |
| Lab-first README | DONE | PR #37 |
| PR template + labels guide | DONE | `.github/` |
| Uncheck hireable | BLOCKED | Ian UI |
| Bio + website + location | BLOCKED | Ian UI |
| Profile README repo `RepresentPR/RepresentPR` | BLOCKED | Ian create from template |
| Create `vision/*` labels | BLOCKED | Ian (API 403) |
| Follow 10–20 intentional accounts | BLOCKED | Ian |

---

## E. Secrets / recovery (private only)

| Item | Public status | Private location |
| --- | --- | --- |
| GitHub recovery codes | **Never in git** | Agent store `secrets/github-recovery-codes.txt` · workspace `secrets/` (gitignored) · Gmail to Outlook |
| `.gitignore` covers `secrets/` + `*recovery-codes*` | DONE | verify each session |

**If codes rotate:** update vault + send new Outlook mail; never commit.

---

## F. Email / company ops

| Item | Status | Notes |
| --- | --- | --- |
| `hello@` / `ian@` routing docs | DONE / in flight | see `docs/business-email-asap.md` + related PRs |
| Site contact cutover | READY | PR #31 |
| Send-as from Gmail | BLOCKED | Ian Google/Cloudflare if not finished |

---

## G. Consolidated Ian action list (single checklist)

Do these in order when you next sit down 15–30 minutes:

1. **Save recovery codes** — password manager + print; discard public copies.  
2. **GitHub profile** — uncheck hireable; set bio/website; create profile README.  
3. **Merge PRs** — #34 → #31 → #32 → #33 → #35 → #36 → #37 → #29.  
4. **Postiz** — confirm scheduled Lab VO waves; delete duplicate DRAFTs from the earlier wave.  
5. **LinkedIn** — paste from `docs/career-linkedin-kit.md`.  
6. **Photos** — send dump per `docs/visual-photo-scatter.md`.  
7. **Job apps** — apply with cover notes from the kit (SA stay / Manager / Creative).

---

## H. What we explicitly will not fake-finish

- Live shop checkout  
- Hiring pages / “available for hire” theater  
- Fortune-scale or fake follower claims  
- Merging CS2 community (#25) ahead of Lab face work  
- Committing secrets “just for backup”

---

## Session log

| Date (UTC) | What closed | What stayed open |
| --- | --- | --- |
| 2026-10-13 | Inventory; polished Lab VO scheduled (3 waves); pipeline file; secrets vault confirmed; recovery-code mail + consolidated action mail | Ian UI items; photo dump; LinkedIn paste; PR merges |
