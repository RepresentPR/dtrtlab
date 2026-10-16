# Find me — mentor map (vision reaudit)

**Last reviewed:** 2026-10-13  
**Filter:** `.github/docs/vision.md` — useful, honest, dual-brand, no fake scale.  
**Canonical data:** `content/socials.js` → `/find.html` + quiet strip (`js/find-me.js`).

---

## What “stupid easy” means (without intrusion)

| Pattern | Do | Don’t |
| --- | --- | --- |
| **Hub** | One page: `/find.html` (Lab / Stream / Career) | Scatter different lists that disagree |
| **Everywhere** | Quiet strip above footers + nav icons + footer “Find me” | Floating pills, sticker badges, hero clutter |
| **Digest** | Label + handle; stream links dashed | Dump 20 CTAs in the first viewport |
| **Voice** | Same honesty rules on every bio | Lab chrome on Twitch, or stream heat as company face |

---

## Surfaces vs vision

| Surface | Job | Primary CTA | Vision check |
| --- | --- | --- | --- |
| **dtrtlab.com** | Company / usefulness | Free plan · Find me | Studio Identity; shop checkout off |
| **X / IG / YT / TikTok** | Lab face | dtrtlab.com or /find.html | No Fortune / hiring / live store claims |
| **Twitch / Kick** | DTRTC entertainment | Hang out live; Lab link secondary | Keep orange heat off company chrome |
| **LinkedIn** | Hire / collaborate with Ian | Career story + Lab proof | Estimator + Lab builder; no fake titles |
| **GitHub** | Public code / RepresentPR | Honest README | No hireable theater unless true |

---

## Site wiring (this ship)

| Location | Behavior |
| --- | --- |
| `content/socials.js` | Single network list + surfaces |
| `js/find-me.js` + `css/find-me.css` | Injects strip on pages with `footer.site-footer` / `#site-foot` |
| `js/nav.js` | Loads find-me; footer “Find me”; icons include LinkedIn + GitHub |
| Growth pages (`index`, `about`, `sample-plan`, `support`) | Explicit find-me script + Find me footer link where needed |
| `company.json` / `site.json` / JSON-LD `sameAs` | Full public set including Kick, LinkedIn, GitHub |
| `sitemap.xml` | `/find.html` |

---

## Live channel paste (Ian unlock — agent cannot edit locked bios)

Paste kit: `.github/docs/social-bios-paste.md`.

Priority unlocks (agent 1st chair; Ian 2nd):

1. Every Lab bio → link `https://dtrtlab.com/find.html` (or `dtrtlab.com`)
2. Twitch/Kick panels → Lab = useful · Stream = DTRTC (dual brand)
3. LinkedIn About + Featured → Find me + free plan (career kit)
4. GitHub profile README → vision-aligned template; hireable only if true
5. Discard Postiz DRAFT duplicates; keep scheduled quality VO waves

---

## Explicitly out (mentor stop-list)

- Mass free-trial / burner accounts / “spread like wildfire” hacks  
- Cloning or piggybacking on third-party security incidents for reach  
- Fake follower tools, engagement pods, live-checkout theater  
- One mega-bio that pretends Lab and DTRTC are the same employer face  

If it burns trust for reach → **out**. Use dated proof + useful free plans instead.

---

## Related

- Bios: `.github/docs/social-bios-paste.md`  
- Captions / VO: `.github/docs/social-refresh-pack.md`  
- GitHub: `.github/docs/github-profile-readme-template.md`  
- Vision: `.github/docs/vision.md`
