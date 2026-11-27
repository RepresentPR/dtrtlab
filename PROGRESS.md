# Progress

Public AI chat branch `cursor/public-ai-launch-8a16`.

Head: `30ab3e94ec5f53da7127633baa17ed76825f0855`

FIXED: indirect finality crossed with site questions returns the full sheet, 96/96 scripts/ask-varied.test.cjs
FIXED: Spanish future and conditional lines set the flag, 8/8 scripts/ask-varied.test.cjs
FIXED: symbol leetspeak lines set the flag, 6/6 scripts/ask-varied.test.cjs
FIXED: past-tense ingestion lines set the flag, 6/6 scripts/ask-varied.test.cjs
FIXED: do-not-want-to-live lines set the flag, 6/6 scripts/ask-varied.test.cjs
FIXED: plans with a time word set the flag, 6/6 scripts/ask-varied.test.cjs
FIXED: idioms and short benign questions set no flag, 43/43 scripts/ask-varied.test.cjs
FIXED: 30 plain questions set no flag, 30/30 scripts/ask-plain.test.cjs
FIXED: re-show keeps the first flag timestamp, 2/2 scripts/ask-flag.test.cjs
FIXED: a legacy stored 1 expires, 2/2 scripts/ask-flag.test.cjs
FIXED: held-out crisis-first stays 56/56, scripts/public-ai.test.cjs
FIXED: wrangler.toml is absent so dashboard bindings stay, scripts/cf-deploy.test.cjs

Not checked: QA's private sets, a live D1 signup, and the proof stamp.

Local `node --test scripts/*.test.cjs`: 372 tests, 362 pass, 0 fail, 10 skip.

Main's PR #115 live-refresh handoff is merged in this branch. Its not-checked list remains the live Actions status code, the live secret, and proof-freshness.
