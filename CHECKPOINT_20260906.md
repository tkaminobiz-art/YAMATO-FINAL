# Design review checkpoint — 2026-09-06

This checkpoint preserves the existing routes and the separate design-review pages.
It does not replace `kodawari.html` with the editorial preview or `works.html` with the yellow preview.

## Review routes

- `index-770-preview.html#builtProof`: catalog-inspired 770-home section.
- `index-material-preview.html`: material and motion iteration.
- `works-yellow-preview.html`: yellow works design.
- `kodawari-editorial-preview.html#price`: editorial redesign below the retained digital catalog.
- `lots-preview.html?view=estimate`: property-linked payment estimates.
- `move-to-nara-preview.html`: commute and access presentation.
- `v1top/`: preserved former homepage.

## Packaging and verification

`node scripts/build-checkpoint.mjs` builds an allow-listed `public/` directory in a clean checkout. Source documents, QA captures, credentials, unused artwork originals, and internal planning files are not served. Instagram credentials remain in Vercel Preview environment variables only. The server module is outside `public/`.

The checkpoint adds secret/output exclusions to `.gitignore` and repairs catalog CSS background URLs. No approved copy or layout is changed as part of packaging.

Run calculation and API unit tests with:

```
node --test qa/connections-20260905/mortgage.test.mjs qa/connections-20260905/instagram.test.mjs qa/simulation-friendly-20260905/presets.test.mjs
```

## Remaining release gates

Production integration update: the approved catalog-style 770-home section from
`index-770-preview.html` is now integrated directly into `index.html`, immediately
after the hero. The existing four quick links and four guide cards are retained.
`scripts/verify-homepage.mjs` verifies both before each build. Other design-review
pages remain separate. The existing Instagram sensitive variable now targets
both Preview and Production; its value is not copied into this repository.

- Contact form delivery is not connected.
- Latest warranty and periodic-inspection conditions require confirmation.
- A design-review URL is not a final production-release approval.
- Preview deployment must retain noindex and existing access protection.
