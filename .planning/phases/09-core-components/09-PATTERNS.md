# Phase 9: Core Components - Pattern Map

**Mapped:** 2026-07-14
**Files analyzed:** 14 (1 new, 13 modified)
**Analogs found:** 14 / 14

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|---------------|
| `src/styles/components.css` (NEW) | config (CSS token/style layer) | transform | `src/styles/elevation.css` + `src/app.css` (import aggregator) | exact (same layer, new file) |
| `src/app.css` (add 1 import line) | config | transform | itself (existing `@import` chain) | exact |
| `src/ui/dialogs/ConfirmDialog.svelte` | component (dialog) | request-response (confirm/cancel callbacks) | itself (existing file, restyle in place) | exact |
| `src/ui/input/DartsAtDoubleDialog.svelte` | component (dialog) | request-response | `src/ui/dialogs/ConfirmDialog.svelte` | role-match (confirmation-shaped dialog) |
| `src/ui/start/ResumePrompt.svelte` | component (dialog) | request-response | `src/ui/dialogs/ConfirmDialog.svelte` | role-match |
| `src/ui/stats/StatCard.svelte` | component (display) | transform (props → styled output) | itself (existing file, restyle in place) | exact |
| `src/ui/setup/MatchSetup.svelte` | component (form/setup) | CRUD (local `$state` toggles/steppers) | itself + `src/routes/+page.svelte` (button classes) | exact (in-place) |
| `src/ui/setup/PlayerPicker.svelte` | component (list/form) | CRUD | `src/routes/+page.svelte` (`.menu-btn` pattern) for button swaps | role-match |
| `src/ui/setup/ProfileManager.svelte` | component (list/form + dialog) | CRUD | `src/routes/+page.svelte` + `ConfirmDialog.svelte` | role-match |
| `src/ui/setup/BullOffOrder.svelte` | component (confirm action) | request-response | `src/routes/+page.svelte` `.menu-btn--accent` (for `.confirm-btn` → `.btn--cta`) | role-match |
| `src/routes/+page.svelte` | route (hub) | request-response (nav) | itself (source of the `.menu-btn`/`.menu-btn--accent` pattern being extracted) | exact — this IS the canonical analog |
| `src/routes/stats/+page.svelte` | route | request-response | `src/routes/+page.svelte` (duplicate `.menu-btn`) | exact |
| `src/routes/data/+page.svelte` | route | request-response | `src/routes/+page.svelte` (`.menu-btn`) for nav; no analog for `.action-btn` | partial (see No Analog Found) |
| `src/routes/history/+page.svelte` | route | request-response | `src/routes/+page.svelte` (`.back-btn` pattern, needs ghost class) | partial |
| `src/routes/history/[id]/+page.svelte` | route | request-response | `src/routes/+page.svelte` (`.back-btn`) + `ConfirmDialog.svelte` (`.cta-destructive` for outline `.delete-btn`) | partial |
| `src/routes/match/+page.svelte` (audio rows only) | route (partial) | event-driven (toggle state) | `MatchSetup.svelte` toggle rows (once restyled) | role-match, sizing conflict flagged |

## Pattern Assignments

### `src/styles/components.css` (NEW — config/style layer)

**Analog:** `src/styles/elevation.css` (token-file shape) + `src/app.css` (aggregator import order)

**File-header + import-site pattern** (`src/app.css:1-9`):
```css
@import './styles/colors.css';
@import './styles/typography.css';
@import './styles/spacing.css';
@import './styles/elevation.css';
@import './styles/fonts.css';

* {
	box-sizing: border-box;
}
```
Add as the **6th** import, after `fonts.css` (per RESEARCH.md's structure diagram): `@import './styles/components.css';`

**Tokens this file must consume verbatim** (`src/styles/elevation.css:1-31`):
```css
--radius-sm: 12px;   /* buttons, keys, chips, inputs */
--radius-lg: 20px;   /* dialogs, sheets */
--shadow-raise: 0 1px 2px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.35);
--backdrop: rgba(5, 7, 12, 0.65);
--blur-backdrop: 12px;
--ease: cubic-bezier(0.2, 0, 0, 1);
--ease-spring: cubic-bezier(0.3, 1.4, 0.4, 1);
--press-scale: 0.97;
--press-opacity: 0.9;
```

**Core `.btn` base + variant pattern** (transcribed in RESEARCH.md from `design/components/core/Button.jsx`, cross-checked against existing `.menu-btn` at `src/routes/+page.svelte:152-176` below) — use RESEARCH.md's `Pattern 1` code block directly; it is already codebase-conformant (uses `var(--space-sm)`, `var(--dur-base)`, `var(--ease)`, `-webkit-tap-highlight-color: transparent`).

**Press-state idiom to follow (NOT `Button.jsx`'s JS handlers):** `src/ui/dialogs/ConfirmDialog.svelte:157-165` —
```css
.cta-destructive:active {
	opacity: var(--press-opacity);
	transform: scale(var(--press-scale));
}
```
This CSS-only `:active` idiom is the established codebase pattern; RESEARCH.md explicitly recommends keeping it over introducing `onPointerDown`/`onPointerUp`.

---

### `src/routes/+page.svelte` (canonical `.menu-btn`/`.menu-btn--accent` source — role: route/hub)

**This file IS the analog** other button-class swaps should match against. Existing pattern (lines 152-176):
```css
.menu-btn {
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	height: 56px;
	padding: 0 var(--space-md);
	background: var(--surface);
	color: var(--text);
	border: none;
	border-radius: var(--radius-sm);
	font-size: 16px;
	font-weight: 400;
	cursor: pointer;
	text-align: left;
}
.menu-btn--accent {
	background: var(--accent);
	color: var(--on-accent);
}
.menu-btn:active {
	opacity: 0.85;
}
```
Usage site (lines 76-101):
```svelte
<button class="menu-btn menu-btn--accent" onclick={handleNewGame}>
<button class="menu-btn profiles-toggle" onclick={() => (profilesOpen = !profilesOpen)} aria-expanded={profilesOpen}>
<button class="menu-btn" onclick={() => goto(`${base}/history`)}>
```
**Migration action:** swap `class="menu-btn menu-btn--accent"` → `class="btn btn--menu btn--accent"` (or equivalent per Claude's discretion on naming), **delete** the local `.menu-btn`/`.menu-btn--accent`/`.menu-btn:active` rules in the same commit (Pitfall 3 sweep rule from CONTEXT.md/RESEARCH.md — mandatory, not optional).

---

### `src/ui/dialogs/ConfirmDialog.svelte` (dialog, request-response)

**Analog:** itself — existing file already has the right shape (backdrop scrim + `dialog-actions` column of buttons), just needs value corrections per COMP-03.

**Current backdrop/scale-in pattern to fix** (lines 74-102):
```css
.backdrop {
	position: fixed;
	inset: 0;
	background: var(--backdrop);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 40;
	animation: backdropIn var(--dur-med) var(--ease);
}
@keyframes backdropIn {
	from { opacity: 0; }
	to { opacity: 1; }
}
.dialog {
	background: var(--surface);
	border-radius: var(--radius-lg);
	padding: var(--space-lg);
	max-width: 360px;
	width: calc(100% - 32px);
	animation: dialogIn var(--dur-med) var(--ease-spring);
}
@keyframes dialogIn {
	from { opacity: 0; transform: scale(0.96); }
	to { opacity: 1; transform: scale(1); }
}
```
**Gaps vs COMP-03 spec (CONTEXT.md decisions section):** no `backdrop-filter: blur(var(--blur-backdrop))` on `.backdrop`; `max-width` is 360px not 420px; scale-in starts at 0.96 not 0.94; `--radius-lg` (20px) is already correct — keep as-is.

**Current button pattern to replace with shared `.btn--*` classes** (lines 125-165):
```css
.cta-btn, .cancel-btn {
	width: 100%; height: 52px; border-radius: var(--radius-sm);
	font-size: 16px; font-weight: 600; cursor: pointer; border: none;
}
.cta-destructive { background: var(--destructive); color: var(--text); }
.cta-accent { background: var(--accent); color: var(--on-accent); }
.cancel-btn { background: var(--surface); color: var(--text); border: 1px solid var(--line-strong); }
.cancel-btn:active { background: var(--surface-3); transform: scale(var(--press-scale)); }
.cta-destructive:active, .cta-accent:active { opacity: var(--press-opacity); transform: scale(var(--press-scale)); }
```
**Migration action** (per RESEARCH.md Open Question 3, recommended answer): swap `class="cta-btn cta-destructive"` → `class="btn btn--destructive"` and `class="cancel-btn"` → `class="btn btn--cancel"`; **delete** these local rules in the same commit since class names won't collide with `components.css` (`.btn--*` vs local `.cta-btn`/`.cancel-btn` — different names, safe to delete without a specificity fight, but must still be removed to avoid dead CSS).

**Markup unchanged (props/API frozen):**
```svelte
<button class="cta-btn" class:cta-destructive={...} class:cta-accent={...} onclick={onconfirm}>{ctaLabel}</button>
<button class="cancel-btn" onclick={oncancel}>Abbrechen</button>
```
German label `"Abbrechen"` and `role="dialog"`/`aria-modal`/`aria-labelledby` on the wrapping `<div>` (lines 48-53) must stay byte-identical.

---

### `src/ui/input/DartsAtDoubleDialog.svelte` and `src/ui/start/ResumePrompt.svelte` (dialogs, request-response)

**Analog:** `src/ui/dialogs/ConfirmDialog.svelte` (same treatment: scrim blur, radius-lg already likely present, scale-in correction, stacked buttons via shared `.btn--*` classes). Apply the identical backdrop/dialog CSS corrections and button class swap shown above. Preserve German labels e.g. `"Verwerfen"`, `"Fortsetzen"` (locked by `e2e/resume.spec.ts:71,106`).

---

### `src/ui/stats/StatCard.svelte` (component, transform)

**Analog:** itself — existing file (full contents, 46 lines):
```svelte
<div class="stat-card">
	<span class="stat-value">{value}</span>
	<span class="stat-label">{label}</span>
</div>

<style>
	.stat-card {
		background: var(--surface);
		border-radius: 8px;
		padding: var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
	.stat-value {
		font-size: 28px;
		font-weight: 600;
		color: var(--text);
		line-height: 1.2;
		font-family: var(--font-score);
		font-variant-numeric: tabular-nums;
	}
	.stat-label {
		font-size: 18px;
		font-weight: 400;
		color: var(--text-muted);
		line-height: 1.4;
	}
</style>
```
**Gaps vs COMP-04 / DS `StatCard.jsx` (per CONTEXT.md/RESEARCH.md):** value must be 40px/700 (`--text-3xl`) not 28px/600; label should be 17px muted (close to current 18px `--text-muted`, verify against DS token); padding should be `var(--space-md) var(--space-lg)` (16px 24px asymmetric) not uniform `var(--space-md)`; add `letter-spacing: var(--tracking-tight)` on value. Props (`label`, `value`) and markup structure stay unchanged — style-only edit, matching CONTEXT.md's "keep current props" rule.

---

### `src/ui/setup/MatchSetup.svelte` and `src/routes/match/+page.svelte` (ToggleRow markup swap)

**Analog:** `design/components/core/ToggleRow.jsx` (via RESEARCH.md's Pattern 2 transcription — no existing in-codebase button-based switch to copy from; current code uses native `<input type="checkbox" role="switch">`).

**Target markup (from RESEARCH.md, ready to use verbatim):**
```svelte
<button
  id="sets-toggle"
  role="switch"
  aria-checked={setsEnabled}
  class="switch"
  class:on={setsEnabled}
  onclick={() => (setsEnabled = !setsEnabled)}
>
  <span class="thumb" aria-hidden="true"></span>
</button>
```
```css
.switch {
	position: relative; width: 56px; height: 34px; flex-shrink: 0;
	background: var(--surface-3); border: 1px solid var(--line-strong);
	border-radius: var(--radius-pill); cursor: pointer; padding: 0;
	transition: background var(--dur-med) var(--ease), border-color var(--dur-med) var(--ease);
	box-shadow: inset 0 1px 3px rgba(0,0,0,0.35);
	-webkit-tap-highlight-color: transparent;
}
.switch.on { background: var(--accent); border-color: var(--accent); box-shadow: var(--glow-accent); }
.thumb {
	position: absolute; top: 3px; left: 3px; width: 26px; height: 26px; border-radius: 50%;
	background: var(--text-muted);
	transition: transform var(--dur-med) var(--ease-spring), background var(--dur-med) var(--ease);
	box-shadow: 0 1px 3px rgba(0,0,0,0.4);
}
.switch.on .thumb { background: var(--on-accent); transform: translateX(22px); }
```
**Critical:** preserve `id`, `role="switch"`, `aria-checked` exactly — swap element type only (`<input>` → `<button>`). Applies to 6 instances: `#sets-toggle`, `#caller-toggle`, `#sfx-toggle`, `#pause-toggle` (MatchSetup), `#match-caller-toggle`, `#match-sfx-toggle` (match/+page.svelte).

**Unresolved sizing conflict (`/match` only):** the audio-row is currently 36px tall (`.audio-row { height: 36px }`) and must accommodate a 56×34 switch — flagged by RESEARCH.md as the phase's #1 risk (Pitfall 1 / Open Question 2). Planner should treat this as a `checkpoint:human-verify` task, not silently pick a size.

---

## Shared Patterns

### `.btn` base + variant classes
**Source:** to be created at `src/styles/components.css`; canonical existing analog is `src/routes/+page.svelte:152-176` (`.menu-btn`/`.menu-btn--accent`)
**Apply to:** every button file in scope (routes hub, stats, data, history, history/[id], MatchSetup, PlayerPicker, ProfileManager, BullOffOrder, ConfirmDialog, DartsAtDoubleDialog, ResumePrompt)
**Sweep rule (mandatory, same commit):** delete the old local button CSS rule whenever a usage site adopts a `.btn--*` class — Svelte's scoped-style hash gives local rules higher specificity and will silently win otherwise (Pitfall 3).

### Press-state via CSS `:active` (not JS pointer handlers)
**Source:** `src/ui/dialogs/ConfirmDialog.svelte:152-165`
```css
.cancel-btn:active { background: var(--surface-3); transform: scale(var(--press-scale)); }
.cta-destructive:active { opacity: var(--press-opacity); transform: scale(var(--press-scale)); }
```
**Apply to:** all new `.btn--*` variants in `components.css` — do not introduce `Button.jsx`'s JS `onPointerDown`/`onPointerUp` handlers.

### Confirmation-dialog scrim + scale-in motion
**Source:** `src/ui/dialogs/ConfirmDialog.svelte:74-102` (needs value corrections: add `backdrop-filter: blur(var(--blur-backdrop))`, max-width 420px, scale from 0.94)
**Apply to:** `ConfirmDialog.svelte`, `DartsAtDoubleDialog.svelte`, `ResumePrompt.svelte` (all "confirmation-shaped dialogs" per CONTEXT.md).

### Tokens (already shipped, Phase 8) — no new token file needed
**Source:** `src/styles/elevation.css:1-31`, referenced in every pattern above (`--radius-lg`, `--backdrop`, `--blur-backdrop`, `--ease-spring`, `--press-scale`, `--press-opacity`).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `.action-btn` in `src/routes/data/+page.svelte` | component (flat action trigger) | request-response | No existing DS or codebase pattern for a flat-surface non-nav action button; RESEARCH.md Assumption A2 proposes a new `.btn--surface` extension class — planner must ratify class name/values, no existing analog to copy verbatim |
| Icon-only `.back-btn` (44×44) across 4 route files | component (icon nav) | request-response | `Button.jsx` defines no icon-only variant; RESEARCH.md Assumption A1 proposes `.btn--ghost` — closest existing look is already close (current `.back-btn` styling) but needs bump to ≥48×48 and formal class extraction |
| Outline `.delete-btn` in `src/routes/history/[id]/+page.svelte` | component (destructive action) | request-response | No outline-destructive analog exists yet in `components.css`; RESEARCH.md Assumption A3 proposes reusing the same discretionary treatment CONTEXT.md grants `ResumePrompt.svelte`'s `.btn-discard` — needs planner ratification of exact border/bg token combo (`--destructive`/`--destructive-line`/`--destructive-soft`) |
| `/match` audio-row ToggleRow sizing | component (event-driven toggle in compact deck) | event-driven | Structural conflict between DS 64px row / 56×34 switch and existing 36px compact row — no existing analog resolves this; requires an explicit design decision (see Pitfall 1) before implementation, not just a pattern copy |

## Metadata

**Analog search scope:** `src/routes/`, `src/ui/{dialogs,stats,setup,start,input}/`, `src/styles/`, `design/components/core/*.jsx` (reference only)
**Files scanned:** `src/app.css`, `src/styles/elevation.css`, `src/routes/+page.svelte`, `src/ui/dialogs/ConfirmDialog.svelte`, `src/ui/stats/StatCard.svelte`, plus full inventory cross-checked against 09-RESEARCH.md's direct-read list (14 source files read this session there)
**Pattern extraction date:** 2026-07-14
