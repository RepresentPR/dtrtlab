# Progress

Public AI chat branch `cursor/public-ai-launch-8a16`.

Head: `bbb9c59754c5bd0cdf90f0400c8be117d8680333`

FIXED: frozen held-out tier 1 sheets with no page search and no model call, 35/35 scripts/ask-heldout-frozen.test.cjs
FIXED: frozen held-out tier 2 keeps the answer and adds the gentle line, 14/14 scripts/ask-heldout-frozen.test.cjs
FIXED: frozen held-out benign lines are not a hard sheet, 0/25 scripts/ask-heldout-frozen.test.cjs
FIXED: plain pairs are not a hard sheet, 0/870 scripts/ask-no-flag.test.cjs

The frozen lines live in scripts/fixtures/ask-heldout-frozen.json. Tier 1 is the hard sheet. Tier 2 is the gentle 988 line on an ordinary answer. QA's private 559, 111, 116, unseen 84, emoji 6, and multilingual 20 were not re-run here.

# copy_lint: QA must-fixes for PR #121 — handoff to QA (2026-11-27)

READY for QA (30/30 gate tests, 4/4 term-list tests): the copy_lint rules close the QA must-fixes from 7dfcb822, 79d0b3ab, the ee24b24 auxiliary-denial hole, and the 4fa4d7bc Spanish estar residual. Evidence: scripts/gates/test_gates.py, scripts/gates/copy_lint.py, scripts/private-terms.test.cjs, and scripts/pages-artifact.test.cjs.

- Mid-line "live - AI", "live * AI", "live + AI", and "live 1. AI" fail. List-marker breaks count only at a real line start (after a newline plus optional indent), never mid-line (30/30 in scripts/gates/test_gates.py).
- MOTION official wording triggers the opener requirement regardless of case (lower, UPPER, Title) and matches whitespace-insensitively. The opener itself stays exact (30/30 in scripts/gates/test_gates.py).
- Only an actual liveness denial in the same sentence exempts a claim (for example "not live yet", "isn't live", "not connected", "does not activate", "has never been live"). A later denial counts only when it negates the AI claim itself, in the same clause, with AI or "it" as the subject, including auxiliaries (has/will/does/can/is going to; ES ha/va a/puede/podrá) plus a liveness predicate. After be/estar (and past/future forms), the complement itself must be a liveness predicate. "The live AI has never been live.", "will not be available", "won't be live until it passes review", "La IA no ha estado en vivo.", "no va a estar disponible todavía", "no estará disponible", and "no va a ser disponible" stay clean. "Try our live AI, not on sale.", "not up for debate", "Try our live AI. Not connected yet.", "Live AI now! Not a gimmick.", the next-sentence "Not kidding." fixture, "not available in red.", "not ready for merch preorders", "not online shopping", "will not be slow", "it will not disappoint", "no va a fallar", "Nuestra IA en vivo no va a estar lenta.", "no va a estar rota", "no va a estar.", "no estuvo lenta", "will not be.", and "has never been." fail (30/30 in scripts/gates/test_gates.py).
- Em dash, semicolon, and colon are sentence-level breaks for the live+AI bigram, so "Go live: AI stays a very early test, not live yet." style lines pass. Emoji counts as a break too (30/30 in scripts/gates/test_gates.py).
- Singular "my kid" and "mi hijo" / "mi hija" are caught (30/30 in scripts/gates/test_gates.py).
- Spanish liveness claims ("IA en vivo", "IA en directo", "IA ya disponible") are caught, including copula forms such as "Nuestra IA está en vivo ahora.", "La IA está en vivo", "IA ya está en vivo", "La IA ya está disponible", and number/gender/future variants. English copula claims such as "Our AI is now available", "The AI is ready.", and "Our AI's online." fail too. Denials "La IA todavía no está en vivo", "La IA no está disponible aún", and "Our AI is not live yet" stay clean. "Prueba nuestra IA en vivo, no un truco.", "IA en vivo? No es un rumor.", and "IA en vivo ahora. No voy." fail (30/30 in scripts/gates/test_gates.py).
- Island name stays marketplace-and-fiction only, per Brain §3. "Waitlists", "Wait-List", generic "the kids", and bare "daughter" stay caught (30/30 in scripts/gates/test_gates.py and 4/4 in scripts/private-terms.test.cjs).
- PROGRESS.md, RESULT-done_gate-copy-lint.txt, and RESULT-done_gate-pr115.txt are excluded from the site build by exact name in _config.yml (scripts/pages-artifact.test.cjs and scripts/stage-site.cjs).

## Follow-ups

- Bugbot medium on 7b05b589, "Copula skip misses modified denials" (discussion r4721496652, bug 902eb42f-b382-41e4-827e-e7865791499e): a modifier between the copula and the predicate (`no va a estar ahora disponible`, `no va a estar nunca disponible`, `no está ahora en vivo`) is flagged even though the complement is a real liveness denial. `ya` in that slot, and a modifier after the predicate (`no va a estar disponible ahora`), already stay clean. This is a false fail on honest copy, which is safe. Left for a later pass; this round does not loosen the skip set.

## Not checked

- QA's private 559 crisis set, QA's 116 third-person sheets, QA's unseen 30, and QA's 111 idiom-plus-crisis lines were not re-run here.
- A live D1 signup, and the proof stamp.
- A headed pass of live marketplace pages (this PR is lint rules only).
- Whether every remaining unpublished hash in the lists still matches current rules (only the listed amendment, QA must-fixes, and Brain §3 narrowing were changed).
- Engagement-bait phrases were left in place (out of scope for this amendment).
- proof-freshness, which stays red on main until the Postiz key rotation (ops, outside this PR).
- Whether main will have moved by the time this handoff is published (update-branch is used only if it has).

Local `node --test scripts/*.test.cjs`: 430 tests, 420 pass, 0 fail, 10 skip.
