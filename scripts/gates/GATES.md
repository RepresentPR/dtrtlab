# Gates (rules.md 8.1 and 8.4)

`done_gate.py` is restored here so a box refresh cannot wipe it again. The 11/26 refresh deleted `/workspace/checks/gates/`.

| Script | Rule | Run | Fails on |
|---|---|---|---|
| `scripts/gates/done_gate.py` | 8.1 | `python3 scripts/gates/done_gate.py PROGRESS.md` | NO-PROOF, SELF-GRADED. Prints NO-NOT-CHECKED but does not fail on it (same as the recovered 11/17 source). |

`copy_lint.py` (rule 8.4) is not in this public repo. The recovered term lists are plaintext, and `scripts/` is still scanned by the site's term tests, so committing those lists would fail the tests and also publish the terms. The runnable copy is `/home/box/dtrt-checks/gates/copy_lint.py`. See that file's header for what was recovered and what is still missing from the 11/17 original.

Box copies under `/home/box/dtrt-checks/gates/` also include `done_gate.py`.
