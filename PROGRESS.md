# copy_lint: QA must-fixes for PR #120 — handoff to QA (2026-11-27)

READY for QA (25/25 gate tests, 4/4 term-list tests): the copy_lint and repo term-list rules close the QA must-fixes from fa43f657. Evidence: scripts/gates/test_gates.py, scripts/gates/copy_lint.py, scripts/private-terms.test.cjs, and scripts/pages-artifact.test.cjs.

- Live-AI negation only exempts a phrase when it denies liveness itself (for example "not live yet" or "isn't live"). The three nearby-negation claims now fail (25/25 in scripts/gates/test_gates.py).
- The live+AI bigram does not match across sentence ends, bullets, a middle dot, or line or list breaks. "Go live. AI stays a very early test, not live yet." and "Find-me live · AI spend ops" now pass (25/25 in scripts/gates/test_gates.py).
- MOTION official wording or the affiliate link requires the exact opener "Affiliate link. We earn a commission." Official wording without the opener fails; the paraphrase ban stays (25/25 in scripts/gates/test_gates.py).
- Island name is allowed only on marketplace pages (mercado and store pages, the home store section, their ES versions) and on fiction pages, and is flagged everywhere else, per Brain §3 (25/25 in scripts/gates/test_gates.py and 4/4 in scripts/private-terms.test.cjs).
- "Waitlists", "Wait-List", generic "the kids", and bare "daughter" are now caught (25/25 in scripts/gates/test_gates.py).
- PROGRESS.md, RESULT-done_gate-copy-lint.txt, and RESULT-done_gate-pr115.txt are excluded from the site build by exact name in _config.yml (scripts/pages-artifact.test.cjs and scripts/stage-site.cjs).

## Not checked

- A headed pass of live marketplace pages (this PR is lint rules only).
- Whether every remaining unpublished hash in the lists still matches current rules (only the listed amendment, QA must-fixes, and Brain §3 narrowing were changed).
- Engagement-bait phrases were left in place (out of scope for this amendment).
- proof-freshness, which stays red on main until the Postiz key rotation (ops, outside this PR).
