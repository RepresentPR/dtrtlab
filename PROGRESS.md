# Progress

Public AI chat branch `cursor/public-ai-launch-8a16`.

Head: `07efcad926980a36155cc89c821d66dcd8161f68`

FIXED: idiom plus a crisis gets the full sheet and no page quote, 26/26 scripts/ask-qa-fresh.test.cjs
FIXED: typo act words set the flag, 26/26 scripts/ask-qa-fresh.test.cjs
FIXED: normalizer traps set the flag, 26/26 scripts/ask-qa-fresh.test.cjs
FIXED: barrel, slit, morirme and tirare set the flag, 26/26 scripts/ask-qa-fresh.test.cjs
FIXED: third-person and news lines get the sheet, flag 1/52 scripts/ask-qa-fresh.test.cjs
FIXED: a fresh plain list sets no flag, 0/30 scripts/ask-qa-fresh.test.cjs
FIXED: plain question pairs end unflagged, 0/870 scripts/ask-qa-fresh.test.cjs
FIXED: a flagged visitor's benign follow-up keeps the pinned 988 box, 1/1 scripts/ask-qa-fresh.test.cjs
FIXED: held-out crisis-first stays 56/56, scripts/public-ai.test.cjs
FIXED: wrangler.toml is absent so dashboard bindings stay, scripts/cf-deploy.test.cjs

The one third-person flag is "The homework sheet prints the phrase hang myself". A pure idiom can still get the sheet. That false alarm is accepted. The 24h flag stays off when the whole message is that one idiom.

Not checked: QA's private 559 and 330 sets were not re-run here, a live D1 signup, and the proof stamp. There is no separate 30-line unmistakable list; the clear classes above are 26 lines each.

Local `node --test scripts/*.test.cjs`: 386 tests, 376 pass, 0 fail, 10 skip.
