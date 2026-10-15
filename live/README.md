# /live — private owner dashboard (company growth)

- Page: `live/index.html` + `live/dashboard.js` + `live/dashboard.css` (`/hq/` redirects here). `noindex`, not linked from any page.
- Data: `live/owner.enc.json` = AES-256-GCM ciphertext (PBKDF2-SHA256, 600,000 iterations). The browser decrypts it with the HQ password (WebCrypto). The plaintext never enters this repo.
- Hosting note: dtrtlab.com is GitHub Pages (no server-side auth). Protection here is encryption, not access control: anyone can download the ciphertext, nobody can read it without the password.
- Content: aggregate counts only (followers, posts, leads, Whop order/member counts, Brain counts). No names, notes, customers, Caliber data, emails or credentials. Missing sources = `null` → "not connected yet".
- Refresh: built on the agent box by `company_aggregates.py --site <checkout>` (after `brain_metrics.py`), then committed. See the PR description for the schedule.

## Refresh (what updates the numbers)
1. **Automatic, every 2 h** — `.github/workflows/live-refresh.yml` runs `scripts/live-refresh.py`: decrypts with `LIVE_PASSWORD`, pulls X followers (`X_BEARER_TOKEN`) and Postiz published posts (`POSTIZ_API_KEY`), re-encrypts, updates `content/proof.json`, commits. Missing secret → that source is skipped; missing `LIVE_PASSWORD` → job exits without changes.
2. **Agent push after each Brain ingest** — on the agent box: `brain_metrics.py`, `pipeline_counts.py`, then `company_aggregates.py --site <checkout>`; commit `live/owner.enc.json` + `content/proof.json` (Brain, pipeline, Whop counts).
