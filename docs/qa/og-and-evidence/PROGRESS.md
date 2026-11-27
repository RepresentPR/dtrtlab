# fix/og-and-evidence — handoff to QA (2026-11-27)

Branch fix/og-and-evidence off main a13f7000 (after #114). Two QA follow-ups from #114 plus one file move.

READY for QA: content/live-performance.json is restored byte-for-byte to its 4612a9dc version (before #114), so the Nov 15 historical reel URLs and evidence notes say officiallydtrt again. Proof: live-performance-restore.txt in this folder (empty diff, matching sha256). The file has no current-facing handle field, so it now has no dtrt.xyng text.

## Share image
- 47 HTML pages pointed og:image and twitter:image at img/brand/og-job-desk-2026-10-15.png (its pixels name a region, which rules.md bans). All 47 now use img/brand/avatar-a.png (512x512 mark, no text; same as /links and the legal pages), with og:image:width/height 512 where present, og:image:alt "DTRT Lab logo.", twitter:card summary.
- QA's 45 = the pages #114 touched. The other 2 (live/extras.html, live/upnext.html) were not touched by #114 but carried the same card, so they are included.
- No neutral 1200x630 image exists in the repo: og-theme-a.png, dtrt-social.png and dtrt-banner.png name the same region; og-owner-dashboard.png says "Owner dashboard". img/avatar-a.png does not exist; the file is img/brand/avatar-a.png.
- Left as is: brand.html still offers og-job-desk-2026-10-15.png as a "Social share image (PNG)" download link (not a share tag), sw.js still precaches it, and scripts/logo-a.test.cjs still checks its size. No JS edited (fix7/5). Nothing from the old-job material was touched.

## File move
- RESULT-done_gate-pr114.txt moved with git mv to links/RESULT-done_gate-pr114.txt, next to links/PROGRESS.md. _config.yml exclude now names links/RESULT-done_gate-pr114.txt.

## Not checked
- How each social network renders the square summary card (no live share debugger run).
- campaign.json: #114 also renamed historical Nov 15 notes there ("signed-in dtrt.xyng Reels grid" and the Sep 12 to Oct 11 Insights handle). Not changed here; outside this request.
- copy_lint flags one PAIR on partners.html line 14 (meta description). It is the same on main before this PR (only the og lines changed here) and was left alone.
- No deploy; the site serves main at a pinned commit.
