#!/usr/bin/env python3
"""copy_lint.py - copy gate for DTRTLab DRAFTS (captions, posts, page copy).

rules.md 8.4: copy_lint.py must pass on every DRAFTS file before QA, with
--ai-voice whenever a clip has an AI voice. A FAIL (exit 1) blocks the draft
from reaching Ian. Fix the copy, never the term lists.

Rebuilt 2026-11-27 and committed to the repo (scripts/gates/) so a box refresh
cannot wipe it again. The 11/17 original was lost in the 11/26 refresh; this
version follows the rules it enforced, not a byte copy of it.

The repo is public, so banned terms are stored only as truncated SHA-256
hashes, the same scheme as scripts/private-terms.test.cjs. That file's lists
(SINGLE, PAIRS, PLACE_PAIRS) are read at run time so there is one source of
truth; the extra lists below add caption-only rules (places, legal-hold
employer, family and health, gambling, "investors", engagement bait). The
fiction-file allowlist does NOT apply to drafts.

Checks per file:
  TERM        a banned word (hash match on folded, accent-stripped tokens)
  PAIR        a banned two-word phrase
  DISCLOSURE  mentions the Candles referral without the exact line
              "Referral link. We earn from fees. Trading is risky, not financial advice."
  AI-VOICE    --ai-voice given but no "AI voice" disclosure in the copy
Output names the hash and line number, never the matched word.
Exit 0 = PASS, 1 = FAIL, 2 = usage error. Read-only.
"""
import argparse, hashlib, os, re, sys, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_TERMS = os.path.join(HERE, "..", "private-terms.test.cjs")

EXTRA_SINGLE = {
    "5072f198bd5e3aab", "4f80902c333e7bd9", "383188966c792ce3", "f49c6320e08eb5ed",  # places
    "682a4851da0c4e36", "72b978cf9608f1ed", "f0cd63a491438eb0",                      # places
    "e424dce6bf0bec35",                                                              # legal hold
    "df22016bdd63f389", "927f368c571eef4c",                                          # investor claims
    "008f13c4ba9cf25d", "c4c6dfa746694877", "61fb51e57b258404", "4358ccfc6d227afb",  # gambling
    "a03ea09072d789ad", "8afe3c83decffdf6", "16ccff8bb1fe4285",                      # family, health
}
EXTRA_PAIRS = {
    "f50b92b29527bc02", "45f4e17b3f02ee1f", "211be92b4add74dc", "afeacc461eaa9436",  # places
    "43b1301526a5f924", "2696ade4f3b116d3", "abcdf9ba5ebbd320", "6e5d5d5d68599e0f",  # shop work
    "d651e202e22d5041",                                                              # gambling
    "d63dba796421ec85", "a23f6a233621bd96", "44c9c6ce50391755",                      # engagement bait
}
DISCLOSURE = "Referral link. We earn from fees. Trading is risky, not financial advice."
TEXT_EXT = (".md", ".txt", ".json", ".srt", ".vtt", ".html", ".csv", ".yml", ".yaml")


def h(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def fold(text):
    return "".join(c for c in unicodedata.normalize("NFD", str(text)) if not unicodedata.combining(c)).lower()


def tokens(text):
    return [t for t in re.split(r"[^a-z0-9]+", fold(text)) if t]


def repo_sets(path=REPO_TERMS):
    """SINGLE / PAIRS / PLACE_PAIRS hash sets from private-terms.test.cjs (empty if missing)."""
    out = {"SINGLE": set(), "PAIRS": set(), "PLACE_PAIRS": set()}
    try:
        src = open(path, encoding="utf-8").read()
    except OSError:
        return out
    for name in out:
        m = re.search(r"const %s = new Set\(\[([^\]]*)\]\)" % name, src)
        if m:
            out[name] = set(re.findall(r"'([0-9a-f]{16})'", m.group(1)))
    return out


def term_sets():
    r = repo_sets()
    return r["SINGLE"] | EXTRA_SINGLE, r["PAIRS"] | r["PLACE_PAIRS"] | EXTRA_PAIRS


def lint_text(text, ai_voice=False, sets=None):
    single, pairs = sets or term_sets()
    issues = []
    for n, line in enumerate(str(text).splitlines() or [""], 1):
        toks = tokens(line)
        for i, t in enumerate(toks):
            if h(t) in single:
                issues.append(("TERM", n, "term#" + h(t)))
            if i + 1 < len(toks) and h(t + " " + toks[i + 1]) in pairs:
                issues.append(("PAIR", n, "pair#" + h(t + " " + toks[i + 1])))
    folded = fold(text)
    if "candles" in tokens(text) and DISCLOSURE not in str(text):  # exact case and wording
        issues.append(("DISCLOSURE", 0, "Candles mentioned without the exact line: " + DISCLOSURE))
    if ai_voice and not re.search(r"\bai[- ]?(generated )?voice\b", folded):
        issues.append(("AI-VOICE", 0, "--ai-voice set but the copy has no 'AI voice' disclosure"))
    return issues


def collect(paths):
    files = []
    for p in paths:
        if os.path.isdir(p):
            for root, _dirs, names in os.walk(p):
                files += [os.path.join(root, f) for f in sorted(names) if f.lower().endswith(TEXT_EXT)]
        else:
            files.append(p)
    return files


def main(argv=None):
    ap = argparse.ArgumentParser(description="DTRTLab copy gate (rules.md 8.4)")
    ap.add_argument("paths", nargs="+", help="draft files or folders")
    ap.add_argument("--ai-voice", action="store_true", help="the clip uses an AI voice; require a disclosure")
    args = ap.parse_args(argv)
    sets = term_sets()
    if not sets[0]:
        print("FAIL: no term lists loaded", file=sys.stderr)
        return 2
    files = collect(args.paths)
    if not files:
        print("FAIL: no draft files found in " + " ".join(args.paths), file=sys.stderr)
        return 2
    bad = 0
    for f in files:
        try:
            text = open(f, encoding="utf-8", errors="replace").read()
        except OSError as exc:
            print(f"FAIL {f}: unreadable ({type(exc).__name__})")
            bad += 1
            continue
        issues = lint_text(text, args.ai_voice, sets)
        bad += bool(issues)
        print(f"{'FAIL' if issues else 'PASS'} {f}: {len(issues)} issue(s)")
        for kind, n, detail in issues[:12]:
            print(f"   {kind:10} L{n}: {detail}")
        if len(issues) > 12:
            print(f"   ... {len(issues) - 12} more")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
