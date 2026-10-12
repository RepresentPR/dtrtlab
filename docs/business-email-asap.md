# Business email ASAP — dtrtlab.com

**Goal:** `hello@dtrtlab.com` (and `contact@dtrtlab.com`) receiving mail today.  
**Current state (2026-10-12):** Domain on Cloudflare Free. **No MX records.** Public contact still uses `DTRTCollision@outlook.com`.

## Do this first (≈10 minutes) — Cloudflare Email Routing

Receive-only, free, works with your existing Gmail.

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com/) → **dtrtlab.com**
2. Left nav: **Email** → **Email Routing**
3. Click **Get started / Enable**
4. **Destination addresses** → add `iananthonyfc@gmail.com` → confirm the verification email in Gmail
5. **Custom addresses** → create:
   - `hello@dtrtlab.com` → `iananthonyfc@gmail.com`
   - `contact@dtrtlab.com` → `iananthonyfc@gmail.com`
6. Leave Cloudflare’s MX records as it sets them (do not point MX elsewhere)
7. Send a test from any other account to `hello@dtrtlab.com` and confirm it lands in Gmail

When that works, reply in chat: **hello@ live**

Optional cleanup: DMARC currently reports to `dmarc_rua@onsecureserver.net` (old GoDaddy residue). After routing works, change DMARC `rua` to a mailbox you control (e.g. `mailto:hello@dtrtlab.com`) or remove if unused.

## Verify from this repo

```bash
python3 scripts/check-business-email.py
```

Expect MX at `*.mx.cloudflare.net` and a non-empty routing path. The script also prints whether site.json still points at Outlook.

## Send as hello@ (same day, pick one)

Cloudflare Email Routing **receives only**. To *send* as `@dtrtlab.com`:

| Option | Cost | Speed | Notes |
| --- | --- | --- | --- |
| **A. Zoho Mail free** | Free (1 user) | ~20–40 min | Full mailbox + SMTP; good ASAP send/receive |
| **B. Google Workspace** | Paid | ~30–60 min | Best long-term with your Gmail habits |
| **C. Microsoft 365** | Paid | ~30–60 min | Fits if you want Outlook as primary |

Recommended order: finish Cloudflare receive tonight → choose A or B this week for send.

### Gmail “Send mail as” (after you have SMTP)

Gmail → Settings → Accounts → **Send mail as** → Add `hello@dtrtlab.com` using the SMTP from Zoho/Workspace/M365. Then default that address for DTRT Lab outreach.

## Site cutover (after hello@ receives)

Update `content/site.json` emails to `hello@dtrtlab.com`, then replace hardcoded Outlook addresses in contact/partners/press/legal pages (or read from `site.json`). Do **not** cut over while MX is empty — mail will bounce.

## Addresses we standardize on

| Address | Use |
| --- | --- |
| `hello@dtrtlab.com` | Public contact, free plan, partnerships |
| `contact@dtrtlab.com` | Alias → same inbox |
| Keep personal Gmail/Outlook private | Do not publish on the site |

## Owner checklist

- [ ] Cloudflare Email Routing enabled
- [ ] Destination `iananthonyfc@gmail.com` verified
- [ ] `hello@` and `contact@` routes created
- [ ] Test message received
- [ ] Tell Cursor: `hello@ live`
- [ ] Choose Zoho / Workspace / M365 for sending
- [ ] Merge site cutover PR
- [ ] Update Instagram/X/YouTube “email” fields if any
