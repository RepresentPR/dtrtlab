# Social row includes Twitch

**Date:** 2026-11-15  
**Decided by:** Ian Ferraro

Source: Ian's message in his Grok Bot chat on 2026-11-15 at 12:44 AM ET, relayed by DTRT Co-Founder: "ensure all my social media acc are easily link for anyone who goes on my website".

That request is why every public page links the profiles already in the repo: X, Instagram, TikTok, YouTube, and Twitch. Ian said on 2026-10-14 "instagram and x are the main focus" (relayed by DTRT Co-Founder).

The homepage social row may link `https://www.twitch.tv/dtrtc`. That link is a profile, not the stream player, the results dashboard, or AFTERLIGHT. Those stay off the company face under the Stage 1 freeze.

Tests that used to reject any `twitch.tv` string on the homepage now allow that profile in `nav.site-socials` and still reject a Twitch embed, CS2, and AFTERLIGHT on the company face.
