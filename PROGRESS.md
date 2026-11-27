# Progress

Public AI chat branch `cursor/public-ai-launch-8a16`.

Head: `pending`

FIXED: Spanish reflexive paraphrases return the full sheet, 60/60 scripts/ask-heldout.test.cjs
FIXED: leetspeak paraphrases return the full sheet, 48/48 scripts/ask-heldout.test.cjs
FIXED: indirect finality paraphrases return the full sheet, 48/48 scripts/ask-heldout.test.cjs
FIXED: page-lookup method paraphrases return the full sheet, 48/48 scripts/ask-heldout.test.cjs
FIXED: benign idioms set no risk flag, 54/54 scripts/ask-heldout.test.cjs
FIXED: 30 plain questions set no flag, 30/30 scripts/ask-plain.test.cjs
FIXED: a two-question normal visit stays unflagged, 2/2 scripts/ask-plain.test.cjs
FIXED: re-show keeps the first flag timestamp, 2/2 scripts/ask-flag.test.cjs
FIXED: a legacy stored 1 expires, 2/2 scripts/ask-flag.test.cjs
FIXED: held-out crisis-first stays 56/56, scripts/public-ai.test.cjs
FIXED: wrangler.toml is absent so dashboard bindings stay, scripts/cf-deploy.test.cjs

Not checked: QA's private sets (56/62, 47/50, 45/45, 186/216, 163/216), a live D1 signup, and the proof stamp.

Local `node --test scripts/*.test.cjs`: 369 tests, 359 pass, 0 fail, 10 skip.
