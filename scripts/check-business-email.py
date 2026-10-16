#!/usr/bin/env python3
"""Check whether dtrtlab.com can receive business mail and whether the site still publishes Outlook."""
from __future__ import annotations

import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
DOMAIN = "dtrtlab.com"
EXPECTED_CF_MX = ("mx.cloudflare.net",)


def dig(name: str, rtype: str) -> list[str]:
    try:
        out = subprocess.check_output(
            ["dig", "+short", name, rtype], text=True, stderr=subprocess.DEVNULL
        )
    except (OSError, subprocess.CalledProcessError) as exc:
        print(f"dig failed: {exc}", file=sys.stderr)
        return []
    return [line.strip().rstrip(".") for line in out.splitlines() if line.strip()]


def main() -> int:
    mx = dig(DOMAIN, "MX")
    txt = dig(DOMAIN, "TXT")
    dmarc = dig(f"_dmarc.{DOMAIN}", "TXT")
    site = json.loads((ROOT / "content/site.json").read_text(encoding="utf-8"))
    contact = site.get("contactEmail", "")

    print(f"Domain: {DOMAIN}")
    print(f"MX ({len(mx)}):")
    for row in mx or ["(none)"]:
        print(f"  {row}")
    print("TXT:")
    for row in txt or ["(none)"]:
        print(f"  {row}")
    print("DMARC:")
    for row in dmarc or ["(none)"]:
        print(f"  {row}")
    print(f"site.json contactEmail: {contact}")

    mx_ok = any(any(token in row.lower() for token in EXPECTED_CF_MX) for row in mx)
    hello = contact.lower() == f"hello@{DOMAIN}"
    outlook = "outlook.com" in contact.lower()

    print()
    if not mx:
        print("STATUS: NO MX — Cloudflare Email Routing is not enabled yet.")
        print("ACTION: .github/docs/business-email-asap.md → enable Email Routing, then re-run this script.")
        return 2
    if mx_ok:
        print("STATUS: Cloudflare-style MX present.")
    else:
        print("STATUS: MX exists but not Cloudflare Email Routing — confirm the provider intentionally.")
    if outlook:
        print("SITE: Still publishing Outlook contact — wait for hello@ to receive, then cut over.")
    elif hello:
        print("SITE: Publishing hello@dtrtlab.com.")
    else:
        print(f"SITE: Publishing {contact}.")
    return 0 if mx_ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
