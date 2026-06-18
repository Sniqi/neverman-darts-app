---
status: partial
phase: 07-chromecast-integration
source: [07-VERIFICATION.md]
started: 2026-06-18T22:25:00Z
updated: 2026-06-19T09:30:00Z
---

## Current Test

[testing paused — 2nd on-device pass: the Cast CONNECTION now works (Test 1 ✓), but the RECEIVER
never renders the match (Test 4, BLOCKER) plus a cosmetic Vollbild button on the TV. Both bugs
diagnosed (root causes below, confirmed by code reading). Next: fix → redeploy to GitHub Pages →
re-run all 5 tests on-device in one pass → complete the milestone.]

## Tests

### 1. Cast button connects to a real device (CAST-01)
expected: On /match (Chrome, same LAN as the registered Chromecast), the Cast control is visible; tapping it lists the device; selecting it starts a session and the TV shows the live scoreboard within seconds, tablet stays on the scoring view.
result: pass
note: |
  PASS for connection mechanics (2026-06-19). The long-running "device absent from picker" blocker
  was a serial-number typo: registered "9716C9ZRIB" but the real Chromecast serial is "9716C9ZR1B"
  (digit 1, not letter I). Cast Console's "Ready For Testing" never validated the serial against a
  real device, so the wrong entry looked fine. After registering the correct serial + a full
  power-cycle, the device "Wohnzimmer Ultra" appears in the picker, the session starts, and /match
  shows "Überträgt auf: Wohnzimmer Ultra"; the tablet stays on the scoring view. ✓
  CAVEAT: the "TV shows the live scoreboard" sub-clause is NOT met — the receiver renders only the
  idle "Warten auf Match" screen. That failure is the receiver-render bug, tracked under Test 4.

### 2. Device name shown + stop casting (CAST-03)
expected: While connected, /match shows "Überträgt auf: <Gerät>"; tapping the launcher opens the native Cast dialog and "Stop casting" ends the session; the TV returns to idle.
result: pending
note: |
  Device-name half CONFIRMED on-device: /match shows "Überträgt auf: Wohnzimmer Ultra" while
  connected. Stop-casting half not yet exercised — deferred to the post-fix on-device retest pass.

### 3. Auto-rejoin after tablet reload (CAST-05)
expected: With an active Cast session, reloading /match auto-rejoins the existing session (ORIGIN_SCOPED) without re-selecting the device; the TV scoreboard keeps showing the current match; the "Verbindung wiederhergestellt" toast appears.
result: pending
note: "Sender-side now reachable (Test 1 passes). Deferred to the post-fix on-device retest pass."

### 4. Receiver renders on TV + live per-throw sync (RECV-01 / SYNC live)
expected: The Chromecast loads /display as the Custom Web Receiver and renders the full scoreboard; every dart thrown on the tablet updates the TV in real time; the auto-pause countdown appears and stays in sync on the TV during break intervals.
result: issue
reported: "Auf dem Chromecast nur 'Warten auf Match' — der Scoreboard erscheint nicht, keine Live-Übertragung der Würfe."
severity: blocker

### 5. Session survives a long pause (RECV-04)
expected: Leave the session idle through a 6+ minute auto-pause break; the receiver stays up on the TV (disableIdleTimeout / maxInactivity=3600) and resumes updating when scoring continues.
result: pending
note: "Depends on the receiver rendering the match (Test 4). Deferred to the post-fix on-device retest pass."

## Summary

total: 5
passed: 1
issues: 1
pending: 3
skipped: 0
blocked: 0

## Gaps

- truth: "The Chromecast receiver (/display) renders the live scoreboard and updates on every dart thrown on the tablet."
  status: failed
  reason: "User reported: TV stays on 'Warten auf Match' (IdleScreen); the scoreboard never appears and throws don't sync."
  severity: blocker
  test: 4
  category: code (sender/receiver message-contract mismatch)
  root_cause: |
    The Cast sender never tags its snapshot messages with the `type: 'snapshot'` discriminant that
    the receiver REQUIRES. CastSenderManager.sendSnapshot() (src/lib/cast-sender.svelte.ts:145-152)
    sends the bare CastDisplayState from toDisplayState() via session.sendMessage(CAST_NS, payload).
    The receiver bridge (src/lib/cast-receiver.ts:68-75) only forwards a message to onSnapshot when
    `data.type === 'snapshot'`; every actual message has no `type` field, so the guard is always
    false, onSnapshot never fires, displayStore.state stays null, and /display renders <IdleScreen/>
    ("Warten auf Match") forever. The intended wire type `CastSnapshotMessage = { type: 'snapshot' } &
    CastDisplayState` (src/lib/cast-types.ts:75) exists but is never constructed by the sender.
    Unit tests missed it: the sender test (cast-sender.test.ts:281-297) asserts sendMessage is called
    with the BARE payload (codifying the bug); the receiver test (cast-receiver.test.ts:161) feeds a
    payload that already has type:'snapshot'. No test connected sender output to receiver input, so
    the contract mismatch slipped through.
  artifacts:
    - path: "src/lib/cast-sender.svelte.ts"
      issue: "sendSnapshot() sends the bare CastDisplayState — missing the type:'snapshot' discriminant the receiver requires."
    - path: "src/lib/cast-sender.test.ts"
      issue: "Test asserts sendMessage(CAST_NS, payload) with the bare payload — codifies the bug; must expect { type:'snapshot', ...payload }."
  missing:
    - "Wrap the payload in sendSnapshot() as { type: 'snapshot', ...payload } (use the existing CastSnapshotMessage type) before session.sendMessage()."
    - "Update cast-sender.test.ts to expect the type:'snapshot'-tagged message."
    - "Add a sender↔receiver contract/integration test: a message produced by the sender path is accepted by the receiver's addCustomMessageListener handler (would have caught this)."
  debug_session: ""

- truth: "On the Chromecast receiver, no PC/tablet-only fullscreen controls are shown (the TV is already fullscreen and non-interactive)."
  status: failed
  reason: "User reported: an unnecessary 'Vollbild' button shows at the bottom of the TV that can't be pressed anyway."
  severity: cosmetic
  test: 4
  category: code (receiver UI gating)
  root_cause: |
    src/routes/display/+page.svelte renders the fullscreen controls without gating on isReceiver.
    The bottom "Vollbild aktivieren" prompt (.fullscreen-prompt, lines 284-288) shows when
    `!isFullscreen && (matchState === null || phase === 'setup' || ...)`; on a Chromecast isFullscreen
    is always false and (because of the snapshot bug) matchState is null → the prompt shows. The
    top-right .fullscreen-toggle (lines 261-277) is rendered unconditionally and would also show on
    the TV. None of these are usable on a Cast receiver (no pointer, already fullscreen). The
    isReceiver flag already exists (set true in onMount) but only drives the overscan padding, not
    control visibility.
  artifacts:
    - path: "src/routes/display/+page.svelte"
      issue: "Fullscreen prompt/toggle (and exit button) are not gated on isReceiver, so they appear on the Cast receiver."
  missing:
    - "Hide .fullscreen-prompt, .fullscreen-toggle and .exit-btn when isReceiver is true (e.g. add `&& !isReceiver` / wrap in {#if !isReceiver})."
  debug_session: ""
