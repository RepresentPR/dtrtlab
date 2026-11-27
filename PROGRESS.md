# PR #114 /links/ — handoff to QA (2026-11-27)

Round: pr114 (head will be the commit that includes this file).
READY for QA: the /links/ page in links/index.html, plus links/lang.js and links/links.css.

## What changed in this round (after QA FAIL on dcf2be34, report at qa-reports/links-pr114/REPORT-pr114-dcf2be34.md)

- Candles disclosure on links/index.html is exactly: Referral link. We earn from fees. Trading is risky, not financial advice. Same line as the Open Candles link, no parentheses. Spanish: Enlace de referido. Ganamos de las comisiones. Operar es riesgoso, no es asesoría financiera.
- White Lotus tea card removed (Ian, 11/27). Card 01 is now #jafra in links/index.html: "My mom's Jafra shop" / "La tienda Jafra de mi mamá", link https://www.jafra.com/es/?pws=sabrinacrespo with rel="sponsored noopener", disclosure "My mom's Jafra consultant link. She earns from sales." / "Enlace de consultora Jafra de mi mamá. Ella gana de las ventas." Meta descriptions updated; links/links.css class renamed tea to jafra.
- "Very early AI test, not live yet." and "todavía no está en vivo." are unchanged (Co-Founder call).
- PROGRESS.md is in the repo root and listed in _config.yml exclude (with RESULT-done_gate*.txt) so Pages will not publish it.
- done_gate.py restored to /home/box/dtrt-checks/gates/done_gate.py and copied to scripts/gates/done_gate.py. It is a restore of the 11/17 source. Gap: it prints NO-NOT-CHECKED but exits 0 on that flag alone (same as the recovered script).
- copy_lint.py rebuilt at /home/box/dtrt-checks/gates/copy_lint.py only. It is not committed under scripts/gates/: the recovered term lists are plaintext, and scripts/ is scanned by the site term tests, so committing those lists would fail the tests and publish the terms. See scripts/gates/GATES.md. The reconstruction is not a byte copy of the wiped original; leftover LOCATION, OLD-JOB, BRAND, and KIDS lists were not recovered and were not invented.
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
- The rest of the original copy_lint.py term lists (OLD-JOB, BRAND, KIDS, leftover LOCATION). That reconstruction is incomplete; see scripts/gates/GATES.md and the header of /home/box/dtrt-checks/gates/copy_lint.py.
- js/stats.js cleanup (dead file still has the old Instagram handle).
