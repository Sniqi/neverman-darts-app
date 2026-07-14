---
phase: 09-core-components
reviewed: 2026-07-14T00:00:00Z
depth: standard
files_reviewed: 19
files_reviewed_list:
  - src/styles/components.css
  - src/app.css
  - src/routes/+page.svelte
  - src/routes/stats/+page.svelte
  - src/routes/history/+page.svelte
  - src/routes/history/[id]/+page.svelte
  - src/routes/data/+page.svelte
  - src/routes/match/+page.svelte
  - src/ui/dialogs/ConfirmDialog.svelte
  - src/ui/dialogs/ConfirmDialog.test.ts
  - src/ui/input/DartsAtDoubleDialog.svelte
  - src/ui/setup/MatchSetup.svelte
  - src/ui/setup/PlayerPicker.svelte
  - src/ui/setup/ProfileManager.svelte
  - src/ui/setup/BullOffOrder.svelte
  - src/ui/start/ResumePrompt.svelte
  - src/ui/stats/StatCard.svelte
  - src/ui/stats/StatCard.test.ts
  - src/ui/shared/components-css.test.ts
  - e2e/match-audio-toggle.spec.ts
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 9: Code Review Report

**Reviewed:** 2026-07-14
**Depth:** standard
**Files Reviewed:** 19 (+ e2e spec)
**Status:** issues_found

## Summary

This phase is a pure-restyling pass: shared `.btn`/`.switch` classes in `src/styles/components.css`, class swaps at usage sites, checkbox→button `role="switch"` conversions, and DS treatment for `ConfirmDialog`/`DartsAtDoubleDialog`/`StatCard`. I traced every diff hunk against `742a130^..HEAD`, cross-checked design tokens (`spacing.css`, `elevation.css`, `typography.css`, `colors.css`) against the new class definitions and their `.test.ts` assertions, ran `svelte-check` and the relevant Vitest browser-mode specs, and grepped the whole tree for leftover local CSS that could shadow the new shared classes.

The "same-commit local-CSS deletion" rule was followed correctly everywhere I checked (`ConfirmDialog`, `DartsAtDoubleDialog`, `MatchSetup`, `PlayerPicker`, `ProfileManager`, `BullOffOrder`, `ResumePrompt`, hub/stats/history/data pages, `/match` audio bar) — no duplicate `.btn`/`.switch`/`.thumb` rules exist outside `components.css`, and no old class names (`cta-btn`, `menu-btn--accent`, `action-btn`, `delete-btn`, `audio-check`, checkbox `input[type=checkbox]`) remain anywhere in `src/` or `e2e/`. Design tokens referenced by the new CSS (`--row-h`, `--hit-min`, `--control-h`, `--radius-pill`, `--press-scale`, `--ease-spring`, etc.) all resolve correctly, and the new component-css/StatCard/ConfirmDialog browser tests pass. `svelte-check` reports no new type errors from these files (pre-existing Chromecast-typing errors are unrelated to this phase).

The checkbox→button switch conversion is functionally sound (native `<button>` fires on both Enter and Space, `type="button"` prevents accidental form submission, `class:on`/`aria-checked` stay in sync with `$state`), but it introduces new, unaddressed `svelte-check` a11y lint warnings, and the phase's own justification for ignoring them is only partially backed by E2E evidence (see WR-01). I also found one real CSS-driven visual-size drift on menu-row chevrons that isn't reflected in the markup (IN-01), and a documentation inaccuracy in a code comment (IN-02).

No security issues, no `{@html}` usage, no hardcoded secrets, and no functional/state-logic regressions were found.

## Warnings

### WR-01: Checkbox→button switch conversion introduces new a11y lint warnings; the "verified by E2E" justification only covers 3 of 7 switches

**File:** `src/ui/setup/MatchSetup.svelte:226,261,278,300`, `src/routes/match/+page.svelte:293,317`

**Issue:** Converting the toggles from `<input type="checkbox" role="switch">` to `<button type="button" role="switch"><span class="thumb"/></button>` makes `svelte-check` emit `a11y_consider_explicit_label` ("Buttons and links should either contain text or have an `aria-label`...") for all 6 switch buttons — confirmed by running `npx svelte-check` on the repo:
```
WARNING "src/ui/setup/MatchSetup.svelte" 226:4 a11y_consider_explicit_label   (Sets)
WARNING "src/ui/setup/MatchSetup.svelte" 261:4 a11y_consider_explicit_label   (Caller)
WARNING "src/ui/setup/MatchSetup.svelte" 278:4 a11y_consider_explicit_label   (Musik)
WARNING "src/ui/setup/MatchSetup.svelte" 300:4 a11y_consider_explicit_label   (Automatische Pause)
WARNING "src/routes/match/+page.svelte" 293:6 a11y_consider_explicit_label   (Caller)
WARNING "src/routes/match/+page.svelte" 317:6 a11y_consider_explicit_label   (Musik)
```
This did not fire against the old `<input type="checkbox">` markup (Svelte's a11y ruleset doesn't apply this "text or aria-label" check to `<input>`), so this is a warning-count regression newly introduced by this phase, not a pre-existing condition.

`09-05-SUMMARY.md` documents this as a deliberate, accepted false positive ("buttons are labelable elements... verified at runtime via the pre-existing `getByRole('switch', {name:'Sets'})` E2E assertion"), and that reasoning is correct for the *Sets* toggle — `full-match-flow.spec.ts:27` does assert `getByRole('switch', { name: 'Sets' })`, and `match-audio-toggle.spec.ts` asserts `getByRole('switch', { name: 'Caller' })` / `{ name: 'Musik' }` for `/match`. But grepping every e2e spec shows **no** `getByRole('switch', {...})` assertion anywhere for MatchSetup's **Caller**, **Musik**, or **Automatische Pause** toggles — 3 of the 6 flagged buttons have zero runtime proof that the external `<label for>` association actually produces the intended accessible name. The blanket "known false positive, verified via E2E" claim in the phase docs is therefore only partially substantiated; if the label/id association ever regresses for one of those three (typo in `for=`/`id=`, a wrapping element inserted between label and button, etc.), no test would catch it, and screen-reader users would get an unlabeled `switch`.

**Fix:** Either add an explicit `aria-label` (or reuse the label text) directly on the three unverified `<button role="switch">` elements to make the accessible name self-contained and silence the linter, or add `getByRole('switch', { name: 'Caller' })` / `{ name: 'Musik' }` / `{ name: 'Automatische Pause' }` assertions to the MatchSetup e2e coverage (mirroring `full-match-flow.spec.ts:27`'s existing `Sets` assertion) so the documented justification is actually true for every switch it claims to cover. A `<!-- svelte-ignore a11y_consider_explicit_label -->` comment (with the existing rationale inline) should also be added at each site so `svelte-check` output stays clean without relying on tribal knowledge from a planning doc that most future contributors won't read.

### WR-02: `.btn.btn--icon` doc comment misattributes the override it exists for

**File:** `src/styles/components.css:137-138`

**Issue:** The comment reads: `/* .btn.btn--icon — fixed 48x48 square hit target for icon-only buttons. Two-class selector so it reliably overrides .btn--ghost's inherited width. */`. `.btn--ghost` (lines 126-135) never sets a `width` — the `width: 100%` being overridden is inherited from `.btn` itself (line 12), not from `.btn--ghost`. The two-class compound selector isn't even strictly required for that override (a single `.btn--icon { width: ... }` rule, appearing later in source order than `.btn`, would already win by source order at equal specificity) — it's just belt-and-braces. Not a functional bug, but a misleading comment that will send a future maintainer chasing the wrong cascade explanation when they touch `.btn--ghost` or the icon-button styling.

**Fix:** Correct the comment, e.g.: `/* Two-class selector for extra specificity so this reliably overrides .btn's own width: 100% regardless of which variant class(es) are combined with it. */`

### WR-03: `remove-btn` icon-button styling relies entirely on shared classes with no local visual regression test

**File:** `src/ui/setup/PlayerPicker.svelte:65`, `src/ui/setup/ProfileManager.svelte:100-101`

**Issue:** Not a bug today, but worth flagging given the phase's own "Sweep rule (Pitfall 3)" concern about shared classes silently losing coverage: `remove-btn`/`icon-btn` buttons now derive 100% of their box model (48×48 hit target, background, border) from `.btn.btn--icon`/`.btn--ghost` with only a `font-size` override locally. `components-css.test.ts` only asserts `.btn.btn--ghost.btn--icon` sizing in isolation (not composed with the `remove-btn`/`icon-btn` extra class), so a future change to `components.css` that narrows `.btn--icon`'s selector (e.g. accidentally requiring an additional class) would silently shrink these real-world hit targets below the 48px minimum without any test catching it.

**Fix:** No action required now; consider adding one browser-mode assertion per phase (or a shared "critical instances" list) that renders the actual usage-site class combination (`btn btn--ghost btn--icon remove-btn`) rather than only the canonical two/three-class combination, to guard against silent specificity regressions in future phases.

## Info

### IN-01: `.btn--menu svg` CSS forces 20×20 icons, but markup still hardcodes `width="16" height="16"`

**File:** `src/styles/components.css:49-54`; usage sites: `src/routes/+page.svelte:78-107`, `src/routes/stats/+page.svelte:69-72`, `src/routes/history/+page.svelte` (via `HistoryRow`, out of scope)

**Issue:** The new shared rule `.btn--menu svg { width: 20px; height: 20px; opacity: 0.7; flex-shrink: 0; }` matches the DS spec (`09-UI-SPEC.md:104`: "Chevron (optional) | 20×20 stroke SVG, opacity .7"), and correctly overrides the inline SVG's `width="16" height="16"` HTML attributes (CSS wins over presentation attributes) — so the chevrons render at the DS-correct 20×20 today. But the markup itself still literally says `width="16" height="16"` at every `.btn--menu` call site untouched by this phase's diff. This is now dead/misleading markup: anyone reading the `.svelte` file without also checking `components.css` will believe the icon is 16px when it actually renders at 20px.

**Fix:** Update the inline `width`/`height` attributes to `20` (or drop them entirely and let the CSS be the single source of truth) at the affected call sites, so markup and rendered result agree.

### IN-02: Hardcoded `color: #fff` on `.btn--destructive` — intentional per spec, but breaks the file's own token-only convention

**File:** `src/styles/components.css:95`

**Issue:** Every other button variant's text color in this file is a CSS custom property (`--on-accent`, `--text`, `--destructive`), and `src/lib/design-tokens.test.ts` exists specifically to keep the codebase off hardcoded colors — but `09-UI-SPEC.md:99`'s Button-variant table explicitly specifies `#fff` (not `--text`) for the `destructive` variant's text color, so this is a deliberate, spec-mandated exception rather than an oversight. Flagging only because it's the one hardcoded literal color in an otherwise 100%-tokenized file, and `design-tokens.test.ts`'s forbidden-value list wouldn't catch a typo'd/drifted hex here in the future (it only guards specific *old* provisional values, not "any literal color").

**Fix:** No action required — this matches the design spec. If a `--on-destructive` token is ever introduced for consistency, this is the one line to update.

### IN-03: `DartsAtDoubleDialog`'s option buttons are not migrated to the shared `.btn` system

**File:** `src/ui/input/DartsAtDoubleDialog.svelte:37,95-110`

**Issue:** This phase gave `DartsAtDoubleDialog` the ConfirmDialog-family scrim/blur treatment (`backdrop-filter` added), but its three "1/2/3 Darts" buttons still use a fully bespoke local `.option-btn` class (56px height, `var(--bg)` background, own `:active` transform) rather than any of the five `.btn--*` variants. This appears intentional (no DS `Button.jsx` variant maps to a 3-way option-sheet control, and `09-CONTEXT.md`'s scope list doesn't call out button-class consumption for this file specifically), so this is not flagged as a defect — just noting it for completeness since the review brief called out watching for "leftover local rules shadowing components.css" and this is a local rule that legitimately doesn't shadow anything (no class-name collision with `.btn`).

**Fix:** No action required; confirm in a future phase whether `.option-btn` should ever be folded into `.btn--surface` or a new discretionary variant if this sheet pattern recurs elsewhere.

---

_Reviewed: 2026-07-14_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
