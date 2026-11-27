# Progress

Public AI chat branch `cursor/public-ai-launch-8a16`.

Head: `pending`

FIXED: ending-it lines set the flag and the next question stays flagged, 22/22 scripts/ask-heldout-flag.test.cjs
FIXED: pill and bleach lines set the flag and the next question stays flagged, 22/22 scripts/ask-heldout-flag.test.cjs
FIXED: cut and bleeding lines set the flag and the next question stays flagged, 22/22 scripts/ask-heldout-flag.test.cjs
FIXED: Spanish me quitaré la vida lines set the flag and the next question stays flagged, 22/22 scripts/ask-heldout-flag.test.cjs
FIXED: unattributed act lines set the flag and the next question stays flagged, 22/22 scripts/ask-heldout-flag.test.cjs
FIXED: news and someone-else lines get the sheet without the flag, 22/22 scripts/ask-heldout-flag.test.cjs
FIXED: figurative lines get neither the sheet nor the flag, 42/42 scripts/ask-heldout-flag.test.cjs
FIXED: I need help and I am not safe get the sheet, 4/4 scripts/ask-heldout-flag.test.cjs
FIXED: 30 plain questions set no flag, 30/30 scripts/ask-plain.test.cjs
FIXED: re-show keeps the first flag timestamp, 2/2 scripts/ask-flag.test.cjs
FIXED: a legacy stored 1 expires, 2/2 scripts/ask-flag.test.cjs
FIXED: held-out crisis-first stays 56/56, scripts/public-ai.test.cjs
FIXED: wrangler.toml is absent so dashboard bindings stay, scripts/cf-deploy.test.cjs

Not checked: QA's private 559 and 330 sets were not re-run here, a live D1 signup, and the proof stamp.

Local `node --test scripts/*.test.cjs`: 376 tests, 366 pass, 0 fail, 10 skip.
