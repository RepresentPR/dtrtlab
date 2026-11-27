# Progress

Public AI chat branch `cursor/public-ai-launch-8a16`.

Head: `d6ee99f4085faa655cc2edc304d7d945f191fb2f`

FIXED: 30 plain questions get a not-sure reply and set no flag, 30/30 scripts/ask-plain.test.cjs
FIXED: a two-question normal visit stays unflagged, 2/2 scripts/ask-plain.test.cjs
FIXED: page requests that contain a distress, death, method, or farewell word return the full sheet, 435/435 scripts/ask-screen.test.cjs
FIXED: re-show keeps the first flag timestamp, 2/2 scripts/ask-flag.test.cjs
FIXED: a legacy stored 1 expires, 2/2 scripts/ask-flag.test.cjs
FIXED: held-out crisis-first stays 56/56, scripts/public-ai.test.cjs

Not checked: QA's private report set, a live D1 signup, and the proof stamp.

Local `node --test scripts/*.test.cjs`: 358 tests, 349 pass, 0 fail, 9 skip.
