#!/usr/bin/env python3
"""Scheduled refresh for /hq (encrypted) and /proof (public). Runs in GitHub Actions.

Env (repo secrets; any missing one just skips that source, the last real value is kept):
  LIVE_PASSWORD     required to decrypt/re-encrypt hq/owner.enc.json (same password Ian types on /hq)
  X_BEARER_TOKEN    X API v2 bearer -> @DTRTLab followers
  POSTIZ_API_KEY    Postiz public API key -> published post count
Never invents a number: a failed fetch leaves the previous value and records the error in meta.errors.
"""
import base64, datetime as dt, json, os, secrets, urllib.request, urllib.parse
from zoneinfo import ZoneInfo
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

ET = ZoneInfo("America/New_York")
ENC, PROOF = "hq/owner.enc.json", "content/proof.json"
b64d, b64e = base64.b64decode, lambda b: base64.b64encode(b).decode()

def key(pw, salt, it):
    return PBKDF2HMAC(hashes.SHA256(), 32, salt, it).derive(pw.encode())

def decrypt(e, pw):
    return json.loads(AESGCM(key(pw, b64d(e["salt"]), e["iter"])).decrypt(b64d(e["iv"]), b64d(e["ct"]), None))

def encrypt(o, pw, it=600000):
    salt, iv = secrets.token_bytes(16), secrets.token_bytes(12)
    ct = AESGCM(key(pw, salt, it)).encrypt(iv, json.dumps(o, separators=(",", ":")).encode(), None)
    return {"v": 1, "kdf": "PBKDF2-SHA256", "iter": it, "salt": b64e(salt), "iv": b64e(iv), "ct": b64e(ct)}

def get(url, headers):
    req = urllib.request.Request(url, headers={"User-Agent": "dtrtlab-hq-refresh", **headers})
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
    posts = d.get("posts", d) if isinstance(d, dict) else d
    return sum(1 for p in posts if str(p.get("state", p.get("status", ""))).upper() == "PUBLISHED")

def main():
    pw = os.environ["LIVE_PASSWORD"]
    owner = decrypt(json.load(open(ENC)), pw)
    now = dt.datetime.now(ET)
    today = dict(owner["history"][-1]) if owner.get("history") else {}
    errors = []
    for name, fn in (("x", x_followers), ("postiz", postiz_published)):
        try:
            v = fn()
        except Exception as e:  # keep last real value
            errors.append(f"{name}: {type(e).__name__}"); continue
        if v is None: continue
        if name == "x":
            today["followers"] = {**today.get("followers", {}), "x": v}
        else:
            today["posts_published"] = v
    f = today.get("followers", {})
    known = [v for v in f.values() if isinstance(v, int)]
    today["followers_total_known"] = sum(known) if known else None
    today["followers_complete"] = bool(f) and all(isinstance(v, int) for v in f.values())
    today["date"] = now.strftime("%Y-%m-%d")
    hist = [d for d in owner.get("history", []) if d["date"] != today["date"]] + [today]
    owner["history"], owner["today"] = hist, today
    owner["meta"].update({"updated_et": now.strftime("%Y-%m-%d %H:%M ET"), "errors": errors,
                          "days_running": (now.date() - dt.date.fromisoformat(owner["meta"]["start"])).days})
    json.dump(encrypt(owner, pw), open(ENC, "w"))
    proof = json.load(open(PROOF))
    proof.update({"updated_et": owner["meta"]["updated_et"], "days_running": owner["meta"]["days_running"],
                  "posts_published": today.get("posts_published"),
                  "audience_total": today["followers_total_known"] if today["followers_complete"] else None})
    ph = [d for d in proof.get("history", []) if d["date"] != today["date"]]
    ph.append({"date": today["date"], "notes": today.get("notes"), "sources": today.get("sources"),
               "companies": today.get("companies"), "posts": today.get("posts_published")})
    proof["history"] = ph
    json.dump(proof, open(PROOF, "w"), indent=1)
    print("refreshed", owner["meta"]["updated_et"], "errors:", errors or "none")

if __name__ == "__main__":
    main()
