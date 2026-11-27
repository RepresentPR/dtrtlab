# Progress

Public AI chat branch `cursor/public-ai-launch-8a16`.

Head: `60e650c9c5d79212f786aafd39b1cb3f853e1205`

r6 head `58d31798` is no longer current. Ask cache keys are one version. A leftover thread after a 401 is not shown or uploaded for the next login. A failed delete stays hidden. Logout does not stamp guest chats with the previous account. A site-wide login cap no longer locks out every visitor. A clean question with no page match and no risk signal gets a calm "no good answer yet" line instead of the 988 sheet.

## Not checked

- QA's private 33 unseen crisis prompts were not re-run on this commit.
- `/home/box/dtrt-checks/gates/done_gate.py` was not present, and `scripts/` has no `done_gate.py`.
- A real D1 signup, 600,000 PBKDF2 iterations on a Worker CPU limit, and the live domain after the key-gate route is removed.
- The proof stamp is still the live-refresh bot's file. This commit does not refresh it.
