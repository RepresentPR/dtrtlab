# DTRT Lab website

The homepage is the DTRTC creator hub. DTRT AFTERLIGHT — the story, Volume One, training, and world — is on `afterlight.html` and the pages linked from it. Volume One was not removed.

## Add a clip

Clip cards on the homepage read `content/clips.js`. Append one object to `window.DTRT_CLIPS`:

```js
{ title: "short title", slug: "TwitchClipSlugHere" }
```

`slug` is the last part of a `https://clips.twitch.tv/SLUG` URL. Save the file and reload the homepage. There is no build step. Without a thumbnail the card stays on the formalin hatch and still plays on click.

## Add a clip thumbnail

Thumbnails are static files in the repo, not hotlinked from Twitch:

- `assets/clips/SLUG.webp` — about 640 pixels wide
- `assets/clips/SLUG-320.webp` — about 320 pixels wide

Set `thumb` to the 640-wide path. The page builds the `srcset` from that path. To fetch any clip that does not have both files yet:

```
scripts/fetch-clip-thumbs
```

The script needs `ffmpeg` and Python 3. It reads `content/clips.js`, requests `og:image` from `https://clips.twitch.tv/SLUG`, and if that image is missing or is only the generic Twitch logo it uses Twitch's public clip metadata (`thumbnailURL`). It writes the two WebP files and fills in `thumb`. Clips that already have both files are left alone.

Stylesheets and scripts are loaded with `?v=20261008c` because GitHub Pages cannot set cache headers. The service worker in `sw.js` uses that same version in its cache name. HTML is network-first, so a new page still arrives. Other files are stale-while-revalidate. When you change CSS, JS, fonts, or thumbnails, bump the version in `sw.js`, `js/nav.js`, and `css/fonts.css` together with the `?v=` query on the pages.

## Turn a social on

Header, hero, Find me, and footer all read `content/socials.js`. TikTok, Instagram, and Snapchat are commented out at the bottom of that file. Uncomment the block, fill `handle` and `url`, and reload. Ko-fi stays at `https://ko-fi.com/dtrtlab`.

The X link is `https://x.com/DTRTLab`. Ian confirmed that account, so it shows with the other networks and the homepage sets `twitter:site` to `@DTRTLab`.

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
