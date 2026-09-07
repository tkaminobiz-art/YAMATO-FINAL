# FV hover-only correction

Request: remove mouse-hover pause from the newly published hero. Source baseline: 4896d61. Scope: assets/top-renewal/fv-bright/fv-player.js only in the site runtime.

Preserve the approved eight-scene finite playback, explicit pause/play and scene switches, keyboard-focus/touch interaction, reduced motion, offscreen and background pause. Other section card rails retain their own hover behavior. No design, copy, source media, staff, owner-voice, or other section changes.

Validation: reproduce the old hover pause through a browser route serving the baseline player; verify video time and still-scene progression while hovering in Chromium and WebKit, explicit controls, keyboard focus, offscreen pause, reduced motion and mobile controls. Verify isolated staged build and anonymous production delivery before reporting completion.

This is an authorized narrow behavior fix, not a new visual direction or a claim of physical-iPhone QA.
