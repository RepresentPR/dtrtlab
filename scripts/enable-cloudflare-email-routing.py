#!/usr/bin/env python3
"""Enable Cloudflare Email Routing for dtrtlab.com when CF_API_TOKEN is available.

Creates destination + routes:
  hello@dtrtlab.com  → destination (public)
  ian@dtrtlab.com    → destination (founder / CEO personal work)

Env:
  CF_API_TOKEN   required (Zone Email Routing Edit + Zone Read, or Account Email Routing)
  CF_DESTINATION optional, default iananthonyfc@gmail.com
  CF_ZONE_NAME   optional, default dtrtlab.com
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

API = "https://api.cloudflare.com/client/v4"
DOMAIN = os.environ.get("CF_ZONE_NAME", "dtrtlab.com")
DESTINATION = os.environ.get("CF_DESTINATION", "iananthonyfc@gmail.com")
LOCALS = ("hello", "ian")


def call(method: str, path: str, body: dict | None = None) -> dict:
    token = os.environ.get("CF_API_TOKEN", "").strip()
    if not token:
        raise SystemExit(
            "Missing CF_API_TOKEN. Create a Cloudflare API token with Email Routing "
            "edit on dtrtlab.com, then: export CF_API_TOKEN=...\n"
            "https://dash.cloudflare.com/profile/api-tokens"
        )
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        API + path,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "dtrtlab-email-setup/1.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            payload = json.loads(resp.read().decode())
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "ignore")
        raise SystemExit(f"Cloudflare API {method} {path} failed: {exc.code}\n{detail}") from exc
    if not payload.get("success"):
        raise SystemExit(f"Cloudflare API error: {json.dumps(payload.get('errors'), indent=2)}")
    return payload


def zone_id() -> str:
    q = urllib.parse.urlencode({"name": DOMAIN})
    rows = call("GET", f"/zones?{q}").get("result") or []
    if not rows:
        raise SystemExit(f"Zone not found for {DOMAIN}")
    return rows[0]["id"]


def ensure_destination(account_id: str) -> dict:
    existing = call("GET", f"/accounts/{account_id}/email/routing/addresses").get("result") or []
    for row in existing:
        if (row.get("email") or "").lower() == DESTINATION.lower():
            print(f"Destination exists: {DESTINATION} (verified={row.get('verified')})")
            return row
    created = call(
        "POST",
        f"/accounts/{account_id}/email/routing/addresses",
        {"email": DESTINATION},
    )["result"]
    print(f"Destination created: {DESTINATION} (verified={created.get('verified')})")
    print("Check Gmail for Cloudflare verification email if verified=false.")
    return created


def ensure_enabled(zid: str) -> None:
    settings = call("GET", f"/zones/{zid}/email/routing")["result"]
    if settings.get("enabled"):
        print("Email Routing already enabled.")
        return
    # Prefer enable endpoint when available
    try:
        call("POST", f"/zones/{zid}/email/routing/enable")
        print("Email Routing enabled.")
        return
    except SystemExit:
        call("PUT", f"/zones/{zid}/email/routing", {"enabled": True, "name": DOMAIN})
        print("Email Routing enabled via settings update.")


def ensure_rule(zid: str, local: str) -> None:
    matcher_value = f"{local}@{DOMAIN}"
    rules = call("GET", f"/zones/{zid}/email/routing/rules").get("result") or []
    for rule in rules:
        matchers = rule.get("matchers") or []
        if any(
            m.get("type") == "literal"
            and m.get("field") == "to"
            and (m.get("value") or "").lower() == matcher_value
            for m in matchers
        ):
            print(f"Rule exists: {matcher_value}")
            return
    body = {
        "name": f"DTRT {local}",
        "enabled": True,
        "matchers": [{"type": "literal", "field": "to", "value": matcher_value}],
        "actions": [{"type": "forward", "value": [DESTINATION]}],
    }
    call("POST", f"/zones/{zid}/email/routing/rules", body)
    print(f"Rule created: {matcher_value} → {DESTINATION}")


def main() -> int:
    zid = zone_id()
    zone = call("GET", f"/zones/{zid}")["result"]
    account_id = zone["account"]["id"]
    print(f"Zone {DOMAIN} id={zid} account={account_id}")
    ensure_enabled(zid)
    dest = ensure_destination(account_id)
    if not dest.get("verified"):
        print(
            "WARNING: destination not verified yet. Cloudflare will not deliver until you "
            "confirm the email. Rules are still created."
        )
    for local in LOCALS:
        ensure_rule(zid, local)
    dns = call("GET", f"/zones/{zid}/email/routing/dns").get("result")
    print("DNS/routing snapshot:")
    print(json.dumps(dns, indent=2)[:2000])
    print()
    print("Done. Next: verify destination in Gmail, then: python3 scripts/check-business-email.py")
    print("Public: hello@dtrtlab.com | Founder: ian@dtrtlab.com | Login inbox: https://mail.google.com")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
