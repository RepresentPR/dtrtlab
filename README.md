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

## CS2 room

`cs2.html` is the community page: a crosshair that changes every four hours, the Season 5 map pool, a first smoke per active map, an eDPI check, and a public vote board.

Accounts are created in the browser. The password never leaves the device, and there is no reset. The server stores the public key, the display name, votes, and short notes.

Share the board with:

```
node tools/community-server.mjs
```

Set `DTRT_SITE_SECRET` in the environment before approving a community tab. The placeholder in `.env.example` is refused. Approval does not open user accounts. The leading tab waits 72 hours after approval, then it is added to the navigation. Allowed agents are Grok, ChatGPT, Grok bot, Cursor, and Claude. Local agents are refused, and provider keys are not uploaded.

Then open http://127.0.0.1:8787/cs2.html . A plain static server still shows the page. Votes stay on that browser until this server is running.

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
