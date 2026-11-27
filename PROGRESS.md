# Progress

Public AI chat branch `cursor/public-ai-launch-8a16`.

Head: `pending`

## Claims

- claim: a page answer ends with "If you're struggling, call or text 988 (US) or visit findahelpline.com." A detected risk returns the full 988 sheet instead of that page answer.
- claim: the risk lexicon runs before any page match. It includes death, dying, die, end it, end my life, life, living, staying alive, leave this world, lethal, dose, overdose, quit life, who will find me, gone, not be here, and disappear, in English and Spanish.
- claim: a request for a harm or method page is risk.
- claim: indirect risk sets the browser-session flag `dtrt.risk.v1` in sessionStorage. New chat does not clear it.
- claim: a replyFor error includes the same short 988 footer.
- claim: held-out counts remain crisis-first 56/56, closed-sheet 14/14, on-topic 5/5, false-alarms 0/53, login-isolation 1/1, delete-tombstone 1/1, unmatched-sheet 35/35.

Local `node --test scripts/*.test.cjs`: 350 tests, 341 pass, 0 fail, 9 skip.

## Not checked

- QA's private unseen crisis set was not re-run here. The named misses and the class templates are tests in this commit.
- `/home/box/dtrt-checks/gates/done_gate.py` was not on this machine. The run failed because that path does not exist. `scripts/` has no `done_gate.py`.
- A real D1 signup, 600,000 PBKDF2 iterations on a Worker CPU limit, and the live domain after the key-gate route is removed.
- The proof stamp is still the live-refresh bot's file. This commit does not refresh it.
