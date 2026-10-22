# Five-product storefront review and rollback

Status: draft for DTRT Co-Founder positioning review. Not approved for merge or publication. No product offers, supplier agreements, stock, checkout, prices or delivery promises are established by this branch.

Recovery guidance adopted: DTRT-OPS-2026-10-22.1. Owner's October 22 request authorizes a reversible five-product redesign draft. This proposal does not change existing service offers, prices, fulfillment or the production homepage.

## Review

Open `/storefront-preview.html` in a local static server rooted at the repository. It is a complete proposed homepage with five product directions and an explicit unavailable-to-order state. It has no scripts, checkout, payment links, signup forms, tracking or external dependencies. Illustrative editorial typography is used instead of unverified product photos. Candidate facts are in `content/storefront-candidates.json`.

`index.html` in this directory is an exact source snapshot of the existing production homepage at baseline commit `09bd77ed4324966ea695af4207a5c1dcbeb95b1e`. Its SHA-256 is recorded in `manifest.json`. The complete old model, including all supporting pages, remains in git at that baseline. This docs directory is excluded from public publishing by the existing `_config.yml`.

## Approval and activation

Co-Founder must approve the product direction and company positioning before merge. Publishing this review page is a separate public release; this draft PR authorizes neither. A later activation change must reconcile navigation, existing service links, canonical and social metadata, content JSON, applicable terms, sitemap and the existing positioning tests. Do not simply overwrite the homepage and abandon current customer obligations. No existing portfolio or résumé page is removed.

Product launch additionally requires verified supplier authority and stock, actual landed and fulfillment costs, QC evidence, shipping and return terms, seller/payment verification and a successful end-to-end fulfillment check. Until then checkout stays false and no prices or availability are asserted.

## Rollback

Before activation, no production rollback is needed: the production homepage is unchanged. Close this draft PR to decline the proposal.

If a future approved activation changes the homepage, restore its exact source with `git restore --source=09bd77ed4324966ea695af4207a5c1dcbeb95b1e -- index.html` in a rollback branch. Review changes since that baseline before restoring any supporting file. Alternatively copy the archived snapshot into the root `index.html` and verify its recorded hash. Use a reviewed revert of the activation commit to restore the complete activation diff; do not reset main or discard unrelated subsequent work.
