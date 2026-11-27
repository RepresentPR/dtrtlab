#!/usr/bin/env python3
"""Scheduled refresh for /live (encrypted owner dashboard) and /proof (public). Runs in GitHub Actions.

Env (repo secrets):
  LIVE_PASSWORD     required to decrypt/re-encrypt live/owner.enc.json (same password Ian types on /live)
  X_BEARER_TOKEN    X API v2 bearer -> @DTRTLab followers
  POSTIZ_API_KEY    Postiz public API key -> published post count
Never invents a number. Any X failure is optional: a blank or rejected
token, HTTP error, timeout, connection error, or bad JSON is recorded as
unavailable. The X count stays unknown (null, never zero), an older audience
total is not left beside the new stamp, and Postiz still refreshes. A skipped
or failed required source writes nothing: the stamp, numbers and history stay.
The log names the error type only (plus, for a required source, the HTTP status code for HTTP
errors, never the response body or any header).
A required source (Postiz) that is missing, rejected, rate limited or broken
fails the run with exit code 1 and a ::error:: line that says what to fix, so
the Actions run turns red instead of passing with stale data (11/22 incident:
every run logged "postiz: HTTPError" and still went green for 5 days).
TODO(fix-2): a public "auto-update paused" line needs Ian's approval of the
exact wording. Do not add that sentence to a page.
"""
import base64, datetime as dt, json, os, secrets, sys, urllib.error, urllib.request, urllib.parse
from zoneinfo import ZoneInfo

ET = ZoneInfo("America/New_York")
ENC, PROOF = "live/owner.enc.json", "content/proof.json"
b64d, b64e = base64.b64decode, lambda b: base64.b64encode(b).decode()

def key(pw, salt, it):
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    from cryptography.hazmat.primitives import hashes
    return PBKDF2HMAC(hashes.SHA256(), 32, salt, it).derive(pw.encode())

def decrypt(e, pw):
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    return json.loads(AESGCM(key(pw, b64d(e["salt"]), e["iter"])).decrypt(b64d(e["iv"]), b64d(e["ct"]), None))

def encrypt(o, pw, it=600000):
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    salt, iv = secrets.token_bytes(16), secrets.token_bytes(12)
    ct = AESGCM(key(pw, salt, it)).encrypt(iv, json.dumps(o, separators=(",", ":")).encode(), None)
    return {"v": 1, "kdf": "PBKDF2-SHA256", "iter": it, "salt": b64e(salt), "iv": b64e(iv), "ct": b64e(ct)}

def get(url, headers):
    req = urllib.request.Request(url, headers={"User-Agent": "dtrtlab-live-refresh", **headers})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)

def x_followers():
    """Follower count, or None when the token is missing or rejected.

    None means unavailable. It is not a measured zero. A 401 or 403 returns
    None without reading the body. Every other failure raises. The caller
    treats that raise like a blank token and logs only the exception type.
    """
    token = (os.environ.get("X_BEARER_TOKEN") or "").strip()
    if not token:
        return None
    try:
        data = get("https://api.x.com/2/users/by/username/DTRTLab?user.fields=public_metrics",
                   {"Authorization": "Bearer " + token})
    except urllib.error.HTTPError as exc:
        if exc.code in (401, 403):
            return None
        raise
    return int(data["data"]["public_metrics"]["followers_count"])

def postiz_published():
    k = os.environ.get("POSTIZ_API_KEY")
    if not k: return None
    q = urllib.parse.urlencode({"startDate": "2025-01-01T00:00:00.000Z",
                                "endDate": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")})
    d = get("https://api.postiz.com/public/v1/posts?" + q, {"Authorization": k})
    posts = d.get("posts") if isinstance(d, dict) else d
    if not isinstance(posts, list):
        raise ValueError("postiz reply has no posts list")
    return sum(1 for p in posts if str(p.get("state", p.get("status", ""))).upper() == "PUBLISHED")

# X may be absent or fail. A required source that skips or raises still blocks the write.
OPTIONAL = {"x"}

def describe(exc):
    """Short, secret-free label for a failure: type name, plus status code for HTTP errors."""
    if isinstance(exc, urllib.error.HTTPError):
        return f"{type(exc).__name__} {exc.code}"
    return type(exc).__name__

# What to do about each failure, printed with the ::error:: line. No secret values.
HINTS = {
    "postiz: skipped": "POSTIZ_API_KEY is empty or missing. Copy the key from Postiz > Settings > Public API "
                       "and set it at GitHub > RepresentPR/dtrtlab > Settings > Secrets and variables > Actions.",
    "postiz: HTTPError 401": "Postiz rejected POSTIZ_API_KEY: the key was regenerated or revoked. "
                             "Copy the current key from Postiz > Settings > Public API and update it at GitHub > RepresentPR/dtrtlab > Settings > Secrets and variables > Actions.",
    "postiz: HTTPError 403": "Postiz refused POSTIZ_API_KEY (403). Check the Postiz plan/workspace, then update POSTIZ_API_KEY at GitHub > RepresentPR/dtrtlab > Settings > Secrets and variables > Actions.",
    "postiz: HTTPError 429": "Postiz rate limit hit (30 requests/hour per key). Something else is sharing this key; "
                             "the next scheduled run will retry.",
}

def hint(error):
    if error in HINTS:
        return HINTS[error]
    if error.startswith("postiz: HTTPError 5"):
        return "Postiz server error. The next scheduled run will retry; if it persists, check status.postiz.com."
    if error.startswith("postiz: HTTPError 404"):
        return "Postiz API path changed. Compare https://docs.postiz.com/public-api/posts/list with postiz_published()."
    return "See scripts/live-refresh.py postiz_published()."

def refresh_owner(owner, now, sources):
    """Apply source callables.

    None or any exception from X records X unavailable and leaves its count
    unknown (null, never zero). Postiz still commits. The stored detail is the
    exception type name only. None or an exception from a required source
    changes only meta.errors: history, today and the stamp stay.
    """
    history = list(owner.get("history") or [])
    today = dict(history[-1]) if history else {}
    if isinstance(today.get("followers"), dict):
        today["followers"] = dict(today["followers"])
    errors, unavailable, values, detail = [], [], {}, {}
    for name, fn in sources:
        try:
            value = fn()
        except Exception as exc:
            if name in OPTIONAL:
                unavailable.append(name)
                detail[name] = type(exc).__name__
                continue
            errors.append(f"{name}: {describe(exc)}")
            continue
        if value is None and name in OPTIONAL:
            unavailable.append(name)
            continue
        if value is None:
            errors.append(f"{name}: skipped")
            continue
        values[name] = value
    meta = owner.setdefault("meta", {})
    if errors:
        meta["errors"] = errors
        return errors
    followers = dict(today.get("followers") or {})
    if "x" in values:
        followers["x"] = values["x"]
    elif "x" in unavailable:
        followers["x"] = None
    today["followers"] = followers
    if "postiz" in values:
        today["posts_published"] = values["postiz"]
    known = [v for v in followers.values() if isinstance(v, int)]
    today["followers_total_known"] = sum(known) if known else None
    today["followers_complete"] = bool(followers) and all(isinstance(v, int) for v in followers.values())
    today["date"] = now.strftime("%Y-%m-%d")
    history = [row for row in history if row.get("date") != today["date"]] + [today]
    owner["history"], owner["today"] = history, today
    meta["errors"] = []
    meta["source_status"] = {
        name: ("unavailable" if name in unavailable else "ok")
        for name, _fn in sources
        if name in unavailable or name in values
    }
    if detail:
        meta["source_detail"] = detail
    meta["days_running"] = (now.date() - dt.date.fromisoformat(meta["start"])).days
    meta["updated_et"] = now.strftime("%Y-%m-%d %H:%M ET")
    return errors

def refresh_proof(proof, owner, fresh):
    if not fresh:
        return
    today = owner.get("today", {})
    proof["days_running"] = owner["meta"]["days_running"]
    proof["posts_published"] = today.get("posts_published")
    proof["audience_total"] = today["followers_total_known"] if today.get("followers_complete") else None
    proof["updated_et"] = owner["meta"]["updated_et"]
    ph = [row for row in proof.get("history", []) if row.get("date") != today["date"]]
    ph.append({"date": today["date"], "notes": today.get("notes"), "sources": today.get("sources"),
               "companies": today.get("companies"), "posts": today.get("posts_published")})
    proof["history"] = ph

def main():
    pw = os.environ["LIVE_PASSWORD"]
    with open(ENC) as handle:
        owner = decrypt(json.load(handle), pw)
    now = dt.datetime.now(ET)
    errors = refresh_owner(owner, now, (("x", x_followers), ("postiz", postiz_published)))
    stamp = owner["meta"].get("updated_et")
    if errors:
        # Do not re-encrypt. A new salt would make a "refresh" commit with nothing refreshed.
        # Fail loudly: a red run is the signal. The stored files stay on the last complete refresh.
        for e in errors:
            print(f"::error title=live-refresh failed::{e}. {hint(e)} Saved stamp is still {stamp}.")
        print("unchanged", stamp, "errors:", errors)
        sys.exit(1)
    with open(ENC, "w") as handle:
        json.dump(encrypt(owner, pw), handle)
    if not os.path.exists(PROOF):
        print("refreshed", stamp, "(no proof.json yet)", "errors: none"); return
    with open(PROOF) as handle:
        proof = json.load(handle)
    refresh_proof(proof, owner, True)
    with open(PROOF, "w") as handle:
        json.dump(proof, handle, indent=1)
    status = owner["meta"].get("source_status") or {}
    note = ""
    if status.get("x") == "unavailable":
        kind = (owner["meta"].get("source_detail") or {}).get("x")
        note = " x: unavailable" + ((" " + kind) if kind else "")
    print("refreshed", stamp, "errors: none" + note)

if __name__ == "__main__":
    main()
