---
phase: 08-design-foundation
plan: 04
subsystem: ui
tags: [svelte, css-custom-properties, design-tokens, motion, tabular-nums]

# Dependency graph
requires:
  - phase: 08-design-foundation (08-01, 08-02)
    provides: DS token files (src/styles/*.css), src/app.css aggregator, self-hosted fonts
provides:
  - 14 spectator-display/setup/history components fully swept to DS tokens (zero hardcoded hex/rgba)
  - PlayerPanel's 54 combined hex+rgba occurrences swept, including liveRowPulse's locked exception
  - PlayerPanel score elements (.remaining-score, .h-total) carrying --font-score
  - MatchSetup's .info-hint mapped to the DS's dedicated --surface-hint "info bubble" token
affects: [09-core-components, 10-scoring-surface, 11-display-cqw-scale, 12-page-layouts]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "White/near-white translucent overlay fills with no matching accent/destructive token
      (rgba(255,255,255,x) chip/box/pill backgrounds) map to var(--line) or var(--line-strong)
      by alpha proximity, not var(--text-faint) — text-faint is reserved for text/flash roles;
      line/line-strong are the DS's only near-white translucent family for fill/border roles"
    - "Off-white text at partial alpha (rgba(240,240,240,x)) maps by alpha band: ~0.5-0.6 ->
      var(--text-muted), ~0.74-0.78 -> var(--text-soft), ~0.35 -> var(--text-faint)"
    - "Solid dark greys with no blue tint (#333, #2a2d35, #2d2d35, #22242d) map to the nearest
      surface step by RGB distance, not by a fixed rule — computed per-value against
      surface/surface-2/surface-3 rather than assumed from position in the file"
    - "Semantic role wins over raw numeric distance when the DS names an exact use-case:
      MatchSetup's tooltip background (#272a33) is numerically closer to --surface-2, but
      --surface-hint is documented specifically for 'info hint bubbles' and was used instead"

key-files:
  created: []
  modified:
    - src/ui/display/IdleScreen.svelte
    - src/ui/display/MatchHeader.svelte
    - src/ui/display/VisitLine.svelte
    - src/ui/display/LegWinBanner.svelte
    - src/ui/setup/ProfileManager.svelte
    - src/ui/display/MatchWinDisplay.svelte
    - src/ui/display/SpectatorChooser.svelte
    - src/ui/display/PlayerPanel.svelte
    - src/ui/setup/PlayerPicker.svelte
    - src/ui/setup/BullOffOrder.svelte
    - src/ui/setup/MatchSetup.svelte
    - src/ui/history/HistoryRow.svelte
    - src/ui/history/MatchStatBreakdown.svelte
    - src/ui/history/PlayerStatRow.svelte

key-decisions:
  - "PlayerPanel's .live-row background (rgba(232,160,32,0.18)) mapped to var(--accent-soft)
    per the plan's explicit judgment call (no exact 18%-alpha DS token exists)"
  - "PlayerPanel's active-panel box-shadow used two different accent tokens for two different
    shadow layers (var(--accent-soft) for the wide 60px inset glow, var(--accent-line) for the
    sharp 4px inset edge) — chosen by semantic role (glow vs. edge/line) rather than pure
    numeric alpha distance, since the DS token names describe exactly that distinction"
  - "MatchHeader's gradient header background (#24272f -> #181a21) and PlayerPanel's two panel
    gradients (#1f222b/#16181f inactive, #2b2f3b/#1c1f29 active) mapped to the nearest
    surface-step pair by RGB distance (surface-2/surface, surface-3/surface-2 respectively)"
  - "PlayerPanel's near-white text/fill colors with no direct token split across three buckets
    by alpha: --line/--line-strong for fills/borders, --text-muted/--text-soft/--text-faint
    for text, following the RGB-distance method documented in tech-stack.patterns"
  - "MatchSetup's .info-hint background mapped to var(--surface-hint), the DS token explicitly
    documented for 'info hint bubbles', overriding a numerically closer --surface-2 match"
  - "Radius sanity-check applied per-role across all 14 files: row/card containers ->
    --radius-md, buttons/chips/inputs -> --radius-sm, small circular badges (guest-badge,
    dart-pill, checkout-route) -> --radius-pill, compact popovers that must stay visually
    small (SpectatorChooser landscape menu) -> --radius-xs"

requirements-completed: [FOUND-01, FOUND-02, FOUND-03, FOUND-04]

coverage:
  - id: D1
    description: "All 14 files show 0 hardcoded hex/rgba color literals (grep gate, excluding {#each} template-syntax false positives)"
    requirement: "FOUND-01"
    verification:
      - kind: unit
        ref: "grep -Ev '\\{#each' <file> | grep -Ec '#[0-9a-fA-F]{3,6}|rgba\\(' across all 14 files"
        status: pass
    human_judgment: false
  - id: D2
    description: "PlayerPanel's liveRowPulse keyframe preserves its locked 1.6s ease-in-out infinite duration"
    requirement: "FOUND-04"
    verification:
      - kind: unit
        ref: "grep 'liveRowPulse 1.6s ease-in-out infinite' src/ui/display/PlayerPanel.svelte"
        status: pass
    human_judgment: false
  - id: D3
    description: "PlayerPanel's .live-row background resolves to var(--accent-soft), not a raw rgba()"
    requirement: "FOUND-01"
    verification:
      - kind: unit
        ref: "grep -A1 'history-row.live-row' src/ui/display/PlayerPanel.svelte"
        status: pass
    human_judgment: false
  - id: D4
    description: "PlayerPanel's .remaining-score and .h-total declare font-family: var(--font-score)"
    requirement: "FOUND-02"
    verification:
      - kind: unit
        ref: "grep 'font-family: var(--font-score)' src/ui/display/PlayerPanel.svelte"
        status: pass
    human_judgment: false
  - id: D5
    description: "No script/logic changes to MatchSetup or BullOffOrder — diff limited to <style> blocks"
    requirement: "FOUND-03"
    verification:
      - kind: unit
        ref: "git diff --stat + manual diff review of src/ui/setup/MatchSetup.svelte and src/ui/setup/BullOffOrder.svelte"
        status: pass
    human_judgment: false
  - id: D6
    description: "Full test suite stays green (no regressions from the sweep)"
    verification:
      - kind: unit
        ref: "npm test (vitest run, both projects, 30 files / 512 tests)"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-07-13
status: complete
---

# Phase 8 Plan 4: Sweep Spectator-Display/Setup/History Components Summary

**Swept 14 spectator display, setup, and history components to DS color/radius/motion tokens, including PlayerPanel's 54-occurrence hex/rgba density and its locked liveRowPulse motion exception.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-07-13T20:55:00Z (approx.)
- **Completed:** 2026-07-13T21:09:11Z
- **Tasks:** 3
- **Files modified:** 14

## Accomplishments
- Replaced all hardcoded hex/rgba color literals across 14 components with DS `var(--token)` equivalents
- Dropped all `var(--token, #fallback)` dead fallbacks in these 14 files
- Retimed 9 transitions/animations to `--dur-*`/`--ease` tokens (MatchHeader's bannerFadeIn analog in LegWinBanner, MatchWinDisplay's matchWinFadeIn, SpectatorChooser's slideUp/fadeIn, PlayerPanel's bustFadeIn/bustLabelIn/background-transition/remaining-score-transition/history-row-transition, BullOffOrder's border-color transition)
- Preserved PlayerPanel's locked `liveRowPulse` exception verbatim (`1.6s ease-in-out infinite`), only dropping the `var(--accent, #e8a020)` fallbacks on its two box-shadow references
- Mapped PlayerPanel's `.live-row` background (`rgba(232,160,32,0.18)`) to `var(--accent-soft)` per the plan's documented judgment call
- Applied `--font-score` to PlayerPanel's `.remaining-score` and `.h-total` (tabular-nums already cascaded from the `.player-panel` container rule)
- Sanity-checked every radius call site: row/card containers → `--radius-md`, buttons/chips/inputs → `--radius-sm`, circular badges/pills → `--radius-pill`, one compact popover kept at `--radius-xs`
- Applied the text-on-accent-fill pairing fix (`var(--on-accent)`, not `var(--bg)`) to ProfileManager's avatar, PlayerPicker's avatar, BullOffOrder's avatar/tapped-position/confirm-btn, MatchSetup's chip/seg-btn/start-btn active states
- Confirmed zero script/logic changes to MatchSetup and BullOffOrder — diffs are `<style>`-block only

## Task Commits

Each task was committed atomically:

1. **Task 1: Sweep IdleScreen, MatchHeader, VisitLine, LegWinBanner, ProfileManager** - `283083f` (feat)
2. **Task 2: Sweep MatchWinDisplay, SpectatorChooser, PlayerPanel, PlayerPicker** - `55d56fa` (feat)
3. **Task 3: Sweep BullOffOrder, MatchSetup, HistoryRow, MatchStatBreakdown, PlayerStatRow** - `4e079e6` (feat)

**Plan metadata:** (pending — this commit)

## Files Created/Modified
- `src/ui/display/IdleScreen.svelte` - Background/text color tokens, space-md fallback drop
- `src/ui/display/MatchHeader.svelte` - Gradient background mapped to surface tokens, accent/text tokens, accent bloom mapped to `--accent-soft`
- `src/ui/display/VisitLine.svelte` - Text color fallback cleanup
- `src/ui/display/LegWinBanner.svelte` - Scrim mapped to `--backdrop`, accent colors, bannerFadeIn retimed to `--dur-med`
- `src/ui/setup/ProfileManager.svelte` - Colors, radius (`--radius-md`/`--radius-sm`/`--radius-lg`), avatar on-accent text fix, `--border-input` on inputs
- `src/ui/display/MatchWinDisplay.svelte` - Colors, matchWinFadeIn retimed to `--dur-slow`
- `src/ui/display/SpectatorChooser.svelte` - Inline SVG stroke token, colors, radius, slideUp/fadeIn retimed to `--dur-med`
- `src/ui/display/PlayerPanel.svelte` - Densest file (54 occurrences): gradients, bust overlay/label, ls-chip, remaining-score + `--font-score`, history-box, history-row/live-row (locked exception preserved), dart-pill variants, checkout-route, stats-line
- `src/ui/setup/PlayerPicker.svelte` - Colors, radius, on-accent text fix
- `src/ui/setup/BullOffOrder.svelte` - Colors, radius, on-accent text fix, border-color transition retimed
- `src/ui/setup/MatchSetup.svelte` - Colors, radius (chips/seg-control/steppers/toggle-row/start-btn), `.info-hint` mapped to `--surface-hint`, on-accent text fixes, no script changes
- `src/ui/history/HistoryRow.svelte` - Colors, pressed-state background mapped to `--surface-3`
- `src/ui/history/MatchStatBreakdown.svelte` - Colors, radius
- `src/ui/history/PlayerStatRow.svelte` - Colors

## Decisions Made
- Ambiguous colors/radii with no exact 1:1 entry in the old→new mapping table were resolved by nearest-DS-token-by-role (RGB distance for surface steps, alpha proximity for accent/destructive/text tints, semantic naming when the DS explicitly documents a role), per CONTEXT.md's explicit discretion clause — full list in frontmatter `key-decisions`
- `{#each ...}` Svelte template loops trigger a false positive in the hex-literal grep gate (`#each` contains the hex-valid substring `#eac`) — verified by manual inspection that every remaining grep hit across all 14 files is this template syntax, not an actual color literal

## Deviations from Plan

None - plan executed exactly as written. All three tasks' acceptance criteria (grep gate, locked motion exception, `--font-score`/tabular-nums, no-logic-change diff) were met without needing bug fixes, missing-functionality additions, or blocking-issue workarounds.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 14 files in this plan's scope are free of hardcoded colors; full test suite (30 files, 512 tests) passes
- Phase 8 (Design Foundation) sweep is now complete across all component families covered by plans 08-01 through 08-04
- Phase 9 (Core Components) and later phases can build on these tokens without further foundation-layer sweep work in this component set
- No blockers

---
*Phase: 08-design-foundation*
*Completed: 2026-07-13*

## Self-Check: PASSED

All 14 modified component files + this SUMMARY.md confirmed present on disk. All 3 task commits (`283083f`, `55d56fa`, `4e079e6`) confirmed present in `git log`.
