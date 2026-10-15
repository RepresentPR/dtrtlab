# /hq — private owner dashboard (company growth)

- Page: `hq/index.html` + `hq/hq.js` + `hq/hq.css`. `noindex`, not linked from any page.
- Data: `hq/owner.enc.json` = AES-256-GCM ciphertext (PBKDF2-SHA256, 600,000 iterations). The browser decrypts it with the HQ password (WebCrypto). The plaintext never enters this repo.
- Hosting note: dtrtlab.com is GitHub Pages (no server-side auth). Protection here is encryption, not access control: anyone can download the ciphertext, nobody can read it without the password.
- Content: aggregate counts only (followers, posts, leads, Whop order/member counts, Brain counts). No names, notes, customers, Caliber data, emails or credentials. Missing sources = `null` → "not connected yet".
- Refresh: built on the agent box by `company_aggregates.py --site <checkout>` (after `brain_metrics.py`), then committed. See the PR description for the schedule.
