# Progress

Public AI chat branch `cursor/public-ai-launch-8a16`.

Head: `3f5b41ef19bfa429fa15c4ecaac1f4d1c377a6e0`

FIXED: site questions set no flag, 0/55 scripts/ask-flag-lexicon.test.cjs
FIXED: overdose phrasing sets the flag, 26/26 scripts/ask-flag-lexicon.test.cjs
FIXED: not wanting to exist sets the flag, 26/26 scripts/ask-flag-lexicon.test.cjs
FIXED: ending phrases with a time set the flag, 26/26 scripts/ask-flag-lexicon.test.cjs
FIXED: Spanish hanging phrases set the flag, 26/26 scripts/ask-flag-lexicon.test.cjs
FIXED: Spanish cutting phrases set the flag, 26/26 scripts/ask-flag-lexicon.test.cjs
FIXED: jumping, weapons, and a plan with a time set the flag, 26/26 scripts/ask-flag-lexicon.test.cjs
FIXED: explicit typos set the flag, 26/26 scripts/ask-flag-lexicon.test.cjs
FIXED: unmistakable first-person lines set the flag, 30/30 scripts/ask-flag-lexicon.test.cjs
FIXED: someone else gets the sheet and a helping line, flag 0/52 scripts/ask-flag-lexicon.test.cjs
FIXED: pure idioms rarely set the flag, 0/40 scripts/ask-flag-lexicon.test.cjs
FIXED: a fresh plain list sets no flag, 0/30 scripts/ask-flag-lexicon.test.cjs
FIXED: plain question pairs end unflagged, 0/870 scripts/ask-flag-lexicon.test.cjs
FIXED: held-out crisis-first stays 56/56, scripts/public-ai.test.cjs
FIXED: wrangler.toml is absent so dashboard bindings stay, scripts/cf-deploy.test.cjs

The one barrel line that did not flag in the older file is "The slit is the plan I keep", 25/26 scripts/ask-qa-fresh.test.cjs. The sheet path was not retuned.

Not checked: QA's private 559 and 330 sets were not re-run here, a live D1 signup, and the proof stamp.

Local `node --test scripts/*.test.cjs`: 401 tests, 391 pass, 0 fail, 10 skip.
