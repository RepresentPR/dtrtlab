# Social refresh pack — quality-only + organic VO

**Last built:** 2026-10-13  
**Rule:** Quality only. No fake scale, Fortune claims, live checkout, or hiring theater.  
**Dual brand:** Lab = useful work · DTRTC = entertainment (keep surfaces separate).

---

## Voice experiment (talking AIs)

| Source | Result |
| --- | --- |
| **Grok** (script author) | Best organic scripts — ranked A > D > E > C > B |
| **Muse** | Usage quota blocked this run — retry later for A/B script polish |
| **Dot** | No Dot TTS/model available in this agent toolchain |
| **Postiz Astra path** | `image-text-slides` + **ElevenLabs** voices via `videoFunctionTool` → `loadVoices` |
| **Seedance** | Image→video (no dedicated VO library); use for B-roll later with real stills |

### ElevenLabs voices tested (organic male creator lane)

| Voice | ID | Why |
| --- | --- | --- |
| **Chris** — Charming, Down-to-Earth | `iP95p4xoKVk53GoZ742B` | Primary pick for Lab intro (script A) |
| **Will** — Relaxed Optimist | `bIHbv24MWmeRgasZH58o` | Shop honesty (script D) |
| **Roger** — Laid-Back, Casual, Resonant | `CwhRBWXzGAHq8TQ4Fs17` | Dual-brand Lab vs DTRTC (script E) |
| Skip for company face | Liam (too “social media AI”), Adam (too firm), Harry (warrior) | |

**Direction (for regenerations):** Talk to one person off-camera. Slower than chat. Warmth plain, energy 5–6. Spell addresses as “dtrtlab dot com.” DTRT = letters D-T-R-T.

---

## Scripts (Grok winners — spoken)

### A — Free plan intro (TikTok / IG / YT Short)
Hey, I'm Ian. This is DTRT Lab. I make useful stuff, and I try to have fun doing it. The rule I actually keep is do the right thing. If you've got an idea, the free plan is on dtrtlab.com. Any age. Any size. Bring the messy version. That's fine.

**On-screen:** Free plan. Any age, any size.  
**CTA:** https://dtrtlab.com

### D — Shop honesty (X / IG)
Real quick, the shop. If you want a tee, the mark pack, or the digital files, interest is open. Checkout is not live. I won't put a fake buy button on it. The list sits at dtrtlab.com/shop. When payment and delivery are real, I'll say so.

**On-screen:** Checkout is not live.  
**CTA:** https://dtrtlab.com/shop.html

### E — Dual brand (TikTok / Twitch promo caption)
Two names, on purpose. DTRT Lab is the useful work. Free plans, the company face, stuff you can use. DTRTC is the entertainment side. Stream, clips, the fun part. Same person. Different job. Plan's at dtrtlab.com. Hang out at twitch.tv/dtrtc.

**On-screen:** Lab is useful. DTRTC is the stream.  
**CTA:** https://dtrtlab.com · https://twitch.tv/dtrtc

### C — Made for all (IG carousel caption / short VO)
Made for all. Any age. A brand-new idea, or a shop that's been around for years. You can be anywhere. The free plan is on dtrtlab.com. One goal is enough. You don't need a polished pitch.

### B — How the free plan works (YT Short / X thread)
Want a free plan? Send a link to the business, or a short note on the idea, plus one goal. I'll write back three practical priorities, one sample improvement, and a clear next step. You don't have to buy anything. It's on dtrtlab.com.

---

## Caption pack (post text — HTML for Postiz)

### X (≤280) — Lab refresh
```
<p>New Lab face, same rules.</p>
<p>Do the right thing. Make useful stuff. Have fun doing it.</p>
<p>Free plan → dtrtlab.com · Made for all · Shop interest open (checkout not live)</p>
```

### Instagram
```
<p>DTRT Lab refresh.</p>
<p>Useful work. Honest status. Free plans for any age, any size idea.</p>
<p>Free plan → dtrtlab.com</p>
<p>Shop interest is open. Checkout is not live.</p>
<p>DTRTC is the stream — separate on purpose.</p>
```

### TikTok
```
<p>I'm Ian. This is DTRT Lab — useful work, free plans, no fake store.</p>
<p>dtrtlab.com</p>
```

### YouTube Short title / description
**Title:** Free plan. Any age. Any size. — DTRT Lab  
**Description:** Honest Lab refresh. Free plan at dtrtlab.com. Shop interest open; checkout not live. DTRTC is the entertainment stream.

### Twitch (panel/chat promo — not Lab face)
```
<p>Lab = useful work → dtrtlab.com</p>
<p>Stream = DTRTC → twitch.tv/dtrtc</p>
```

---

## Channel map (connected Postiz)

| Platform | Integration | Content type |
| --- | --- | --- |
| X | Ian / `x` | Caption + video or still |
| Instagram | Ian Ferraro / `instagram-standalone` | Reel (video) `post_type=post` |
| TikTok | IanAnthonyFC / `tiktok-business` | Video · `DIRECT_POST` · label `video_made_with_ai=true` |
| YouTube | DTRT / `youtube` | Short · unlisted first optional |
| Twitch | dtrtc | Entertainment-only caption; no Lab chrome takeover |

LinkedIn: **not** on Postiz — paste career kit manually.

---

## Generated VO (this run)

| Script | Voice | Status | Media |
| --- | --- | --- | --- |
| D — Shop honesty | Will | **Ready** | https://uploads.postiz.com/Ug9DA6DTc6.mp4 |
| E — Dual brand | Roger | **Ready** | https://uploads.postiz.com/AxzqWNbzmv.mp4 |
| A — Free plan intro | Chris | **Ready** | https://uploads.postiz.com/P6OFBe1NwF.mp4 |
| A retry | Eric | Failed mid-run — account hit **no AI video credits** for a moment | — |

**Muse / Dot:** Muse quota blocked; no Dot TTS in toolchain. **Grok** wrote the winning scripts.

## Postiz drafts created (review before publish)

| Surface | Preview |
| --- | --- |
| X — shop honesty | https://platform.postiz.com/p/cmv6vh92h0kdyqw0y2rtvg8wk?share=true |
| IG — Lab refresh + shop VO | https://platform.postiz.com/p/cmv6vh9800kdzqw0y42bxzbj3?share=true |
| TikTok — checkout not live | https://platform.postiz.com/p/cmv6vh9fp0ke0qw0y4rpzw2xf?share=true |
| X — dual brand | https://platform.postiz.com/p/cmv6vh9l10ke1qw0y07yorryr?share=true |
| IG — Lab vs DTRTC | https://platform.postiz.com/p/cmv6vh9sh0ke2qw0ywp9l1ap7?share=true |
| TikTok — Lab vs DTRTC | https://platform.postiz.com/p/cmv6vh9zq0ke3qw0y4vr7ncjq?share=true |
| YouTube (unlisted) — shop honesty | https://platform.postiz.com/p/cmv6vha6y0ke4qw0yh52wydr9?share=true |
| Twitch — dual brand promo | https://platform.postiz.com/p/cmv6vhaer0ke5qw0yrcmnzbks?share=true |
| X — free plan intro (Chris) | https://platform.postiz.com/p/cmv6via860keuqw0y3xrfak59?share=true |
| IG — free plan intro | https://platform.postiz.com/p/cmv6viaff0kevqw0yjbvj8szt?share=true |
| TikTok — free plan intro | https://platform.postiz.com/p/cmv6vianl0kewqw0yr9xcx2jj?share=true |
| YouTube unlisted — free plan intro | https://platform.postiz.com/p/cmv6viaua0kexqw0ywv7rit2y?share=true |

TikTok drafts set `video_made_with_ai=true` + `DIRECT_POST` when published.

---

## Publish status (2026-10-13)

Polished captions scheduled (type `schedule`) — **discard older DRAFT duplicates** in Postiz UI for the same waves.

| Wave | UTC window | Previews |
| --- | --- | --- |
| 1 Shop honesty (Will) | Oct 14 16:00–18:00 | [X](https://platform.postiz.com/p/cmv6w8hdb0knpqw0yqgwppd99?share=true) · [IG](https://platform.postiz.com/p/cmv6w8hm80knqqw0yc6fon7wr?share=true) · [TikTok](https://platform.postiz.com/p/cmv6w8htw0knrqw0yyv85y7uj?share=true) · [YT unlisted](https://platform.postiz.com/p/cmv6w8hzx0knsqw0yhrf3zhi5?share=true) |
| 2 Dual brand (Roger) | Oct 15 16:00–20:00 | [X](https://platform.postiz.com/p/cmv6w8uzj0knuqw0ytjp0rec1?share=true) · [IG](https://platform.postiz.com/p/cmv6w8v8c0knvqw0yfp4z7851?share=true) · [TikTok](https://platform.postiz.com/p/cmv6w8viq0knwqw0y34axm8fo?share=true) · [Twitch](https://platform.postiz.com/p/cmv6w8vrl0knxqw0y8qnzpi95?share=true) |
| 3 Free plan (Chris) | Oct 16 16:00–18:00 | [X](https://platform.postiz.com/p/cmv6w8x2f0knyqw0yzmfuhavk?share=true) · [IG](https://platform.postiz.com/p/cmv6w8xff0knzqw0y3mof0lhl?share=true) · [TikTok](https://platform.postiz.com/p/cmv6w8xof0ko0qw0yk2aqt1gg?share=true) · [YT unlisted](https://platform.postiz.com/p/cmv6w8y0e0ko1qw0y4szm6zou?share=true) |

**X polish:** captions use plain `dtrtlab.com` (HTTPS links get stripped).  
**Track file:** `.github/docs/unfinished-work-pipeline.md`  

### X caption repair (2026-10-13)

Postiz/X strips bare `dtrtlab.com` from captions. **Keep only these QUEUE posts** (16:10 UTC, “dtrtlab dot com”); discard all older stripped X QUEUE/DRAFT duplicates:

| Wave | Keep preview |
| --- | --- |
| 1 Shop | https://platform.postiz.com/p/cmv6y73ir0lf7qw0ys8gicsyy?share=true |
| 2 Dual brand | https://platform.postiz.com/p/cmv6y73s10lf8qw0y60a16176?share=true |
| 3 Free plan | https://platform.postiz.com/p/cmv6y73zf0lf9qw0yhb2ttzri?share=true |

## Publish checklist

- [x] Schedule quality Lab VO waves (not CS2 clutter)  
- [ ] Watch Will + Roger + Chris VO once in Postiz — kill any that sound robotic before go-live  
- [ ] Delete older DRAFT duplicates for the same waves  
- [ ] TikTok: keep AI-generated label when VO is ElevenLabs  
- [ ] Never schedule “live checkout” or “we're hiring”  
- [ ] After Ian photo dump: Seedance B-roll with real stills + regenerate slides
