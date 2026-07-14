# Phase 10: Scoring Surface - Pattern Map

**Mapped:** 2026-07-14
**Files analyzed:** 6 (5 edit targets + 1 consistency-only orphan)
**Analogs found:** 6 / 6 (all analogs are the DS `.jsx` source files — this is a token-migration restyle, not new-feature code, so the "analog" for each Svelte file is its own DS spec sibling, cross-checked against Phase 9's established CSS-value-edit pattern)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/ui/input/Numpad.svelte` | component (input) | request-response (local $state, onconfirm callback) | `design/components/scoring/Numpad.jsx` | exact (DS source is a literal port target) |
| `src/ui/input/Dartboard.svelte` | component (input, SVG) | event-driven (pointerdown → dispatch) | `design/components/scoring/Dartboard.jsx` + `Dartboard.prompt.md` | role-match (values-only gap; component already mostly aligned) |
| `src/ui/input/ScorePanel.svelte` | component (display) | CRUD-read (reads `matchStore` runes) | `design/components/scoring/ScoreCard.jsx` | exact (DS source is a literal port target) |
| `src/ui/input/CheckoutSuggestion.svelte` | component (display, subcomponent) | CRUD-read | `design/components/scoring/ScoreCard.jsx` (checkout pill block, lines 31-38) | exact |
| `src/routes/match/+page.svelte` (`.dart-column`/`.dart-pill` + `formatDart`) | route (composition) + inline component | CRUD-read + event (tap-to-undo) | `design/components/scoring/DartPill.jsx` | exact (DS source is a literal port target; the Svelte host renders inline markup, not the component, but the visual contract is DartPill's) |
| `src/ui/input/VisitStrip.svelte` (orphaned, consistency-only) | component (display, unused) | CRUD-read | `design/components/scoring/VisitStrip.jsx` + `DartPill.jsx` | exact, but **do not rely on this file for SCOR-03 sign-off** — not imported anywhere (confirmed in RESEARCH.md) |

No "no analog found" files this phase — every target has a corresponding DS `.jsx` spec file.

---

## Pattern Assignments

### `src/ui/input/Numpad.svelte` (component, request-response)

**Analog:** `design/components/scoring/Numpad.jsx`

**Current structure to preserve** (`src/ui/input/Numpad.svelte:1-49`) — imports, `isValidVisitTotal`, `$state` for `inputValue`/`isInvalid`/`shaking`, `pressDigit`/`pressClear`/`pressConfirm`/`pressBackspace`. **Do not touch this script block** — only the template's `⌫` button gets a new attribute and the `<style>` block changes.

**Template diff — add aria-label** (current `src/ui/input/Numpad.svelte:71`):
```svelte
<button class="key backspace-key" onclick={pressBackspace}>⌫</button>
```
→
```svelte
<button class="key backspace-key" onclick={pressBackspace} aria-label="Letzte Ziffer löschen">⌫</button>
```
(Exact string from DS `Numpad.jsx:59`.)

**CSS value diff** (DS `Numpad.jsx:20-29, 40-59, 61-73` → current `src/ui/input/Numpad.svelte:96-193`):
| Rule | Current | Target (token) |
|---|---|---|
| `.input-display` height | `56px` | `var(--key-h)` (76px) |
| `.input-display` background | `var(--surface)` | `var(--bg-deep)` |
| `.input-display` font-size | `28px` | `var(--text-3xl)` (40px) |
| `.input-display` font-weight | `600` | `700` |
| `.input-display.shake` — keep `400ms` duration, keep local `@keyframes shake` (locked exception; DS names it `np-shake` but timing/easing is identical — keep existing name to avoid an unnecessary rename) | — | unchanged |
| `.error-msg` font-size | `14px` | `var(--text-sm)` (15px) |
| `.key` height | `64px` | `var(--key-h)` (76px) |
| `.key` font-size | `24px` | `var(--text-2xl)` (32px) |
| `.key` font-weight | `400` | `500` |
| `.key` box-shadow | none | `var(--edge-highlight)` (DS `Numpad.jsx:25`) |
| `.clear-key` font-size/weight | inherits `.key` (24px/400) | `var(--text-xl)` / `600` (DS `Numpad.jsx:57`) — needs own override, currently shares `.key` unmodified |
| `.backspace-key` font-size | inherits `.key` (24px) | `var(--text-xl)` (DS `Numpad.jsx:59`) — needs own override |
| `.confirm-key` height | `64px` | `var(--key-h)` (76px) |
| `.confirm-key` background | `var(--accent)` flat | `linear-gradient(180deg, var(--accent-bright) 0%, var(--accent) 45%, var(--accent-deep) 130%)` (DS `Numpad.jsx:63`) |
| `.confirm-key` font-size | `18px` | `var(--text-lg)` (22px) |
| `.confirm-key` font-weight | `600` | `700` |
| `.confirm-key` box-shadow | none | `var(--shadow-raise), inset 0 1px 0 rgba(255,255,255,0.25)` (DS `Numpad.jsx:66`) |

**Press-state pattern** (already correct, keep as-is): `.key:active { background: var(--surface-3); transform: scale(var(--press-scale)); }` at `src/ui/input/Numpad.svelte:164-167` matches DS's `pressFx` handlers exactly in intent — no change needed beyond ensuring it still applies after value edits.

---

### `src/ui/input/Dartboard.svelte` (component, event-driven SVG)

**Analog:** `design/components/scoring/Dartboard.jsx` / `Dartboard.prompt.md` (per RESEARCH.md Pitfall 5 — most of this component is already aligned; only 3 literal-value gaps remain)

**Keep byte-identical** (locked, do not touch): `screenToBoard`, `classifyHit`, all `R_*` radius constants, `buildRegions()`, `segmentStartAngle()`, `polarToXY()`, `describeAnnularSlice()`, `describeFullCircle()`, `handlePointerDown()` dispatch logic (`src/ui/input/Dartboard.svelte:10-192`). The 3 existing `Dartboard.test.ts` tests assert only dispatch behavior — must stay green unmodified.

**Notation strings already correct** (`src/ui/input/Dartboard.svelte:32-53`) — `'Bull (50)'`, `'Bull (25)'`, `'✕'`, `T${segment} (${points})`, `D${segment} (${points})` — no changes needed here, this is the reference the other 2 notation sites (`match/+page.svelte`, `VisitStrip.svelte`) should be brought up to.

**Remaining literal-value gaps** (3 edits only):
```
Current (src/ui/input/Dartboard.svelte):                          Target:
line 213: fill={flashKey === region.key ? 'var(--text-faint)' ...}  → rgba(255,255,255,0.35) for region flashes
line 226: fill={flashKey === 'outer-bull' ? 'var(--text-faint)' ...} → rgba(255,255,255,0.35)
line 237: fill={flashKey === 'inner-bull' ? 'var(--text-faint)' ...} → rgba(255,255,255,0.35)
line 246: fill={flashKey === 'miss' ? 'var(--text-faint)' ...}       → rgba(255,255,255,0.15)  (dimmer, miss-zone only)
line 258: font-size="52"  (floating label)                          → font-size="56"
line 261: stroke="var(--backdrop)"  (floating label halo)           → stroke="rgba(0,0,0,.75)"
```

**Flash/timer pattern to keep** (Pattern 2 from RESEARCH.md, already correct): `let flashKey = $state<string | null>(null); ... setTimeout(() => { flashKey = null; }, 300);` (`src/ui/input/Dartboard.svelte:22, 189`) — do not introduce a new abstraction.

**Score-float pattern to keep** (already correct, 1.6s locked): `src/ui/input/Dartboard.svelte:294-303` `@keyframes score-float` + `.score-float { animation: score-float 1.6s cubic-bezier(...) forwards; }`.

---

### `src/routes/match/+page.svelte` — `.dart-column`/`.dart-pill` + `formatDart` (SCOR-03)

**Analog:** `design/components/scoring/DartPill.jsx`

**Notation function diff** (current `src/routes/match/+page.svelte:208-214`):
```typescript
function formatDart(dart: DartScore): string {
	if (dart.segment === 0) return '0';
	if (dart.multiplier === 2 && dart.segment === 25) return 'Bull';
	if (dart.multiplier === 1 && dart.segment === 25) return 'Bull 25';
	const prefix = dart.multiplier === 3 ? 'T' : dart.multiplier === 2 ? 'D' : '';
	return `${prefix}${dart.segment}`;
}
```
Per CONTEXT.md's corrected notation spec (NOT DS `formatDart.jsx` verbatim — DS uses `'Bull'`/`'Outer'`/`'✕'`, but CONTEXT.md's locked decision overrides with `'Bull (50)'`/`'Bull (25)'`/`'✕'` to match `Dartboard.svelte`'s existing float-label notation exactly):
```typescript
function formatDart(dart: DartScore): string {
	if (dart.segment === 0) return '✕';
	if (dart.multiplier === 2 && dart.segment === 25) return 'Bull (50)';
	if (dart.multiplier === 1 && dart.segment === 25) return 'Bull (25)';
	const prefix = dart.multiplier === 3 ? 'T' : dart.multiplier === 2 ? 'D' : '';
	return `${prefix}${dart.segment}`;
}
```
(This makes `match/+page.svelte`'s `formatDart` byte-identical in output to `Dartboard.svelte:33-49`'s label branch — the "Claude's Discretion" consolidation option could extract this as a shared helper module if desired, but keep `VisitLine.svelte`'s copy untouched per Pitfall 1.)

**Pill CSS diff** (current `src/routes/match/+page.svelte:452-480`, target per DS `DartPill.jsx:18-30`):
```
Current:                                              Target:
.dart-pill { border-radius: var(--radius-sm); }       → border-radius: var(--radius-pill) (999px)
.dart-pill { font-size: 16px; font-weight: 400;
             color: var(--text-muted); }               → font-size stays app-appropriate (pill is 18px in DS default,
                                                          but this is a 76x52px slot button, not an inline pill — keep
                                                          current sizing, apply DS's COLOR/border semantics only)
.dart-pill (default/empty) border: 1px solid
             var(--line-strong)                        → unfilled: border: 1px solid var(--line); background:
                                                           rgba(255,255,255,0.06) (DS line 18)
.dart-pill.filled { border-color: var(--accent);
                     color: var(--text); font-weight:600 } → split into 3 distinct visual states per DS lines 19-21:
  • triple/bull (multiplier===3 && segment!==25, OR segment===25):
      color: var(--accent); background: var(--accent-soft);
      border: 1px solid var(--accent-line)
  • double (multiplier===2 && segment!==25):
      color: var(--accent-double); background: color-mix(in oklab, var(--accent) 7%, transparent);
      border: 1px solid color-mix(in oklab, var(--accent) 30%, transparent)
  • miss (segment===0):
      color: var(--text-faint); border: 1px dashed var(--line-strong)
.dart-column.bust .dart-pill { border-color:
   var(--destructive-line); color: var(--destructive); }  → per CONTEXT.md Q2 resolution + DS line 22 (STATIC
                                                              precompute — Chrome 90 forbids runtime color-mix()):
  color: [precomputed static hex equal to color-mix(in oklab, var(--destructive) 75%, white)];
  background: var(--destructive-soft);
  border: 1px solid var(--destructive-line);
  text-decoration: line-through;
```
**IMPORTANT (Chrome-90 constraint, see MEMORY):** DS `DartPill.jsx:22` uses `color-mix(in oklab, var(--destructive) 75%, white)` for the bust text color and `color-mix(in oklab, var(--accent) 7%/30%, transparent)` for the double bg/border. The Chromecast `/display` receiver runs Chrome 90 with no `color-mix()` support — but `/match` is the scoring window (tablet/PC Chrome, not the Cast receiver), so `color-mix()` MAY be safe here. Still, per the CONTEXT.md decision text ("DartPill.jsx uses color-mix: precompute static per the global Chrome-90 decision"), the phase decision is to precompute a static value rather than use `color-mix()` at runtime — follow that locked instruction and calculate the equivalent static hex/rgba during planning rather than shipping a live `color-mix()` expression.

**Struck-through pattern:** `text-decoration: line-through` (DS `DartPill.jsx:28`) is new — no existing analog in this codebase; straightforward CSS addition, no test conflict expected (grep confirms no existing `text-decoration` assertions on this element).

---

### `src/ui/input/ScorePanel.svelte` (component, CRUD-read)

**Analog:** `design/components/scoring/ScoreCard.jsx`

**Preserve exactly:** loop structure `{#each matchStore.state.players as player, i (player.id)}`, `isActive` derivation, CheckoutSuggestion composition, `legs-info`/`sets` conditional (`src/ui/input/ScorePanel.svelte:9-32`) — no script/template logic changes, CSS-only pass.

**CSS value diff** (current `src/ui/input/ScorePanel.svelte:42-127` vs. DS `ScoreCard.jsx:6-43`):
```
Current:                                              Target:
.player-card { border-left: 3px solid transparent; }  → box-shadow-based edge instead of border-left (see .active below)
.player-card.active {
  border-color: var(--accent-line);
  border-left-color: var(--accent);
  background: linear-gradient(var(--accent-soft), var(--accent-soft)), var(--surface);
}                                                      →
.player-card.active {
  border: 1px solid var(--accent-line);
  box-shadow: inset 4px 0 0 var(--accent), var(--glow-accent), var(--edge-highlight);
  background: linear-gradient(var(--accent-soft), var(--accent-soft)), var(--surface-2);
  transition: background var(--dur-slow) var(--ease), box-shadow var(--dur-slow) var(--ease),
              border-color var(--dur-slow) var(--ease);
}
.player-name { font-size: 26px; font-weight: 600; }   → font-size: var(--text-lg) [22px]; font-weight: 600 (unchanged);
                                                          ADD: overflow: hidden; text-overflow: ellipsis;
                                                          white-space: nowrap (no truncation exists today)
.remaining { font-weight: 600; }                       → font-weight varies by state (see below), NOT flat 600
.remaining-active { font-size: 64px; }                 → font-size: var(--text-score-active) [96px];
                                                          font-weight: var(--weight-heavy) [800];
                                                          text-shadow: 0 0 40px color-mix(in oklab, var(--accent) 35%, transparent)
                                                          (precompute static per Chrome-90 rule — this element only
                                                          renders on /match, not /display, so verify whether that
                                                          constraint applies here or only to Cast-rendered surfaces
                                                          before deciding to precompute vs. use color-mix live)
.remaining-inactive { font-size: 32px; }               → font-size: var(--text-score-inactive) [44px]; font-weight: 700
(landscape overrides at lines 99-127 — 80px/52px)      → same proportional bump: 96px stays 96px in landscape too per
                                                          DS (no separate landscape variant in ScoreCard.jsx); flag
                                                          Pitfall 4 (3-4 player overflow risk) for verification
```

**BUST handling — NEW, no existing analog on this component** (RESEARCH.md Pitfall 3 confirmed: `ScorePanel.svelte` has zero bust code today). Per CONTEXT.md Q2 resolution: **do NOT add a new bust indicator to ScorePanel.svelte** — SCOR-04's BUST requirement is satisfied entirely by the `.dart-column.bust .dart-pill` treatment in `match/+page.svelte` (see above), driven by the same `isBust` state already read there. No `ScorePanel.svelte` changes needed for BUST.

---

### `src/ui/input/CheckoutSuggestion.svelte` (component, CRUD-read)

**Analog:** `design/components/scoring/ScoreCard.jsx` lines 31-38 (checkout pill block)

**Preserve exactly:** `{#if matchStore.suggestion !== null}` guard, `matchStore.suggestion.join(' ')` (`src/ui/input/CheckoutSuggestion.svelte:5-9`) — no logic changes.

**CSS value diff** (current `src/ui/input/CheckoutSuggestion.svelte:12-19` vs. DS `ScoreCard.jsx:31-38`):
```
Current:                                              Target:
.suggestion {
  font-size: 14px; font-weight: 400;
  color: var(--accent); line-height: 1.4;
  white-space: nowrap;
}                                                      →
.suggestion {
  font-size: var(--text-base) [17px]; font-weight: 700;
  color: var(--accent);
  background: var(--accent-soft);
  border: 1px solid var(--accent-line);
  border-radius: var(--radius-pill);
  padding: 4px 14px;
  line-height: 1.4;
  white-space: nowrap;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
  box-shadow: var(--glow-accent);  /* CONTEXT.md's "Claude's Discretion" addition beyond DS literal */
}
```
Element stays a bare `<span>` — becomes a pill via border/bg/radius, no markup change needed.

---

### `src/ui/input/VisitStrip.svelte` (orphaned — consistency-only, NOT sufficient alone for SCOR-03)

**Analog:** `design/components/scoring/VisitStrip.jsx` + `DartPill.jsx`

Per RESEARCH.md Pitfall 2 and CONTEXT.md's Q1 resolution: this component is dead code (not imported anywhere). Update its notation/CSS for consistency using the same diffs as `match/+page.svelte` above, but this is optional/low-priority cleanup — **do not treat it as satisfying SCOR-03**. Verify the live `/match` page (via dev-server), not this file, for sign-off.

---

## Shared Patterns

### Chrome-90 static color-mix precompute (cross-cutting)
**Source:** memory note `chromecast-receiver-chrome90.md` + CONTEXT.md Q2 + DS `DartPill.jsx:20,22`, `ScoreCard.jsx:28`
**Applies to:** `.dart-column.bust .dart-pill` (bust text color), `.dart-pill` double state (bg/border color-mix), `ScorePanel.svelte` active-score `text-shadow` glow.
**Rule:** The `/display` (Cast) surface is Chrome 90 and has zero `color-mix()` support, but `/match` (this phase's surface) runs on tablet/PC Chrome where `color-mix()` is fine. CONTEXT.md's decision text nonetheless directs precomputing a static value "per the global Chrome-90 decision" — treat this as the locked instruction for `/match` too (consistency across the token system, and cheap insurance against future surface reuse) rather than shipping live `color-mix()` expressions. Do NOT use the "duplicate-property fallback" pattern (minifier strips it) — precompute the literal hex/rgba instead.

### Local `$state` transient-visual timers (already established, Phase 8/9)
**Source:** `src/ui/input/Dartboard.svelte:22,189` (flash), `src/ui/input/Numpad.svelte:17,34-35` (shake)
**Applies to:** any new flash/press/shake visual — keep using bare `let x = $state(...)` + `setTimeout`, no new library/abstraction.

### Computed-style component test (Phase 9 pattern, to replicate for Wave 0 gaps)
**Source:** `src/ui/stats/StatCard.test.ts` (cited in RESEARCH.md Pattern 1)
```typescript
import '../../app.css';
import { render } from 'vitest-browser-svelte';
import { expect, test } from 'vitest';

test('.key computed height is 76px', async () => {
	const screen = render(Numpad, { onconfirm: () => {} });
	const keyEl = screen.container.querySelector('.digit-key') as HTMLElement;
	const style = getComputedStyle(keyEl);
	expect(style.height).toBe('76px');
});
```
**Applies to:** new test files needed per RESEARCH.md Wave 0 gaps — `Numpad.test.ts`, `ScorePanel.test.ts`, `CheckoutSuggestion.test.ts`, plus new assertions appended to existing `Dartboard.test.ts` and a new test/E2E assertion for `match/+page.svelte`'s live pill notation.

### Do-not-touch boundary (cross-cutting guardrail, not a code pattern but critical for every plan)
- `src/ui/display/VisitLine.svelte` + `VisitLine.test.ts` — Phase 11 scope, has its own old-string-asserting test (`'Bull'`, `'Outer Bull'`, `'0 (Daneben)'`). Never edit.
- `src/engine/board.js` (`classifyHit`, `screenToBoard`) — byte-identical requirement, SCOR-02.
- `isValidVisitTotal` / validation logic in `Numpad.svelte` script — behavior locked, visuals only.
- `matchStore`/`reducer.ts` — out of scope entirely.

## No Analog Found

None — every edit target has a direct DS `.jsx` counterpart.

## Metadata

**Analog search scope:** `design/components/scoring/*` (DS source of truth per Phase 8-12 milestone), `src/ui/input/*.svelte`, `src/routes/match/+page.svelte`, `src/styles/{colors,typography,spacing,elevation}.css` (token confirmation)
**Files scanned:** Numpad.svelte, Dartboard.svelte, ScorePanel.svelte, CheckoutSuggestion.svelte, match/+page.svelte, VisitStrip.svelte, Numpad.jsx, DartPill.jsx, ScoreCard.jsx, VisitStrip.jsx (referenced), colors.css, typography.css, elevation.css, spacing.css
**Pattern extraction date:** 2026-07-14
