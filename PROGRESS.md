# Progress

Public AI chat branch `cursor/public-ai-launch-8a16`.

Head: `pending`

FIXED: idiom plus a real crisis returns the full sheet, 26/26 scripts/ask-softlock.test.cjs
FIXED: a separate plain list sets no flag, 0/30 scripts/ask-softlock.test.cjs
FIXED: plain question pairs end unflagged, 0/870 scripts/ask-softlock.test.cjs
FIXED: the 24h flag keeps its first time and a plain follow-up shows the 988 box, 1/1 scripts/ask-softlock.test.cjs
FIXED: ending-it lines set the flag, 22/22 scripts/ask-heldout-flag.test.cjs
FIXED: pill and bleach lines set the flag, 22/22 scripts/ask-heldout-flag.test.cjs
FIXED: cut and bleeding lines set the flag, 22/22 scripts/ask-heldout-flag.test.cjs
FIXED: Spanish me quitaré la vida lines set the flag, 22/22 scripts/ask-heldout-flag.test.cjs
FIXED: unattributed act lines set the flag, 22/22 scripts/ask-heldout-flag.test.cjs
FIXED: news and someone-else lines get the sheet without the flag, 22/22 scripts/ask-heldout-flag.test.cjs
FIXED: figurative lines get neither the sheet nor the flag, 40/40 scripts/ask-heldout-flag.test.cjs
FIXED: I need help and I am not safe get the sheet, 4/4 scripts/ask-heldout-flag.test.cjs
FIXED: held-out crisis-first stays 56/56, scripts/public-ai.test.cjs
FIXED: wrangler.toml is absent so dashboard bindings stay, scripts/cf-deploy.test.cjs

Not checked: QA's private 559 and 330 sets were not re-run here, a live D1 signup, and the proof stamp.

Local `node --test scripts/*.test.cjs`: 379 tests, 369 pass, 0 fail, 10 skip.
