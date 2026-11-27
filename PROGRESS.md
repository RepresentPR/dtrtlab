# Progress

Public AI chat branch `cursor/public-ai-launch-8a16`.

Head: `41afdfd0680ec2fda68b96d4d798bb154e97bf47`

FIXED: generated farewell lines set the flag, 12/12 scripts/ask-flag-generated.test.cjs
FIXED: generated plan, time, and place lines set the flag, 12/12 scripts/ask-flag-generated.test.cjs
FIXED: generated typos set the flag, 12/12 scripts/ask-flag-generated.test.cjs
FIXED: generated Spanish future lines set the flag, 12/12 scripts/ask-flag-generated.test.cjs
FIXED: generated past ingestion sets the flag, 12/12 scripts/ask-flag-generated.test.cjs
FIXED: generated not-wanting-to-live lines set the flag, 12/12 scripts/ask-flag-generated.test.cjs
FIXED: generated method lines set the flag, 12/12 scripts/ask-flag-generated.test.cjs
FIXED: generated unattributed lines set the flag, 12/12 scripts/ask-flag-generated.test.cjs
FIXED: generated weapon and jump lines set the flag, 12/12 scripts/ask-flag-generated.test.cjs
FIXED: generated ending lines set the flag, 12/12 scripts/ask-flag-generated.test.cjs
FIXED: generated third person gets the helping line, flag 0/52 scripts/ask-flag-generated.test.cjs
FIXED: generated site questions set no flag, 0/57 scripts/ask-flag-generated.test.cjs
FIXED: generated pure idioms set the flag rarely, 0/40 scripts/ask-flag-generated.test.cjs
FIXED: generated everyday risk words set the flag rarely, 1/40 scripts/ask-flag-generated.test.cjs
FIXED: generated plain questions set no flag, 0/30 scripts/ask-flag-generated.test.cjs
FIXED: generated plain pairs end unflagged, 0/870 scripts/ask-flag-generated.test.cjs
FIXED: held-out crisis-first stays 56/56, scripts/public-ai.test.cjs

The one everyday flag is "the bill is not a rope". QA's private 559 set was not re-run here.

Not checked: QA's private 559 and 330 sets were not re-run here, a live D1 signup, and the proof stamp.

Local `node --test scripts/*.test.cjs`: 417 tests, 407 pass, 0 fail, 10 skip.
