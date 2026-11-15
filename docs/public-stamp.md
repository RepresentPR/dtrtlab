# Homepage Updated stamp

GitHub Pages publishes the `main` branch. The date in the homepage stamp is the Eastern date of the newest commit that changed a file Pages would publish.

The public list is the `exclude` list in `_config.yml`, plus these skips:

- `live/owner.enc.json` and `hq/owner.enc.json`
- `content/proof.json`
- commits by the live-refresh bot (`dtrt-live-bot`)
- a diff that is only whitespace, or only the stamp line and sitemap `<lastmod>`, including a stamp change plus a blank line

`.github/workflows/public-stamp.yml` runs on every push to `main`. It recomputes the stamp and commits `index.html` only when that Eastern date changes. The commit changes the stamp line alone, so it does not move the date again.

On 2026-11-15, `main` was not branch-protected, so that push is allowed. The pull request also sets the stamp, because the branch build publishes the committed file and the Pages Actions build does not run while the source is the branch. Do not change the Pages source setting for this.

If branch protection is turned on later and the workflow push is rejected, leave the stamp set in the pull request before merge. That committed date is what the branch build shows.
