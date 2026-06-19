---
status: testing
phase: 07-chromecast-integration
source: [07-VERIFICATION.md]
started: 2026-06-18T22:25:00Z
updated: 2026-06-19T10:00:00Z
---

## Current Test

number: 4
name: Live per-throw sync to TV (SYNC live)
expected: |
  Test 1 PASSED — Cast connects and both the TV and the PC second window render the scoreboard.
  Now verify live sync: every dart thrown on /match updates the TV scoreboard in real time, and no
  PC/tablet-only "Vollbild" button appears on the TV. (Remaining: Test 2 device-name + stop-casting,
  Test 3 auto-rejoin on /match reload, Test 5 long-pause survival.)
awaiting: user response (on-device, match casting live)

<!--
POST-FIX RETEST PASS (3rd pass) — fixes from commit 3f028f2 are LIVE on GitHub Pages
(deploy run 27793185587 succeeded on 9994e1e, 2026-06-18). Two bugs from the 2nd pass were fixed:
  1. RECV-01 blocker — sender now tags snapshots with type:'snapshot' (cast-sender.svelte.ts:151)
  2. Vollbild cosmetic — receiver-only fullscreen controls now gated behind !isReceiver (+page.svelte)
PRECONDITION before testing: hard-reload /match on the tablet (and end any stale Cast session) so the
PWA service worker pulls the fresh build; the Chromecast loads /display fresh per cast session.
All 5 tests reset to pending for a clean on-device pass. If all pass → /gsd-complete-milestone v1.1.
-->

## Tests

### 1. Cast button connects + TV renders the live scoreboard (CAST-01 / RECV-01)
expected: On /match (Chrome, same LAN as the registered Chromecast), the Cast control is visible; tapping it lists "Wohnzimmer Ultra"; selecting it starts a session. The TV shows the full live scoreboard within seconds (not the "Warten auf Match" idle screen); the tablet stays on the scoring view showing "Überträgt auf: Wohnzimmer Ultra".
result: pass
note: |
  PASS (2026-06-19, 3rd pass). User confirmed: "Jetzt funktioniert sowohl TV als auch 2. bildschirm
  /display." Took a chain of fixes, each diagnosed from ground truth:
  - "Failed to cast" → the receiver app 404'd every chunk because relative asset paths (../_app)
    resolved to the domain root on the no-trailing-slash /display URL. Fixed by kit.paths.relative=false
    (absolute paths). (5b333e9)
  - Receiver then booted but showed only the header over empty space. On-screen debug overlay on the
    TV revealed Chrome 90 (no container queries, no dvh, no subgrid) at 1280x720, rootH=77/gridH=0.
    The CSS minifier had stripped the `height:100vh` fallback (dedup of duplicate `height:` decls),
    leaving only the unsupported 100dvh → height collapse. Fixed via @supports (height + cqw fonts +
    subgrid), all verified to survive minification. (e61190c, 8d3fecc, 016eebb)
  - Also: PWA registerType autoUpdate so the receiver self-updates on each cast (no reboot). (8d3fecc)
  Both the Cast receiver and the PC second window now render the full scoreboard.

### 2. Device name shown + stop casting (CAST-03)
expected: While connected, /match shows "Überträgt auf: Wohnzimmer Ultra"; tapping the launcher opens the native Cast dialog and "Stop casting" ends the session; the TV returns to idle.
result: [pending]

### 3. Auto-rejoin after tablet reload (CAST-05)
expected: With an active Cast session, reloading /match auto-rejoins the existing session (ORIGIN_SCOPED) without re-selecting the device; the TV scoreboard keeps showing the current match; the "Verbindung wiederhergestellt" toast appears.
result: [pending]

### 4. Live per-throw sync to TV (SYNC live)
expected: Every dart thrown on the tablet updates the TV scoreboard in real time; the auto-pause countdown appears and stays in sync on the TV during break intervals. No PC/tablet-only "Vollbild" button appears on the TV.
result: [pending]

### 5. Session survives a long pause (RECV-04)
expected: Leave the session idle through a 6+ minute auto-pause break; the receiver stays up on the TV (disableIdleTimeout / maxInactivity=3600) and resumes updating when scoring continues.
result: [pending]

## Summary

total: 5
passed: 1
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps

- truth: "Selecting the Chromecast in the Cast dialog launches the receiver app and starts a Cast session."
  status: failed
  reason: "User reported (3rd pass): Cast dialog shows 'Failed to cast. Please try again.' for Wohnzimmer Ultra; the receiver app never launches. REGRESSION — the session DID establish in the 2nd pass."
  severity: blocker
  test: 1
  category: code/config (SvelteKit relative base-path breaks deep-route direct loads)
  root_cause: |
    CONFIRMED via the receiver's own console (remote-debug). Every asset 404s at the DOMAIN ROOT:
    `GET https://sniqi.github.io/_app/immutable/entry/start.EulKlBcp.js 404` →
    `Uncaught TypeError: Failed to fetch dynamically imported module`. SvelteKit never boots, so
    CastReceiverBridge.init()/ctx.start() never runs → "Failed to cast. Please try again."
    WHY: svelte.config.js leaves kit.paths.relative at its default (true) → assets are emitted as
    RELATIVE paths. The prerendered file display/index.html references `../_app/immutable/...`. That
    only resolves correctly when the document is loaded at `/neverman-darts-app/display/` (WITH a
    trailing slash). The Cast receiver (and a manual reload) loads `/neverman-darts-app/display`
    (NO slash); GitHub 301s to add the slash but the receiver resolves `../_app/` against the no-slash
    URL → one level too high → `https://sniqi.github.io/_app/...` (domain root) → 404 on every chunk.
    Reboot did not help (not a cache issue); live bundle is correct (not a stale build / App ID).
    Evidence: curl `/neverman-darts-app/display` → 301; `/neverman-darts-app/display/` → 200 with
    `<link href="../_app/immutable/entry/start.EulKlBcp.js">`. Likely the SAME cause behind the
    second-window /display reload showing idle/broken.
  fix: |
    Set `kit.paths.relative = false` in svelte.config.js. With paths.base='/neverman-darts-app' that
    emits ABSOLUTE asset URLs (`/neverman-darts-app/_app/...`) that resolve correctly regardless of
    the document URL's trailing slash or route depth — fixes the Cast receiver launch AND direct
    reloads of /display and /match. One-line change; redeploy required.
  artifacts:
    - path: "svelte.config.js"
      issue: "kit.paths.relative unset (defaults true) → relative asset paths 404 on direct deep-route loads (Cast receiver loads /display)."
  missing:
    - "Add `relative: false` to kit.paths in svelte.config.js, rebuild, redeploy, re-cast."
  next_steps:
    - "Immediate confirmation (no deploy): open https://sniqi.github.io/neverman-darts-app/display/ WITH the trailing slash — it should load the display with no 404s."
  debug_session: ""

- truth: "The PC second window (/display) mirrors a match scored in /match in the same browser via BroadcastChannel."
  status: failed
  reason: "User reported (Q3): with /match open and being scored in the SAME browser/PC, the /display window still shows the idle 'Warte auf Match' screen."
  severity: major
  test: 1
  category: code (BroadcastChannel sync — pre-Phase-7 / Phase-2 path, NOT touched by the Cast fix)
  root_cause: |
    UNCONFIRMED — needs a browser-console check on /display. Leading hypothesis: match.svelte.ts
    dispatch() uses an open-post-close pattern (new BroadcastChannel → postMessage → close() in the
    SAME tick, lines 110-112). Closing a channel synchronously after postMessage can drop the message
    before other windows receive it in real browsers; the unit tests use a SYNCHRONOUS MockBroadcastChannel
    (display.svelte.test.ts) that delivers instantly, masking the race. Independent check: a FRESH /display
    load should still hydrate from the localStorage snapshot (match.svelte.ts:119) regardless of the live
    channel — so if reloading /display with an active match ALSO shows idle, the cause is deeper (snapshot
    not written / invalid shape / stale cached build / console error).
  next_steps:
    - "With a match active in /match, RELOAD the /display window. If it then shows the match (localStorage hydration) but doesn't live-update on the next throw → confirms the open-post-close BroadcastChannel race."
    - "Open DevTools console on the /display window and report any errors."
  debug_session: ""

<!-- The two gaps below were DIAGNOSED in the 2nd pass and FIXED in commit 3f028f2 (live on Pages).
     Retained as the record of what this retest verifies. They resolve when Tests 1/4 pass. -->

- truth: "The Chromecast receiver (/display) renders the live scoreboard and updates on every dart thrown on the tablet."
  status: fix_applied_pending_verification
  reason: "User reported (2nd pass): TV stayed on 'Warten auf Match' (IdleScreen); the scoreboard never appeared and throws didn't sync."
  severity: blocker
  test: 1
  category: code (sender/receiver message-contract mismatch)
  root_cause: |
    The Cast sender never tagged its snapshot messages with the `type: 'snapshot'` discriminant the
    receiver REQUIRES (cast-receiver.ts forwards only `data.type === 'snapshot'`), so onSnapshot
    never fired and /display rendered <IdleScreen/> forever.
  fix: |
    cast-sender.svelte.ts:145-156 sendSnapshot() now builds `const message: CastSnapshotMessage =
    { type: 'snapshot', ...payload }` before session.sendMessage(). Verified in source + committed.
  artifacts:
    - path: "src/lib/cast-sender.svelte.ts"
      issue: "FIXED — sendSnapshot() now tags payload with type:'snapshot'."
  debug_session: ""

- truth: "On the Chromecast receiver, no PC/tablet-only fullscreen controls are shown (the TV is already fullscreen and non-interactive)."
  status: fix_applied_pending_verification
  reason: "User reported (2nd pass): an unnecessary 'Vollbild' button showed at the bottom of the TV that couldn't be pressed."
  severity: cosmetic
  test: 4
  category: code (receiver UI gating)
  root_cause: |
    +page.svelte rendered the .fullscreen-prompt / .fullscreen-toggle / .exit-btn without gating on
    isReceiver, so they appeared on the Cast receiver where they're useless.
  fix: |
    +page.svelte now wraps the fullscreen controls in {#if !isReceiver} (lines 262, 288). Verified in
    source + committed.
  artifacts:
    - path: "src/routes/display/+page.svelte"
      issue: "FIXED — fullscreen controls gated behind !isReceiver."
  debug_session: ""
