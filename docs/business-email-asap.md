# Business email ASAP — dtrtlab.com

**Goal:** `hello@dtrtlab.com` (and `ian@dtrtlab.com`) receiving mail.  
**Current state (2026-10-13):** Cloudflare Email Routing **live**. MX at `*.mx.cloudflare.net`. Active routing rules:

- `hello@dtrtlab.com` → routing destination
- `ian@dtrtlab.com` → routing destination

Site public contact cut over to `hello@dtrtlab.com`.

## Login portal

Open the routing destination (address kept out of this public repo). Both `@dtrtlab.com` addresses land there.

## Verify from this repo

```bash
python3 scripts/check-business-email.py
```

Expect MX at `*.mx.cloudflare.net` and `site.json contactEmail: hello@dtrtlab.com`.

### Agent path (re-run / recovery — needs API token)

```bash
export CF_API_TOKEN='your-token'
export CF_DESTINATION='<private destination inbox>'   # required; never commit the real address
python3 scripts/enable-cloudflare-email-routing.py
python3 scripts/check-business-email.py
```

Token needs: Account Email Routing Addresses Edit, Zone Email Routing Rules Edit, Zone Read, resource = `dtrtlab.com`.

Optional cleanup: DMARC currently reports to `dmarc_rua@onsecureserver.net` (old GoDaddy residue). Change DMARC `rua` to `mailto:hello@dtrtlab.com` or remove if unused.

## Send as hello@ (pick one)

Cloudflare Email Routing **receives only**. To *send* as `@dtrtlab.com`:

| Option | Cost | Speed | Notes |
| --- | --- | --- | --- |
| **A. Zoho Mail free** | Free (1 user) | ~20–40 min | Full mailbox + SMTP; good ASAP send/receive |
| **B. Google Workspace** | Paid | ~30–60 min | Best long-term with your Gmail habits |
| **C. Microsoft 365** | Paid | ~30–60 min | Fits if you want Outlook as primary |

Recommended: receive is already live → choose A or B for send.

### Gmail “Send mail as” (after you have SMTP)

Gmail → Settings → Accounts → **Send mail as** → Add `hello@dtrtlab.com` using the SMTP from Zoho/Workspace/M365. Then default that address for DTRT Lab outreach.

## Addresses we standardize on

| Address | Use |
| --- | --- |
| `hello@dtrtlab.com` | Public company inbox (site, free plan, press) |
| `ian@dtrtlab.com` | Company address |
| `contact@dtrtlab.com` | Optional alias → same destination |
| Backend destination | Keep out of this repo |

## Owner checklist

- [x] Cloudflare Email Routing enabled
- [x] Destination inbox verified
- [x] `hello@` and `ian@` routing rules Active
- [ ] Confirm a test message lands in Gmail inbox (check Spam too)
- [ ] Choose Zoho / Workspace / M365 for sending
- [ ] Merge site cutover PR
- [ ] Update Instagram/X/YouTube “email” fields if any
- [ ] Optional: change DMARC `rua` from `dmarc_rua@onsecureserver.net` to `mailto:hello@dtrtlab.com`
