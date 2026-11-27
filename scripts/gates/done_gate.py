#!/usr/bin/env python3
"""done_gate.py - DRAFT "done means proof" gate (Slop to Gold, ops audit 2026-11-17).

rules.md s1: "Done = QA visitor-view proof ... listing what was and was NOT checked."
Today that is prose; this makes it a check. For each status file (PROGRESS.md,
AUTOPILOT-*.md, open-issues.md, QA-NOTE-*.md) every line that claims DONE / READY /
FIXED / LIVE / VERIFIED must cite at least one artifact path (.png .json .log .txt .md
.jsonl .html .srt .mp4, or a folder) that EXISTS on disk. Also flags:
  SELF-GRADED  a READY/handoff line whose latest score in the file is marked
               CONTAMINATED/POST (builder re-scored its own fixes on the same set)
  NO-NOT-CHECKED  file claims READY but never lists what was NOT checked
Read-only. Exit 1 if any NO-PROOF or SELF-GRADED. Not wired into anything.

Restored 2026-11-27 from a captured copy of /workspace/checks/gates/done_gate.py
(Slop to Gold 11/17 draft) after the 11/26 box refresh. Behavior is unchanged.
Gap vs rules.md 8.1: the refusal line tells builders to fix NO-NOT-CHECKED, but
this script still exits 0 when the only issue is NO-NOT-CHECKED (it prints the
flag; hard failures are only NO-PROOF and SELF-GRADED). That matches the
recovered source. Do not treat a PASS with a NO-NOT-CHECKED print as a clean
handoff; fix that line and re-run.
"""
import os, re, sys, glob

CLAIM = re.compile(r"\b(DONE|READY|FIXED|VERIFIED|SHIPPED|LIVE now|is live|now live)\b")
READY = re.compile(r"\bREADY\b|ready for QA|hand(ed)? (off|to QA)|final build|DONE: report", re.I)
SCORE = re.compile(r"\b\d+/\d+\b")
CONTAM = re.compile(r"CONTAMINATED|POST-held-out|\(POST|post-fix rerun", re.I)
NOTCHK = re.compile(r"not checked|NOT checked|never run|not verified", re.I)
PATH = re.compile(r"(?:/workspace/|/tmp/|[\w.-]+/)[\w./*{},@+-]*[\w*}]|[\w.-]+\.(?:png|json|jsonl|log|txt|md|html|srt|mp4|tgz|py|go)\b")

def exists(tok, base):
    tok = tok.rstrip(".,;:)")
    cands = [tok] if tok.startswith("/") else [os.path.join(base, tok), os.path.join(os.path.dirname(base), tok)]
    for c in cands:
        if "{" in c:  # expand a{b,c} -> a b, a c
            m = re.search(r"\{([^}]*)\}", c)
            if m and any(exists(c[:m.start()] + alt + c[m.end():], base) for alt in m.group(1).split(",")):
                return True
            continue
        if glob.glob(c):
            return True
    return False

def check(path):
    base = os.path.dirname(os.path.abspath(path))
    lines = open(path, encoding="utf-8", errors="replace").read().splitlines()
    issues, last_score_contam, has_notchk = [], False, False
    for i, ln in enumerate(lines, 1):
        if NOTCHK.search(ln): has_notchk = True
        if SCORE.search(ln):
            last_score_contam = bool(CONTAM.search(ln))
        if CLAIM.search(ln):
            toks = PATH.findall(ln)
            if not any(exists(t, base) for t in toks):
                issues.append(("NO-PROOF", i, ln.strip()[:110]))
        if READY.search(ln) and last_score_contam:
            issues.append(("SELF-GRADED", i, ln.strip()[:110]))
    if any(READY.search(l) for l in lines) and not has_notchk:
        issues.append(("NO-NOT-CHECKED", 0, "claims READY but lists nothing as NOT checked"))
    return issues, sum(1 for l in lines if CLAIM.search(l))

def main():
    hard = 0
    for f in sys.argv[1:]:
        iss, claims = check(f)
        h = sum(1 for k, _, _ in iss if k in ("NO-PROOF", "SELF-GRADED"))
        hard += h
        print(f"{'FAIL' if h else 'PASS'} {f}: {claims} claim lines, "
              f"{sum(k=='NO-PROOF' for k,_,_ in iss)} without proof, "
              f"{sum(k=='SELF-GRADED' for k,_,_ in iss)} self-graded, "
              f"{sum(k=='NO-NOT-CHECKED' for k,_,_ in iss)} no-not-checked")
        for k, i, t in iss[:6]:
            print(f"   {k:14} L{i}: {t}")
        if len(iss) > 6: print(f"   ... {len(iss)-6} more")
    sys.exit(1 if hard else 0)

if __name__ == "__main__":
    main()
