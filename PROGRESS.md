# Progress

Public AI chat branch `cursor/public-ai-launch-8a16`.

Head: `pending`

FIXED: harm-page requests mixed with site words return the full sheet and no page quote, 132/132 scripts/ask-risk.test.cjs
FIXED: the risk flag reaches a new tab for 24h, 3/3 scripts/ask-risk.test.cjs
FIXED: the unmatched sheet path sets the risk flag, 2/2 scripts/ask-risk.test.cjs
FIXED: held-out crisis-first stays 56/56, scripts/public-ai.test.cjs

Not checked: QA's private 62-message set, a live D1 signup, and the proof stamp.

Local `node --test scripts/*.test.cjs`: 353 tests, 344 pass, 0 fail, 9 skip.
