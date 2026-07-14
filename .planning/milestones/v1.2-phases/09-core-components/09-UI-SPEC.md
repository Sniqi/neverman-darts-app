---
phase: 9
slug: core-components
status: draft
shadcn_initialized: false
preset: none
created: 2026-07-14
---

# Phase 9 — UI Design Contract: Core Components

> Visual and interaction contract for the shared UI primitives (COMP-01..04). This is a **transcription phase**: `design/components/core/*.jsx` + `.prompt.md` are the authoritative source; all values below are copied verbatim from those files and cross-checked against the live tokens in `src/styles/*.css` (Phase 8, already shipped). No new visual decisions are made here — only gaps between the current app code and the DS are catalogued so planner/executor don't have to re-derive them.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (hand-rolled CSS custom properties, no component framework) |
| Preset | not applicable |
| Component library | none — Svelte 5 components + scoped `<style>` + shared `src/styles/components.css` (new, this phase) |
| Icon library | none — inline stroke SVGs (`viewBox 0 0 24 24`, `stroke-width 2–2.5`, `stroke-linecap/linejoin round`) + Unicode glyphs (`−`, `+`, `▼`, `✕`, `●`) per `design/readme.md` Iconography |
| Font | Barlow (UI, `--font-ui`), Barlow Semi Condensed (scores/stat values, `--font-score`) — already self-hosted (Phase 8) |

All tokens referenced below already exist in `src/styles/{spacing,typography,colors,elevation}.css` (Phase 8 shipped) — this phase consumes them, adds none new.

---

## Spacing Scale

| Token | Value | Usage in this phase |
|-------|-------|----------------------|
| `--space-xs` | 4px | Chip/segment internal gaps, StatCard value→label gap |
| `--space-sm` | 8px | Chip row gap, button icon gap, dialog action-stack gap |
| `--space-md` | 16px | Row/stepper/toggle horizontal padding |
| `--space-lg` | 24px | Button "menu"/"accent" horizontal padding, StatCard padding |
| `--space-xl` | 32px | ConfirmDialog padding |

Touch-target tokens (already shipped, this phase's core contract):

| Token | Value | Applies to |
|-------|-------|-----------|
| `--hit-min` | 48px | Stepper −/+ buttons |
| `--control-h` | 56px | Chips, SegmentedControl track height context, ToggleRow/Stepper row min-height is `--row-h` not this — see per-component tables |
| `--row-h` | 64px | Button `menu`/`accent`, Stepper row, ToggleRow row |
| `--radius-pill` | 999px | ToggleRow switch track |

Exceptions: Button `destructive`/`cancel` and dialog-internal buttons use a fixed **56px** height (not `--row-h`), per `Button.jsx` — this is intentional DS behavior, not a gap.

---

## Typography (component-level)

| Element | Size | Weight | Line height | Token |
|---------|------|--------|-------------|-------|
| Button `menu`/`accent` label | 19px | 500 / 600 | normal | `--text-md` |
| Button `cta` label | 22px | 700 | normal, `0.01em` tracking | `--text-lg` |
| Button `destructive`/`cancel` label | 19px | 600 | normal | `--text-md` |
| Chip label | 19px | 500 inactive / 700 active | normal, tabular-nums | `--text-md` |
| SegmentedControl option | 19px | 500 inactive / 700 active | normal | `--text-md` |
| Stepper row label | 19px | 500 | normal | `--text-md` |
| Stepper value | 26px | 700 | 1, tabular-nums | `--text-xl` |
| Stepper unit | 15px | 400 | normal | `--text-sm` |
| ToggleRow label | 19px | 500 | normal | `--text-md` |
| StatCard value | 40px | 700 | 1.1, `-0.02em` tracking, tabular-nums, `--font-score` | `--text-3xl` |
| StatCard label | 17px | 500 | 1.4 | `--text-base` |
| ConfirmDialog heading | 26px | 600 | 1.25 | `--text-xl` |
| ConfirmDialog body | 17px | 400 | 1.5 | `--text-base` |

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `--bg` `#0c0e14` | Page background behind all components |
| Secondary (30%) | `--surface` `#161a23` | Button `menu`, Chip inactive, Stepper/ToggleRow rows, StatCard, ConfirmDialog cancel button |
| Elevated secondary | `--surface-2` `#1d2330` | ConfirmDialog panel background (dialogs sit one step above rows) |
| Pressed/highest | `--surface-3` `#29303f` | Stepper −/+ button fill, ToggleRow track when off |
| Accent (10%) | `--accent` `#f0a424` (gradient `--accent-bright → --accent → --accent-deep`) | Reserved for: Button `accent`/`cta` fills, Chip active fill, SegmentedControl active segment fill, ToggleRow track when on |
| Destructive | `--destructive` `#e5484d` | Button `destructive` fill only (dialog confirm actions that discard/delete data) |

Accent reserved for: active/selected states and primary-action buttons listed above — never applied to body text, borders-only decoration, or inactive elements.

---

## Component Contracts

Each table transcribes exact target values from `design/components/core/*.jsx`. "Current gap" rows list concrete deviations found in the live codebase (file:selector) that the plan must close — these are not new requirements, they are the todo list derived from the diff.

### 1. Button (`.btn` + variant classes in new `src/styles/components.css`) — COMP-01

| Property | menu | accent | cta | destructive | cancel |
|----------|------|--------|-----|-------------|--------|
| Height | `--row-h` 64px | `--row-h` 64px | min-height `--row-h` 64px | 56px (fixed) | 56px (fixed) |
| Padding | `0 --space-lg` | `0 --space-lg` | `--space-sm --space-lg` | center content | center content |
| Background | `--surface` | gradient (bright 0% → accent 45% → deep 130%) | same gradient | `--destructive` | `--surface` |
| Text color | `--text` | `--on-accent` `#191104` | `--on-accent` | `#fff` | `--text` |
| Border | 1px solid `--line` | none | none | none | 1px solid `--border-input` |
| Radius | `--radius-sm` 12px | 12px | 12px | 12px | 12px |
| Font | 19px/500 | 19px/600 | 22px/700, 0.01em tracking | 19px/600 | 19px/600 |
| Box-shadow | `--edge-highlight` | `--shadow-raise` + inset sheen `rgba(255,255,255,.25)` | same as accent | inset sheen `rgba(255,255,255,.15)` | none |
| Chevron (optional) | 20×20 stroke SVG, opacity .7, right-aligned | — | — | — | — |

Shared across all variants: full width, `gap: --space-sm`, `transition: transform/background/filter var(--dur-base) var(--ease)` (150ms), disabled → `opacity: .4` + `cursor: default`, `-webkit-tap-highlight-color: transparent`.

**Press state (all variants):** `onpointerdown` → `transform: scale(var(--press-scale))` (.97) + `filter: brightness(1.1)`; reset on `pointerup`/`pointerleave`.

**Current gaps to close:**
- `src/routes/+page.svelte` `.menu-btn`: height 56px (needs 64), font 16px (needs 19), no press-state transform (only `opacity:.85` on active) — map to `menu`; `.menu-btn--accent` → map to `accent` variant with gradient fill (currently flat `--accent`).
- `src/ui/setup/MatchSetup.svelte` `.start-btn`: height 56px correct-ish but font 18px (needs 22 per `cta`), weight 600 (needs 700), no press transform, flat fill (needs gradient) — map to `cta`.
- `src/ui/setup/BullOffOrder.svelte` `.confirm-btn`: same gaps as `.start-btn` — map to `cta`.
- `src/ui/dialogs/ConfirmDialog.svelte` `.cta-btn`/`.cancel-btn`: height 52px (needs 56), no gradient on `.cta-accent`, no press-transform on `.cancel-btn` beyond `:active` pseudo (fine, but must use `--press-scale`/brightness exactly) — map to `destructive`/`accent`/`cancel`.
- `src/ui/setup/ProfileManager.svelte` `.delete-btn`/`.cancel-btn` (inline delete sheet): flat fills, 48px height, no press transform — map to `destructive`/`cancel`.
- `src/ui/start/ResumePrompt.svelte` `.btn-resume`/`.btn-discard`: height 52px (bump to 56), font 16px (needs 19) — `.btn-resume` maps to `accent` (gradient fill); `.btn-discard` keeps its outline-destructive treatment (no DS variant covers an outlined destructive button — **Claude's discretion**: keep current outline pattern, only align token usage: border `--destructive`, active bg `--destructive-soft`, add `--press-scale` transform, bump font to 19px/600).

### 2. Chip — COMP-02

| Property | Value |
|----------|-------|
| Layout | `flex: 1` inside a `display:flex; gap: --space-sm` row |
| Min-height | `--control-h` 56px |
| Radius | `--radius-sm` 12px |
| Padding | `--space-sm` 8px |
| Active fill | gradient (bright→accent→deep), `--on-accent` text, weight 700 |
| Inactive fill | `--surface`, `--text-soft` `#c4cad6` text, weight 500 |
| Border | active: none (transparent); inactive: 1px solid `--border-input` (16% alpha) |
| Box-shadow | active: `--shadow-raise` + inset sheen; inactive: `--edge-highlight` |
| Font | 19px, tabular-nums |
| `aria-pressed` | required on the button element |
| Press | `transform: scale(var(--press-scale))` on pointerdown, reset on up/leave |

**Current gap:** `src/ui/setup/MatchSetup.svelte` `.chip`: min-height 48px (needs 56), font 16px (needs 19), border color `--line-strong` (needs `--border-input`), weight 400/600 (needs 500/700), flat active fill (needs gradient), no press-state transform, no `tabular-nums`.

### 3. SegmentedControl — COMP-02

| Property | Value |
|----------|-------|
| Container | `role="group"`, `display:flex`, `gap:4px`, `padding:4px`, background `--bg-deep` `#07080c`, border 1px solid `--line`, radius `--radius-sm` 12px (this is the "recessed track") |
| Option | `flex:1`, min-height `calc(--control-h - 10px)` = 46px, no own border, radius `calc(--radius-sm - 4px)` = 8px, padding `--space-sm --space-md` |
| Active option | gradient fill, `--on-accent` text, weight 700, `--shadow-raise` + inset sheen |
| Inactive option | transparent, `--text-muted` `#8a92a6`, weight 500 |
| Font | 19px, `white-space: nowrap` |
| `aria-pressed` | required per option |

**Current gap:** `src/ui/setup/MatchSetup.svelte` `.seg-control`/`.seg-btn` has no recessed-track container (no `--bg-deep` wrapper, no 4px gap/padding) — the buttons are directly joined with split corner-radii and individual `1px solid --line-strong` borders. This needs restructuring: wrap in a track div styled per the container spec above, remove per-button borders and corner-splitting, apply gradient fill to the active option (currently flat `--accent`), bump font 16px → 19px.

### 4. Stepper — COMP-02

| Property | Value |
|----------|-------|
| Row container | `display:flex; justify-content:space-between`, background `--surface`, border 1px solid `--line`, padding `--space-sm --space-md`, min-height `--row-h` 64px, radius `--radius-sm` 12px, gap `--space-sm`, box-shadow `--edge-highlight` |
| Label | 19px/500 |
| −/+ buttons | 48×48px (`--hit-min`), background `--surface-3`, color `--text`, border 1px solid `--line-strong`, radius `--radius-sm` 12px, font 26px/500 line-height 1, box-shadow `--edge-highlight`, `transition: transform var(--dur-fast)` (100ms) |
| −/+ disabled | `opacity: .3`, `cursor: default` |
| Value | 26px/700, min-width 32px, centered, tabular-nums |
| Unit (optional) | 15px, `--text-muted`, min-width 48px |
| `aria-label` | "Weniger" / "Mehr" on −/+ buttons |
| Press | `scale(var(--press-scale))` on pointerdown (not applied when disabled) |

**Current gap:** `src/ui/setup/MatchSetup.svelte` `.stepper-row`/`.stepper-btn`/`.stepper-value`/`.stepper-unit`: row radius 16px (needs 12), no row border/box-shadow, label 16px (needs 19), buttons 44×44px (needs 48×48) with radius 4px (needs 12) and no box-shadow, value font 20/600 (needs 26/700), unit font 14px (needs 15px). The `Legs`/`Sets`/`Pausendauer`/`Pause nach` steppers all share this markup — one shared fix covers all four.

### 5. ToggleRow — COMP-02

| Property | Value |
|----------|-------|
| Row container | same as Stepper row (surface/line/row-h/radius-sm/edge-highlight) |
| Label | 19px/500, `<label>` element |
| Switch | custom `<button role="switch" aria-checked>`, 56×34px, radius `--radius-pill` 999px, border 1px solid (`--accent` on / `--line-strong` off) |
| Switch fill | `--accent` on / `--surface-3` off |
| Switch glow | `--glow-accent` box-shadow when on; `inset 0 1px 3px rgba(0,0,0,.35)` when off |
| Switch transition | `background/border-color var(--dur-med)` (200ms) |
| Thumb | 26×26px circle, `top:3px; left:3px`, `--on-accent` fill when on / `--text-muted` when off, `translateX(22px)` when on |
| Thumb transition | `transform var(--dur-med) var(--ease-spring)` (spring pop), `background var(--dur-med) var(--ease)` |
| Thumb shadow | `0 1px 3px rgba(0,0,0,.4)` |

**This is the largest markup change in the phase.** Every current toggle is a native `<input type="checkbox" role="switch">` styled via browser default / `accent-color` — this must become the custom button+span markup above while **keeping the exact same `id`, `aria-checked`, `role="switch"` contract** (CONTEXT.md: E2E selector lock).

**Current gap — every one of these needs the custom-switch markup:**
- `src/ui/setup/MatchSetup.svelte`: `#sets-toggle`, `#caller-toggle`, `#sfx-toggle`, `#pause-toggle`
- `src/routes/match/+page.svelte`: `#match-caller-toggle`, `#match-sfx-toggle` (explicitly in scope per CONTEXT.md success-criterion 2 — the only `/match` UI this phase touches; the numpad/board/undo/visit-strip controls on the same page stay Phase 10)

### 6. StatCard — COMP-04

| Property | Value |
|----------|-------|
| Container | background `--surface`, border 1px solid `--line`, radius `--radius-md` 16px, padding `--space-md --space-lg` (16px 24px), `display:flex; flex-direction:column; gap:--space-xs` (4px), box-shadow `--edge-highlight` |
| Value | `--font-score`, 40px/700, color `--text`, line-height 1.1, letter-spacing `-0.02em`, tabular-nums |
| Label | 17px/500, color `--text-muted`, line-height 1.4 |
| Props | unchanged: `label`, `value` (caller pre-formats the string, e.g. "42.3", "67%", "—") |

**Current gap:** `src/ui/stats/StatCard.svelte`: radius 8px (needs 16), padding `--space-md` only on all sides (needs `--space-md --space-lg`), value 28px/600 (needs 40px/700) with no letter-spacing, label 18px/400 (needs 17px/500). Component API (`label`, `value` props) stays unchanged per CONTEXT.md — only the `<style>` block changes.

### 7. ConfirmDialog — COMP-03

| Property | Value |
|----------|-------|
| Backdrop | `position:fixed; inset:0`, background `--backdrop` `rgba(5,7,12,.65)`, `backdrop-filter: blur(--blur-backdrop)` (12px) + `-webkit-backdrop-filter`, flex-centered, `z-index:40`, fade-in `var(--dur-med)` (200ms) `var(--ease)` |
| Panel | background `--surface-2` `#1d2330` (one step above row surfaces), border 1px solid `--line-strong`, radius `--radius-lg` 20px, padding `--space-xl` 32px, `max-width:420px`, `width:calc(100% - 48px)`, box-shadow `--shadow-panel` + `--edge-highlight` |
| Panel animation | scale-in from `.94` + `translateY(8px)` → `none`, `var(--dur-med) var(--ease-spring)` |
| Heading | 26px/600, `margin: 0 0 --space-sm 0`, `--text`, line-height 1.25 |
| Body | 17px/400, `margin: 0 0 --space-lg 0`, `--text-soft`, line-height 1.5 |
| Actions | `flex-direction:column; gap:--space-sm`, stacked full-width — CTA button (`destructive` or `accent` variant per `ctaStyle` prop) then `cancel` variant labeled "Abbrechen" |
| Backdrop-click dismiss | only when `backdropDismiss` prop is true (existing prop, unchanged) |

**Current gap:** `src/ui/dialogs/ConfirmDialog.svelte`:
- No `backdrop-filter` at all (blur is entirely missing) — add `blur(var(--blur-backdrop))`.
- Panel background is `--surface` (needs `--surface-2`).
- `max-width: 360px` (needs 420px).
- Panel padding `--space-lg` 24px (needs `--space-xl` 32px).
- Scale-in starts at `.96` with no `translateY` (needs `.94` + `translateY(8px)`).
- Heading hardcoded `20px` (needs 26px/`--text-xl`), no explicit line-height 1.25.
- Body hardcoded `16px` (needs 17px/`--text-base`) — line-height 1.5 already correct.
- Button heights 52px in this file's own `.cta-btn`/`.cancel-btn` classes (should become 56px, ideally by consuming the shared `.btn--destructive`/`.btn--accent`/`.btn--cancel` classes from `src/styles/components.css` instead of local styles — architecture call for planner, per CONTEXT.md's "shared classes only where a pattern appears in ≥2 files").

Component props (`heading`, `body`, `ctaLabel`, `ctaStyle`, `backdropDismiss`, `onconfirm`, `oncancel`) stay unchanged.

---

## Extended Dialog Treatment (confirmation-shaped, non-ConfirmDialog)

CONTEXT.md locks that **all** confirmation-shaped UI in scope gets the DS dialog treatment, not just the shared `ConfirmDialog.svelte` component. The DS does not define a bottom-sheet component — these keep their existing sheet/inline shape, but must adopt DS **tokens** (scrim blur, radius, motion) wherever they diverge.

| Component | Current shape | Target treatment | Gap |
|-----------|---------------|-------------------|-----|
| `src/ui/input/DartsAtDoubleDialog.svelte` | Bottom sheet, slides up from bottom (kept — no DS bottom-sheet spec exists; **Claude's discretion** to preserve this shape) | Scrim gets `backdrop-filter: blur(var(--blur-backdrop))` (currently missing entirely — same fix as ConfirmDialog); sheet keeps `--radius-lg` top corners (already correct); option buttons (1/2/3 Darts) already have `--press-scale` transform on `:active` (correct) — only add the missing scrim blur | Add 1 line: `backdrop-filter`/`-webkit-backdrop-filter: blur(var(--blur-backdrop))` to `.backdrop` |
| `src/ui/setup/ProfileManager.svelte` (inline "Profil löschen?" bottom sheet) | Bottom sheet, hand-rolled (not the shared `ConfirmDialog` component) | Same token alignment as `ConfirmDialog`: scrim needs `backdrop-filter` blur (currently missing), heading/body font sizes should match 26px/600 + 17px/400, buttons restyle to `destructive`/`cancel` `.btn` classes (56px, per Button contract above) | Missing blur on `.sheet-overlay`; `.delete-btn`/`.cancel-btn` are 48px flat fills, need `.btn--destructive`/`.btn--cancel` treatment |
| `src/ui/start/ResumePrompt.svelte` | Inline card on the hub (`role="region"`, **not** a modal/overlay — no scrim) | Not a dialog visually — CONTEXT.md's "gets the treatment" here means its two action buttons align to Button-variant tokens (see Button gaps above: `.btn-resume` → `accent`, `.btn-discard` → discretion-kept outline-destructive with token alignment). No scrim/blur/radius-20 applies since it's not an overlay. | Font-size 16px → 19px on both buttons; height 52px → 56px; everything else (card radius-md, surface bg) already token-correct |

---

## Motion Contract (component-scoped; global system shipped in Phase 8)

| Interaction | Duration | Easing | Notes |
|-------------|----------|--------|-------|
| Button/Chip/Stepper/SegmentedControl press | instant transform | `--press-scale` (.97) + `brightness(1.1)` on filled variants | Reset on pointerup/pointerleave |
| ToggleRow track color | `--dur-med` 200ms | `--ease` | |
| ToggleRow thumb slide | `--dur-med` 200ms | `--ease-spring` | The one spring-eased motion in this phase |
| ConfirmDialog backdrop fade | `--dur-med` 200ms | `--ease` | |
| ConfirmDialog panel scale-in | `--dur-med` 200ms | `--ease-spring` | From `.94` + `translateY(8px)` |
| Stepper button press | `--dur-fast` 100ms | `--ease` | Transform only |

All motion collapses under `prefers-reduced-motion` — already handled globally by `elevation.css` (Phase 8), no per-component override needed.

---

## Copywriting Contract

No new copy is introduced this phase — all labels are locked verbatim from the current app (E2E selector contract, CONTEXT.md). Table lists the labels this phase's components render, for reference only:

| Element | Copy |
|---------|------|
| Primary CTA (setup) | "Spiel starten" |
| Primary CTA (hub) | "Neues Spiel" |
| Destructive dialog CTA (new-match warning) | "Verwerfen und neu starten" |
| Destructive dialog CTA (delete profile) | "Löschen" |
| Cancel (every dialog) | "Abbrechen" |
| Stepper aria-labels | "Weniger" / "Mehr" |
| ToggleRow labels | "Sets", "Caller", "Musik", "Automatische Pause" |
| Chip labels | "301", "401", "501" |
| SegmentedControl labels | "Single Out", "Double Out" |

No empty-state or error-state copy is in scope for this phase's components (StatCard/dialogs consume caller-provided strings; no new states introduced).

---

## Registry Safety

Not applicable — no component registry (shadcn or otherwise) is used in this project. All components are hand-written Svelte + scoped CSS.

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| n/a | n/a | not applicable |

---

## File Scope (this phase)

- New: `src/styles/components.css` (`.btn` base + variant classes), imported from `src/app.css`
- Restyled in place (styles only, no API/prop changes): `src/ui/dialogs/ConfirmDialog.svelte`, `src/ui/stats/StatCard.svelte`
- Restyled + markup changes (native checkbox → custom switch, chip/segment structure): `src/ui/setup/MatchSetup.svelte`, `src/ui/setup/PlayerPicker.svelte`, `src/ui/setup/ProfileManager.svelte`, `src/ui/setup/BullOffOrder.svelte`
- Restyled (Button-variant class swaps only): `src/routes/+page.svelte`, `src/routes/data/+page.svelte`, `src/routes/history/+page.svelte`, `src/routes/history/[id]/+page.svelte`, `src/routes/stats/+page.svelte`, `src/ui/start/ResumePrompt.svelte`, `src/ui/input/DartsAtDoubleDialog.svelte`
- Scoped restyle only (audio ToggleRows), everything else on this file is Phase 10: `src/routes/match/+page.svelte` (`.audio-bar` / `#match-caller-toggle` / `#match-sfx-toggle` only — `.toggle-btn`/`.undo-btn`/`.dart-pill`/board/numpad stay untouched)

**Explicitly out of scope (confirmed against ROADMAP.md phase boundaries):** Numpad, Dartboard, VisitStrip/DartPill, ScoreCard (`/match` scoring surfaces) → Phase 10. Display panels/header → Phase 11. Page-level layout, PauseOverlay/RecordOverlay/MatchWinOverlay/toasts → Phase 12.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS (not applicable — no registry)

**Approval:** pending
