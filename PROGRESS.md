# Progress

Public AI chat branch `cursor/public-ai-launch-8a16`.

Head: `221a15cbc3ec575763dcd499329821f6acf7ee0d`

FIXED: goodbye and farewell notes set the flag, 16/16 scripts/ask-flag-on-sheet.test.cjs
FIXED: last night alive sets the flag, 16/16 scripts/ask-flag-on-sheet.test.cjs
FIXED: not wanting to live sets the flag, 16/16 scripts/ask-flag-on-sheet.test.cjs
FIXED: a plan with a time and a place sets the flag, 16/16 scripts/ask-flag-on-sheet.test.cjs
FIXED: taking pills or a bottle sets the flag, 16/16 scripts/ask-flag-on-sheet.test.cjs
FIXED: ending a life in the first person sets the flag, 16/16 scripts/ask-flag-on-sheet.test.cjs
FIXED: Spanish methods in the first person set the flag, 16/16 scripts/ask-flag-on-sheet.test.cjs
FIXED: spelled-out typos set the flag, 16/16 scripts/ask-flag-on-sheet.test.cjs
FIXED: unattributed lines set the flag, 16/16 scripts/ask-flag-on-sheet.test.cjs
FIXED: a weapon or a jump sets the flag, 16/16 scripts/ask-flag-on-sheet.test.cjs
FIXED: unmistakable lines set the flag, 30/30 scripts/ask-flag-on-sheet.test.cjs
FIXED: third person gets the helping line, flag 0/52 scripts/ask-flag-on-sheet.test.cjs
FIXED: site questions and site phrases set no flag, 0/67 scripts/ask-flag-on-sheet.test.cjs
FIXED: a fresh plain list sets no flag, 0/30 scripts/ask-flag-on-sheet.test.cjs
FIXED: plain question pairs end unflagged, 0/870 scripts/ask-flag-on-sheet.test.cjs
FIXED: held-out crisis-first stays 56/56, scripts/public-ai.test.cjs

The flag follows the existing crisis-vocabulary sheet. Idioms, third-person frames, and site phrases stay on the sheet without the flag. QA's private 559 set was not re-run here.

Not checked: QA's private 559 and 330 sets were not re-run here, a live D1 signup, and the proof stamp.

Local `node --test scripts/*.test.cjs`: 415 tests, 405 pass, 0 fail, 10 skip.
