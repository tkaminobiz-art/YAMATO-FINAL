# Interaction verification

TECHNICAL_PASS locally; production verification follows deployment. Evidence: local-report.json and check.mjs.

Chromium at 1440, 390 and 320px; WebKit at 1440 and 390px. Checked all five galleries, first and last photos, keyboard wraparound, correct gallery title and image source, Escape/focus return, archive expansion from 8 to 20 and bath filter with 3 results. Intentional image failure and retry passed. JavaScript-disabled fallback links checked in both engines. No page errors or horizontal overflow. Header controls do not overlap.

All 62 full photos returned HTTP 200 and SHA matched the local file. HTML, JS and CSS hashes checked. TOP hash also checked to guard against unrelated changes. No inquiry submissions. Production run uses the same check script against the live domain, separately recorded.
