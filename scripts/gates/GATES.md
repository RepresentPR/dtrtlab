# Gates (rules.md 8.1 and 8.4)

These live in the repo so a box refresh can't wipe them again. The 11/26 refresh deleted `/workspace/checks/gates/`.

| Script | Rule | Run it like this | Fails on |
|---|---|---|---|
| `done_gate.py` | 8.1 handoff gate | `python3 scripts/gates/done_gate.py <round>/PROGRESS.md > RESULT-done_gate-<round>.txt` | NO-PROOF, SELF-GRADED (it prints NO-NOT-CHECKED but doesn't fail on it, same as the 11/17 original) |
| `copy_lint.py` | 8.4 copy gate | `python3 scripts/gates/copy_lint.py DRAFTS/<file-or-folder> [--ai-voice]` | a banned term or phrase, a missing exact Candles disclosure, or `--ai-voice` without an "AI voice" disclosure |

- **Term lists:** banned terms are stored only as hashes, using the same scheme as `scripts/private-terms.test.cjs`. That file's lists are read at run time. Fix the copy, never the lists. List changes go through Brain and QA.
- **CI:** `.github/workflows/gates.yml` runs `scripts/gates/run_ci.sh` on every PR and push to main. It runs the gate unit tests, `copy_lint.py` on every tracked `DRAFTS/`, `drafts/` or `captions/` file, and `done_gate.py` on every tracked PROGRESS.md, AUTOPILOT-*.md, QA-NOTE-*.md or open-issues.md.
- **Box copies:** box copies under `/home/box/dtrt-checks/gates/` are convenience mirrors only. The repo copy is the source of truth. To refresh the mirror, copy from a fresh checkout of main. A mirrored `copy_lint.py` needs `--terms <repo>/scripts/private-terms.test.cjs`. Without the repo lists it refuses to run (exit 2) instead of passing.
