# Five-product storefront review and rollback

Status: draft for DTRT Co-Founder positioning review. Not approved for merge or publication. Checkout stays off. Proposed retail prices are shown for review only. Landed cost, stock, image license, supplier agreements, and fulfillment are not confirmed, so nothing on this branch is an offer to sell.

Recovery guidance adopted: DTRT-OPS-2026-10-22.1. The October 22 production brief names five desk products. This proposal does not change existing service offers, `content/shop.json`, payment IDs, `/live/`, DNS, legal pages, or the production homepage.

## Review

Open `/storefront-preview.html` in a local static server rooted at the repository. It is a noindex draft catalog, not the company homepage. Four product pages are linked from the active grid: water bottle $29.99, sunset lamp $29.99, kinetic desk ball $24.99 (ages 14 and up), and flip-cube timer $24.99. The HMBMO fidget slider ($22.99) is marked coming soon and kept out of that grid because its magnets and hub logo are not verified. Every product page states US shipping in 1–3 business days with arrival in about 3–7 days, notes that the listing says about 3 days and is not reconfirmed, and states a full refund if the item is damaged or not delivered. Pages use original SVG placeholders labeled illustrative. There are no supplier photos, scripts, checkout, payment links, or signup forms. Facts are in `content/storefront-candidates.json`. `content/shop.json` stays `checkoutLive: false`.

`index.html` in this directory is an exact source snapshot of the existing production homepage at baseline commit `09bd77ed4324966ea695af4207a5c1dcbeb95b1e`. Its SHA-256 is recorded in `manifest.json`. The complete old model, including all supporting pages, remains in git at that baseline. This docs directory is excluded from public publishing by the existing `_config.yml`.

## Approval and activation

Co-Founder must approve the product direction and company positioning before merge. Publishing this review page is a separate public release; this draft PR authorizes neither. A later activation change must reconcile navigation, existing service links, canonical and social metadata, content JSON, applicable terms, sitemap and the existing positioning tests. Do not simply overwrite the homepage and abandon current customer obligations. No existing portfolio or résumé page is removed.

Product launch additionally requires verified supplier authority and stock, actual landed and fulfillment costs, QC evidence, a reconfirmed shipping window, seller/payment verification, and a successful end-to-end fulfillment check. The slider also needs its magnets and hub logo verified before it can leave coming soon. Until then checkout stays false, orders stay closed, and the prices on these pages are proposed retail only.

## Rollback

Before activation, no production rollback is needed: the production homepage is unchanged. Close this draft PR to decline the proposal.

If a future approved activation changes the homepage, restore its exact source with `git restore --source=09bd77ed4324966ea695af4207a5c1dcbeb95b1e -- index.html` in a rollback branch. Review changes since that baseline before restoring any supporting file. Alternatively copy the archived snapshot into the root `index.html` and verify its recorded hash. Use a reviewed revert of the activation commit to restore the complete activation diff; do not reset main or discard unrelated subsequent work.
