---
phase: 01-playable-x01-match
plan: 03
subsystem: ui
tags: [svelte5, svg, dartboard, polar-math, touch, pwa, wake-lock, numpad, correction-window]

# Dependency graph
requires:
  - phase: 01-playable-x01-match
    plan: 01
    provides: SvelteKit scaffold, Vitest multi-project harness, design tokens
  - phase: 01-playable-x01-match
    plan: 02
    provides: matchStore, classifyHit, screenToBoard, SEGMENT_ORDER, getSuggestion, isValidVisitTotal

provides:
  - SVG dartboard (Dartboard.svelte) with D-01 enlarged rings, polar-math hit dispatch, 300ms flash
  - Per-player score panel (ScorePanel.svelte) with 48px active / 20px inactive remaining
  - Visit strip (VisitStrip.svelte) with 3x48px slots and per-dart UNDO tap
  - Compact checkout suggestion line (CheckoutSuggestion.svelte) — null renders nothing (D-12)
  - 10-key numpad (Numpad.svelte) with isValidVisitTotal guard, shake animation, Bestätigen
  - 2.5s correction window (CorrectionWindow.svelte) with draining bar and Korrigieren
  - Darts-at-double bottom sheet (DartsAtDoubleDialog.svelte) for numpad finishing visits
  - Match win full-screen overlay (MatchWinOverlay.svelte) with Neues Spiel CTA
  - Wake lock utility (wake-lock.svelte.ts) with try/catch no-op and visibilitychange re-acquire
  - Responsive portrait/landscape match route (match/+page.svelte) wiring all above
  - 7 browser-mode component tests (Dartboard 3 + CorrectionWindow 4), all green

affects: [01-04, phase-2-spectator, phase-3-persistence, phase-4-stats]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SVG dartboard: segments rendered with describeAnnularSlice polar paths; scoring via screenToBoard+classifyHit (never SVG contains)"
    - "Flash feedback: $state flashKey tracks tapped region key; 300ms setTimeout clears it"
    - "Correction window: requestAnimationFrame tick drives progressPct; fake timers in browser test advance setTimeout"
    - "Per-player input mode: inputModeByPlayer Record keyed by activePlayerIndex, $derived to current mode"
    - "Wake lock: module-level sentinel; acquireWakeLock/releaseWakeLock exported; $effect in match route registers visibilitychange"

key-files:
  created:
    - src/ui/input/Dartboard.svelte
    - src/ui/input/Dartboard.test.ts
    - src/ui/input/ScorePanel.svelte
    - src/ui/input/VisitStrip.svelte
    - src/ui/input/CheckoutSuggestion.svelte
    - src/ui/input/Numpad.svelte
    - src/ui/input/CorrectionWindow.svelte
    - src/ui/input/CorrectionWindow.test.ts
    - src/ui/input/DartsAtDoubleDialog.svelte
    - src/ui/overlays/MatchWinOverlay.svelte
    - src/lib/wake-lock.svelte.ts
  modified:
    - src/routes/match/+page.svelte (replaced Plan 01 placeholder)
  deleted:
    - src/stores/skeleton.svelte.ts (Plan 01 placeholder — removed as planned)

key-decisions:
  - "Miss-zone test coordinate: use (rect.width/400)*350 screen offset (SVG r=350 in miss zone) not a fraction of rendered half-width — the fraction approach only reaches r≈184 SVG units which is inside inner single"
  - "CorrectionWindow visibility: correction state managed in match route via $effect watching player.visits.length; no phase change in reducer (CONFIRM_VISIT is a no-op in reducer, correction is pure UI)"
  - "Numpad DartsAtDouble: NUMPAD_VISIT dispatched first, dialog shown if prevRemaining===total — dartsAtDouble value captured for Phase 3 persistence (not stored to DB in Phase 1)"
  - "Numpad toggle icons: emoji 🔢/🎯 used for compact toggle button (functional placeholder, no icon library in Phase 1)"
  - "MatchWinOverlay: winnerName from matchStore.activePlayer (reducer sets activePlayerIndex to winning player on match-complete)"

patterns-established:
  - "SVG hit detection: always polar math via screenToBoard+classifyHit; never SVG path contains()"
  - "Browser test for SVG: (rect.width/400)*svgR maps screen coordinate to SVG user space"
  - "Touch-action none on SVG root prevents scroll/zoom intercepting pointerdown"

requirements-completed: [INP-01, INP-02, INP-03, INP-04, INP-05, ENG-04, ENG-05, ENG-07]

# Metrics
duration: 8min
completed: 2026-06-10
---

# Phase 1 Plan 03: Scoring View Summary

**Complete touch scoring view with SVG dartboard (polar-math hit detection, D-01 enlarged rings), numpad with impossible-score validation, 2.5s correction window, darts-at-double dialog, match-win overlay, and screen wake lock — 7 browser tests green**

## Performance

- **Duration:** 8 min
- **Started:** 2026-06-10T17:05:21Z
- **Completed:** 2026-06-10T17:13:44Z
- **Tasks:** 2
- **Files modified:** 13 (12 created, 1 modified, 1 deleted)

## Accomplishments

- SVG dartboard with 82 regions (20×inner-single/triple/outer-single/double + inner/outer bull), D-01 enlarged triple/double rings, polar-math hit classification, 300ms flash feedback, miss-zone transparent overlay — all dispatching real DART_THROWN actions
- Complete scoring layout: portrait (score panel ~35vh top, board fills remaining) and landscape (38%/62% split) via `@media (orientation: landscape)`, active player accent border, 48px/20px remaining display
- Numpad with 10 digit keys (≥64×64px), C/backspace, isValidVisitTotal guard (rejects 179/178/176/175/173/172/169 + out-of-range), 400ms 3-cycle shake + "Ungültige Punktzahl", per-player mode memory
- 2.5s correction window with draining progress bar, Überworfen! bust path, Korrigieren pause — CONFIRM_VISIT only after window dismisses (Pitfall 5)
- Wake lock acquired on match mount, re-acquired on visibilitychange, try/catch no-op if unsupported

## Task Commits

1. **Task 1: Core play loop** - `15ac401` (feat)
2. **Task 2: Numpad, correction window, darts-at-double, win overlay, wake lock** - `e2e7e37` (feat)

## Files Created/Modified

- `src/ui/input/Dartboard.svelte` - SVG board 82 regions + polar pointerdown dispatch, miss zone overlay
- `src/ui/input/Dartboard.test.ts` - 3 browser tests: center→bull, triple-20, miss zone
- `src/ui/input/ScorePanel.svelte` - Per-player cards, accent left border on active, CheckoutSuggestion inline
- `src/ui/input/VisitStrip.svelte` - 3×48px dart slots, UNDO on tap, bust red background
- `src/ui/input/CheckoutSuggestion.svelte` - Accent route line, renders nothing when null (D-12)
- `src/ui/input/Numpad.svelte` - 10-key + C + backspace + Bestätigen, validation + shake
- `src/ui/input/CorrectionWindow.svelte` - 2.5s overlay, draining bar, Überworfen!, Korrigieren
- `src/ui/input/CorrectionWindow.test.ts` - 4 browser tests: render, 2.5s dispatch, bust label, hidden no-op
- `src/ui/input/DartsAtDoubleDialog.svelte` - Bottom sheet, 1/2/3 Dart options
- `src/ui/overlays/MatchWinOverlay.svelte` - Full-screen fade, [name] gewinnt!, Neues Spiel→/setup
- `src/lib/wake-lock.svelte.ts` - acquireWakeLock/releaseWakeLock with try/catch
- `src/routes/match/+page.svelte` - Responsive layout + all components + wake lock $effect
- `src/stores/skeleton.svelte.ts` - DELETED (Plan 01 placeholder)

## Decisions Made

- **Miss-zone browser test coordinate:** `(rect.width / 400) * 350` maps SVG r=350 to screen pixels — confirmed by the failing test that showed `(rect.width/2)*0.92` only reaches r≈184 SVG units (inner single), not the miss zone
- **CorrectionWindow in reducer:** `CONFIRM_VISIT` is a no-op in the reducer (the turn already passed when the visit completed). The correction window is a pure UI delay layer — it watches `player.visits.length` increases and holds the screen for 2.5s before the player can see the next turn
- **DartsAtDouble dispatch timing:** NUMPAD_VISIT is dispatched immediately (reduces remaining, passes turn); dialog is shown afterward to capture darts-at-double metadata for Phase 3 stats — in Phase 1 the value is captured but not persisted

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Miss-zone browser test used wrong coordinate scaling**
- **Found during:** Task 1 — Dartboard.test.ts miss-zone test failed (segment 6 returned instead of 0)
- **Issue:** `(rect.width / 2) * 0.92` in screen pixels maps to `r ≈ 0.92 × 200 = 184` SVG units — inside the inner single ring (r < 186), not the miss zone (r ≥ 325)
- **Fix:** Changed to `(rect.width / 400) * 350` — correctly maps SVG r=350 to the rendered screen coordinate
- **Files modified:** src/ui/input/Dartboard.test.ts
- **Verification:** Miss-zone test now passes (segment: 0 returned)
- **Committed in:** 15ac401

**2. [Rule 1 - Bug] Dead `$derived: { void x }` pattern triggered Svelte compiler warnings**
- **Found during:** Task 2 build — vite-plugin-svelte warning "This reference only captures the initial value"
- **Issue:** `$derived: { void paused; }` in CorrectionWindow.svelte and `$derived: { void inputValue; }` in Numpad.svelte are not valid Svelte 5 rune syntax — they are labelled statement blocks, not reactive declarations
- **Fix:** Removed both dead blocks (neither was doing anything useful)
- **Files modified:** src/ui/input/CorrectionWindow.svelte, src/ui/input/Numpad.svelte
- **Verification:** svelte-check 0 errors 0 warnings after fix
- **Committed in:** e2e7e37

**3. [Rule 1 - Bug] CorrectionWindow a11y: click divs missing ARIA roles**
- **Found during:** Task 2 build — vite-plugin-svelte a11y warnings on overlay and window divs with onclick handlers
- **Fix:** Added `role="presentation"` to both clickable divs; replaced `svelte-ignore a11y_no_static_element_interactions` with `role="presentation"` (presentation role is correct for a dismiss-on-click overlay)
- **Files modified:** src/ui/input/CorrectionWindow.svelte
- **Verification:** svelte-check 0 warnings after fix
- **Committed in:** e2e7e37

---

**Total deviations:** 3 auto-fixed (3 bugs — 1 test coordinate, 2 Svelte 5 rune/a11y patterns)
**Impact on plan:** All fixes were correctness/tooling issues; no scope creep, no architectural change.

## Issues Encountered

None beyond the deviations documented above.

## Known Stubs

None. All components are fully wired to matchStore:
- `DartsAtDoubleDialog`: captures darts-at-double value but Phase 1 does not persist it to Dexie (this is the planned Phase 3 behaviour, documented in D-08)
- Numpad emoji toggle icons (🔢/🎯): functional, Phase 1 has no icon library; SVG icons can replace in a later plan

## Threat Surface Scan

No new trust boundaries introduced beyond the plan's threat model:
- All player name rendering uses Svelte `{interpolation}` (T-03-04 satisfied: no `{@html}`)
- `isValidVisitTotal` called before every NUMPAD_VISIT dispatch (T-03-01 satisfied)
- `screenToBoard` + `classifyHit` used for all board taps; no `contains()` (T-03-02 satisfied)
- Wake lock wrapped in try/catch (T-03-03 satisfied)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Full scoring view playable: board tap → score drop → checkout suggestion → undo → win overlay
- All 7 requirement IDs for this plan (INP-01..05, ENG-04/05/07) demonstrable in the scoring view
- Plan 01-04 (MatchSetup + BullOffOrder + ProfileManager) is the final plan of Phase 1
- E2E FLOW-01 spec remains RED until Plan 01-04 wires the setup→bull-off→match navigation

## Self-Check: PASSED

- All 12 created/modified files exist on disk (verified above)
- Commits 15ac401 and e2e7e37 present in git log
- `npx vitest run --project=browser`: 7/7 passed
- `npm run build`: exit 0, wrote site to build/
- `npx svelte-check --threshold error`: 0 errors, 0 warnings (367 files)

---
*Phase: 01-playable-x01-match*
*Completed: 2026-06-10*
