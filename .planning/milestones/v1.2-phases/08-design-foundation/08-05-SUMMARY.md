---
phase: 08-design-foundation
plan: 05
subsystem: ui
tags: [svelte, css-custom-properties, design-tokens, sveltekit]

requires:
  - phase: 08-design-foundation (08-01, 08-02)
    provides: DS token files (src/styles/*.css), self-hosted fonts, base motion/reduced-motion collapse
provides:
  - Stats components (StatCard, 3 SVG charts, ProfileStatDashboard) fully swept to DS tokens
  - 7 route pages (start hub, stats, history list/detail, data, match, display) fully swept to DS tokens
  - StatCard value display using --font-score + tabular-nums
affects: [09-core-components, 10-scoring-surface, 11-spectator-display, 12-app-pages]

tech-stack:
  added: []
  patterns:
    - "SVG presentation attributes (fill/stroke) resolve var(--token) values same as CSS properties -- used across all 3 bespoke chart components"
    - "Old #444/#444444 (previously mapped to --board-stroke for Dartboard.svelte) mapped to var(--line-strong) instead when used as a non-board hairline/gridline/muted-fill role"
    - "Pressed-state backgrounds (:active) map to var(--surface-3) by DS-documented role ('pressed/highest layer'), not by numeric hex proximity to --surface-2"
    - "Old accent-tinted rgba() banners/scrims map to var(--accent-soft)/var(--accent-line) by alpha proximity; old dark rgba() floating-button backgrounds map to var(--backdrop) (scrim-role precedent from 08-03)"

key-files:
  created: []
  modified:
    - src/ui/stats/StatCard.svelte
    - src/ui/stats/AverageTrendChart.svelte
    - src/ui/stats/DartsPerLegChart.svelte
    - src/ui/stats/ScoreDistributionChart.svelte
    - src/ui/stats/ProfileStatDashboard.svelte
    - src/routes/+page.svelte
    - src/routes/stats/+page.svelte
    - src/routes/history/+page.svelte
    - src/routes/history/[id]/+page.svelte
    - src/routes/data/+page.svelte
    - src/routes/match/+page.svelte
    - src/routes/display/+page.svelte

key-decisions:
  - "match/+page.svelte's dart-pill border (#444/#444444) mapped to var(--line-strong), not var(--board-stroke) -- it's a non-board hairline (visit-strip slot), not Dartboard.svelte itself"
  - "display/+page.svelte's fullscreen-prompt CTA gradient (#f0ab2c -> #e8a020) mapped to var(--accent-bright) -> var(--accent) to preserve the existing light-to-dark gradient direction using the DS's own named gradient-role tokens, without building the full Phase-9 Button treatment"
  - "fullscreen-prompt's box-shadow (0 6px 22px rgba(232,160,32,.35)) mapped wholesale to var(--glow-accent) despite differing blur/offset/alpha -- no exact token exists and Phase 8 only requires 'nearest token now'"
  - "data/+page.svelte's .storage-warning banner radius mapped to var(--radius-sm), consistent with MatchSetup's .info-hint precedent from 08-04, not var(--radius-md)"

requirements-completed: [FOUND-01, FOUND-02, FOUND-03, FOUND-04]

coverage:
  - id: D1
    description: "5 stats components (StatCard + 3 SVG charts + ProfileStatDashboard) swept to 0 hardcoded hex/rgba, StatCard uses --font-score + tabular-nums, chart SVG structure unchanged"
    requirement: "FOUND-01"
    verification:
      - kind: unit
        ref: "grep -Ev '\\{#each' <file> | grep -Ec '#[0-9a-fA-F]{3,6}|rgba\\(' -- 0 for all 5 files"
        status: pass
      - kind: unit
        ref: "npx vitest run --project unit -- 435 passed"
        status: pass
    human_judgment: false
  - id: D2
    description: "5 route pages (start hub, stats, history list/detail, data) swept to 0 hardcoded hex/rgba, .menu-btn--accent uses accent+on-accent pairing, .menu-btn radius sanity-checked, no script changes"
    requirement: "FOUND-01"
    verification:
      - kind: unit
        ref: "grep -Ev '\\{#each' <file> | grep -Ec '#[0-9a-fA-F]{3,6}|rgba\\(' -- 0 for all 5 files"
        status: pass
      - kind: unit
        ref: "npx vitest run --project unit -- 435 passed"
        status: pass
    human_judgment: false
  - id: D3
    description: "match/+page.svelte and display/+page.svelte swept to 0 hardcoded hex/rgba, fadeIn/fadeInExit retimed to --dur-base/--ease, radius call sites sanity-checked, no script/logic changes, build succeeds, no new E2E regressions"
    requirement: "FOUND-01, FOUND-04"
    verification:
      - kind: unit
        ref: "grep -Ev '\\{#each' <file> | grep -Ec '#[0-9a-fA-F]{3,6}|rgba\\(' -- 0 for both files"
        status: pass
      - kind: other
        ref: "npm run build"
        status: pass
      - kind: e2e
        ref: "npx playwright test e2e/full-match-flow.spec.ts e2e/spectator-sync.spec.ts -- 4 failures, all identical to documented pre-existing baseline in deferred-items.md (no new regressions)"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-07-13
status: complete
---

# Phase 8 Plan 5: Stats Components & Route Pages Sweep Summary

**Swept 12 files (5 stats components incl. 3 bespoke SVG charts + 7 route page shells including match/display) from hardcoded hex/rgba colors to DS design tokens -- pure presentation change, zero functional/script diffs.**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-07-13T21:24:32Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments
- StatCard, AverageTrendChart, DartsPerLegChart, ScoreDistributionChart, ProfileStatDashboard: all hardcoded hex/rgba replaced with `var(--token)` equivalents; the 3 bespoke SVG charts kept their exact structure (element count/types unchanged) per the "no chart rebuild" out-of-scope rule
- StatCard's value display now uses `font-family: var(--font-score)` and `font-variant-numeric: tabular-nums`
- Start hub, stats, history (list+detail), and data route pages fully swept; `.menu-btn--accent` uses the text-on-accent-fill pairing (`background: var(--accent); color: var(--on-accent);`); `.menu-btn` radius sanity-checked to `var(--radius-sm)`
- match/+page.svelte and display/+page.svelte (the two highest-density route shells) fully swept, including retiming `fadeIn`/`fadeInExit` keyframes to `var(--dur-base) var(--ease)` and sanity-checking all existing `var(--radius-*)` call sites
- All 12 files verified at 0 remaining hardcoded hex/rgba literals (grep gate, excluding `{#each}` Svelte template-syntax false positives per 08-04 precedent)
- Full unit+browser test suite (512 tests) stays green; production build succeeds; the two named E2E specs fail at exactly the same pre-existing points documented in `deferred-items.md` -- no new regressions introduced by this sweep

## Task Commits

Each task was committed atomically:

1. **Task 1: Sweep StatCard, AverageTrendChart, DartsPerLegChart, ScoreDistributionChart, ProfileStatDashboard** - `cbf0caf` (feat)
2. **Task 2: Sweep the start hub, stats, history (list+detail), and data route pages** - `3ce5ec1` (feat)
3. **Task 3: Sweep the two highest-density route shells -- match/+page.svelte and display/+page.svelte** - `0ce2cec` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/ui/stats/StatCard.svelte` - Background/text colors to tokens; value display gets --font-score + tabular-nums
- `src/ui/stats/AverageTrendChart.svelte` - SVG stroke/fill colors and card background/text to tokens
- `src/ui/stats/DartsPerLegChart.svelte` - SVG stroke/fill colors and card background/text to tokens
- `src/ui/stats/ScoreDistributionChart.svelte` - SVG stroke/fill colors and card background/text to tokens
- `src/ui/stats/ProfileStatDashboard.svelte` - Empty-state, heading, and divider colors to tokens
- `src/routes/+page.svelte` - Start hub: app-title, menu buttons, accent CTA, toggle-arrow transition to tokens
- `src/routes/stats/+page.svelte` - Profile picker/dashboard shell colors and focus rings to tokens
- `src/routes/history/+page.svelte` - History list shell colors to tokens
- `src/routes/history/[id]/+page.svelte` - Match detail shell, summary card, delete button colors to tokens
- `src/routes/data/+page.svelte` - Backup screen shell, cards, action buttons, storage-warning banner to tokens
- `src/routes/match/+page.svelte` - Scoring shell, dart pills, control deck, undo/toggle buttons, audio bar, back button colors + motion to tokens (scoring logic untouched)
- `src/routes/display/+page.svelte` - Spectator shell radial gradient, fullscreen controls, exit button colors + fadeIn/fadeInExit motion to tokens (sync/idle/banner logic untouched)

## Decisions Made
- `#444`/`#444444` in match/+page.svelte's dart-pill (a visit-strip slot border, not the Dartboard component itself) mapped to `var(--line-strong)` rather than `var(--board-stroke)` -- the PATTERNS.md board-stroke mapping applies specifically to `Dartboard.svelte`'s board rendering, not unrelated hairline borders elsewhere that happen to share the old hex value
- `:active` pressed-state backgrounds (`#2d2d2d`, `#22242d`) mapped to `var(--surface-3)` by the DS's documented "pressed/highest layer" role, overriding numeric hex proximity to `--surface-2` -- consistent with the 08-04 precedent (info-hint -> `--surface-hint` over closer `--surface-2`)
- display/+page.svelte's `.fullscreen-prompt` gradient (`#f0ab2c` -> `#e8a020`) mapped to `var(--accent-bright)` -> `var(--accent)`, preserving the light-to-dark gradient direction with the DS's own named tokens, without building the full Phase-9 (COMP-01) Button gradient/sheen treatment
- Its `box-shadow: 0 6px 22px rgba(232,160,32,.35)` mapped wholesale to `var(--glow-accent)` (`0 0 28px rgba(240,164,36,.18)`) despite differing offset/blur/alpha -- no exact DS token exists for this geometry, and Phase 8's rule is "use the nearest token now," not invent new precomputed values
- Old-accent rgba() banners/hover-tints (10-22% alpha) mapped to `var(--accent-soft)` (13%); ~35-45% alpha borders/lines mapped to `var(--accent-line)` (45%) -- nearest-alpha-proximity mapping per CONTEXT.md's "map to nearest DS token by role" discretion
- Floating semi-opaque dark backgrounds (`rgba(28,31,39,.6/.7/.85)` on back-btn/fullscreen-toggle/exit-btn) mapped to `var(--backdrop)` -- reusing the 08-03-established scrim-role precedent rather than inventing a new token
- data/+page.svelte's `.storage-warning` banner radius mapped to `var(--radius-sm)` (not `--radius-md`), consistent with MatchSetup's `.info-hint` precedent from 08-04 (info/hint bubbles use the smaller radius tier)
- Task 1 (stats components) intentionally did not touch `border-radius: 8px` literals since the plan's Sweep Rules list for that task explicitly invoked only Rules 1/3/5/7 (colors, fallback cleanup, motion, chart-no-rebuild) -- radius sanity-check (Rule 4) was not assigned to Task 1

## Deviations from Plan

None - plan executed exactly as written. One incidental fix (not a deviation from scope, a correction within the assigned task): a stale hex reference in a `StatCard.svelte` code comment (`value (20px/600/#f0f0f0) above label (14px/400/#888)`) was updated to reference the new tokens, since it fell within the file's grep verification gate and documents the exact styling this task changed.

## Issues Encountered
- The literal `grep -Ec '#[0-9a-fA-F]{3,6}|rgba\('` acceptance-criteria command produces false-positive matches against Svelte's `{#each ...}` template syntax (`#eac` is 3 valid hex chars before the non-hex `h`). This is the same known artifact documented in the 08-04 SUMMARY; verification for this plan used `grep -Ev '\{#each' <file> | grep -Ec ...` and confirmed 0 true hex/rgba literals remain in all 12 files.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- FOUND-01 through FOUND-04 requirements now fully covered across all Phase 8 plans (08-01 through 08-05) -- zero provisional hardcoded colors remain in the swept components/routes, DS radii/motion tokens applied and sanity-checked, `--font-score`/`tabular-nums` applied to all named score surfaces including StatCard
- The 6 pre-existing E2E failures documented in `deferred-items.md` remain unresolved (out of this plan's scope, tracked for a dedicated post-milestone repair effort per that file's recommendation) -- they did not regress and are not new
- Phase 9 (Core Components) can proceed to build the exact DS Button/Chip/Dialog/StatCard treatments on top of the token foundation now fully swept in

---
*Phase: 08-design-foundation*
*Completed: 2026-07-13*

## Self-Check: PASSED

All 12 modified files exist on disk; all 3 task commit hashes (cbf0caf, 3ce5ec1, 0ce2cec) found in git log.
