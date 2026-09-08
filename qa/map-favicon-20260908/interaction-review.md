# Interaction review

- Reviewer: Codex creator self-review
- Package: `node scripts/package-land-payment.mjs`, 25 manifest-verified files
- Local origin: `http://127.0.0.1:4195`

## Checked entrances

- `/#/search`: PC map entrance loads 40 properties; console 0 errors / 0 warnings.
- `/land-payment-study.html#/search?view=list`: SP list entrance loads 40 properties; console 0 errors / 0 warnings.
- `/land-payment-study.html#/estimate`: PC estimate entrance opens “毎月の返済額を計算する”; console 0 errors / 0 warnings.

## Preserved behavior

- TOP return remains `https://yamato-final.vercel.app/`.
- Search, map/list switch, sorting including school distance, and estimate navigation remain available.
- Existing data, finance modules, API contract, map controller, styles, and view modules are byte-identical to `land-payment-20260908-pc`.
- Only the HTML favicon declaration, the exact copied SVG, snapshot records, and package default changed.

Production checks for both the dedicated alias and company-site rewrite are performed after deployment.

