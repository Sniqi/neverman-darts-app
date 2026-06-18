---
status: diagnosed
phase: 07-chromecast-integration
source: [07-VERIFICATION.md]
started: 2026-06-18T22:25:00Z
updated: 2026-06-18T21:16:00Z
---

## Current Test

[testing paused — Cast control not visible; 4 dependent tests blocked]

## Tests

### 1. Cast button connects to a real device (CAST-01)
expected: On /match (Chrome, same LAN as the registered Chromecast), the Cast control is visible; tapping it lists the device; selecting it starts a session and the TV shows the live scoreboard within seconds, tablet stays on the scoring view.
result: issue
reported: "Ich sehe \"Cast\" nirgendswo — on sniqi.github.io/neverman-darts-app/match the only display options are 'Zweites Fenster öffnen' and 'Anzeige hier im Vollbild'; no Cast button/launcher appears anywhere."
severity: major

### 2. Device name shown + stop casting (CAST-03)
expected: While connected, /match shows "Überträgt auf: <Gerät>"; tapping the launcher opens the native Cast dialog and "Stop casting" ends the session; the TV returns to idle.
result: blocked
blocked_by: prior-phase
reason: "Cannot reach this state — no Cast control visible to start a session (Test 1 issue)."

### 3. Auto-rejoin after tablet reload (CAST-05)
expected: With an active Cast session, reloading /match auto-rejoins the existing session (ORIGIN_SCOPED) without re-selecting the device; the TV scoreboard keeps showing the current match; the "Verbindung wiederhergestellt" toast appears.
result: blocked
blocked_by: prior-phase
reason: "Cannot reach this state — no Cast session can be started (Test 1 issue)."

### 4. Receiver renders on TV + live per-throw sync (RECV-01 / SYNC live)
expected: The Chromecast loads /display as the Custom Web Receiver and renders the full scoreboard; every dart thrown on the tablet updates the TV in real time; the auto-pause countdown appears and stays in sync on the TV during break intervals.
result: blocked
blocked_by: prior-phase
reason: "Cannot reach this state — no Cast session can be started (Test 1 issue)."

### 5. Session survives a long pause (RECV-04)
expected: Leave the session idle through a 6+ minute auto-pause break; the receiver stays up on the TV (disableIdleTimeout / maxInactivity=3600) and resumes updating when scoring continues.
result: blocked
blocked_by: prior-phase
reason: "Cannot reach this state — no Cast session can be started (Test 1 issue)."

## Summary

total: 5
passed: 0
issues: 1
pending: 0
skipped: 0
blocked: 4

## Gaps

_Prerequisite (gates ALL 5 tests):_ Complete the Cast Developer Console registration per `docs/CAST-SETUP.md` — $5 one-time fee, register the Chromecast serial + the deployed receiver URL, allow ~15-min propagation + reboot. The receiver must be served at its stable HTTPS GitHub Pages URL (PWA deployed) before these tests can run.

- truth: "The Cast control is visible on /match in Chrome and lets the user start a Cast session to the registered Chromecast."
  status: failed
  reason: "User reported: 'Ich sehe \"Cast\" nirgendswo' — on the deployed app at sniqi.github.io/neverman-darts-app/match, the Anzeigemodus panel only shows 'Zweites Fenster öffnen' and 'Anzeige hier im Vollbild'; no Cast button/launcher appears."
  severity: major
  test: 1
  category: code-config (deploy ordering / stale build — no source code defect)
  root_cause: "The live GitHub Pages bundle was built BEFORE the VITE_CAST_APP_ID repo variable existed, so the Cast App ID was inlined as empty. Last deploy = 2026-06-18T20:59:37Z (commit d708b08); repo var VITE_CAST_APP_ID=9671DA41 created 2026-06-18T21:04:02Z (~4.5 min later); no deploy since. Bundle grep of the live deployed JS: '9671DA41' appears 0×, but all Cast code IS present (cast_sender.js, __onGCastApiAvailable, castAvailable, 'Auf Chromecast übertragen'). Empty appId → the `if (appId)` guard in /match onMount is false → castSenderManager.init() never runs → SDK never loads → castAvailable stays false → the Cast row ({#if castSenderManager.castAvailable}, no else) never renders."
  artifacts:
    - path: "src/routes/match/+page.svelte:58-62"
      issue: "const appId = import.meta.env.VITE_CAST_APP_ID; if (appId) {...} — no-ops when App ID inlined empty (code correct; build-time value missing)"
    - path: "src/lib/cast-sender.svelte.ts:53-69"
      issue: "init() is the only path that loads the SDK and sets castAvailable via __onGCastApiAvailable"
    - path: "src/ui/display/SpectatorChooser.svelte:171-209"
      issue: "Cast row wrapped in {#if castSenderManager.castAvailable} with no else/disabled state — fully absent when false"
    - path: ".github/workflows/deploy.yml:43"
      issue: "VITE_CAST_APP_ID: ${{ vars.VITE_CAST_APP_ID }} — read only at build time, so a deploy predating the variable inlines empty"
  missing:
    - "Re-run the GitHub Pages deploy now that VITE_CAST_APP_ID=9671DA41 exists (gh workflow run, or push to main/master) — rebuilds the bundle with the App ID inlined. PRIMARY FIX, no code change."
    - "Verify after redeploy: grep the live bundle for 9671DA41 (>0), reload /match in Chrome, confirm the Cast row appears."
    - "OPTIONAL polish: emit a DEV console.warn when appId is empty so a missing App ID is observable instead of silently hiding Cast."
  debug_session: .planning/debug/cast-launcher-not-visible.md
