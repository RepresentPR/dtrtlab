# GitHub vision alignment audit — RepresentPR

**Audited:** 2026-10-13  
**Account:** [github.com/RepresentPR](https://github.com/RepresentPR)  
**Vision filter:** `.github/docs/vision.md`  
**Tools used:** GitHub MCP (`get_me`, `search_repositories`, `list_*`, `pull_request_read`, `get_file_contents`, `ui_get`, `search_*`) + `gh` API where allowed

---

## Executive verdict

RepresentPR is a **personal GitHub user** named “DTRT”, not a GitHub Organization. Two repos hold the dual brand correctly in spirit (**dtrtlab** = company/usefulness surface, **DTRTCore** = entertainment/FPS foundation), but **connections, profile fields, README, and open-PR hygiene** are out of sync with the written vision.

Biggest gaps: empty profile (no bio/blog/location), `hireable: true` (reads as hiring theater), stale dtrtlab README (“homepage is the DTRTC creator hub”), zero social graph (0 following / 0 followers), no org/teams, default labels only, **~10 open PRs on dtrtlab** and **~20 on DTRTCore** stacking without merge order.

---

## Inventory

| Surface | Fact | Vision fit |
| --- | --- | --- |
| Account type | **User** (`type: User`), login `RepresentPR`, display name `DTRT` | OK for solo founder; not an Org — no members/teams API |
| Created | 2024-01-04 | Matches `company.json` foundedYear 2024 |
| Public repos | 1 public (`dtrtlab`) + 1 private (`DTRTCore`) | Dual brand split is correct |
| Profile bio / blog / location / company | All empty | **Misaligned** — no public story |
| Twitter field | `DTRTLab` | Aligned with company X |
| `hireable` | **true** | **Misaligned** — vision forbids fake hiring pipelines |
| Following / followers | 0 / 0 | Weak connection surface |
| Org / teams | N/A (not an org) | No collaborator structure |
| Profile README | `RepresentPR/RepresentPR` **missing** | Opportunity |
| Pages | `dtrtlab` → `dtrtlab.com` (HTTPS enforced) | Aligned |

### Repos

| Repo | Visibility | Role vs vision | Open PRs (approx) | Open issues |
| --- | --- | --- | --- | --- |
| [dtrtlab](https://github.com/RepresentPR/dtrtlab) | Public | Company face, free plan, evidence, shop honesty | ~10 | 0 (PRs inflate `open_issues`) |
| [DTRTCore](https://github.com/RepresentPR/DTRTCore) | Private | AFTERLIGHT / FPS craft — “no old-game dependencies” | ~20 | 5 real issues (#1, #32, #33, #39, #41) |

**DTRTCore description (good):** original assets, UE 5.8, deterministic sim, no old-game deps — matches “Explicitly out of vision: reverse-engineering / cloning.”

**Collaborators:** DTRTCore lists only `RepresentPR` (admin). dtrtlab collaborator list blocked by token scope (403).

---

## Connection alignment (people & graph)

| Finding | Action |
| --- | --- |
| Not a GitHub Org — cannot use org members/teams | Keep as user **or** create `DTRTLab` Org later and transfer repos when entity is real |
| 0 following | Follow a short, intentional list: Unreal/Epic samples, honest indie studios, PR tech/community accounts — not vanity follow-backs |
| No profile README | Create `RepresentPR/RepresentPR` with Lab north star + dual-brand map + links |
| Token cannot PATCH user profile (`hireable`, bio, blog) | **Ian must set in GitHub UI** (checklist below) |
| Partner pack lives on DTRTCore PR #51 | Merge onto intended game branch; don’t pretend partner pipeline is live on site |

---

## Goals vs vision (work in flight)

### Vision priorities (from `.github/docs/vision.md`)

1. Free plans / usefulness  
2. Shop interest (checkout off)  
3. AFTERLIGHT / playtest honesty  
4. Evidence + company foundation  
5. Entity + send-as hello@  
6. Later: PR business help  

### dtrtlab open PRs — suggested merge order (vision-first)

| Order | PR | Why |
| --- | --- | --- |
| 1 | #34 vision-fit Studio Identity | Company face |
| 2 | #31 hello@ cutover | Trust / email |
| 3 | #32 company foundation | Trust / scale with integrity |
| 4 | #33 dummy-proof actions | Usefulness UX |
| 5 | #35 mobile free-plan tool | Usefulness |
| 6 | #36 Made for all + shop | Made for all + revenue snowball |
| 7 | #37 career + social + this audit | Career/social ops |
| 8 | #29 live numbers | Evidence honesty |
| 9 | #28 social vision audit | May be superseded — review before merge |
| Park | #25 CS2 community room | Entertainment; don’t bury Lab offer |

### DTRTCore

| Signal | Note |
| --- | --- |
| Issue #33 North Star + many stacked PRs | Entertainment craft is in vision — but **PR debt** blocks clear evidence of what’s live |
| PR #51 partner-readiness | Aligns with trust; targets `codex/issue-33-clean-production`, not `main` |
| Issue #39 Higgsfield asset pack | OK only with **legal provenance**; never imply reverse-engineered game IP |
| Issue #1 black frame bug | Keep as real quality bar |

---

## Misalignment detail

### High

1. **GitHub profile empty + hireable true** — contradicts “no fake hiring” and weakens partner readiness.  
2. **dtrtlab README stale** — still centers “homepage is the DTRTC creator hub”; vision is Lab company face + dual brand.  
3. **PR pile-up** — goals look scattered; merge order should follow vision priority.  
4. **No milestones / vision labels** — only default GitHub labels; cannot filter “usefulness / entertainment / evidence / trust”.

### Medium

5. No profile README or pinned story.  
6. Repo topics empty; homepage field empty on dtrtlab API metadata.  
7. No `.github/` community pack on **dtrtlab** (DTRTCore PR #51 adds one for the game).  
8. Partner PR still asks for homepage “FPS / entertainment” sentence — **conflict risk** with Made-for-all company face: entertainment belongs on AFTERLIGHT/DTRTC surfaces, not as the only homepage job.

### Low

9. Display name “DTRT” vs product “DTRT Lab” — clarify in bio.  
10. Account login `RepresentPR` vs brand `DTRT Lab` — keep login; put Lab in bio/README.

---

## Ian checklist (GitHub UI — token cannot do these)

- [ ] Profile → **uncheck Available for hire** (`hireable`)  
- [ ] Bio: `DTRT Lab — Make useful stuff. Made for all. Free plan → dtrtlab.com`  
- [ ] Website: `https://dtrtlab.com`  
- [ ] Location: `DMV Area` (or leave blank — don’t invent HQ address)  
- [ ] Create / pin profile README (`RepresentPR/RepresentPR`)  
- [ ] Add topics on dtrtlab: `dtrt-lab`, `website`, `made-for-all`  
- [ ] Follow 10–20 intentional accounts (craft + PR community), not spam  
- [ ] Merge dtrtlab PRs in vision order above; close superseded drafts  
- [ ] On DTRTCore: land or close stale drafts; keep Issue #33 as single North Star  

---

## Agent-applied fixes (this branch)

- Rewrite `README.md` for Lab-first / dual-brand honesty  
- Add this audit doc  
- Add `.github/PULL_REQUEST_TEMPLATE.md` requiring vision filter  
- Add vision-aligned issue label guide in `.github/labels.md` (create labels in UI or `gh label create`)  

---

## Decision filter for future GitHub work

Before opening a repo, issue, or PR:

1. Usefulness or story world more real?  
2. Dated evidence without lying?  
3. Durable craft/revenue (even slowly)?  
4. Proud if a journalist or local owner read the README tomorrow?  

Fail → don’t ship the PR.
