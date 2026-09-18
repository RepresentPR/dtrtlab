# DTRT Lab website

## Read only

Open `index.html` in a browser. Catalog/news JSON still load if you serve the folder.

## Full site (forms + PayPal)

```
Start-Site.ps1
```

or `python site/server/app.py` then http://127.0.0.1:8787

## Update content without rewriting HTML

Edit:

- `content/site.json` — product copy, version, donate button id
- `content/catalog.json` — modes, rifles, music
- `content/worlds.json` — world blurbs/status
- `content/news.json` — What’s new / changelog (`news.html`)
- `content/afterlight.json` — Afterlight chapter stills and insights (`story.html`)

In-game buttons read `../data/web.json`, not this folder. Keep `preorderEnabled` here in sync with `preorder_live` there. Nav shows **Coming soon** until `preorderEnabled` is true.

## Payments

See `PAYMENTS.md`. Copy `.env.example` to `.env`. Never commit `.env`. Never put a PayPal password in the repo. Checkout stays disabled until Client ID, Secret, price, and PREORDER_ENABLED are set.

## Inbox

Contact/bug/feedback append to `site/data/*.jsonl` (gitignored).
