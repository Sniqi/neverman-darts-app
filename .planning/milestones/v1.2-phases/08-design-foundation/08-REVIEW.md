---
phase: 08-design-foundation
reviewed: 2026-07-13T00:00:00Z
depth: standard
files_reviewed: 55
files_reviewed_list:
  - src/app.css
  - src/styles/colors.css
  - src/styles/elevation.css
  - src/styles/fonts.css
  - src/styles/spacing.css
  - src/styles/typography.css
  - src/db/db.ts
  - src/db/profiles.ts
  - src/db/profiles.test.ts
  - src/lib/backup.test.ts
  - src/lib/design-tokens.test.ts
  - src/routes/+page.svelte
  - src/routes/data/+page.svelte
  - src/routes/display/+page.svelte
  - src/routes/history/[id]/+page.svelte
  - src/routes/history/+page.svelte
  - src/routes/match/+page.svelte
  - src/routes/stats/+page.svelte
  - src/ui/cast/ResumeToast.svelte
  - src/ui/dialogs/ConfirmDialog.svelte
  - src/ui/display/IdleScreen.svelte
  - src/ui/display/LegWinBanner.svelte
  - src/ui/display/MatchHeader.svelte
  - src/ui/display/MatchWinDisplay.svelte
  - src/ui/display/PlayerPanel.svelte
  - src/ui/display/SpectatorChooser.svelte
  - src/ui/display/VisitLine.svelte
  - src/ui/history/HistoryRow.svelte
  - src/ui/history/MatchStatBreakdown.svelte
  - src/ui/history/PlayerStatRow.svelte
  - src/ui/input/CheckoutSuggestion.svelte
  - src/ui/input/CorrectionWindow.svelte
  - src/ui/input/Dartboard.svelte
  - src/ui/input/DartsAtDoubleDialog.svelte
  - src/ui/input/Numpad.svelte
  - src/ui/input/ScorePanel.svelte
  - src/ui/input/StatDrawer.svelte
  - src/ui/input/VisitStrip.svelte
  - src/ui/overlays/MatchWinOverlay.svelte
  - src/ui/overlays/PauseOverlay.svelte
  - src/ui/overlays/RecordOverlay.svelte
  - src/ui/pwa/ReloadPrompt.svelte
  - src/ui/pwa/ReloadPrompt.test.ts
  - src/ui/setup/BullOffOrder.svelte
  - src/ui/setup/MatchSetup.svelte
  - src/ui/setup/PlayerPicker.svelte
  - src/ui/setup/ProfileManager.svelte
  - src/ui/start/ResumePrompt.svelte
  - src/ui/stats/AverageTrendChart.svelte
  - src/ui/stats/DartsPerLegChart.svelte
  - src/ui/stats/ProfileStatDashboard.svelte
  - src/ui/stats/ScoreDistributionChart.svelte
  - src/ui/stats/StatCard.svelte
  - e2e/offline-fonts.spec.ts
  - e2e/reduced-motion.spec.ts
  - vite.config.ts
findings:
  critical: 1
  warning: 2
  info: 2
  total: 5
status: fixed
fixed_at: 2026-07-13T00:00:00Z
fix_scope: critical_warning
fixed: 2
wont_fix: 1
deferred: 2
---

# Phase 8: Code Review Report

**Reviewed:** 2026-07-13
**Depth:** standard
**Files Reviewed:** 55
**Status:** fixed
**Fixed at:** 2026-07-13 — CR-01 and WR-02 fixed (commits `1ce517a`, `5753501`);
WR-01 deferred by design (Phase 11); IN-01/IN-02 no action (out of fix scope).

## Summary

This phase is a pure restyling sweep: hardcoded hex/rgba literals were replaced with CSS
custom properties from new token files (`colors.css`, `elevation.css`, `fonts.css`,
`spacing.css`, `typography.css`), webfonts were self-hosted, and motion durations were
retimed. I diffed every reviewed file against `93ece5f` rather than trusting the final
state in isolation, specifically to confirm the milestone's "no functional changes" rule.

**Scope discipline held up well.** Across all 36 `.svelte` files, `db.ts`/`profiles.ts`,
and `vite.config.ts`, the diff is CSS-value-only (including SVG `fill`/`stroke` attribute
values, which are cosmetic, not logic). The only two script-level changes are exactly the
two the phase called out as expected: the `Profile.color` default (`#e8a020` →
`#f0a424`) and the matching `ReloadPrompt.test.ts` color assertion. No other conditional,
event-handler, or data-flow logic changed anywhere in the reviewed set.

**One real Chrome-90/Chromecast regression survives the sweep**, in a file the phase itself
touched: `IdleScreen.svelte` still uses a bare `height: 100dvh` with no `@supports`
fallback, while the sibling `display/+page.svelte` was carefully rewritten (with a
multi-line comment explaining exactly why) to avoid this same failure mode. Since
`IdleScreen` is the first thing rendered on the physical Chromecast receiver (before any
match snapshot arrives), this is a provable functional regression on the project's explicit
platform constraint, not a theoretical one — see CR-01.

Beyond that, the sweep is otherwise mechanically sound (no `color-mix`, `:has`, or ungated
`cqw`/`container-type`/`subgrid` usage in any live-rendered path; the Chrome-90 fallbacks
added to `PlayerPanel.svelte` are correct and match the values they shadow), but the sweep
itself was applied inconsistently across files (WR-02) and leaves a number of newly-added
design tokens completely unused (WR-01, IN-01).

## Critical Issues

### CR-01: `IdleScreen.svelte` uses ungated `100dvh` — breaks on the Chromecast (Chrome 90) receiver

**Status:** Fixed (commit `1ce517a`)

**File:** `src/ui/display/IdleScreen.svelte:18`
**Issue:**
`.idle-screen` sets `height: 100dvh` with no fallback and no `@supports` gate:

```css
.idle-screen {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100dvh;   /* <-- unsupported on Chrome 90 */
	width: 100%;
	...
}
```

`IdleScreen` is rendered by `src/routes/display/+page.svelte` whenever
`matchState === null || matchState.phase === 'setup'` — i.e. it is the *first* thing shown
on the Chromecast receiver, before any match snapshot has arrived over the cast channel.

The sibling `.display-root` rule in `src/routes/display/+page.svelte` was deliberately
restructured in this same phase specifically to avoid this failure mode, with an explicit
comment documenting the mechanism:

```css
/* Base height for the Chromecast's Chrome 90 (no `dvh`, no container queries). This MUST be
   a single `height: 100vh` with the dvh upgrade in a SEPARATE @supports rule below. ...
   → the element gets no height → the panels-grid collapses to 0 and only the header shows
   (rootH=77, gridH=0). (UAT 07, 3rd pass — confirmed via on-screen receiver debug) */
.display-root { height: 100vh; ... }
@supports (height: 100dvh) { .display-root { height: 100dvh; } }
```

`IdleScreen.svelte` was touched by this phase (its background/color/gap were migrated to
tokens in the same commit range), but the identical `dvh` hazard in it was left unfixed.
On the actual Chromecast Chrome-90 runtime, `height: 100dvh` is an invalid declaration and
is ignored, so `.idle-screen` gets no explicit height; depending on ancestor sizing this
collapses/auto-sizes rather than filling the TV, breaking the "Warte auf Match…" waiting
screen on real hardware — the exact regression class this phase's own `PlayerPanel.svelte`
`@supports` fallbacks and the `display-root` rewrite were written to prevent.

**Fix:** Apply the same pattern used in `display/+page.svelte`:

```css
.idle-screen {
	...
	height: 100vh;
	width: 100%;
	...
}

@supports (height: 100dvh) {
	.idle-screen {
		height: 100dvh;
	}
}
```

## Warnings

### WR-01: New "spectator display scale" typography tokens are defined but never consumed — components hand-roll different values instead

**Status:** Won't fix — deferred by design. Per CONTEXT.md, the `--display-*` cqw
tokens were defined 1:1 now and are intentionally inert until their consuming
components are built in Phase 11. Wiring `PlayerPanel`/`MatchHeader`/
`LegWinBanner`/`MatchWinDisplay` to these tokens now would be out-of-scope
component-behavior work for a phase whose stated scope is token definitions
only, and risks drifting from the actual Phase 11 layout requirements.

**File:** `src/styles/typography.css:31-38`
**Issue:** This phase added five tokens explicitly documented as the sizing scale for the
spectator display:

```css
/* Spectator display scale — 27" at 3 m. Sizes scale with player-column width
   (cqw); minimums keep everything legible from across the room.
   caption = Ø labels/meta · body = visit rows/chips · emph = totals/checkout · name · score */
--display-caption: clamp(1.75rem, 4cqw, 5rem);
--display-body: clamp(2rem, 5cqw, 6.5rem);
--display-emph: clamp(2.5rem, 6.5cqw, 8rem);
--display-name: clamp(3rem, 10cqw, 12rem);
--display-score: clamp(6rem, 27cqw, 26rem);
```

None of these five custom properties is referenced anywhere in the codebase outside of
`typography.css` itself (verified by full-source grep). The components they were clearly
designed for instead define their own, *different*, hand-rolled `clamp()` expressions:

- `PlayerPanel.svelte` `.player-name`: `clamp(1.6rem, 11cqw, 8.5rem)` vs. `--display-name`'s
  `clamp(3rem, 10cqw, 12rem)`.
- `PlayerPanel.svelte` `.remaining-score`: `clamp(3rem, 23cqw, 16rem)` vs. `--display-score`'s
  `clamp(6rem, 27cqw, 26rem)`.

This defeats the point of the "Design Foundation" phase for this surface: the token and the
rendered value have already drifted apart on day one, so changing `--display-name` later
will silently do nothing, and a reader has no way to know the token is dead without
grepping for it.

**Fix:** Either wire `PlayerPanel.svelte`/`MatchHeader.svelte`/`LegWinBanner.svelte`/
`MatchWinDisplay.svelte` to consume `var(--display-name)`, `var(--display-score)`, etc.
directly, or remove the five unused tokens from `typography.css` if the per-component
values are intentionally bespoke.

### WR-02: Fallback-literal removal was applied inconsistently, leaving at least one stale/mismatched fallback value

**Status:** Fixed (commit `5753501`). Finished the fallback-removal sweep across
all 12 remaining files (`ConfirmDialog.svelte`, `ResumePrompt.svelte`,
`Numpad.svelte`, `ScorePanel.svelte`, `StatDrawer.svelte`, `VisitStrip.svelte`,
`CorrectionWindow.svelte`, `DartsAtDoubleDialog.svelte`, `MatchWinOverlay.svelte`,
`PauseOverlay.svelte`, `RecordOverlay.svelte`, `MatchSetup.svelte`), converting
every `var(--token, literal)` to bare `var(--token)`, including the stale
`var(--space-md, 12px)` at `MatchSetup.svelte:376`. `PlayerPanel.svelte`'s
`var(--player-count, 2)` fallbacks were intentionally left untouched — that is
a fallback for a JS-set custom property (not a design token) and is correct as
documented in the Summary above.

**File:** `src/ui/setup/MatchSetup.svelte:376` (representative example)
**Issue:** Per `ReloadPrompt.test.ts`'s own comment, this phase's stated convention was to
drop `var(--token, <literal fallback>)` fallbacks from component CSS ("08-03 sweep:
fallback literals were intentionally dropped from component CSS per CONTEXT.md"), and
`match/+page.svelte`, `display/+page.svelte`, and `ReloadPrompt.svelte` were fully swept to
bare `var(--token)`. However roughly a dozen other reviewed files still carry the old
`var(--token, literal)` form untouched (`ConfirmDialog.svelte`, `ResumePrompt.svelte`,
`Numpad.svelte`, `ScorePanel.svelte`, `StatDrawer.svelte`, `VisitStrip.svelte`,
`CorrectionWindow.svelte`, `DartsAtDoubleDialog.svelte`, `MatchWinOverlay.svelte`,
`PauseOverlay.svelte`, `RecordOverlay.svelte`, `MatchSetup.svelte`), so the "convention" is
not actually applied consistently across the swept surface.

Worse, at least one of the leftover fallbacks is stale relative to the current token value:

```css
/* MatchSetup.svelte:376 */
margin-bottom: calc(-1 * var(--space-md, 12px));
```

`spacing.css` defines `--space-md: 16px`, not `12px` — this fallback predates the current
spacing scale. It is currently harmless because `--space-md` is always defined at runtime,
but it is misleading dead documentation, and the exact class of bug `ReloadPrompt.test.ts`
had to work around (a component rendered without the global token sheet loaded, where the
fallback becomes the *actual* rendered value) would silently render 4px too little
negative margin here.

**Fix:** Either finish the fallback-removal sweep across all component styles for
consistency, or if fallbacks are intentionally kept in some files, correct the stale
`12px` → `16px` value in `MatchSetup.svelte:376` (and re-check the rest of that file/other
leftover files for other drifted literals).

## Info

### IN-01: Several new design tokens are defined but never referenced anywhere

**Status:** No action — out of fix scope. Default fix scope is Critical +
Warning; unused DS tokens are intentional day-one completeness (same rationale
as WR-01) and not addressed by this fix pass.

**File:** `src/styles/colors.css`, `src/styles/elevation.css`
**Issue:** Full-source grep shows these tokens are defined in the new token files but never
consumed by any component:

- `--edge-highlight` (`elevation.css:14`)
- `--ring-focus` (`elevation.css:15`) — actual focus styling in `typography.css:56-59` uses
  a literal `outline: 3px solid var(--focus-ring)` instead of this token
- `--surface-card`, `--text-body`, `--cta-bg`, `--cta-text` (`colors.css:51-54`, explicitly
  labeled "semantic aliases")
- `--positive`, `--positive-soft` (`colors.css:33-34`, labeled "leg/checkout won" — but
  `LegWinBanner.svelte`'s `.banner-name` and win-related styling all use `var(--accent)`,
  not `var(--positive)`)
- `--weight-heavy` (`typography.css:24`, labeled "giant scores")

**Fix:** Not urgent, but this is unused surface area from day one of the design system.
Either wire these into the components they were clearly intended for (leg/checkout wins →
`--positive`, focus rings → `--ring-focus`, raised edges → `--edge-highlight`) or drop them
until there's a consumer, so the token file reflects what's actually in use.

### IN-02: `VisitLine.svelte` and `VisitStrip.svelte` are orphaned components that still received token-migration edits

**Status:** No action — out of fix scope. Orphaned-component cleanup is out of
milestone scope for this fix pass. Note: `VisitStrip.svelte` did receive the
WR-02 fallback-literal fix (it was one of the 12 swept files) since that edit
is purely mechanical and harmless regardless of the component's reachability;
its dead-code status was not otherwise addressed.

**File:** `src/ui/display/VisitLine.svelte`, `src/ui/input/VisitStrip.svelte`
**Issue:** Neither component is imported anywhere outside its own test file
(`VisitLine.test.ts`, and no `VisitStrip.test.ts` even exists) — `PlayerPanel.svelte`
explicitly documents that it "replaces the separate VisitLine" with inline markup, and
`match/+page.svelte` inlines its own dart-pill/dart-column markup instead of importing
`VisitStrip`. Both dead components nonetheless had their hardcoded colors swept to tokens
in this phase, spending effort on unreachable code.

Separately, `VisitLine.svelte`'s `.visit-line` rule uses `font-size: clamp(1rem, 5cqw,
3.2rem)` with **no** `@supports` fallback for container-query-less browsers (unlike the
actively-used `PlayerPanel.svelte`, which has a full fallback block for exactly this
pattern). This is currently inert only because the component is unreachable; if it is ever
reactivated it will reproduce the same Chrome-90 collapse bug fixed elsewhere in this
phase.

**Fix:** Not this phase's concern to fix functionally, but worth flagging for cleanup —
either delete the two orphaned components or restore their usage. If kept around, `git blame`
already shows they're dead; don't spend further token-migration effort on them.

---

_Reviewed: 2026-07-13_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
