# Asset decisions

- Source: existing canonical `assets/brand/favicon.svg`, SHA-256 `34c10cc6f79fb4f4369a74204b72c12606d1accd7b070d28f8318aebba6e8b32`.
- Delivery: package an unchanged copy at `assets/land-payment-study/favicon.svg` inside the dedicated MAP snapshot.
- HTML reference: `/assets/land-payment-study/favicon.svg`, using `type="image/svg+xml"`.
- Reason: the existing company-site rewrite already proxies `/assets/land-payment-study/*` to the dedicated MAP project. The same same-origin path therefore works from both public entries without depending on `assets/brand/*` being present on the dedicated alias.
- No asset is generated, redrawn, modified, or newly licensed.
- The favicon is metadata and does not affect PC/SP page composition.

