---
status: testing
phase: 07-chromecast-integration
source: [07-VERIFICATION.md]
started: 2026-06-18T22:25:00Z
updated: 2026-06-18T22:25:00Z
---

## Current Test

number: 1
name: Cast button connects to a real Chromecast (CAST-01)
expected: |
  On /match in Chrome, the Cast control is visible; tapping it lists the registered
  Chromecast; selecting it starts a session and the TV shows the /display scoreboard
  within seconds — without leaving the scoring view.
awaiting: user response

## Tests

### 1. Cast button connects to a real device (CAST-01)
expected: On /match (Chrome, same LAN as the registered Chromecast), the Cast control is visible; tapping it lists the device; selecting it starts a session and the TV shows the live scoreboard within seconds, tablet stays on the scoring view.
result: [pending]

### 2. Device name shown + stop casting (CAST-03)
expected: While connected, /match shows "Überträgt auf: <Gerät>"; tapping the launcher opens the native Cast dialog and "Stop casting" ends the session; the TV returns to idle.
result: [pending]

### 3. Auto-rejoin after tablet reload (CAST-05)
expected: With an active Cast session, reloading /match auto-rejoins the existing session (ORIGIN_SCOPED) without re-selecting the device; the TV scoreboard keeps showing the current match; the "Verbindung wiederhergestellt" toast appears.
result: [pending]

### 4. Receiver renders on TV + live per-throw sync (RECV-01 / SYNC live)
expected: The Chromecast loads /display as the Custom Web Receiver and renders the full scoreboard; every dart thrown on the tablet updates the TV in real time; the auto-pause countdown appears and stays in sync on the TV during break intervals.
result: [pending]

### 5. Session survives a long pause (RECV-04)
expected: Leave the session idle through a 6+ minute auto-pause break; the receiver stays up on the TV (disableIdleTimeout / maxInactivity=3600) and resumes updating when scoring continues.
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps

_Prerequisite (gates ALL 5 tests):_ Complete the Cast Developer Console registration per `docs/CAST-SETUP.md` — $5 one-time fee, register the Chromecast serial + the deployed receiver URL, allow ~15-min propagation + reboot. The receiver must be served at its stable HTTPS GitHub Pages URL (PWA deployed) before these tests can run.
