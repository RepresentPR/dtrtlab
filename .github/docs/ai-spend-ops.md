# AI spend ops — one chat, one agent, two wallets

**Last reviewed:** 2026-10-13  
**Owner:** Ian Ferraro (budget) · Agent (execution under vision)  
**Filter:** `.github/docs/vision.md` — useful, honest, no trust-burning growth hacks.

---

## What you asked for

1. **One chat box** to run the Lab.  
2. **One agent** that executes the whole operation.  
3. **Stop uncontrolled usage spend.**  
4. **Separate experiments from company AI.**

That is the right architecture. Do **not** chase “swap endpoint, 50% off” ads as the company backbone.

---

## Verdict on the Cheaper Inference–style ad

| Claim | Reality for DTRT |
| --- | --- |
| “Swap API URL, same requests” | Real pattern — many gateways do this |
| Massive secret discounts forever | Marketing; young aggregators vary wildly |
| Put company work through a brand-new wallet proxy | **No** — code, email, recovery paths, Postiz, customer data |

**cheaperinference.com:** young domain, mixed trust scores, similar “cheap unlimited” proxies get Reddit reports of throttling / unstable quality. Fine as a **tiny experiment wallet** later if you want to poke it — **never** the company ops path.

**Same idea, established:** [OpenRouter](https://openrouter.ai) (one OpenAI-compatible key, many models, credit wallet, activity log). Direct cheap hosts when you only need one model: **DeepSeek**, **Groq**, **Fireworks**, **Together**.

---

## Target shape (keep it dumb)

```
┌─────────────────────────────────────────────┐
│  COMPANY (only this runs the Lab)           │
│  Chat: Cursor                               │
│  Agent: one Cloud Agent on RepresentPR/dtrtlab │
│  Social publish: Postiz (connected accounts)│
│  Rule: agent 1st chair · Ian unlock only    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  EXPERIMENTS (separate money + keys)        │
│  OpenRouter (or similar) with HARD cap      │
│  Optional: local / free tiers               │
│  Never: hello@, recovery codes, Postiz keys │
└─────────────────────────────────────────────┘
```

**One chat + one agent** already matches how we operate. Spending blows up when:

- Many parallel Cloud Agents / chats do the same work  
- Expensive models for every turn  
- AI video / VO / image credits on every draft (Postiz)  
- Experiment keys mixed into company tools  

---

## Company wallet (preserve this)

| Surface | Use for | Cap habit |
| --- | --- | --- |
| **Cursor Cloud Agent** | Ship site, merge PRs, Postiz schedule, docs, ops | Prefer **one** active Lab agent; close idle runs |
| **Cursor models** | Default / Auto for routine; escalate model only when stuck | Don’t burn frontier on copy edits |
| **Postiz** | Scheduled Lab / DTRTC posts | Reuse VO; don’t regenerate every wave |
| **Gmail / Outlook MCP** | Notify Ian, drafts | No extra AI product needed |

Do **not** route Cursor Cloud Agents through a random third-party inference proxy. Cursor is the product; swapping its guts is not a supported company play.

---

## Experiment wallet (play here)

| Surface | Use for | Cap habit |
| --- | --- | --- |
| **OpenRouter** | Try cheap models, scripts, toys | Buy small credits ($10–20); stop when empty |
| **DeepSeek / Groq direct** | One model, lowest friction | Monthly budget note in phone calendar |
| **Local** (optional later) | Offline toys if hardware allows | Zero cloud burn |
| **cheaperinference-class** | Only if curiosity remains | Max $5–10; never company secrets |

**Hard rule:** Experiment keys never touch `secrets/`, Cloudflare, Postiz, Gmail send, or customer plan emails.

---

## How to cut the bill this week (Ian unlocks)

1. **Kill parallel agents** — one Lab agent at a time unless a true parallel job.  
2. **Close idle Cloud Agent runs** in the dashboard.  
3. **Default model down** for routine site/docs work; escalate only when needed.  
4. **Postiz:** keep scheduled quality waves; delete DRAFT duplicates; don’t regenerate ElevenLabs VO “just to try.”  
5. **OpenRouter (optional):** create account → buy small credits → label key `DTRT-EXPERIMENT` → never paste into company agent env.  
6. **Weekly check:** Cursor usage + Postiz credits + any API wallets — three numbers, five minutes.

---

## “Doesn’t rely on usage” — honest answer

True **unlimited** company AI does not exist at useful quality without either:

- a **subscription seat** (Cursor) with fair-use limits, or  
- **self-hosted** GPUs (not ready for DTRT as the company path today).

What you *can* do: **predictable seats + hard experiment caps**, so experiments cannot drain the company seat.

| Myth | Better |
| --- | --- |
| Unlimited proxy = free forever | Throttles / quality cliffs / young-company risk |
| Ten free trials = growth | Out of vision (trust burn) |
| One cheap endpoint for Cursor + Postiz + email | Wrong layer — those are products, not raw chat APIs |

---

## Decision filter (before buying any AI tool)

1. Does it make Lab work **more useful** or AFTERLIGHT **more real**?  
2. Can we **cap spend** without a surprise bill?  
3. Does it stay out of **customer / secret** paths if it fails?  
4. Would we be proud if a journalist saw the vendor tomorrow?

If “no” → experiment wallet only, or skip.

---

## Related

- Authority: `.github/docs/company-operating-system.md`  
- Vision: `.github/docs/vision.md`  
- Pipeline: `.github/docs/unfinished-work-pipeline.md`  
- Templates: `.github/docs/templates/`
