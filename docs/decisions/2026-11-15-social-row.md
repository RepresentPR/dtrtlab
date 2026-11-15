# Social row includes Twitch

**Date:** 2026-11-15  
**Decided by:** Ian Ferraro, in the site request for this branch

Ian asked that every social profile already in the repo be easy to find from the site: X, Instagram, TikTok, YouTube, and Twitch. On the same day he said Instagram and X are where he posts most.

The homepage social row may link `https://www.twitch.tv/dtrtc`. That link is a profile, not the stream player, the results dashboard, or AFTERLIGHT. Those stay off the company face under the Stage 1 freeze.

Tests that used to reject any `twitch.tv` string on the homepage now allow that profile in `nav.site-socials` and still reject a Twitch embed, CS2, and AFTERLIGHT on the company face.
