# copy_lint: PR amendment + new rules — handoff to QA (2026-11-27)

READY for QA (24/24 gate tests, 4/4 term-list tests): copy_lint and the repo term lists follow the 11/27 marketplace amendment and the new caption rules. Evidence: scripts/gates/test_gates.py, scripts/gates/copy_lint.py, scripts/private-terms.test.cjs, and scripts/pages-artifact.test.cjs.

- Marketplace island-name tokens are no longer banned globally; personal towns stay banned (24/24 in scripts/gates/test_gates.py).
- Bare state-name tokens are no longer banned; the personal-location terms stay banned (24/24 in scripts/gates/test_gates.py).
- Investor-claim phrases still fail; the bare word passes (24/24 in scripts/gates/test_gates.py).
- New rules cover the MOTION paraphrase, waitlist, AI-is-live claims, the retired handle, and generic kids phrases (24/24 in scripts/gates/test_gates.py).
- PROGRESS.md and RESULT-done_gate-copy-lint.txt are excluded from the site build by exact name in _config.yml (scripts/pages-artifact.test.cjs and scripts/stage-site.cjs).

## Not checked

- A headed pass of live marketplace pages (this PR is lint rules only).
- Whether every remaining unpublished hash in the lists still matches current rules (only the listed amendment and new rules were changed).
- Engagement-bait phrases were left in place (out of scope for this amendment).
