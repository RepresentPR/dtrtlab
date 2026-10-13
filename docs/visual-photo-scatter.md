# Visual photo scatter plan — company · hiring · social

**Goal:** Replace thin brand chrome with **real photos** of Ian’s work, place, and craft so the company face, hiring surface, and socials match one visual story.

**Blocker:** This agent **cannot open Apple iCloud or your phone** unless you send photos through one of the intake paths below. Once photos land, selection + scatter can run in the same session.

**Last built:** 2026-10-13  
**Brand rules:** `docs/brand-playbook.md` · Studio Identity `#080808` / `#fafafa` · real work over abstract decoration  
**Intake drop:** `media/intake/` (gitignored originals) → curated exports go to `img/`

---

## How to get photos to the agent (pick one)

| Path | How | Best for |
| --- | --- | --- |
| **A. Postiz upload widget** | Use the upload UI in chat (phone/computer → Postiz media library) | Social drafts + quick picks |
| **B. Chat attachments** | Attach 20–80 favorites in Cursor chat | Fast curated set |
| **C. Shared album / Drive / Dropbox link** | iCloud Shared Album (public link), Google Drive folder, Dropbox — paste URL | Full library dump |
| **D. Zip to repo drop** | Export from Photos → zip → place under `media/intake/raw/` (or ask agent for a receive path) | Large batches |

**iCloud tip:** Photos → select → Share → **Shared Album** or **iCloud Link** (anyone with link) → paste here. Do **not** share Apple ID password.

**Phone tip:** Same as A or B — you do not need to “link the phone” to the cloud agent permanently.

---

## What to pull from the library (selection filter)

**Prefer**
- Real workshop / desk / shipping / whiteboard / printed plans
- Puerto Rico place / atmosphere that matches Lab roots (honest, not stock)
- Clean founder headshot (shoulders up, soft light, no party crop)
- Short-form stills that feel like finished work (AFTERLIGHT/dev only if labeled in development)
- Wide horizontal frames for hero / LinkedIn banner; square for IG/TikTok; vertical for Stories/Reels covers

**Skip / quarantine**
- Other people’s faces without clear consent
- Kids / private family / IDs / licenses / mail / screens with secrets
- Drunk / meme-only / unrelated nightlife as *company* face
- Heavily filtered shots that break monochrome brand
- Anything you’d regret on a hiring manager’s screen

**Grade scale (agent uses this when sorting)**
- **A** — hero / OG / LinkedIn / press
- **B** — company page, about, shop atmosphere
- **C** — social rotation, Postiz drafts
- **D** — archive only / do not publish

---

## Scatter map (where winners go)

### Company site (benefits of looking real)

| Slot | File target | Crop | Notes |
| --- | --- | --- | --- |
| Home hero | `img/company/company-showcase-poster.jpg` (+ webp) | 16:9 or wider, subject right-of-center OK | Full-bleed; grayscale filter already in CSS |
| Company / Made-for-all stills | `img/company/` new named stills | 3:2 or 16:9 | One job per section — no collage cards in hero |
| OG / share card | `img/brand/dtrt-social.png` | 1200×630 | Brand mark + one real still if possible |
| Press / brand kit | `img/brand/` + press page | Mark stays SVG | Photos for “founder + workshop” only if honest |

### Hiring / LinkedIn (career surface)

| Slot | Where | Crop | Notes |
| --- | --- | --- | --- |
| Headshot | LinkedIn profile photo | 1:1 | Professional, not stream face cam |
| Banner | LinkedIn banner (~1584×396) | Wide | Workshop or Lab still + spare text; no fake Fortune |
| Featured | LinkedIn Featured | 1.91:1 | Site OG or plan tool still |
| Contact / about vibe | Site about if used | — | Same headshot family |

### Social presence (Postiz + native)

| Channel | Visual | Cadence idea |
| --- | --- | --- |
| X @DTRTLab | Horizontal work still + short caption | Company voice; link free plan |
| IG @officiallydtrt | Square / 4:5 work stills | Same company voice; Made for all |
| TikTok @iananthonyfc | Vertical covers from real stills | Personal → Lab link |
| YT @DTRTLabYT | Banner already in `img/brand/`; thumbs from work stills | Proof, not chrome |
| Twitch dtrtc | Keep stream heat **off** company site; panels stay stream | Dual brand |

Postiz: upload winners → schedule drafts with `integrationSchedulePostTool` (attachments = media library paths).

---

## Scatter workflow (once intake arrives)

1. Ingest to `media/intake/raw/` (or Postiz library).  
2. Triage → `media/intake/selected/{a,b,c}/` with short notes.  
3. Export web-ready: JPEG/WebP, strip GPS if present, rename `yyyy-mm-dd-slug`.  
4. Place into `img/company/` / `img/brand/` targets above; update CSS/HTML only if new filenames.  
5. Queue 3–5 social drafts (X/IG/TikTok) with honest captions — no fake hire/store claims.  
6. Give Ian a LinkedIn headshot + banner pair to upload manually (LinkedIn not on Postiz).

---

## Current gaps (before new photos)

| Surface | Status |
| --- | --- |
| Home hero | Uses `company-showcase-poster.jpg` — replace when better real still exists |
| Brand OG / avatar / banners | Graphic marks — strengthen with photo-backed OG when possible |
| LinkedIn | Needs real headshot + banner from library |
| Social rotation | Thin vs clip thumbs; needs still library |
| Hiring credibility | Real workshop + honest founder photo beats stock |

---

## Privacy & consent checklist

- [ ] No Apple ID / iCloud password shared with agents  
- [ ] Shared links can be revoked after ingest  
- [ ] Face consent for anyone who isn’t Ian  
- [ ] No doxxing home address in EXIF captions on public site  
- [ ] Stream (DTRTC) faces stay on entertainment surfaces unless Ian chooses otherwise
