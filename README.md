# DTRT Lab website

Public site for **[dtrtlab.com](https://dtrtlab.com)** — Ian Ferraro’s independent studio.

**Company face:** make useful stuff, show dated evidence, Made for all.  
**Entertainment face:** DTRTC (stream/clips) and **DTRT AFTERLIGHT** (story world; game in development). Same founder, different surfaces — see `docs/vision.md`.

## What this repo is

| Path | Job |
| --- | --- |
| `/` + free plan tool | Usefulness — send a link + goal, get a practical plan |
| `/company.html`, `/shop.html` | Company story + shop **interest** (checkout off until real) |
| `/live/`, `/history.html` | Dated evidence — no vanity metrics without context |
| `/afterlight.html`, `/clips/` | Entertainment / story / clips — honest status |
| `docs/vision.md` | Decision filter for every change |

Do **not** claim a live store, open raise, hiring pipeline, Fortune rank, or reverse-engineered third-party games.

## Vision & ops docs

- Vision filter: [`docs/vision.md`](docs/vision.md)
- Operating system: [`docs/company-operating-system.md`](docs/company-operating-system.md)
- Brand: [`docs/brand-playbook.md`](docs/brand-playbook.md)
- GitHub alignment audit: [`docs/github-vision-alignment-audit.md`](docs/github-vision-alignment-audit.md)

## Local

Open `index.html` in a browser, or:

```bash
# full site (forms)
python site/server/app.py   # http://127.0.0.1:8787
```

Content without rewriting HTML: `content/*.json`, `content/socials.js`, `content/clips.js`.

## Payments & inbox

See `PAYMENTS.md`. Checkout stays disabled until Client ID, Secret, price, and flags are real. Never commit `.env`.

Contact/bug/feedback append to `site/data/*.jsonl` (gitignored).

## Related private craft

FPS / production foundation lives in the private **DTRTCore** repo (Unreal 5.8, original assets, no old-game dependencies). That work feeds AFTERLIGHT entertainment — it is not the company homepage job.
