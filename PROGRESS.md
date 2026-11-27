# PR #114 /links/ — handoff to QA (2026-11-27, after QA FAIL 32231752)

Round: pr114 (head will be the commit that includes this file).
READY for QA: the /links/ page in links/index.html, plus links/lang.js and links/links.css.

## QA FAIL 32231752 fixes (report at qa-reports/links-pr114/REPORT-pr114-32231752.md)

- links/index.html header nav no longer has the Ask DTRT link (EN "Ask DTRT", ES "Pregúntale a DTRT"). links/index.html has no /ask/ link anywhere.
- Hero lead in links/index.html: "Things we build or link to. Every link that pays us says how." / "Cosas que construimos o enlazamos. Cada enlace que nos paga dice cómo." Matches the footer; the "use" claim is gone.
- Ask index rebuilt; cache keys bumped to 20261127-links6 as scripts/update-cache-manifest.cjs required.
- Merged main 6e54b0d (#119 data refresh). Conflict in content/campaign.json resolved by taking main's numbers and keeping this PR's handle rename (signed-in dtrt.xyng Reels grid) in content/campaign.json.

## QA FAIL b48f9a3b fixes (report at qa-reports/links-pr114/REPORT-pr114-b48f9a3b.md)

- MOTION in links/index.html now quotes motionpouches.com/shop word for word, fetched 2026-11-27: "Zero nicotine and zero tobacco, too." and "40mg caffeine per pouch. Adults 18+." Spanish is a marked translation. Source link is https://www.motionpouches.com/shop, "(checked November 27, 2026)". Builder fetch copies with sha256 are outside the repo in the box evidence folder dtrt-work/evidence-pr114 (motion-shop-2026-11-27.html).
- AI card: the /ask/ link is removed (Co-Founder ruling: no link until #111 passes). "It's free" removed (no source in the repo). "No paid model is connected" kept: ask/index.html says "A paid model is not connected."
- Six legal pages (legal/cookies.html, legal/dmca.html, legal/preorder-terms.html, legal/privacy.html, legal/refunds.html, legal/terms.html) no longer use og-job-desk-2026-10-15.png. They use img/brand/avatar-a.png (512x512 mark, no text, same image /links uses), with width/height 512, alt "DTRT Lab logo.", twitter:card summary. og-mercado.png was NOT added: the GitHub connector this builder pushes through only writes text files, so a PNG would be corrupted. Other pages untouched.
- Footer: "Things we build or link to. Some links earn us a commission." (ES: "Cosas que construimos o enlazamos. Algunos enlaces nos dan una comisión.")
- _config.yml exclude lists RESULT-done_gate-pr114.txt by exact name (stage-site.cjs does not expand the glob).
- Ask index rebuilt; cache keys bumped to 20261127-links5 where the manifest script required.
- js/stats.js still has the old handle: editing it fails fix7/5 again (no page loads it). Not changed.

## What changed in the previous round (after QA FAIL on dcf2be34, report at qa-reports/links-pr114/REPORT-pr114-dcf2be34.md)

- Candles disclosure on links/index.html is exactly: Referral link. We earn from fees. Trading is risky, not financial advice. Same line as the Open Candles link, no parentheses. Spanish: Enlace de referido. Ganamos de las comisiones. Operar es riesgoso, no es asesoría financiera.
- White Lotus tea card removed (Ian, 11/27). Card 01 is now #jafra in links/index.html: "My mom's Jafra shop" / "La tienda Jafra de mi mamá", link https://www.jafra.com/es/?pws=sabrinacrespo with rel="sponsored noopener", disclosure "My mom's Jafra consultant link. She earns from sales." / "Enlace de consultora Jafra de mi mamá. Ella gana de las ventas." Meta descriptions updated; links/links.css class renamed tea to jafra.
- "Very early AI test, not live yet." and "todavía no está en vivo." are unchanged (Co-Founder call).
- PROGRESS.md is in the repo root and listed in _config.yml exclude (with RESULT-done_gate*.txt) so Pages will not publish it.
- done_gate.py restored to /home/box/dtrt-checks/gates/done_gate.py and copied to scripts/gates/done_gate.py. It is a restore of the 11/17 source. Gap: it prints NO-NOT-CHECKED but exits 0 on that flag alone (same as the recovered script).
- copy_lint.py now comes from main (merged in from #117/#118, scripts/gates/copy_lint.py; same file as /home/box/dtrt-checks/gates/copy_lint.py). Run with --terms scripts/private-terms.test.cjs. GATES.md is main's version; this branch's placeholder was dropped in the merge.
- Legal pages: "Last updated" is now November 27, 2026, because the footer Instagram handle changed to @dtrt.xyng; legal text is unchanged. Recorded in legal/cookies.html, legal/dmca.html, legal/preorder-terms.html, legal/privacy.html, legal/refunds.html, legal/terms.html. Spanish leads in js/biz-lang.js match that date. Cache keys for js/biz-lang.js, js/nav.js, sw.js, and ask/ui.js were bumped so the new strings load.
- js/stats.js handle edit from this PR was reverted. That file is not loaded by any served page, so the edit was invisible and failed fix7/5. It still says @officiallydtrt in that dead file only.

## CI (gate)

- The annotation "newest notebook entry 2026-11-19 is more than 72 hours old" is a warning only. scripts/notebook.test.cjs is written to warn and not fail on that. Run locally on this tree: the notebook tests pass and print `::warning::newest notebook entry 2026-11-19 is more than 72 hours old`. Hours since that entry grow as the clock moves; no fake notebook entry was added.
- Main's `gate` job is green on the same notebook date (checked GitHub check runs on 29009944, including site-gate runs 45829376155, 45623902683, 45403573889, 45302729623).
- The PR's `gate` job on dcf2be34 was red for other reasons: fix7/5 (js/stats.js edited but unreferenced) and fix7/7 (legal pages edited without a fresh Last updated date). Those are addressed above.
- proof-freshness is red on this PR and on main (known, OI-008). Not "fixed" here.

## Not checked

- Live dtrtlab.com/links and www (key lock; this PR is not merged).
- A headed click-through; Instagram @dtrt.xyng ownership logged out.
- The 5% MOTION discount (no longer on the page or in the PR body).
- Candles and Jafra pages beyond a 200 from the link.
- Source for "It's free", "No paid model is connected," and "we use" Candles.
- Screen-reader or keyboard pass; Lighthouse; og:image render.
- Whether a later CI run of `gate` is green; this was not re-run on GitHub before the handoff (local Node tests are in /tmp/pr114-subset.log; a fuller local run is in /tmp/pr114-tests.log after the commit).
- js/stats.js cleanup (dead file still has the old Instagram handle).
