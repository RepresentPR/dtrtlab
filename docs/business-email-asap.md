# Business email ASAP — dtrtlab.com

<<<<<<< HEAD
**Goal:** `hello@dtrtlab.com` (and `ian@dtrtlab.com`) receiving mail.  
**Current state (2026-10-13):** Cloudflare Email Routing **live**. MX at `*.mx.cloudflare.net`. Active routing rules:

- `hello@dtrtlab.com` → `iananthonyfc@gmail.com` (public company)
- `ian@dtrtlab.com` → `iananthonyfc@gmail.com` (founder / CEO personal work)

Site public contact cut over to `hello@dtrtlab.com`.

## Login portal

Open [mail.google.com](https://mail.google.com) as `iananthonyfc@gmail.com`. Both `@dtrtlab.com` addresses land in that inbox.
=======
**Goal:** `hello@dtrtlab.com` (and `contact@dtrtlab.com`) receiving mail today.  
**Current state (2026-10-12):** Domain on Cloudflare Free. **No MX records.** Public contact still uses `DTRTCollision@outlook.com`.

## Do this first (≈10 minutes) — Cloudflare Email Routing

Receive-only, free, works with your existing Gmail.

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com/) → **dtrtlab.com**
2. Left nav: **Email** → **Email Routing**
3. Click **Get started / Enable**
4. **Destination addresses** → add `iananthonyfc@gmail.com` → confirm the verification email in Gmail
5. **Custom addresses** → create:
   - `hello@dtrtlab.com` → `iananthonyfc@gmail.com` (public company)
   - `ian@dtrtlab.com` → `iananthonyfc@gmail.com` (founder / CEO personal work)
   - optional alias: `contact@dtrtlab.com` → same Gmail
6. Leave Cloudflare’s MX records as it sets them (do not point MX elsewhere)
7. Send a test from any other account to `hello@dtrtlab.com` and `ian@dtrtlab.com` and confirm both land in Gmail

When that works, reply in chat: **hello@ live**

### Agent path (if you paste an API token)

```bash
export CF_API_TOKEN='your-token'
export CF_DESTINATION='iananthonyfc@gmail.com'   # optional
python3 scripts/enable-cloudflare-email-routing.py
python3 scripts/check-business-email.py
```

Token needs: Account Email Routing Addresses Edit, Zone Email Routing Rules Edit, Zone Read, resource = `dtrtlab.com`.

Optional cleanup: DMARC currently reports to `dmarc_rua@onsecureserver.net` (old GoDaddy residue). After routing works, change DMARC `rua` to a mailbox you control (e.g. `mailto:hello@dtrtlab.com`) or remove if unused.
>>>>>>> origin/main

## Verify from this repo

```bash
python3 scripts/check-business-email.py
```

<<<<<<< HEAD
Expect MX at `*.mx.cloudflare.net` and `site.json contactEmail: hello@dtrtlab.com`.

## Send as hello@ (pick one)
=======
Expect MX at `*.mx.cloudflare.net` and a non-empty routing path. The script also prints whether site.json still points at Outlook.

## Send as hello@ (same day, pick one)
>>>>>>> origin/main

Cloudflare Email Routing **receives only**. To *send* as `@dtrtlab.com`:

| Option | Cost | Speed | Notes |
| --- | --- | --- | --- |
| **A. Zoho Mail free** | Free (1 user) | ~20–40 min | Full mailbox + SMTP; good ASAP send/receive |
| **B. Google Workspace** | Paid | ~30–60 min | Best long-term with your Gmail habits |
| **C. Microsoft 365** | Paid | ~30–60 min | Fits if you want Outlook as primary |

<<<<<<< HEAD
=======
Recommended order: finish Cloudflare receive tonight → choose A or B this week for send.

>>>>>>> origin/main
### Gmail “Send mail as” (after you have SMTP)

Gmail → Settings → Accounts → **Send mail as** → Add `hello@dtrtlab.com` using the SMTP from Zoho/Workspace/M365. Then default that address for DTRT Lab outreach.

<<<<<<< HEAD
=======
## Site cutover (after hello@ receives)

Update `content/site.json` emails to `hello@dtrtlab.com`, then replace hardcoded Outlook addresses in contact/partners/press/legal pages (or read from `site.json`). Do **not** cut over while MX is empty — mail will bounce.

>>>>>>> origin/main
## Addresses we standardize on

| Address | Use |
| --- | --- |
| `hello@dtrtlab.com` | Public company inbox (site, free plan, press) |
| `ian@dtrtlab.com` | Founder/CEO personal work email (modern CEO pattern: first-name@company) |
| `contact@dtrtlab.com` | Optional alias → same Gmail |
| Keep `iananthonyfc@gmail.com` / Outlook private | Backend destination only; do not publish |

<<<<<<< HEAD
## Owner checklist

- [x] Cloudflare Email Routing enabled
- [x] Destination `iananthonyfc@gmail.com` verified
- [x] `hello@` and `ian@` routing rules Active
- [ ] Confirm a test message lands in Gmail inbox (check Spam too)
- [ ] Choose Zoho / Workspace / M365 for sending
- [ ] Merge site cutover PR
- [ ] Update Instagram/X/YouTube “email” fields if any
- [ ] Optional: change DMARC `rua` from `dmarc_rua@onsecureserver.net` to `mailto:hello@dtrtlab.com`
=======
**Login portal after routing is live:** [mail.google.com](https://mail.google.com) — both addresses forward into that inbox.

## Owner checklist

- [ ] Cloudflare Email Routing enabled
- [ ] Destination `iananthonyfc@gmail.com` verified
- [ ] `hello@` and `contact@` routes created
- [ ] Test message received
- [ ] Tell Cursor: `hello@ live`
- [ ] Choose Zoho / Workspace / M365 for sending
- [ ] Merge site cutover PR
- [ ] Update Instagram/X/YouTube “email” fields if any
>>>>>>> origin/main
