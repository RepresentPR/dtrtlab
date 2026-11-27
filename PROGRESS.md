# Progress

Public AI chat branch `cursor/public-ai-launch-8a16`.

Head: `b070b5c53ceaab3c60e0f90dca54d57922fd4cb8`

FIXED: ask and functions contain no 24-hour flag writer, scripts/ask-no-flag.test.cjs
FIXED: plain questions show no session pin, 0/30 scripts/ask-no-flag.test.cjs
FIXED: plain pairs show no session pin, 0/870 scripts/ask-no-flag.test.cjs
FIXED: third-person sheets include the helping line, 10/10 scripts/ask-no-flag.test.cjs
FIXED: a later plain answer stays pinned after a positive crisis match in the same history, scripts/ask-no-flag.test.cjs
FIXED: the 988 footer stays on a page answer and an error, scripts/ask-no-flag.test.cjs
FIXED: crisis-first screen stays 56/56, scripts/public-ai.test.cjs

The pin is in-memory history only. `replyFor` pins a non-sheet reply when an earlier turn in `opts.history` is `crisisMatch`. `finish()` is the only call that adds the helping line, and it runs once. Grep of `ask/` and `functions/` for `writeRiskFlag`, `readRiskFlag`, `RISK_FLAG_KEY`, `RISK_TTL`, and `dtrt.risk` returned no hits.

Not checked: QA's private 559 and 330 sets were not re-run here, a live D1 signup, and the proof stamp.

Local `node --test scripts/*.test.cjs`: 420 tests, 410 pass, 0 fail, 10 skip.
