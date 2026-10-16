# Template — Evidence / status update (dated)

**Use when:** Updating `/live`, campaign notes, or a public “what changed” post.  
**Honesty:** Separate Insights windows from inventory counters. Never invent zeros.

## Prompt (copy all)

```
Draft a dated evidence update for DTRT Lab.

Rules:
- Every number needs a source, date/time (timezone), and what it does NOT mean.
- Do not compare Instagram Professional Insights period views to Reel lifetime inventory as if equal.
- If a platform was not measured, say “pending” — do not invent 0.
- Campaign composite ≠ unique people ≠ “views in the last hour.”

Inputs:
- Date of observation (with timezone): {{WHEN}}
- Metrics observed (platform → number → definition): {{METRICS}}
- What stayed the same: {{UNCHANGED}}
- Decision / next experiment (or “no winner claimed”): {{DECISION}}
- Audience: {{PUBLIC_SITE | X_POST | INTERNAL_NOTE}}

Write a short update with:
1) Dated headline
2) What we measured
3) Limits / what we are not claiming
4) Next check time

No hype. No “crushing it.”
```
