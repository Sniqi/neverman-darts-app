# Phase 11: Spectator Display - Pattern Map

**Mapped:** 2026-07-14
**Files analyzed:** 5 (3 edited components + 1 test + 1 shared module referenced)
**Analogs found:** 5 / 5 — this phase edits existing files in place; each file's own current version IS its analog (transcription phase, not new-file phase)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|---------------|
| `src/ui/display/PlayerPanel.svelte` | component (display, prop-driven) | request-response (props in → DOM out, no I/O) | itself (current shipped version) + `design/components/display/PlayerPanel.jsx` (value source) | exact (in-place restyle) |
| `src/ui/display/MatchHeader.svelte` | component (display, prop-driven) | request-response | itself (current shipped version) + `design/components/display/MatchHeader.jsx` (value source) | exact (in-place restyle) |
| `src/ui/display/VisitLine.svelte` | component (display, dead code) | request-response | `src/ui/input/dart-notation.ts` (formatDart to import) | exact (import swap only) |
| `src/ui/display/VisitLine.test.ts` | test | request-response (render assertions) | itself (current shipped version) | exact (string updates only) |
| `src/ui/input/dart-notation.ts` | utility | transform (pure formatter) | itself — **read-only reference, not modified** (per its own header comment, do not add a second export or alter it for this phase) | n/a — consumed, not changed |

No files require a cross-directory analog search: this is a same-file transcription phase. `design/components/display/{MatchHeader,PlayerPanel}.jsx` and `design/components/scoring/DartPill.jsx` are the literal VALUE sources (design system), not code-pattern analogs — the CODE PATTERN analog for the Chrome-90 handling is the current `PlayerPanel.svelte` `@supports` block itself.

## Pattern Assignments

### `src/ui/display/PlayerPanel.svelte` (component, request-response)

**Analog:** itself, current shipped version (`src/ui/display/PlayerPanel.svelte`) + DS value source `design/components/display/PlayerPanel.jsx`

**Two-layer @supports pattern to preserve exactly** (current lines 546-580):
```css
/* Fallback for engines WITHOUT container-query support... */
@supports not (container-type: inline-size) {
	.player-panel {
		padding: clamp(8px, calc(2vw / var(--player-count, 2)), 24px)
			clamp(8px, calc(2vw / var(--player-count, 2)), 18px);
		gap: clamp(4px, calc(1.2vw / var(--player-count, 2)), 12px);
	}
	.player-name    { font-size: clamp(1.6rem, calc(11vw  / var(--player-count, 2)), 8.5rem); }
	.remaining-score { font-size: clamp(3rem,  calc(23vw  / var(--player-count, 2)), 16rem); }
	.ls-chip        { font-size: clamp(1.1rem, calc(6.5vw / var(--player-count, 2)), 4.4rem); }
	.bust-label     { font-size: clamp(1.5rem, calc(17vw  / var(--player-count, 2)), 6rem); }
	.dart-pill      { font-size: clamp(1rem,   calc(5vw   / var(--player-count, 2)), 3.2rem); }
	.h-total        { font-size: clamp(1.2rem, calc(6.7vw / var(--player-count, 2)), 4.5rem); }
	.h-remaining    { font-size: clamp(1rem,   calc(5.4vw / var(--player-count, 2)), 3.6rem); }
	.checkout-route { font-size: clamp(1rem,   calc(5.5vw / var(--player-count, 2)), 3rem); }
	.stats-line     { font-size: clamp(1rem,   calc(5.8vw / var(--player-count, 2)), 3.8rem); }
	.history-row.bust-row .h-total { font-size: clamp(1rem, calc(4.8vw / var(--player-count, 2)), 3.2rem); }
}

@supports not (grid-template-columns: subgrid) {
	.history-row { grid-template-columns: 1fr auto auto; }
}
```
**Rule:** every renamed/changed cqw rule in the primary (`@supports (container-type: inline-size)`-implicit / unconditional) layer needs its matching `Nvw` line updated here in the SAME commit, using `calc(Nvw / var(--player-count, 2))` with the SAME `N` as the new `--display-*` clamp's middle value. E.g. `.player-name` moving to `var(--display-name)` = `clamp(3rem, 10cqw, 12rem)` → fallback becomes `clamp(3rem, calc(10vw / var(--player-count, 2)), 12rem)`.

**Never do this** (locked anti-pattern, confirmed by `src/routes/display/+page.svelte:305-310` comment): duplicate-property same-rule fallbacks (e.g. `height: 100vh; height: 100dvh;` in one rule) — minifier strips the first. Fallback values MUST live in a separate `@supports not (...)` rule, never inline.

**Typography token mapping** (element → new `--display-*` token, from `src/styles/typography.css:34-38`):

| Element (current selector) | Current | New (--display-* token) |
|---|---|---|
| `.stat-label`/`.stat-val`/`.stats-line` | `clamp(1rem, 5.8cqw, 3.8rem)` | `var(--display-caption)` = `clamp(1.75rem, 4cqw, 5rem)` |
| `.dart-pill`, `.h-total`, `.h-remaining`, `.ls-chip` | assorted cqw clamps | `var(--display-body)` = `clamp(2rem, 5cqw, 6.5rem)` |
| `.checkout-route`, visit-total in DS (v.bust ? body : emph) | `clamp(1rem, 5.5cqw, 3rem)` | `var(--display-emph)` = `clamp(2.5rem, 6.5cqw, 8rem)` |
| `.player-name` | `clamp(1.6rem, 11cqw, 8.5rem)` | `var(--display-name)` = `clamp(3rem, 10cqw, 12rem)` |
| `.remaining-score` | `clamp(3rem, 23cqw, 16rem)` | `var(--display-score)` = `clamp(6rem, 27cqw, 26rem)` |

**Precomputed color-mix replacements needed** (never ship live `color-mix()` — Chrome 90 breaks silently; established rule at `src/routes/match/+page.svelte:494-496`, verbatim precedent):
```css
/* Source pattern: src/routes/match/+page.svelte:494-496 */
.dart-pill--double {
	background: rgba(240, 164, 36, 0.07);
	border-color: rgba(240, 164, 36, 0.3);
}
```
Apply identically for PlayerPanel:
| DS literal | Precomputed static | Target in PlayerPanel.svelte |
|---|---|---|
| `color-mix(in oklab, var(--accent) 7%, transparent)` | `rgba(240, 164, 36, 0.07)` | `.player-panel.active` box-shadow, 1st inset |
| `color-mix(in oklab, var(--accent) 22%, transparent)` | `rgba(240, 164, 36, 0.22)` | `.player-panel.active` box-shadow, 2nd inset |
| `color-mix(in oklab, var(--accent) 17%, transparent)` | `rgba(240, 164, 36, 0.17)` | `.history-row.live-row` background |
| `color-mix(in oklab, var(--accent) 40%, transparent)` | `rgba(240, 164, 36, 0.40)` | `.player-panel.active .remaining-score` text-shadow (Open Question 3 — not a UI-SPEC-tabled FIX row; confirm with planner before applying) |
| `color-mix(in oklab, var(--destructive) 16%, transparent)` | `rgba(229, 72, 77, 0.16)` | `.bust-overlay` background (Open Question 3 — same caveat) |

**formatDart local copy** (current, lines 22-28) — DS/DartPill.jsx source (verbatim, lines 4-10) resolves Q1 (outer-bull = `'Outer'`, not `'Bull'`):
```javascript
// Current PlayerPanel.svelte:22-28
function formatDart(dart: DartScore): string {
	if (dart.segment === 0) return '0';
	if (dart.multiplier === 2 && dart.segment === 25) return 'Bull';
	if (dart.multiplier === 1 && dart.segment === 25) return 'Outer';
	const prefix = dart.multiplier === 3 ? 'T' : dart.multiplier === 2 ? 'D' : '';
	return `${prefix}${dart.segment}`;
}
```
Per CONTEXT.md Q1 resolution: PlayerPanel keeps its OWN local short-form (do not import `dart-notation.ts` here — its header comment at `dart-notation.ts:3-5` explicitly reserves the shared module for `VisitLine.svelte`'s long form and match/+page.svelte, not PlayerPanel's short-pill form). Only the miss case changes: `'0'` → `'✕'` (matches DS `DartPill.jsx:5`). `'Outer'` and `'Bull'` (inner) stay as-is — they already match DS literally.

**MatchHeader vs PlayerPanel background-gradient distinction (Pitfall 4 — do not conflate):**
- `PlayerPanel.svelte` `.player-panel` / `.player-panel.active` backgrounds: LOCKED literal hex from DS — `linear-gradient(165deg, #1a1e29 0%, #12151d 100%)` (inactive), `linear-gradient(165deg, #272d3c 0%, #191d28 100%)` (active). MUST change from current `var(--surface-2)`/`var(--surface-3)` token forms.
- `MatchHeader.svelte` `.match-header` background: UI-SPEC marks this "acceptable — nearest-token mapping, no change required." Leave `linear-gradient(180deg, var(--surface-2) 0%, var(--surface) 100%)` as-is.

---

### `src/ui/display/MatchHeader.svelte` (component, request-response)

**Analog:** itself, current shipped version + DS value source `design/components/display/MatchHeader.jsx`

**Current structure (no @supports needed — MatchHeader uses plain `vw`, baseline-supported on Chrome 90):**
```css
/* Current MatchHeader.svelte:33-49 */
.match-header {
	font-size: clamp(2rem, 4vw, 5.6rem);   /* → clamp(1.75rem, 3.4vw, 6.5rem) */
	font-weight: 500;                       /* → 600 */
	padding: var(--space-sm) var(--space-lg); /* → clamp(8px, 1vw, 20px) clamp(16px, 2.5vw, 48px) */
	gap: clamp(0.4rem, 1vw, 1.2rem);        /* → clamp(0.5rem, 1.2vw, 1.6rem) */
	/* font-family: var(--font-score) — currently MISSING, must add */
}
.match-header::after {
	height: 14px;                           /* → 16px */
	background: linear-gradient(180deg, var(--accent-soft), transparent); /* → precomputed rgba below */
}
.mh-dot {
	font-size: 0.45em;                      /* → 0.4em */
	transform: translateY(-0.1em);          /* → translateY(-0.15em) */
}
.mh-mode { font-weight: /* implicit base 500, now needs explicit 600 via new base weight */ }
.mh-leg  { font-weight: 700;                /* → 800 */ }
```
**Bloom precomputed color-mix** (DS `MatchHeader.jsx:23`):
| DS literal | Precomputed static | Target |
|---|---|---|
| `color-mix(in oklab, var(--accent) 28%, transparent)` | `rgba(240, 164, 36, 0.28)` | `.match-header::after` background, replacing `var(--accent-soft)` (13%) |

**● separator markup** — current uses text-node `<span class="mh-dot" aria-hidden="true">●</span>` between `.mh-seg` spans (lines 25-29); DS `.jsx` (line 7, `dot` const reused twice) confirms the same text-node approach — Claude's Discretion item in CONTEXT.md is resolved by the existing shipped pattern: keep text nodes, do not switch to pseudo-elements.

---

### `src/ui/display/VisitLine.svelte` (component, dead code, request-response)

**Analog:** `src/ui/input/dart-notation.ts` (shared long-form formatDart)

**Current local copy to DELETE** (lines 16-23):
```typescript
// formatDart copied verbatim from src/ui/input/VisitStrip.svelte (lines 9-15)
function formatDart(dart: DartScore): string {
	if (dart.segment === 0) return '0 (Daneben)';
	if (dart.multiplier === 2 && dart.segment === 25) return 'Bull';
	if (dart.multiplier === 1 && dart.segment === 25) return 'Outer Bull';
	const prefix = dart.multiplier === 3 ? 'T' : dart.multiplier === 2 ? 'D' : '';
	return `${prefix}${dart.segment}`;
}
```
**Replace with import of the shared module:**
```typescript
// src/ui/input/dart-notation.ts (full file, current)
import type { DartScore } from '../../engine/types.js';

export function formatDart(dart: DartScore): string {
	if (dart.segment === 0) return '✕';
	if (dart.multiplier === 2 && dart.segment === 25) return 'Bull (50)';
	if (dart.multiplier === 1 && dart.segment === 25) return 'Bull (25)';
	const prefix = dart.multiplier === 3 ? 'T' : dart.multiplier === 2 ? 'D' : '';
	return `${prefix}${dart.segment}`;
}
```
Add `import { formatDart } from '../input/dart-notation.js';` to VisitLine.svelte's `<script>` block (alongside its existing `DartScore, Visit` type import from `../../engine/types.js`), remove the local function. No CSS/markup changes required — VisitLine's `.visit-line` font-size (line 76) has no `@supports` fallback and, per RESEARCH Pitfall 3, none should be added (dead code, out of scope).

---

### `src/ui/display/VisitLine.test.ts` (test)

**Analog:** itself, current shipped version — planned string updates only (Pitfall 2 in RESEARCH.md), no structural change.

Three assertions to update (grep for `'Bull'`, `'Outer Bull'`, `'0 (Daneben)'` to find all):
```typescript
// Line 89 — inner bull, update for precision even though 'Bull' substring still passes:
expect(screen.container.textContent).toContain('Bull (50)');
// was: expect(screen.container.textContent).toContain('Bull');
// and tighten the negative assertion at line 91 (still valid, no change needed —
// 'Bull (50)' does not contain 'Outer Bull')

// Line 100 — miss, MUST update (would otherwise fail):
expect(screen.container.textContent).toContain('✕');
// was: expect(screen.container.textContent).toContain('0 (Daneben)');

// Line 109 — outer bull, MUST update (would otherwise fail):
expect(screen.container.textContent).toContain('Bull (25)');
// was: expect(screen.container.textContent).toContain('Outer Bull');
```
Test names at lines 83, 94, 103 reference the old strings in their titles too (`'formatDart: miss {segment:0} → "0 (Daneben)"'` etc.) — update test titles to match for consistency, though this is not test-breaking on its own.

---

## Shared Patterns

### Chrome-90 two-layer @supports (source: `PlayerPanel.svelte:546-580`, apply to: PlayerPanel only — MatchHeader/VisitLine don't need it)
See full code block under PlayerPanel section above. Golden rule: base/primary rule always wins on modern browsers; `@supports not (...)` rule is the ONLY place Chrome-90 values live; never duplicate a property within one rule.

### color-mix() precomputation (source: `src/routes/match/+page.svelte:494-496`, apply to: PlayerPanel.svelte, MatchHeader.svelte)
Formula: `color-mix(in oklab, var(--accent) N%, transparent)` → `rgba(240, 164, 36, N/100)`; `color-mix(in oklab, var(--destructive) N%, transparent)` → `rgba(229, 72, 77, N/100)`. Always add a same-commit code comment citing the DS `.jsx` source line, per the existing precedent's comment style. Verification gate: `grep -rn "color-mix" src/ui/display/` must return zero matches after this phase.

### Dart notation module split (source: `src/ui/input/dart-notation.ts:1-14`)
Two intentionally different formatters coexist — do not unify:
- `dart-notation.ts` `formatDart` (long form: `'Bull (50)'`, `'Bull (25)'`, `'✕'`) — used by `VisitLine.svelte` (this phase) and `src/routes/match/+page.svelte`/`VisitStrip.svelte` (already done, prior phase).
- `PlayerPanel.svelte`'s own local `formatDart` (short form: `'Bull'`, `'Outer'`, `'✕'` after this phase's 1-line fix) — stays local, TV-pill-sized, never imported from the shared module.

## No Analog Found

None — this phase is a same-file transcription with the file's own current version as its baseline; no new files/components are introduced.

## Metadata

**Analog search scope:** `src/ui/display/`, `src/ui/input/dart-notation.ts`, `design/components/display/`, `design/components/scoring/DartPill.jsx`, `src/styles/typography.css`, `src/routes/match/+page.svelte` (color-mix precedent), `src/routes/display/+page.svelte` (anti-duplicate-property precedent)
**Files scanned:** 9 (read in full)
**Pattern extraction date:** 2026-07-14
