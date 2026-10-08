# DTRT Lab website

The homepage is the DTRTC creator hub. DTRT AFTERLIGHT — the story, Volume One, training, and world — is on `afterlight.html` and the pages linked from it. Volume One was not removed.

## Add a clip

Clip cards on the homepage read `content/clips.js`. Append one object to `window.DTRT_CLIPS`:

```js
{ title: "short title", slug: "TwitchClipSlugHere" }
```

`slug` is the last part of a `https://clips.twitch.tv/SLUG` URL. Save the file and reload the homepage. There is no build step.

## Turn a social on

Header, hero, Find me, and footer all read `content/socials.js`. TikTok, Instagram, and Snapchat are commented out at the bottom of that file. Uncomment the block, fill `handle` and `url`, and reload. Ko-fi stays at `https://ko-fi.com/dtrtlab`.

The X link is `https://x.com/DTRTLab`, carried over from the previous site. A public lookup did not confirm the account, so the hub marks it unconfirmed until someone checks it.

The About paragraph is the element with `id="creator-bio"` in `index.html`.

## Read only

Open `index.html` in a browser. Catalog/news JSON still load if you serve the folder.

## Full site (forms + PayPal)

```
Start-Site.ps1
```

or `python site/server/app.py` then http://127.0.0.1:8787

## Update content without rewriting HTML

Edit:

- `content/product.json` — public game name, status, features, media kinds
- `content/releases.json` — user-facing release notes (`news.html`)
- `content/site.json` — studio copy, version, donate button id
- `content/catalog.json` — modes, rifles, music
- `content/worlds.json` — world blurbs/status
- `content/news.json` — What’s new / changelog (`news.html`)
- `content/afterlight.json` — Afterlight chapter stills and insights (`story.html`)

In-game buttons read `../data/web.json`, not this folder. Keep `preorderEnabled` here in sync with `preorder_live` there. Nav shows **Coming soon** until `preorderEnabled` is true.

## Payments

See `PAYMENTS.md`. Copy `.env.example` to `.env`. Never commit `.env`. Never put a PayPal password in the repo. Checkout stays disabled until Client ID, Secret, price, and PREORDER_ENABLED are set.

## Inbox

Contact/bug/feedback append to `site/data/*.jsonl` (gitignored).
