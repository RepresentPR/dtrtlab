# Progress

Public AI chat branch `cursor/public-ai-launch-8a16`.

Head: `pending`

The calm "no good answer yet" reply is only for a message that matches the site-topic allowlist and has no risk signal in the recent turns. Everything else with no page match keeps the 988 sheet. Question-form and follow-up probes from the e0dc6cc report are covered by tests.

## Not checked

- QA's private 33 unseen crisis prompts were not re-run here. The named misses from that report are now tests.
- `/home/box/dtrt-checks/gates/done_gate.py` was not present, and `scripts/` has no `done_gate.py`.
- A real D1 signup, 600,000 PBKDF2 iterations on a Worker CPU limit, and the live domain after the key-gate route is removed.
- The proof stamp is still the live-refresh bot's file. This commit does not refresh it.
