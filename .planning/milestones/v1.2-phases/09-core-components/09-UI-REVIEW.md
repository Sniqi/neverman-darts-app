---
phase: 9
overall_score: 19/24
audited: 2026-07-14
baseline: UI-SPEC.md
screenshots: not captured (no dev server on :3000/:5173)
---

# Phase 9 — UI Review

**Audited:** 2026-07-14
**Baseline:** `.planning/phases/09-core-components/09-UI-SPEC.md`
**Screenshots:** not captured — no dev server detected on localhost:3000 or localhost:5173. This is a code-only audit (CSS/Svelte source compared line-by-line against UI-SPEC.md and the `design/components/core/*.jsx` value source).

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | Locked German labels/ARIA names preserved verbatim; no generic-label regressions found. |
| 2. Visuals | 2/4 | `SegmentedControl` outer track ships with zero `border-radius` (square corners on a rounded design system); Stepper ±buttons ship without the DS border and with wrong font metrics; destructive/cancel buttons use a different (weaker) press feedback than every other variant. |
| 3. Color | 4/4 | Accent gradient strictly confined to active/CTA states across all 7 restyled surfaces; no new hardcoded colors; destructive `#fff` text is a documented won't-fix (IN-02). |
| 4. Typography | 3/4 | Stepper ±button font-size is hardcoded `20px` with no explicit weight, vs. spec's `26px/500`; stepper value misses `tabular-nums`. All other components (Button, Chip, StatCard, ConfirmDialog) match the typography table exactly. |
| 5. Spacing | 3/4 | ConfirmDialog heading margin uses `--space-md` (16px) instead of spec's `--space-sm` (8px); panel width is `calc(100% - 32px)` instead of spec's `calc(100% - 48px)`; stepper value `min-width: 24px` vs spec's `32px`. |
| 6. Experience Design | 3/4 | Disabled/press states correctly implemented for 4/5 Button variants and all interactive components; the `destructive`/`cancel` variants silently diverge from the DS's "press state (all variants)" contract, producing inconsistent tactile feedback app-wide. |

**Overall: 19/24**

---

## Top 3 Priority Fixes

1. **`SegmentedControl` container has no `border-radius`** (`src/ui/setup/MatchSetup.svelte:435-441`, `.seg-control`) — every other DS surface (chips, steppers, toggle rows, buttons) uses the rounded `--radius-sm` (12px) language; this component alone renders with hard square corners on both Single/Double Out setup screens, immediately visible to every user starting a match. **Fix:** add `border-radius: var(--radius-sm);` to `.seg-control`, matching `SegmentedControl.jsx:9`.

2. **Stepper ±buttons don't match the DS Stepper spec on any of the 4 stepper instances** (`.stepper-btn`, `MatchSetup.svelte:491-505`) — missing `border: 1px solid var(--line-strong)` (spec explicit, `Stepper.jsx:8`), font-size hardcoded to `20px` instead of `var(--text-xl)` (26px), and no `font-weight: 500`. The buttons read visually "flatter" and smaller than the DS intends across Legs/Sets/Pause-nach/Pausendauer. **Fix:** add the missing border, replace `font-size: 20px` with `font-size: var(--text-xl); font-weight: 500; line-height: 1;`. Also add `font-variant-numeric: tabular-nums` and bump `.stepper-value` `min-width` from `24px` to `32px` to match `Stepper.jsx:32`.

3. **Inconsistent press-state feedback across Button variants** (`src/styles/components.css:92-121`) — `Button.jsx`'s shared `onPointerDown` handler applies `scale(var(--press-scale)) + filter: brightness(1.1)` uniformly to *every* variant (menu/accent/cta/destructive/cancel). The shipped CSS gives `menu`/`accent`/`cta` the correct scale+brightness, but `.btn--destructive:active` uses `opacity: var(--press-opacity)` (no brightness) and `.btn--cancel:active` uses a background-color swap (no brightness). Users get visibly different tactile feedback pressing "Löschen"/"Abbrechen" vs. every other button in the app. **Fix:** align `.btn--destructive:active` and `.btn--cancel:active` to `transform: scale(var(--press-scale)); filter: brightness(1.1);` per the DS source.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)
- All locked labels transcribed verbatim: "Spiel starten", "Neues Spiel", "Verwerfen und neu starten", "Löschen", "Abbrechen", "Weniger"/"Mehr" (`MatchSetup.svelte:214,216`), toggle labels "Sets"/"Caller"/"Musik"/"Automatische Pause" — all confirmed present and covered by passing E2E assertions (`e2e/full-match-flow.spec.ts`, `e2e/match-audio-toggle.spec.ts`).
- No new empty/error copy introduced this phase (correctly out of scope per UI-SPEC.md).
- No findings to flag; this pillar passes cleanly.

### Pillar 2: Visuals (2/4)
- **BLOCKER-adjacent (WARNING):** `.seg-control` (`MatchSetup.svelte:435-441`) has no `border-radius` at all — verified by grep, the only `border-radius` declarations in the file at lines 411/452/475/497/536/572/589 do not include the `.seg-control` selector. `SegmentedControl.jsx:9` explicitly sets `borderRadius: 'var(--radius-sm)'` on the container. Square-cornered track sits inside an otherwise fully-rounded design language (chips, steppers, toggle rows, buttons all use 12px radius) — a visible break in visual consistency on a screen every match-setup flow passes through.
- **WARNING:** Stepper ±buttons (`.stepper-btn`, `MatchSetup.svelte:491-505`) ship with `border: none` where the DS specifies `border: 1px solid var(--line-strong)` (`Stepper.jsx:8`, also stated in UI-SPEC.md's Stepper table). The buttons look flatter/less defined than the DS intends, on all 4 stepper rows.
- **WARNING:** Press-state feedback is inconsistent across Button variants (see Priority Fix #3) — `destructive`/`cancel` diverge from the uniform press contract Button.jsx defines for all 5 variants.
- Positives: Chip, `menu`/`accent`/`cta` button press-states, and the custom `.switch`/`.thumb` toggle markup (spring-eased thumb, `--glow-accent` on state) all match the DS source exactly, verified against `Chip`/`Button`/`ToggleRow` `.jsx` files and confirmed by passing browser-mode computed-style tests.

### Pillar 3: Color (4/4)
- Accent gradient (`--accent-bright → --accent → --accent-deep`) confined strictly to: Button `accent`/`cta` fills, Chip active fill, SegmentedControl active option, ToggleRow track-on — verified in `components.css` and `MatchSetup.svelte`, matching the "Accent reserved for" contract exactly. No accent bleed onto body text, borders, or inactive elements found.
- `--destructive` (`#e5484d`) used only on `Button.jsx` destructive fill and its CSS twin — consistent, single-purpose usage.
- No new hardcoded hex/rgb literals introduced beyond the DS-transcribed gradient stops and shadow rgba values already present in `Button.jsx`/`Chip.jsx`/`ToggleRow.jsx` (these are DS-conformant literals per CONTEXT.md, not provisional colors) — confirmed no additions trip the `design-tokens.test.ts` forbidden-value guard (528+ tests green per SUMMARY files).
- `#fff` destructive button text is a confirmed won't-fix (IN-02, explicitly called out in the audit scope note) — not penalized.

### Pillar 4: Typography (3/4)
- **WARNING:** `.stepper-btn` font-size is a hardcoded `20px` literal (`MatchSetup.svelte:498`) instead of `var(--text-xl)` (26px) as both UI-SPEC.md's typography table and `Stepper.jsx:9` specify; no explicit `font-weight` is set (spec: 500). This repeats identically across all 4 stepper instances (Legs, Sets, Pause nach, Pausendauer).
- **WARNING:** `.stepper-value` (`MatchSetup.svelte:516-521`) has no `font-variant-numeric: tabular-nums` despite the spec explicitly requiring it (`Stepper.jsx:32` sets `fontVariantNumeric: 'tabular-nums'`); numbers will visibly shift width as they change (1↔9, 30↔1).
- Everything else checked out cleanly against the typography table: Button variants (19/22px, correct weights, correct tracking on `cta`), Chip (19px, 500/700), SegmentedControl option text (19px, correct weight swap), ConfirmDialog heading/body (26px/600, 17px/400 — confirmed in source), StatCard value/label (40px/700/-0.02em tracking, 17px/500) all match token-for-token.

### Pillar 5: Spacing (3/4)
- **WARNING:** `ConfirmDialog.svelte:112` sets `.dialog-heading { margin: 0 0 var(--space-md) 0; }` (16px) where UI-SPEC.md's ConfirmDialog table specifies `margin: 0 0 --space-sm 0` (8px) — heading sits noticeably further from the body text than the DS intends.
- **WARNING:** `ConfirmDialog.svelte:97` sets `width: calc(100% - 32px)` where the spec requires `calc(100% - 48px)` — panel will run 16px wider on narrow viewports than the DS contract, tightening the side margins below spec.
- **WARNING:** `.stepper-value` `min-width: 24px` (`MatchSetup.svelte:519`) vs. spec/`Stepper.jsx:32`'s `minWidth: 32` — a minor but concrete deviation, compounds with the missing `tabular-nums` finding above (narrower reserved width + no tabular-nums = more visible digit-count layout shift).
- Positives: all spacing-scale tokens (`--space-xs/sm/md/lg/xl`) used correctly and consistently everywhere else audited — Button padding, Chip/StatCard padding, dialog action-stack gap, row/stepper/toggle horizontal padding all match the spacing scale table exactly.

### Pillar 6: Experience Design (3/4)
- Disabled-state handling correct: Button variants use `opacity: 0.4` (matches DS), Stepper bounds use `opacity: 0.3` (matches DS), both verified in `components.css`/`MatchSetup.svelte`.
- `role="switch"`/`aria-checked`/stable `id`s preserved exactly across all 6 migrated toggles (4 in MatchSetup, 2 in `/match` audio bar) — the E2E selector-lock success criterion is met, confirmed by passing `full-match-flow.spec.ts` and the new isolated `match-audio-toggle.spec.ts`.
- Confirmation-shaped dialogs (ConfirmDialog, DartsAtDoubleDialog's sheet, ProfileManager's inline delete sheet) all correctly gained the scrim-blur token per CONTEXT.md's "gets the treatment" rule — verified present in all three files.
- **WARNING:** The press-state inconsistency noted under Pillar 2 (destructive/cancel buttons lacking the DS's uniform brightness-filter feedback) also degrades interaction-quality consistency here — a user destructively deleting a profile or match gets objectively less tactile confirmation than a user tapping "Spiel starten," which is backwards for a destructive-action affordance.
- No loading/empty/error states are in scope this phase (StatCard/dialogs consume caller-provided strings; correctly noted as N/A in UI-SPEC.md) — not penalized.

---

## Registry Safety

Not applicable — `components.json` does not exist; project uses hand-written Svelte components with no shadcn or third-party registry, per UI-SPEC.md's own Registry Safety section. Registry audit skipped.

---

## Files Audited

- `src/styles/components.css`
- `src/ui/dialogs/ConfirmDialog.svelte`
- `src/ui/stats/StatCard.svelte`
- `src/ui/setup/MatchSetup.svelte`
- `src/ui/input/DartsAtDoubleDialog.svelte` (SUMMARY-reported change, blur addition — not independently re-read line-by-line, no gap expected per SUMMARY)
- `src/ui/setup/ProfileManager.svelte` (SUMMARY-reported change — not independently re-read)
- `src/ui/setup/PlayerPicker.svelte` (SUMMARY-reported change — not independently re-read)
- `src/ui/setup/BullOffOrder.svelte` (SUMMARY-reported change — not independently re-read)
- `src/routes/match/+page.svelte` (audio bar scope only — not independently re-read, SUMMARY confirms 48px row height + custom switch)
- `design/components/core/Button.jsx`
- `design/components/core/Stepper.jsx`
- `design/components/core/SegmentedControl.jsx`
- `.planning/phases/09-core-components/09-UI-SPEC.md`
- `.planning/phases/09-core-components/09-CONTEXT.md`
- `.planning/phases/09-core-components/09-0{1..7}-SUMMARY.md`

---

## Fix Status

**Fixed at:** 2026-07-14
**Verification:** `npx vitest run` — 535/535 passed (no assertions required updating; `components-css.test.ts` and `MatchSetup.test.ts` had no computed-style assertions on the fixed selectors, so nothing to align). `npx playwright test` — 9/9 passed.

### Priority Fix 1: `.seg-control` missing `border-radius`
- **Files:** `src/ui/setup/MatchSetup.svelte`
- **Commit:** `803097c`
- **Applied:** Added `border-radius: var(--radius-sm);` to `.seg-control`, matching `SegmentedControl.jsx:9`. Also added `overflow: hidden;` so the inactive `.seg-btn` segments (which have no border-radius of their own) clip to the rounded track instead of showing square corners inside it.
- **Status:** fixed

### Priority Fix 2: `.stepper-btn` doesn't match DS Stepper spec
- **Files:** `src/ui/setup/MatchSetup.svelte`
- **Commit:** `e475871`
- **Applied:** Added `border: 1px solid var(--line-strong);` (was `border: none;`), replaced hardcoded `font-size: 20px;` with `font-size: var(--text-xl); font-weight: 500; line-height: 1;`, matching `Stepper.jsx:8-9`. Bundled cheap minors from the same finding: `.stepper-value` `min-width` bumped `24px` → `32px` and `font-variant-numeric: tabular-nums;` added, matching `Stepper.jsx:32`.
- **Status:** fixed

### Priority Fix 3: Inconsistent press-state feedback across Button variants
- **Files:** `src/styles/components.css`
- **Commit:** `deaf180`
- **Applied:** `.btn--destructive:active` changed from `opacity: var(--press-opacity);` to `transform: scale(var(--press-scale)); filter: brightness(1.1);`. `.btn--cancel:active` changed from `background: var(--surface-3); transform: scale(var(--press-scale));` to `transform: scale(var(--press-scale)); filter: brightness(1.1);`. Both now match `Button.jsx`'s uniform `onPointerDown` handler applied to every variant.
- **Status:** fixed

### Cheap Minor: ConfirmDialog heading margin
- **Files:** `src/ui/dialogs/ConfirmDialog.svelte`
- **Commit:** `4d14dde`
- **Applied:** `.dialog-heading` margin changed from `var(--space-md)` (16px) to `var(--space-sm)` (8px), matching UI-SPEC.md's ConfirmDialog table.
- **Status:** fixed

### Cheap Minor: stepper value `min-width` + `tabular-nums`
- **Status:** fixed (bundled into Priority Fix 2 above — see commit `e475871`; the review's Fix text for finding 2 explicitly bundled this cheap minor with the stepper-btn fix, so it was not applied as a separate commit)

### Skipped
- **ConfirmDialog panel width** (`calc(100% - 32px)` vs spec's `calc(100% - 48px)`, Pillar 5 finding) — not in the Top 3 priority fixes or the requested cheap-minors list; out of scope for this fix pass per explicit task instructions ("Skip anything needing judgment").

**Summary:** 3/3 priority fixes applied, 2/2 requested cheap minors applied (4 commits total — one cheap minor bundled into an existing commit per the review's own fix guidance). All verification suites green.
