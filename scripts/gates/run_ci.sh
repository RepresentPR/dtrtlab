#!/usr/bin/env bash
# CI entry for the durable gates. Runs from the repo root.
# 1) unit tests for the gates themselves
# 2) copy_lint.py on every tracked DRAFTS / drafts / captions file
# 3) done_gate.py on every tracked status file (PROGRESS.md, AUTOPILOT-*.md, QA-NOTE-*.md, open-issues.md)
# Any failure exits non-zero. Nothing to lint is a pass, printed as such.
set -euo pipefail
python3 -m unittest scripts/gates/test_gates.py

mapfile -t drafts < <(git ls-files | grep -E '(^|/)(DRAFTS|drafts|captions)/' | grep -Ei '\.(md|txt|json|srt|vtt|csv|html|yml|yaml)$' || true)
if ((${#drafts[@]})); then
  python3 scripts/gates/copy_lint.py "${drafts[@]}"
else
  echo "copy_lint: no tracked DRAFTS/captions files; nothing to lint"
fi

mapfile -t status < <(git ls-files | grep -E '(^|/)(PROGRESS\.md|AUTOPILOT-[^/]*\.md|QA-NOTE-[^/]*\.md|open-issues\.md)$' || true)
if ((${#status[@]})); then
  python3 scripts/gates/done_gate.py "${status[@]}"
else
  echo "done_gate: no tracked status files; nothing to check"
fi
