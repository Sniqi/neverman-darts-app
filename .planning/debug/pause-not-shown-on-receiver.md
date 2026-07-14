---
status: diagnosed
trigger: "pause-not-shown-on-receiver"
created: 2026-07-14T00:00:00Z
updated: 2026-07-14T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED — pause-tick updates (#checkAutoPause, decrementPause, resumePause in src/stores/match.svelte.ts) only ever call #broadcastPause(), which posts to BC_CHANNEL (BroadcastChannel, same-machine only). #publishToCast() — the only code path that reaches the real Chromecast via castSenderManager.sendSnapshot()/activeSession.sendMessage(CAST_NS,...) — is called exclusively from inside dispatch(), i.e. only when a match action (dart thrown/undo) occurs. No dispatch occurs while paused, so the Cast channel never carries pauseActive:true or the live countdown. Additionally, even the triggering dispatch's own Cast publish (line ~126) runs BEFORE #checkAutoPause (line ~146) mutates pauseActive, so that one snapshot is stale too.
test: traced full call graph of #broadcastPause vs #publishToCast in src/stores/match.svelte.ts; confirmed only one call site of castManager.sendSnapshot (inside #publishToCast, inside dispatch()); confirmed the pause setInterval effect in match/+page.svelte only calls matchStore.decrementPause() (no cast touch)
expecting: n/a — root cause confirmed via static trace, no runtime repro needed
next_action: none — diagnosis complete (goal: find_root_cause_only)

## Symptoms

expected: Auto-Pause zeigt den synchronisierten Countdown auf dem TV; das Pause-Overlay (inkl. des neuen Blur-Scrims aus Phase 12 WR-02, backdrop-filter 12px) ist auf dem Chromecast-Receiver sichtbar; „Weiter" beendet die Pause beidseitig.
actual: "pass, aber der chromecast zeigt die Pause nicht an" — Auf dem echten Chromecast erscheint die Pause-Anzeige gar nicht. (Score-Live-Sync, Idle-Screen, Leg-/Win-Banner und Auto-Rejoin funktionieren auf demselben Receiver korrekt — nur die Pause fehlt.)
errors: None reported (user only observed missing UI on the TV).
reproduction: Test 5 in .planning/phases/11-spectator-display/11-UAT.md — auf einem echten Chromecast von /match casten, ein Match starten, die Auto-Pause auslösen; das Pause-Overlay erscheint auf dem TV nicht.
started: Discovered during Phase 11 on-device UAT (2026-07-14). Spectator display restyled in Phase 11; pause blur-scrim addendum from Phase 12 (WR-02).

## Eliminated

## Evidence

- timestamp: investigation
  checked: src/lib/cast-types.ts (toDisplayState, CastDisplayState)
  found: The Cast snapshot schema DOES include pauseActive/pauseRemainingSeconds fields (SYNC-03), and receiveSnapshot() in display.svelte.ts correctly applies them. So the wire format is fine.
  implication: The bug is not in the schema/receiver-apply path — it's upstream, in whether/when a Cast snapshot carrying pause fields is ever sent.

- timestamp: investigation
  checked: src/stores/match.svelte.ts dispatch() (lines ~100-147)
  found: dispatch() runs, in order: reduce() -> BroadcastChannel publish -> localStorage persist -> #publishToCast() (Cast snapshot, line ~126) -> record detection -> match-complete persist -> #checkAutoPause() (line ~146, sets pauseActive/pauseRemainingSeconds on set-win threshold).
  implication: #publishToCast() runs BEFORE #checkAutoPause() in the same dispatch cycle, so even the snapshot sent on the very dispatch that triggers the pause still has pauseActive=false (stale by one step).

- timestamp: investigation
  checked: src/stores/match.svelte.ts #checkAutoPause(), decrementPause(), resumePause(), #broadcastPause()
  found: All three pause-state mutators call ONLY #broadcastPause(), which opens a `new BroadcastChannel(BC_CHANNEL)` and posts a `{type: MSG_PAUSE_TICK, pauseActive, pauseRemainingSeconds}` message, then closes it. None of them call #publishToCast() or touch castSenderManager/#castManager in any way.
  implication: Every pause-tick (trigger, per-second decrement, resume) is BroadcastChannel-only. BroadcastChannel is scoped to same-origin contexts on the SAME machine/browser — it cannot reach a physical Chromecast receiver device, which only receives data pushed explicitly over the Cast custom-message channel (CAST_NS) via castSenderManager.sendMessage.

- timestamp: investigation
  checked: grep for all call sites of castManager.sendSnapshot / #publishToCast across src/
  found: Exactly one call site: src/stores/match.svelte.ts line ~490 inside #publishToCast(), which itself has exactly one call site: dispatch() line ~126.
  implication: The Cast channel is updated ONLY as a side-effect of a match action being dispatched (a dart thrown/undo/etc.). No darts are thrown while the match is paused, so no dispatch() call — and therefore no #publishToCast() call — occurs during the entire pause window. The receiver's last-known pauseActive stays false (or whatever it was before the pause) for the pause's full duration.

- timestamp: investigation
  checked: src/routes/match/+page.svelte pause countdown $effect (lines ~145-154) and full-file grep for castManager/CAST_NS/setInterval
  found: The only setInterval in the file is the 1s pause-countdown ticker, which calls only `matchStore.decrementPause()`. No separate interval or effect re-publishes to Cast during a pause.
  implication: Confirms there is no alternate/periodic path that would compensate for the missing Cast-side pause publish. This is a complete gap, not an intermittent timing issue.

- timestamp: investigation
  checked: src/routes/display/+page.svelte comment above PauseOverlay ("No new BroadcastChannel subscription needed here — displayStore.connect() handles it") and displayStore.connect()'s MSG_PAUSE_TICK handler in display.svelte.ts
  found: displayStore.connect()'s BroadcastChannel handler correctly updates pauseActive/pauseRemainingSeconds on MSG_PAUSE_TICK — this is why the local PC two-window preview (both windows same machine, same BroadcastChannel) shows the pause correctly. The comment reflects the (incorrect, for the Cast-receiver case) assumption that BroadcastChannel alone is sufficient for all /display contexts.
  implication: Confirms the local-preview-vs-real-device delivery-path difference named in the investigation hints: BroadcastChannel works for the local dev/preview path but was never bridged to the Cast custom-message channel for pause updates specifically (unlike match-state and record-event, which DO have Cast-publish coverage via #publishToCast on every dispatch).

## Resolution

root_cause: |
  Auto-pause state changes (trigger, per-second countdown decrement, resume) are broadcast
  to the spectator display ONLY via `#broadcastPause()` in src/stores/match.svelte.ts, which
  posts exclusively to a same-machine `BroadcastChannel(BC_CHANNEL)`. The only code path that
  reaches a real Chromecast receiver — `#publishToCast()` → `castSenderManager.sendSnapshot()`
  → `activeSession.sendMessage(CAST_NS, ...)` — is invoked exclusively from inside `dispatch()`,
  which only runs on match actions (darts thrown, undo, etc.). No dispatch occurs while the
  match is paused, so the Cast channel never carries a snapshot with `pauseActive: true` or an
  updated `pauseRemainingSeconds`. Even the single dispatch that triggers the pause publishes
  to Cast (line ~126) BEFORE `#checkAutoPause()` mutates the pause fields (line ~146), so that
  snapshot is stale too. Net effect: the real Chromecast receiver's `displayStore.pauseActive`
  (populated only via `receiveSnapshot()`) never becomes true, so `PauseOverlay` never renders
  on the TV — while the local PC two-window preview works because both windows share one
  BroadcastChannel namespace on the same machine, which `displayStore.connect()` subscribes to
  directly.
fix:
verification:
files_changed: []
