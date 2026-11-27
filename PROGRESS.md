# PR #115 live-refresh fail-loud — handoff to QA (2026-11-27)

READY for QA (30/30): required-source Postiz failures print `::error` with the HTTP status code only (no body, no headers, no secret values), then exit 1. Writes on failure are unchanged, and X stays optional. Evidence: scripts/test_live_refresh.py and scripts/live-refresh.py.

## Not checked

- The real status code from a live Actions run (it was not logged before; it will show after merge and a `POSTIZ_API_KEY` rotation).
- The live secret value (unread, and not requested).
- proof-freshness, which stays red on main until that rotation (ops, outside this PR).
