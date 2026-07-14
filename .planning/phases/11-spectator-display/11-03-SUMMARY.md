---
phase: 11-spectator-display
plan: 03
subsystem: ui
tags: [svelte, css, cqw, chrome-90, spectator-display, typography]

# Dependency graph
requires:
  - phase: 11-spectator-display
    provides: formatDartShort export from src/ui/input/dart-notation.ts (Plan 11-01)
provides:
  - PlayerPanel.svelte fully restyled to DS literal backgrounds/box-shadows/typography
  - formatDart consolidated onto shared formatDartShort in PlayerPanel
  - Chrome-90 @supports vw-fallback layer resynced to every changed cqw rule
  - Confirmed zero live color-mix() across all of src/ui/display/
affects: [phase-11-spectator-display remaining plans, any future spectator-display restyle work]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Locked-literal DS backgrounds/box-shadows precomputed to static rgba() (never live color-mix()), matching the project-wide Chrome-90 rule established in Phase 8/10"
    - "Two-layer cqw/vw @supports fallback: every --display-* or literal-cqw font-size in the primary rule has a matching vw-fallback line with the same numeric N"

key-files:
  created: []
  modified:
    - src/ui/display/PlayerPanel.svelte

key-decisions:
  - "Active box-shadow amber mixes rewritten from 13%/45% tokens to precomputed 7%/22% static rgba() per the DS literal"
  - "bust-overlay 14% token replaced with precomputed 16% static per RESEARCH.md Pitfall/CONTEXT.md Q3"
  - ".history-box background direction-fixed from a near-invisible light overlay (var(--line)) to a dark recess (rgba(0,0,0,0.22)), not just an intensity tweak"
  - "Removed the DS-absent .player-panel.active .history-box override entirely (not adjusted)"
  - ".dart-pill font-size switched from an independent absolute clamp to a relative 0.82em against .h-darts's new --display-body size, matching the DS's DartPill size=\"0.82em\" pattern"
  - "liveRowPulse keyframe left completely untouched (locked exception) even though the static last-row edge moved 3px->4px"
  - "Comments describing precomputed color mixes phrase avoid the literal 'color-mix(' string so the phase-wide grep gate stays clean"

requirements-completed: [DISP-01, DISP-03, DISP-04]

coverage:
  - id: D1
    description: "PlayerPanel backgrounds, border-top, active box-shadow, BUST overlay/label, and history-box match DS literal values; DS-absent active-history-box override removed"
    requirement: "DISP-01"
    verification:
      - kind: unit
        ref: "src/ui/display/PlayerPanel.test.ts (14 tests)"
        status: pass
      - kind: other
        ref: "grep -c 'player-panel.active .history-box' src/ui/display/PlayerPanel.svelte -> 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "PlayerPanel typography fully swapped to shared --display-* token scale; history-row spacing/backgrounds and checkout pill match DS values; liveRowPulse keyframe unchanged"
    requirement: "DISP-01"
    verification:
      - kind: unit
        ref: "src/ui/display/PlayerPanel.test.ts (14 tests)"
        status: pass
    human_judgment: false
  - id: D3
    description: "formatDart consolidated onto shared formatDartShort; Chrome-90 vw-fallback layer resynced to every changed cqw rule with matching N; zero live color-mix() across src/ui/display/"
    requirement: "DISP-03"
    verification:
      - kind: unit
        ref: "src/ui/display/PlayerPanel.test.ts, MatchHeader.test.ts, VisitLine.test.ts, SpectatorChooser.test.ts (38 tests, npx vitest run --project=browser src/ui/display/)"
        status: pass
      - kind: e2e
        ref: "e2e/spectator-sync.spec.ts (3/3 specs, DISP-05 regression net)"
        status: pass
      - kind: other
        ref: "grep -rn 'color-mix(' src/ui/display/ -> zero matches"
        status: pass
    human_judgment: false
  - id: D4
    description: "On-device Chromecast (Chrome 90) verification of the new fallback values"
    verification: []
    human_judgment: true
    rationale: "This plan's scope is code-side @supports discipline only (DISP-03); the on-device Cast receiver visual check is a separate, planned end-of-phase human UAT per 11-CONTEXT.md, not part of this plan's automated verification."

duration: 12min
completed: 2026-07-14
status: complete
---

# Phase 11 Plan 03: PlayerPanel Restyle Summary

**PlayerPanel.svelte restyled to DS literal backgrounds/box-shadows/typography (precomputed static rgba(), no live color-mix()), formatDart consolidated onto the shared formatDartShort, and the Chrome-90 vw-fallback layer resynced to every changed cqw rule.**

## Performance

- **Duration:** ~12 min
- **Tasks:** 3
- **Files modified:** 1 (src/ui/display/PlayerPanel.svelte)

## Accomplishments
- `.player-panel`/`.player-panel.active` backgrounds swapped to locked-literal DS gradients; border-top 4px→5px; active box-shadow uses precomputed 7%/22% amber statics
- BUST overlay/label restyled to DS values (font-family, size, weight, tracking, text-shadow); history-box direction-fixed to a dark recess with wider padding; DS-absent active-history-box override removed
- All PlayerPanel typography (name, chips, totals, remaining, averages, checkout pill, BUST) now consumes the shared `--display-*` token scale; dart pills sized relatively (0.82em) off `.h-darts`
- History-row/section spacing widened and backgrounds moved to DS literals; live-row background precomputed to a 17% static, more saturated than the last-completed row's token; `liveRowPulse` keyframe left untouched per the locked exception
- `formatDart` deleted from PlayerPanel; dart pills now render through the shared `formatDartShort` (Plan 11-01)
- Chrome-90 `@supports not (container-type: inline-size)` fallback block fully resynced: 9 font-size lines updated to match new `--display-*`/literal values, `.dart-pill` line removed, `.h-darts` line added
- Confirmed zero live `color-mix()` CSS anywhere in `src/ui/display/` (all three components)

## Task Commits

Each task was committed atomically:

1. **Task 1: Backgrounds, borders, box-shadows, BUST overlay/label, history-box recess** - `6c09aea` (feat)
2. **Task 2: Typography scale swap to --display-* tokens, history-row spacing/backgrounds, checkout pill polish** - `d86de08` (feat)
3. **Task 3: Consolidate formatDart onto formatDartShort; sync Chrome-90 vw-fallback; zero-color-mix verification** - `7e9d2c3` (refactor)

_No TDD tasks in this plan; each task is a single commit._

## Files Created/Modified
- `src/ui/display/PlayerPanel.svelte` - Restyled backgrounds/box-shadows/BUST/history-box (Task 1), typography scale + history-row/checkout-pill polish (Task 2), formatDart consolidation + Chrome-90 fallback resync (Task 3)

## Decisions Made
- Active box-shadow amber mixes rewritten from 13%/45% tokens to precomputed 7%/22% static rgba() per the DS literal (comment describes as "translucent-accent mix," avoiding the literal `color-mix(` string the phase-wide grep gate scans for)
- `.history-box` background direction-fixed from a near-invisible light overlay to a dark recess (not just an intensity tweak) — matches the DS's recessed-panel intent
- Removed the DS-absent `.player-panel.active .history-box` override entirely, per plan instruction (not adjusted, deleted)
- `.dart-pill` font-size switched from an independent absolute clamp to a relative `0.82em` off `.h-darts`'s new `--display-body` size, matching the DS's `<DartPill size="0.82em">` pattern
- `liveRowPulse` keyframe left completely byte-identical (locked exception) even though the static last-row edge moved 3px→4px

## Deviations from Plan

None — plan executed exactly as written, including all "leave X untouched" and "do not widen this" guardrails (remaining-score text-shadow blur/second-layer, liveRowPulse keyframe, .player-panel padding/gap fallback, subgrid @supports block).

## Issues Encountered
- The first draft of the active-box-shadow comment (Task 1) used the literal string `color-mix(` while describing the precomputation — caught during Task 3's zero-color-mix grep verification and rephrased to avoid the literal function-call syntax, per the plan's own explicit warning about the phase-wide grep gate. Fixed before commit; no functional impact.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All three Phase 11 spectator-display components (MatchHeader, PlayerPanel, VisitLine/SpectatorChooser) now ship zero live `color-mix()` and DS-literal values with a synced Chrome-90 fallback layer
- Full suite green: 563/563 vitest, 12/12 Playwright (including all 3 spectator-sync E2E specs)
- DISP-03's code-side requirement satisfied; the on-device Chromecast (Chrome 90) visual verification remains a separate, planned end-of-phase human UAT per 11-CONTEXT.md — not blocking this plan's completion

---
*Phase: 11-spectator-display*
*Completed: 2026-07-14*

## Self-Check: PASSED

- FOUND: src/ui/display/PlayerPanel.svelte
- FOUND: .planning/phases/11-spectator-display/11-03-SUMMARY.md
- FOUND: 6c09aea (Task 1 commit)
- FOUND: d86de08 (Task 2 commit)
- FOUND: 7e9d2c3 (Task 3 commit)
