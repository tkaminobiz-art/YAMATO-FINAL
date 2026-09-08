# MAP favicon release record

- Verified: 2026-09-08 14:34 JST
- Source commit: `1ca1a3c5f2c5ca6608f4e278ade14d8a998df375`
- Vercel project: `yamato-land-payment-preview`
- Production deployment: `dpl_FMUf6hTT1tfzUP5V7qPKrNb4Joz9`
- Deployment URL: `https://yamato-land-payment-preview-4yhjtmv70-office-ks-projects.vercel.app`
- Public alias: `https://yamato-land-payment-preview.vercel.app`

## Published result

- Added an explicit SVG favicon declaration to the MAP/search/simulation HTML entry.
- Published the existing official Yamato favicon at `/assets/land-payment-study/favicon.svg`.
- The favicon SHA-256 is `34c10cc6f79fb4f4369a74204b72c12606d1accd7b070d28f8318aebba6e8b32`, identical to `assets/brand/favicon.svg`.
- The published HTML SHA-256 is `95e4f2a65fcba6bd18a11382ce98809ffccf66067cd494891a776f4f8d7415e6`.

## Production verification

| Route | Result |
|---|---|
| `https://yamato-land-payment-preview.vercel.app/` | HTTP 200; explicit icon link present |
| `https://yamato-land-payment-preview.vercel.app/land-payment-study.html` | HTTP 200; same HTML hash |
| `https://yamato-final.vercel.app/land-payment-study.html` | HTTP 200 through the company-site rewrite; same HTML hash |
| Dedicated favicon URL | HTTP 200; `image/svg+xml`; 246 bytes; official asset hash |
| Company-site favicon URL | HTTP 200; `image/svg+xml`; 246 bytes; official asset hash |

Fresh Chromium checks completed on the dedicated alias at PC width and the company-site route at 390 px. Search/list, map, 40-property count, property details, and the monthly-payment estimate route rendered successfully. The estimate action opened `#/estimate/...` and showed `毎月の返済額を計算する`. `TOPへ戻る` opened `https://yamato-final.vercel.app/`. Browser console errors and warnings were both zero.

## Scope guard

The previous snapshot and the new snapshot were compared. Application modules, property data, map behavior, finance logic, `noindex,nofollow`, and the disabled inquiry connection are byte-identical. The release changes only the favicon declaration, copied official favicon, versioned package pointer, and QA records.

State: `RELEASE_APPROVED` for this favicon-only production correction.
