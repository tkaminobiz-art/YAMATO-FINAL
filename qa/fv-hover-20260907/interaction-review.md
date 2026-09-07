# Focused interaction verification

Local browser evidence: local-report.json, 15 passed checks across Chromium and WebKit, no page errors.

Both engines reproduce baseline 4896d61 pausing video on mouse entry despite autoplay remaining enabled. With the fix, video time advances by about 0.7 seconds over a 0.7-second hover sample; playback then advances through video, scene 03 and scene 04 while the pointer remains inside the hero. Chromium additionally completes the unchanged finite sequence at scene 08 and restarts through the explicit play button.

Both engines preserve explicit pause/resume while the mouse remains over the button, manual scene changes, keyboard focus pause, offscreen pause/return resume, 390px touch controls, correct mobile video, and reduced-motion static/manual operation with zero MP4 requests. Existing labels track deliberate playback state. Hidden-tab, visibility event listeners, touch/swipe implementation and non-hero rails are unchanged by source diff.

Checks of index.html, hero CSS and approved image/video hashes against 4896d61 pass. Homepage and bright-hero source invariants pass. Live verification is a separate post-push check, recorded in production-report.json when completed.
