# Promo videos — pre-prepared for post-audit

**Status:** READY AS DRAFTS — do **not** publish until Ian finishes the audit and signs claims/numbers.  
**Built:** 2026-10-14  
**Voice:** ElevenLabs **Chris** (`iP95p4xoKVk53GoZ742B`) — charming, down-to-earth (see [`social-refresh-pack.md`](social-refresh-pack.md)).  
**Generator:** Postiz `image-text-slides` · vertical (TikTok / IG / Shorts) + horizontal (YT) when needed.  
**Study source:** [`company-study-elon.md`](company-study-elon.md)

---

## Hold rule

| Gate | Required before `schedule` / `now` |
| --- | --- |
| Company / Lab OS claims match `/company.html` + `company.json` | Yes |
| No fake store, hiring, or raise language | Yes |
| `/live/` numbers not contradicted by latest audit | Yes |
| Ian explicit “ship promos” | Yes |

Until then: Postiz type = **`draft`** only.

---

## Video 1 — Lab OS in 30s (company face)

**Job:** Teach the operating system without enterprise cosplay.  
**On-screen beats:** Purpose → Playbook → Proof → Free plan.

**Spoken (Chris):**  
Hey — Ian, DTRT Lab. We studied how durable companies actually run, then installed a Lab-scale version in public. Purpose first. Then a six-step playbook: intake, scope, build, proof, deliver, follow-up. If there’s no owner and no dated proof, it’s not done. Scorecard lives on dtrtlab dot com slash live. Free plan’s on dtrtlab dot com. Any age. Any size.

**Caption (HTML):**  
`<p>Lab Operating System — purpose, playbook, proof. Not fake scale.</p><p>Free plan → dtrtlab.com</p>`

**Channels after audit:** X (@DTRT / Ian), Instagram, TikTok, YouTube Shorts.

---

## Video 2 — Founder-direct (what we stole / what we won’t)

**Job:** Company-study honesty. Works vs won’t-copy.

**Spoken (Chris):**  
Quick company lesson. What works: first principles, delete before you automate, founder posts the truth instead of a press release. What we won’t copy: fake scale, automating costume work, or shipping claims before an audit. DTRT Lab is a one-person studio with a real free plan. When checkout and hiring are real, I’ll say so. Until then — dtrtlab dot com.

**Caption:**  
`<p>What we steal from big operators: delete before automate. Founder-direct over press release.</p><p>What we won’t: fake store or hiring theater.</p>`

---

## Video 3 — Free plan CTA (always-on promo)

**Job:** Clearest offer. Ship first after audit if only one video goes live.

**Spoken (Chris):**  
If you’ve got a business or an idea, send a link plus one goal. I’ll send back three practical priorities, one sample improvement, and a clear next step. Free. You don’t have to buy anything. dtrtlab dot com — free plan. Made for all ages, any size idea. Roots in Puerto Rico. You can be anywhere.

**Caption:**  
`<p>Free plan. Link + one goal. Practical next steps.</p><p>dtrtlab.com</p>`

---

## Video 4 — Dual brand (Lab vs DTRTC) — optional

**Spoken (Chris):**  
Two names on purpose. DTRT Lab is the useful work — free plans, company face, stuff you can use. DTRTC is the entertainment side — stream and clips. Same person. Different job. Plan at dtrtlab dot com. Hang out at twitch dot tv slash dtrtc.

---

## Postiz production checklist

1. `generateVideoTool` identifier `image-text-slides`, output `vertical`, params `voice` + `prompt` (scripts above).  
2. Poll `videoStatusTool` until `completed`.  
3. `integrationSchedulePostTool` with `type: "draft"` on X + IG + TikTok (+ YT when horizontal ready).  
4. After Ian audit: flip drafts → schedule (stagger 24h: V3 → V1 → V2).  
5. Log URLs in `content/growth-ledger.json` when live.

### Job IDs / media (fill as generated)

| Video | jobId | media URL | Postiz draft |
| --- | --- | --- | --- |
| V1 Lab OS | blocked — Postiz: no AI video credits (2026-10-14) | | Scripts ready; regenerate when credits available |
| V2 Study honesty | blocked — same | | |
| V3 Free plan | blocked — same | | |

**Ian unlock:** Add Postiz AI video credits (or supply VO clips) → re-run `generateVideoTool` with scripts above → keep `draft` until audit sign-off.

---

## Out of bounds

- Publishing before audit sign-off  
- Fortune / top-50 / “we’re Tesla” language  
- Mixing DTRTC clip energy into Lab company claims without dual-brand framing  
