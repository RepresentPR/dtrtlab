#!/usr/bin/env python3
"""Scheduled refresh for /live (encrypted owner dashboard) and /proof (public). Runs in GitHub Actions.

Env (repo secrets):
  LIVE_PASSWORD     required to decrypt/re-encrypt live/owner.enc.json (same password Ian types on /live)
  X_BEARER_TOKEN    X API v2 bearer -> @DTRTLab followers
  POSTIZ_API_KEY    Postiz public API key -> published post count
Never invents a number: a failed or skipped fetch leaves the previous value.
updated_et moves only when every source returns a real value. A partial run
sets meta.errors, prints a ::warning::, and writes nothing, so the old stamp,
numbers and history stay.
"""
import base64, datetime as dt, json, os, secrets, urllib.request, urllib.parse
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
    t = os.environ.get("X_BEARER_TOKEN")
    if not t: return None
    d = get("https://api.x.com/2/users/by/username/DTRTLab?user.fields=public_metrics", {"Authorization": "Bearer " + t})
    return int(d["data"]["public_metrics"]["followers_count"])

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

def refresh_owner(owner, now, sources):
    """Apply source callables. None is a skip. An exception is a failure.
    On any skip or failure the only change is meta.errors: history, today and the stamp stay.
    updated_et advances only when every source returns a real value.
    """
    history = list(owner.get("history") or [])
    today = dict(history[-1]) if history else {}
    if isinstance(today.get("followers"), dict):
        today["followers"] = dict(today["followers"])
    errors = []
    for name, fn in sources:
        try:
            value = fn()
        except Exception as exc:
            errors.append(f"{name}: {type(exc).__name__}")
            continue
        if value is None:
            errors.append(f"{name}: skipped")
            continue
        if name == "x":
            today["followers"] = {**today.get("followers", {}), "x": value}
        else:
            today["posts_published"] = value
    meta = owner.setdefault("meta", {})
    if errors:
        meta["errors"] = errors
        return errors
    followers = today.get("followers", {})
    known = [v for v in followers.values() if isinstance(v, int)]
    today["followers_total_known"] = sum(known) if known else None
    today["followers_complete"] = bool(followers) and all(isinstance(v, int) for v in followers.values())
    today["date"] = now.strftime("%Y-%m-%d")
    history = [row for row in history if row.get("date") != today["date"]] + [today]
    owner["history"], owner["today"] = history, today
    meta["errors"] = errors
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
        # The warning is the visible signal; the stored files stay on the last complete refresh.
        print("::warning::live refresh left the saved stamp unchanged (" + "; ".join(errors) + ")")
        print("unchanged", stamp, "errors:", errors)
        return
    with open(ENC, "w") as handle:
        json.dump(encrypt(owner, pw), handle)
    if not os.path.exists(PROOF):
        print("refreshed", stamp, "(no proof.json yet)", "errors: none"); return
    with open(PROOF) as handle:
        proof = json.load(handle)
    refresh_proof(proof, owner, True)
    with open(PROOF, "w") as handle:
        json.dump(proof, handle, indent=1)
    print("refreshed", stamp, "errors: none")

if __name__ == "__main__":
    main()
