---
phase: 10-scoring-surface
plan: 04
subsystem: ui
tags: [svelte, css-design-tokens, vitest-browser, scoring-ui]

# Dependency graph
requires:
  - phase: 08-design-foundation
    provides: DS color/spacing/radius/elevation/typography CSS custom properties consumed here (--text-score-active, --accent-line, --glow-accent, --radius-pill, etc.)
  - phase: 10-scoring-surface (10-03)
    provides: dart-pill BUST treatment in VisitStrip.svelte -- this plan's ScorePanel.svelte deliberately adds zero new bust-handling code, per CONTEXT.md Q2
provides:
  - ScorePanel.svelte restyled to DS ScoreCard.jsx spec (96px/800 active score, amber inset-edge + ambient glow, 44px/700 inactive, ellipsis name truncation)
  - CheckoutSuggestion.svelte restyled to an amber-glowing pill (17px/700, pill radius, accent-soft fill)
  - Landscape-only typography overrides removed -- 96px/44px/22px/17px now apply uniformly in portrait and landscape
  - ScorePanel.test.ts + CheckoutSuggestion.test.ts (Wave 0 test-coverage gaps closed)
affects: [10-scoring-surface phase sign-off, any future spectator-display work reusing the same DS score typography tokens]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS/template-only restyle pass: script-block store-read logic ({#each}, isActive, matchStore.suggestion guard) left byte-identical, verified by new component tests targeting rendered DOM"
    - "Numeric sub-values inside a label row wrapped in their own <span class=\"legs-value\"> to carry independent weight/color, matching DS ScoreCard.jsx's nested-span pattern"

key-files:
  created:
    - src/ui/input/ScorePanel.test.ts
    - src/ui/input/CheckoutSuggestion.test.ts
  modified:
    - src/ui/input/ScorePanel.svelte
    - src/ui/input/CheckoutSuggestion.svelte

key-decisions:
  - "Landscape @media typography overrides (32px/80px/52px/22px) removed entirely per RESEARCH.md Pitfall 4 -- DS ScoreCard.jsx has no orientation-specific scale; structural landscape rules (flex/padding/gap) kept unchanged"
  - "CheckoutSuggestion's box-shadow: var(--glow-accent) is CONTEXT.md's explicit 'Claude's Discretion' addition beyond the literal DS sample (which only glows the whole card, not the pill)"

patterns-established:
  - "ScorePanel/CheckoutSuggestion computed-style tests follow the StatCard.test.ts pattern: import '../../app.css' for :root tokens, vitest-browser-svelte render(), getComputedStyle() assertions, partial .toContain() match for multi-value box-shadow"

requirements-completed: [SCOR-04]

coverage:
  - id: D1
    description: "Active player's remaining score renders at 96px/800 with amber inset-edge box-shadow + ambient glow, uniformly in portrait and landscape (no separate landscape scale)"
    requirement: "SCOR-04"
    verification:
      - kind: unit
        ref: "src/ui/input/ScorePanel.test.ts#.player-card.active .remaining-active computed font-size is 96px and font-weight is 800"
        status: pass
      - kind: unit
        ref: "src/ui/input/ScorePanel.test.ts#.player-card.active computed box-shadow contains the accent color"
        status: pass
    human_judgment: false
  - id: D2
    description: "Inactive player's remaining score renders at 44px/700; player name ellipsis-truncates on overflow"
    requirement: "SCOR-04"
    verification:
      - kind: unit
        ref: "src/ui/input/ScorePanel.test.ts#inactive player .remaining-inactive computed font-size is 44px and font-weight is 700"
        status: pass
      - kind: unit
        ref: "src/ui/input/ScorePanel.test.ts#.player-name computed text-overflow is ellipsis and white-space is nowrap"
        status: pass
    human_judgment: false
  - id: D3
    description: "CheckoutSuggestion renders as an amber-glowing pill (17px/700, 999px radius); the existing D-12 null-suggestion behavior is unchanged"
    requirement: "SCOR-04"
    verification:
      - kind: unit
        ref: "src/ui/input/CheckoutSuggestion.test.ts#.suggestion computed font-size is 17px, font-weight is 700, border-radius is 999px"
        status: pass
      - kind: e2e
        ref: "npx playwright test full-match-flow"
        status: pass
    human_judgment: false
  - id: D4
    description: "3-4 player landscape layout (~1024px wide) with 96px active score does not clip or wrap"
    verification: []
    human_judgment: true
    rationale: "Per CONTEXT.md's gate and config human_verify_mode=end-of-phase, this is an explicit manual-only spot-check deferred to end-of-phase review rather than a blocking checkpoint in this plan -- see RESEARCH.md Pitfall 4."

# Metrics
duration: 8min
completed: 2026-07-14
status: complete
---

# Phase 10 Plan 4: Restyle ScorePanel & CheckoutSuggestion to DS ScoreCard Summary

**ScorePanel/CheckoutSuggestion restyled to DS ScoreCard.jsx: 96px/800 amber-edged active score, 44px/700 inactive, amber-glowing checkout pill, landscape font overrides removed**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-14T03:55:00Z (approx, following 10-03 completion)
- **Completed:** 2026-07-14T04:03:00Z
- **Tasks:** 2 completed
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments
- `ScorePanel.svelte` active player card: amber inset-edge box-shadow + ambient glow + accent-soft/surface-2 gradient background, 96px/800 score with amber text-shadow
- `ScorePanel.svelte` inactive player card: 44px/700 score, `--text-soft` dimmed name
- `player-name` ellipsis-truncates on overflow; `legs-info` numeric values isolated in `.legs-value` spans (700 weight)
- Landscape `@media` typography overrides (32px/80px/52px/22px) fully removed -- DS scale now applies uniformly in both orientations, resolving RESEARCH.md Pitfall 4's overflow risk by design (structural landscape layout rules retained)
- `CheckoutSuggestion.svelte` restyled from plain 14px text to an amber-glowing pill (17px/700, `--radius-pill`, `--accent-soft` fill, `--glow-accent` shadow)
- `ScorePanel.test.ts` (4 tests) + `CheckoutSuggestion.test.ts` (1 test) created, closing the Wave 0 test-coverage gap for these components
- Zero new bust-handling code added to `ScorePanel.svelte` (SCOR-04's BUST requirement is satisfied entirely by 10-03's dart-pill treatment, confirmed via `grep -c "bust"` returning 0)

## Task Commits

Each task was committed atomically:

1. **Task 1: Write ScorePanel.test.ts + CheckoutSuggestion.test.ts (RED)** - `b21144d` (test)
2. **Task 2: Restyle ScorePanel.svelte + CheckoutSuggestion.svelte to DS values, remove landscape font override (GREEN)** - `adceb8b` (feat)

**Plan metadata:** (pending -- this commit)

## Files Created/Modified
- `src/ui/input/ScorePanel.test.ts` - 4 computed-style tests for active/inactive score typography, accent box-shadow, name ellipsis truncation
- `src/ui/input/CheckoutSuggestion.test.ts` - 1 computed-style test for pill typography/shape
- `src/ui/input/ScorePanel.svelte` - DS restyle: active-card box-shadow/gradient, active/inactive score typography, name truncation, legs-value spans, landscape override removal
- `src/ui/input/CheckoutSuggestion.svelte` - DS restyle: pill background/border/radius/shadow

## Decisions Made
- Landscape-only typography overrides removed entirely (not scaled down) per RESEARCH.md Pitfall 4 and the DS source having no orientation-specific scale; structural landscape layout rules (`flex`, `padding`, `gap`, `justify-content`) kept unchanged since they are layout, not typography scale
- `CheckoutSuggestion`'s `box-shadow: var(--glow-accent)` added as CONTEXT.md's explicit "Claude's Discretion" extension beyond the literal DS sample (which only glows the whole ScoreCard, not the pill itself)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `src/ui/input/ScorePanel.svelte` and `src/ui/input/CheckoutSuggestion.svelte` now fully match the DS `ScoreCard.jsx` spec; both components' store-read logic is byte-identical to before this plan (verified by new tests exercising the same `{#each}`/`isActive`/`matchStore.suggestion` code paths)
- Full test suite (555 tests) and `full-match-flow` E2E stay green
- **Deferred to end-of-phase review (per `human_verify_mode=end-of-phase`):** manual dev-server spot-check of 3-4 player landscape layout (~1024px) to confirm the now-uniform 96px active score does not clip or wrap in the narrowest realistic column -- see Coverage D4 and RESEARCH.md Pitfall 4. This was the plan's only human-check item; if overflow is observed at end-of-phase, it is a scope question for that review, not something to silently patch here.
- This closes Phase 10 (Scoring Surface) plan 4 of 4 -- all four 10-xx plans are now complete, ready for phase-level verification/UAT.

---
*Phase: 10-scoring-surface*
*Completed: 2026-07-14*
