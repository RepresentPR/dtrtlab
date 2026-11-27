# copy_lint: QA must-fixes for PR #121 — handoff to QA (2026-11-27)

READY for QA (28/28 gate tests, 4/4 term-list tests): the copy_lint rules close the QA must-fixes from 7dfcb822 and 79d0b3ab. Evidence: scripts/gates/test_gates.py, scripts/gates/copy_lint.py, scripts/private-terms.test.cjs, and scripts/pages-artifact.test.cjs.

- Mid-line "live - AI", "live * AI", "live + AI", and "live 1. AI" fail. List-marker breaks count only at a real line start (after a newline plus optional indent), never mid-line (28/28 in scripts/gates/test_gates.py).
- MOTION official wording triggers the opener requirement regardless of case (lower, UPPER, Title) and matches whitespace-insensitively. The opener itself stays exact (28/28 in scripts/gates/test_gates.py).
- Only an actual liveness denial in the same sentence exempts a claim (for example "not live yet", "isn't live", "not connected", "does not activate", "has never been live"). A later denial counts only when it negates the AI claim itself, in the same clause, with AI or "it" as the subject. "Try our live AI, not on sale.", "not up for debate", "Try our live AI. Not connected yet.", "Live AI now! Not a gimmick.", the next-sentence "Not kidding." fixture, "not available in red.", "not ready for merch preorders", and "not online shopping" fail (28/28 in scripts/gates/test_gates.py).
- Em dash, semicolon, and colon are sentence-level breaks for the live+AI bigram, so "Go live: AI stays a very early test, not live yet." style lines pass. Emoji counts as a break too (28/28 in scripts/gates/test_gates.py).
- Singular "my kid" and "mi hijo" / "mi hija" are caught (28/28 in scripts/gates/test_gates.py).
- Spanish liveness claims ("IA en vivo", "IA en directo", "IA ya disponible") are caught, including copula forms such as "Nuestra IA está en vivo ahora.", "La IA está en vivo", "IA ya está en vivo", "La IA ya está disponible", and number/gender/future variants. English copula claims such as "Our AI is now available", "The AI is ready.", and "Our AI's online." fail too. Denials "La IA todavía no está en vivo", "La IA no está disponible aún", and "Our AI is not live yet" stay clean. "Prueba nuestra IA en vivo, no un truco.", "IA en vivo? No es un rumor.", and "IA en vivo ahora. No voy." fail (28/28 in scripts/gates/test_gates.py).
- Island name stays marketplace-and-fiction only, per Brain §3. "Waitlists", "Wait-List", generic "the kids", and bare "daughter" stay caught (28/28 in scripts/gates/test_gates.py and 4/4 in scripts/private-terms.test.cjs).
- PROGRESS.md, RESULT-done_gate-copy-lint.txt, and RESULT-done_gate-pr115.txt are excluded from the site build by exact name in _config.yml (scripts/pages-artifact.test.cjs and scripts/stage-site.cjs).

## Not checked

- A headed pass of live marketplace pages (this PR is lint rules only).
- Whether every remaining unpublished hash in the lists still matches current rules (only the listed amendment, QA must-fixes, and Brain §3 narrowing were changed).
- Engagement-bait phrases were left in place (out of scope for this amendment).
- proof-freshness, which stays red on main until the Postiz key rotation (ops, outside this PR).
- Whether main will have moved by the time this handoff is published (update-branch is used only if it has).
