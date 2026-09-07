# Verification

Local browser checks passed in Chromium and WebKit at 1440 and 390 px: counter waits offscreen, produces intermediate values, never exceeds 770, ends at 770, does not restart after re-entry, retains fixed accessible label and has stable width. Reduced-motion and JavaScript-disabled contexts show 770 immediately. No page errors or horizontal overflow. Nara approved wording is unchanged.

Separate deterministic VM checks passed for document hiding, resize and switching to reduced motion during playback: each settles at 770 and clears reserved width. These are simulated lifecycle tests, not physical-device events.

The existing homepage verifier initially required the literal attribute-free strong tag. Updated that assertion to permit attributes while still requiring literal 770; all seven negative self-tests remain effective. Homepage and bright-FV verifiers and JavaScript syntax checks pass. No media or existing player scripts changed. No real inquiries sent.

TECHNICAL_PASS local. User release authorization: explicit request for immediate production publication. Live delivery is recorded separately after deployment.
