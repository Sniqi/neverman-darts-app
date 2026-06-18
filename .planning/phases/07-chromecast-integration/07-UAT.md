---
status: partial
phase: 07-chromecast-integration
source: [07-VERIFICATION.md]
started: 2026-06-18T22:25:00Z
updated: 2026-06-18T21:46:17Z
---

## Current Test

[testing paused — Cast Console test-device registration incomplete. Complete CAST-SETUP.md Steps 4–5 (register Chromecast serial → reboot → ~15-min propagation → status "Ready for Testing"), then re-run /gsd-verify-work 7]

## Tests

### 1. Cast button connects to a real device (CAST-01)
expected: On /match (Chrome, same LAN as the registered Chromecast), the Cast control is visible; tapping it lists the device; selecting it starts a session and the TV shows the live scoreboard within seconds, tablet stays on the scoring view.
result: blocked
blocked_by: third-party
reason: |
  Symptom 1 (RESOLVED, verified on-device): "Ich sehe Cast nirgendswo" — stale build, App ID
  not inlined. Fixed via redeploy (GitHub Pages run 27790034025); the Cast control now appears
  on /match and opens the native device picker. Confirmed by the user.
  Symptom 2 (BLOCKER): The device picker lists only audio cast devices (Stereo, HT-CT790
  soundbar, SRS-HG1 speaker); the video Chromecast does NOT appear. The Chromecast IS
  discoverable (casts fine from YouTube / Google Home / Chrome's own Cast menu) → not a
  network issue. The receiver app (9671DA41) is an Unpublished Custom Receiver, so the
  Chromecast can only run it once registered as a TEST DEVICE by serial and rebooted
  (CAST-SETUP.md Steps 4–5). Cast Console state unverified by user → registration/reboot is
  the outstanding prerequisite. No app code or deploy defect remains.

### 2. Device name shown + stop casting (CAST-03)
expected: While connected, /match shows "Überträgt auf: <Gerät>"; tapping the launcher opens the native Cast dialog and "Stop casting" ends the session; the TV returns to idle.
result: blocked
blocked_by: prior-phase
reason: "Depends on an active Cast session to the Chromecast (Test 1), which is blocked on Cast Console test-device registration."

### 3. Auto-rejoin after tablet reload (CAST-05)
expected: With an active Cast session, reloading /match auto-rejoins the existing session (ORIGIN_SCOPED) without re-selecting the device; the TV scoreboard keeps showing the current match; the "Verbindung wiederhergestellt" toast appears.
result: blocked
blocked_by: prior-phase
reason: "Depends on an active Cast session to the Chromecast (Test 1)."

### 4. Receiver renders on TV + live per-throw sync (RECV-01 / SYNC live)
expected: The Chromecast loads /display as the Custom Web Receiver and renders the full scoreboard; every dart thrown on the tablet updates the TV in real time; the auto-pause countdown appears and stays in sync on the TV during break intervals.
result: blocked
blocked_by: prior-phase
reason: "Depends on an active Cast session to the Chromecast (Test 1)."

### 5. Session survives a long pause (RECV-04)
expected: Leave the session idle through a 6+ minute auto-pause break; the receiver stays up on the TV (disableIdleTimeout / maxInactivity=3600) and resumes updating when scoring continues.
result: blocked
blocked_by: prior-phase
reason: "Depends on an active Cast session to the Chromecast (Test 1)."

## Summary

total: 5
passed: 0
issues: 0
pending: 0
skipped: 0
blocked: 5

## Gaps

_Prerequisite (gates ALL 5 tests):_ Complete the Cast Developer Console registration per `docs/CAST-SETUP.md`. Status as of 2026-06-18: receiver deployed ✓; App ID `9671DA41` created + inlined into the live bundle ✓ (redeploy run 27790034025); **OUTSTANDING → Steps 4–5: register the video Chromecast as a test device by serial, reboot it, wait ~15 min, confirm "Ready for Testing".** Until the device is an authorized test device for the unpublished receiver, it is filtered out of the Cast picker.

- truth: "The Cast control is visible on /match in Chrome and lets the user start a Cast session to the registered Chromecast."
  status: fixed (verified on-device — Cast control now appears and the picker opens)
  reason: "User reported: 'Ich sehe \"Cast\" nirgendswo' — on the deployed app the Anzeigemodus panel only showed 'Zweites Fenster öffnen' and 'Anzeige hier im Vollbild'; no Cast button/launcher appeared."
  severity: major
  test: 1
  category: code-config (deploy ordering / stale build — no source code defect)
  root_cause: "The live GitHub Pages bundle was built BEFORE the VITE_CAST_APP_ID repo variable existed, so the Cast App ID was inlined as empty. Empty appId → the `if (appId)` guard in /match onMount is false → castSenderManager.init() never runs → SDK never loads → castAvailable stays false → the Cast row ({#if castSenderManager.castAvailable}, no else) never renders."
  fix_applied: "Re-ran 'Deploy to GitHub Pages' (run 27790034025, ref main) on 2026-06-18 after VITE_CAST_APP_ID=9671DA41 was created. Verified server-side: live /match node chunk 8 now contains 9671DA41 (was 0× before). Verified on-device: Cast control now appears and opens the picker. No source change."
  debug_session: .planning/debug/cast-launcher-not-visible.md
