---
phase: 11-spectator-display
reviewed: 2026-07-14T04:30:04Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/ui/display/MatchHeader.svelte
  - src/ui/display/PlayerPanel.svelte
  - src/ui/display/VisitLine.svelte
  - src/ui/display/VisitLine.test.ts
  - src/ui/input/dart-notation.ts
  - src/ui/input/dart-notation.test.ts
findings:
  critical: 1
  warning: 2
  info: 1
  total: 4
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-07-14T04:30:04Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Reviewed the Phase 11 spectator-display restyle (`MatchHeader`, `PlayerPanel`, `VisitLine`, `dart-notation`) against the Chrome 90 Cast-receiver constraint called out in the review brief, and diffed each file against `f92ccc1` to isolate exactly what this phase changed.

Good news first: `MatchHeader.svelte` is a faithful, bug-free transcription of `design/components/display/MatchHeader.jsx` (gap/padding/font-size/dot values, and the precomputed `rgba(240, 164, 36, 0.28)` bloom all match the design source's `color-mix(in oklab, var(--accent) 28%, transparent)` exactly — `--accent: #f0a424` = `rgb(240, 164, 36)`). `formatDartShort` in `dart-notation.ts` is also an exact, verified transcription of `DartPill.jsx`'s `formatDart` (miss → `✕`, inner bull → `Bull`, outer bull → `Outer`, T/D prefixes), and `VisitLine.test.ts` / `dart-notation.test.ts` were updated consistently with that contract. No `color-mix`, `dvh`, or ungated `:has()`/`subgrid` usage was found; the `subgrid` fallback in `PlayerPanel.svelte` correctly re-declares explicit tracks. `PlayerPanel.test.ts` (not part of this diff) is untouched, confirming the `.remaining-score` selector spectator-sync depends on still resolves to a bare text node, and no display-store/cast-sync files were touched by this diff.

The one real problem: the `@supports not (container-type: inline-size)` Chrome-90 fallback block in `PlayerPanel.svelte` is **incomplete**. It faithfully mirrors every `var(--display-*)` token consumer and the `.player-panel` padding/gap, but misses four `cqw` declarations inside the history list — two of which this very diff modified the values of (`row-gap`, `column-gap`, row `padding`) without adding matching fallback entries. On the Chrome 90 receiver this is not a cosmetic issue: it collapses history-row spacing/padding to zero, which is the same class of "unreadable on the TV" defect the code comments say was already found and fixed once (UAT 07, 3rd pass).

## Critical Issues

### CR-01: Chrome-90 `cqw` fallback is missing 4 declarations touched by this diff — history rows collapse to zero padding/gap

**File:** `src/ui/display/PlayerPanel.svelte:350`, `:363`, `:372-373`, `:406`

**Issue:** The `@supports not (container-type: inline-size)` block (lines 553-569) is documented as covering "every `clamp(min, Ncqw, max)` above," but it only mirrors the `var(--display-*)` token consumers plus `.player-panel` padding/gap. Four other `cqw`-based declarations are left completely unguarded:

- `.history-box { padding: clamp(5px, 1cqw, 12px); }` (line 350)
- `.history-section { row-gap: clamp(4px, 0.8cqw, 10px); }` (line 363)
- `.history-row { column-gap: clamp(0.4em, 1.5cqw, 1em); padding: clamp(4px, 0.9cqw, 10px) clamp(8px, 1.6cqw, 16px); }` (lines 372-373)
- `.h-darts { gap: clamp(0.2em, 0.8cqw, 0.5em); }` (line 406)

Three of these four are values this very diff changed (`row-gap` 3px/9px→4px/10px, `column-gap` 0.9em→1em, row `padding` 3px/9px→4px/10px and 6px/14px→8px/16px), so whoever touched the fallback block for the sibling font-size properties did not extend it to these spacing properties in the same pass.

On Chrome 90, `cqw` is an unsupported unit, so each `clamp(...)` value containing it is invalid at parse time. Per CSS error handling, an invalid declaration is dropped entirely — there is no other declaration for these properties on these selectors, so they resolve to their initial values: `padding` → `0`, `gap`/`row-gap`/`column-gap` → `normal` (effectively `0`). The result on the Chromecast receiver: the history box loses its inner padding, visit rows lose their vertical gap and touch each other, and dart pills within a row touch each other with no gap — directly undermining the readability goal this fallback block exists for, on the one browser (Chrome 90 Cast receiver) the project explicitly treats as load-bearing.

**Fix:** Add the missing declarations to the existing `@supports not (container-type: inline-size)` block, following the same `Ncqw ≈ calc(Nvw / player-count)` pattern already used for the other rules:

```css
@supports not (container-type: inline-size) {
	/* ...existing rules... */
	.history-box     { padding: clamp(5px, calc(1vw / var(--player-count, 2)), 12px); }
	.history-section  { row-gap: clamp(4px, calc(0.8vw / var(--player-count, 2)), 10px); }
	.history-row {
		column-gap: clamp(0.4em, calc(1.5vw / var(--player-count, 2)), 1em);
		padding: clamp(4px, calc(0.9vw / var(--player-count, 2)), 10px)
			clamp(8px, calc(1.6vw / var(--player-count, 2)), 16px);
	}
	.h-darts          { gap: clamp(0.2em, calc(0.8vw / var(--player-count, 2)), 0.5em); }
}
```

## Warnings

### WR-01: Spectator-display labels are hardcoded English despite the project's German-only UI constraint

**File:** `src/ui/display/MatchHeader.svelte:14,18,20,25,27,29`, `src/ui/display/PlayerPanel.svelte:145,148,194,196`

**Issue:** `CLAUDE.md` states "Language: German UI throughout" as a hard project constraint. `MatchHeader.svelte` renders `Double Out` / `Single Out`, `First to N Sets` / `First to N Legs`, and `Leg N` verbatim in English; `PlayerPanel.svelte` renders `Sets:` / `Legs:` and `BUST`. These strings pre-date this diff (only CSS values were touched here), but both files are squarely in this phase's review scope and the spectator display is one of the two primary screens of the app — an English-only "Leg 2 ● First to 3 Sets" header on the TV screen everyone in the room reads is a direct violation of a stated hard requirement, not a style nit.

**Fix:** Route these labels through the project's i18n mechanism (per the tech stack, `svelte-i18n`) or a local German string table, e.g. `Doppel-Aus` / `Einfach-Aus`, `Best of N Sätze` / `Best of N Legs`, `Leg N`, `Sätze:` / `Legs:`. If this is intentionally deferred to a later localization phase, note that explicitly in ROADMAP/STATE so it isn't mistaken for "done."

## Info

### IN-01: `VisitLine.svelte` is dead code — not imported by any route, yet still being maintained

**File:** `src/ui/display/VisitLine.svelte`, `src/ui/display/VisitLine.test.ts`

**Issue:** `src/routes/display/+page.svelte` only imports `MatchHeader` and `PlayerPanel`; `VisitLine.svelte` is not referenced from any route or from `PlayerPanel.svelte` (which explicitly replaced it — see the "replaces the separate VisitLine" comment at `PlayerPanel.svelte:33`). The only remaining consumer of `VisitLine.svelte` is its own test file. This diff nonetheless updated `VisitLine.svelte`'s internals (swapped its local `formatDart` for the shared `formatDartShort`) and its test expectations, i.e. effort was spent keeping an orphaned component in sync with the new notation contract. Its own `.visit-line` rule also uses an ungated `cqw` value (`clamp(1rem, 5cqw, 3.2rem)`), which would be a Chrome-90 hazard too if this component were ever wired back up.

**Fix:** Either delete `VisitLine.svelte` + `VisitLine.test.ts` now that `PlayerPanel` fully absorbed its responsibility (bottom live-row + completed history), or, if it's intentionally kept as a reusable building block for a future layout, add a comment at the top of the file noting it is currently unused so future readers don't assume it's on the render path.

---

_Reviewed: 2026-07-14T04:30:04Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
