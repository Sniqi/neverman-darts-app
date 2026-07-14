# Phase 9: Core Components - Research

**Researched:** 2026-07-14
**Domain:** Svelte 5 CSS/markup restyling — no new packages, no runtime dependencies
**Confidence:** HIGH

## Summary

This phase requires zero new libraries and zero architecture research — it is a pure
transcription-and-diff exercise. `09-CONTEXT.md` and `09-UI-SPEC.md` already contain the
authoritative decisions and a large share of the gap analysis. This RESEARCH.md verifies those
claims directly against the live codebase (every file in scope was read in full), and — critically
— extends the inventory to markup the UI-SPEC's per-component gap tables did **not** enumerate:
several button-like elements exist in files that are in File Scope but were only partially audited
in UI-SPEC (`ProfileManager.svelte`'s inline edit/icon buttons, `PlayerPicker.svelte`'s remove/add/
picker buttons, the four route files' identical `.back-btn`, `stats/+page.svelte`'s duplicate
`.menu-btn`, `data/+page.svelte`'s `.action-btn`, `history/[id]/+page.svelte`'s outline
`.delete-btn`). None of these map cleanly onto the five DS Button variants (`menu`/`accent`/`cta`/
`destructive`/`cancel`) — `Button.jsx` defines exactly those five and nothing else, confirmed by
direct read. The planner must decide a policy for icon-only and outline-style buttons that the DS
doesn't cover (this research proposes one, marked `[ASSUMED]`, for the planner/discuss-phase to
ratify).

The single largest execution risk is not stylistic but structural: the `/match` audio bar
(`src/routes/match/+page.svelte`) currently renders `.audio-row` at a hand-tuned 36px height with a
native 36×20 checkbox — converting this to the DS ToggleRow's 56×34 custom switch inside a 64px
row will not fit the existing compact control-deck layout without a deliberate redesign decision
(see Pitfall 1). CONTEXT.md locks that these two rows are in scope (COMP-02) but does not resolve
this size conflict — flagged as an Open Question.

**Primary recommendation:** Build `.btn` + variant classes in `src/styles/components.css` exactly
per `Button.jsx`'s five variants; treat every non-conforming button (icon-only back buttons,
outline destructive, plain surface action buttons) as an explicit "ghost"/"secondary" extension
class layered on `.btn` base, added in this phase since CONTEXT.md's discretion note explicitly
allows it ("Whether ghost/secondary variants get distinct classes... follow any existing codebase
idiom"). Do the ToggleRow markup swap identically in all 6 locations (4 in MatchSetup, 2 in
match/+page.svelte) reusing one Svelte pattern (snippet or tiny local component), preserving `id`/
`role="switch"`/`aria-checked` exactly.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Button visual variants (`.btn` classes) | Browser/Client (CSS) | — | Pure presentation; no data flow change |
| Chip/SegmentedControl/Stepper/ToggleRow markup+styles | Browser/Client (Svelte component) | — | Local UI state (`$state` already exists); this phase only touches render/markup, not the state machine |
| ConfirmDialog/DartsAtDoubleDialog/ResumePrompt visual treatment | Browser/Client (Svelte component) | — | Props/API frozen per CONTEXT.md; only `<style>` blocks change |
| StatCard visual treatment | Browser/Client (Svelte component) | — | Props (`label`,`value`) frozen; caller (stats dashboard) unaffected |
| Shared `.btn` CSS distribution via `app.css` import | Browser/Client (global stylesheet cascade) | — | New `components.css` must coexist with Svelte scoped styles (see Pitfall 3) |

No backend/API/database tier involvement — this is a static, client-only PWA and the phase is
restyle-only (REQUIREMENTS.md: "pure restyling... no functional changes").

## Standard Stack

No new packages. This phase uses only what Phase 8 already shipped:

| Asset | Status | Purpose |
|-------|--------|---------|
| `src/styles/{colors,typography,spacing,elevation,fonts}.css` | Shipped (Phase 8) | All tokens this phase consumes — verified present: `--control-h` 56px, `--row-h` 64px, `--hit-min` 48px, `--key-h` 76px (spacing.css:12-15), `--radius-sm/md/lg/pill` (elevation.css:3-8), `--press-scale` 0.97, `--ease-spring`, `--backdrop`, `--blur-backdrop` 12px (elevation.css:18-30), `--text-md/lg/xl/3xl` etc. (typography.css:9-19), `--surface/-2/-3`, `--on-accent`, `--destructive(-soft/-line)`, `--border-input`, `--line(-strong)`, `--bg-deep`, `--text-soft/-muted` (colors.css). |
| `design/components/core/{Button,Chip,SegmentedControl,Stepper,ToggleRow,StatCard,ConfirmDialog}.jsx` | Reference only, not ported | Confirmed exact prop/style shape by direct read (see Code Examples) — all 7 files read this session |
| Svelte 5 (`$state`, `$props`, `$derived`, snippets) | Already in use throughout | No new API surface needed |

### Alternatives Considered

None — CONTEXT.md already locked "shared CSS classes, not new Svelte components" for buttons, and
"restyle in place" for everything else. No alternative stack exists to evaluate.

## Package Legitimacy Audit

**Not applicable.** This phase installs zero packages — pure CSS/Svelte-markup restyle of existing
files plus one new file (`src/styles/components.css`, hand-written, no dependency). No `npm view` /
registry check needed.

## Architecture Patterns

### System Architecture Diagram

```
app.css (existing aggregator)
  │
  ├─ @import colors.css / typography.css / spacing.css / elevation.css / fonts.css   (Phase 8, unchanged)
  └─ @import components.css   ← NEW THIS PHASE (.btn base + variant classes)
        │
        ▼
  Svelte component <style> blocks (scoped, per-file)
        │
        ├─ consume var(--token) values directly (Chip/Segmented/Stepper/ToggleRow/StatCard/
        │   ConfirmDialog keep their own scoped <style> — CONTEXT.md: "restyled in place")
        │
        └─ <button class="btn btn--menu">  ← usage sites ADD these classes
              (routes/+page.svelte, routes/stats/+page.svelte, MatchSetup .start-btn,
               BullOffOrder .confirm-btn, ConfirmDialog .cta-btn/.cancel-btn,
               ProfileManager .delete-btn/.cancel-btn, ResumePrompt .btn-resume)

Data flow for a button press (unchanged by this phase):
  pointerdown → CSS transform: scale(var(--press-scale)) [presentation only]
  onclick     → existing Svelte event handler [untouched — no logic changes]
```

### Recommended Project Structure

```
src/
├── app.css                      # add one line: @import './styles/components.css';
├── styles/
│   └── components.css           # NEW — .btn base + .btn--menu/--accent/--cta/--destructive/--cancel
│                                 #        (+ discretionary .btn--ghost / .btn--icon for non-DS buttons)
├── ui/
│   ├── dialogs/ConfirmDialog.svelte      # style-only edit; buttons swap to shared .btn classes
│   ├── stats/StatCard.svelte             # style-only edit
│   ├── setup/MatchSetup.svelte           # markup+style: chips, segmented, steppers, toggles
│   ├── setup/PlayerPicker.svelte         # button-class swaps (remove/add/picker-item)
│   ├── setup/ProfileManager.svelte       # markup+style: delete sheet toggle treatment + button swaps
│   ├── setup/BullOffOrder.svelte         # .confirm-btn → .btn--cta
│   ├── start/ResumePrompt.svelte         # button-class swaps, font/height bump
│   └── input/DartsAtDoubleDialog.svelte  # +1 line: backdrop-filter blur
└── routes/
    ├── +page.svelte              # .menu-btn/.menu-btn--accent → .btn--menu/.btn--accent
    ├── stats/+page.svelte        # duplicate .menu-btn pattern — same fix
    ├── data/+page.svelte         # .action-btn → needs a variant decision (see Open Questions)
    ├── history/+page.svelte      # .back-btn only (no other buttons)
    ├── history/[id]/+page.svelte # .back-btn + outline .delete-btn (see Open Questions)
    └── match/+page.svelte        # ONLY .audio-bar / #match-caller-toggle / #match-sfx-toggle in scope
```

### Pattern 1: Shared `.btn` base + variant modifier classes

**What:** One `.btn` class carries the properties common to all 5 variants (full width, gap,
transition, disabled opacity, tap-highlight removal, pointer press-state via JS or `:active`).
Variant classes (`.btn--menu`, `.btn--accent`, `.btn--cta`, `.btn--destructive`, `.btn--cancel`)
add only what differs (height, background, color, font-size/weight, border, box-shadow).

**When to use:** Every button enumerated in UI-SPEC's Button gap table, plus the additional
instances found this session (see Common Pitfalls / Don't-miss inventory below).

**Example (transcribed from `Button.jsx`, confirmed present at `design/components/core/Button.jsx:11-31`):**
```css
/* Source: design/components/core/Button.jsx — transcribed to CSS custom properties */
.btn {
  display: flex; align-items: center; justify-content: center;
  width: 100%; border: none; cursor: pointer;
  font-family: var(--font-ui); text-align: left;
  gap: var(--space-sm);
  transition: transform var(--dur-base) var(--ease),
              background var(--dur-base) var(--ease),
              filter var(--dur-base) var(--ease);
  -webkit-tap-highlight-color: transparent;
}
.btn:disabled { opacity: 0.4; cursor: default; }

.btn--accent {
  background: linear-gradient(180deg, var(--accent-bright) 0%, var(--accent) 45%, var(--accent-deep) 130%);
  color: var(--on-accent);
  box-shadow: var(--shadow-raise), inset 0 1px 0 rgba(255,255,255,0.25);
  height: var(--row-h); padding: 0 var(--space-lg);
  border-radius: var(--radius-sm); font-size: var(--text-md); font-weight: 600;
}
```

Press-state (JS, since it must reset on pointerup/pointerleave, not just `:active` which doesn't
fire brightness filter reliably across touch): attach shared `onpointerdown`/`onpointerup`/
`onpointerleave` handlers, OR — simpler for a CSS-classes-only architecture — use
`:active { transform: scale(var(--press-scale)); filter: brightness(1.1); }` plus `pointer-events`
already work fine for touch in this codebase (existing `.cta-accent:active`/`.cancel-btn:active` in
`ConfirmDialog.svelte:152-165` already use this exact pattern with CSS `:active`, not JS handlers —
**recommend keeping the codebase's existing CSS-`:active` idiom** rather than introducing
`Button.jsx`'s JS pointerdown/up pattern, since `:active` + `transform`/`filter` achieves the same
visual result with less code and matches "Surgical Changes" / existing idiom).

### Pattern 2: Custom switch markup (ToggleRow) replacing native checkbox

**What:** `<button role="switch" aria-checked={checked}>` containing an absolutely-positioned thumb
`<span>`, replacing `<input type="checkbox" role="switch">`.

**When to use:** All 6 toggle instances (`#sets-toggle`, `#caller-toggle`, `#sfx-toggle`,
`#pause-toggle` in `MatchSetup.svelte`; `#match-caller-toggle`, `#match-sfx-toggle` in
`match/+page.svelte`).

**Example (transcribed from `design/components/core/ToggleRow.jsx:14-30`, confirmed by direct read):**
```svelte
<!-- Source: design/components/core/ToggleRow.jsx -->
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
.switch.on {
  background: var(--accent); border-color: var(--accent);
  box-shadow: var(--glow-accent);
}
.thumb {
  position: absolute; top: 3px; left: 3px; width: 26px; height: 26px; border-radius: 50%;
  background: var(--text-muted);
  transition: transform var(--dur-med) var(--ease-spring), background var(--dur-med) var(--ease);
  box-shadow: 0 1px 3px rgba(0,0,0,0.4);
}
.switch.on .thumb { background: var(--on-accent); transform: translateX(22px); }
```

**Critical preservation requirement:** the `id`, `role="switch"`, and `aria-checked` must be on the
same element type semantics (a real `<button>`, which natively supports `role="switch"` +
`aria-checked` for AT and matches `getByRole` test queries) — swapping `<input type=checkbox
role=switch>` for `<button role=switch aria-checked>` is accessibility-**equivalent** and Playwright/
Testing-Library's `getByRole('switch')` queries work identically on both. No E2E test in this repo
currently queries these toggles by role (confirmed via grep — see Common Pitfalls / E2E lock list),
so this swap carries no E2E regression risk, but any future test must use `getByRole('switch', {name...})`
not `getByLabelText` assumptions tied to `<input>`.

### Anti-Patterns to Avoid

- **Re-deriving DS values from memory instead of the `.jsx` files:** All values in this RESEARCH.md
  and in UI-SPEC.md were copied from direct reads of the 7 `design/components/core/*.jsx` files this
  session — do not let the planner/executor re-guess a value (e.g. spring easing curve, exact
  gradient stops) instead of grepping the source file.
- **Introducing `Button.jsx`'s inline-JS pointerdown/up handlers when a CSS `:active` pseudo-class
  already achieves the same visual result** (see Pattern 1) — adds JS with no user-visible benefit,
  violates "Simplicity First."
- **Forgetting that `ConfirmDialog.svelte`'s existing `.cta-accent:active`/`.cta-destructive:active`
  CSS already reference `var(--press-scale)`/`var(--press-opacity)`** — don't duplicate this logic
  when refactoring to shared `.btn` classes; either remove the local `:active` rule if `.btn:active`
  in `components.css` now covers it, or keep local override only where semantics differ.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Spring easing curve for switch thumb / dialog scale-in | A custom cubic-bezier guess | `var(--ease-spring)` = `cubic-bezier(0.3, 1.4, 0.4, 1)` (elevation.css:27, already shipped) | Exact value already exists and is used by `ConfirmDialog.svelte`'s existing (if under-scaled) `dialogIn` keyframe — Phase 9 only needs to correct the scale/translateY values, not invent new easing |
| Backdrop blur amount | A magic-number `blur(10px)` | `var(--blur-backdrop)` = `12px` (elevation.css:19) | Token already defines the DS value; hand-picking a blur amount risks drifting from `DartsAtDoubleDialog`'s eventual blur (must match) |
| Accent gradient stops | Re-deriving `#f0a424` variations by eye | `linear-gradient(180deg, var(--accent-bright) 0%, var(--accent) 45%, var(--accent-deep) 130%)` — this EXACT string appears identically in `Button.jsx:22`, `Chip.jsx:9`, `SegmentedControl.jsx:17` | Copy-paste the verbatim gradient string into `components.css`; three DS source files independently confirm it's the same recipe everywhere — no per-component variation exists |

**Key insight:** Every value needed this phase already exists as a token or as an exact string
repeated verbatim across 2-3 DS source files (confirmed by reading all 7). There is no ambiguity to
resolve by invention — only faithful transcription plus discretion calls for the handful of
non-DS-covered button shapes (see Open Questions).

## Common Pitfalls

### Pitfall 1: `/match` audio-bar rows are structurally too small for the DS ToggleRow

**What goes wrong:** `match/+page.svelte`'s `.audio-row` is 36px tall (`.audio-row { height: 36px }`,
match/+page.svelte:543) and packs label (42px wide) + native 36×20 checkbox + volume `<input
type=range>` + percentage text all on one line. The DS `ToggleRow` spec is a standalone 64px row
with just a label and a 56×34 switch — it has no volume-slider variant.
**Why it happens:** CONTEXT.md's success criterion 2 explicitly pulls these two rows into COMP-02
scope ("the audio/SFX toggle rows on `/match` ARE in scope now"), but neither CONTEXT.md nor
UI-SPEC.md addresses how the compound label+switch+slider+pct row fits DS row-height/switch-size
constraints inside the already-cramped `/match` control deck (a live-scoring screen where vertical
space is precious — landscape mode gives the control deck a fixed-height column, per
`match/+page.svelte:607-619`).
**How to avoid:** The planner must make an explicit sizing call for this row: either (a) grow the
row to accommodate the 56×34 switch at the cost of `/match` vertical space, or (b) keep the row
compact and use a smaller custom switch scaled down from 56×34 (a deviation from DS spec that
should be flagged and justified in the PLAN, not silently done). Given `/match` is out of Phase 9's
primary focus (only these 2 rows are in scope; Numpad/board/undo/visit-strip are all Phase 10),
recommend option (a) is safer for consistency — but this is a design call, not something a research
step can resolve. **This is the #1 planning risk in this phase.**
**Warning signs:** If a plan task says "apply ToggleRow markup to `/match` audio rows" without also
specifying the resulting row height/layout impact on the rest of the control deck, the task is
underspecified.

### Pitfall 2: `getByRole('button', {name: '+'})` / `'501'` / `'Double Out'` accessible-name locks

**What goes wrong:** Several E2E and component tests assert accessible names that are the **entire
visible text content** of a button with no other children:
- `page.getByRole('button', { name: '+' })` — `ProfileManager.test.ts:18` (the create-profile `+`
  button)
- `page.getByRole('button', { name: '501', exact: true })` — `e2e/full-match-flow.spec.ts:20`,
  `e2e/resume.spec.ts:42`, `e2e/spectator-sync.spec.ts:51` (chip)
- `page.getByRole('button', { name: 'Double Out' })` — `e2e/full-match-flow.spec.ts:21` (segmented
  control option)
- `page.getByRole('button', { name: 'Legs verringern' })` — `e2e/full-match-flow.spec.ts:31`
  (stepper aria-label)
- `page.getByRole('button', { name: 'Spielreihenfolge bestätigen' })` — 3 E2E specs (BullOffOrder
  confirm)
- `page.getByRole('button', { name: 'Verwerfen' })` / `'Fortsetzen'` — `e2e/resume.spec.ts:71,106`
  (ResumePrompt)
- `page.getByRole('button', { name: 'Neues Spiel' })` — `e2e/full-match-flow.spec.ts:97` (hub accent
  button; the chevron SVG already has `aria-hidden="true"` so it does not pollute the name — keep
  this attribute on any new/restructured chevron markup)
**Why it happens:** Restructuring a button's internal markup (e.g. wrapping the label in a `<span>`,
adding decorative elements) is safe as long as no new *visible, non-aria-hidden* text node is
introduced as a sibling. Wrapping existing text in a `<span>` does not change the accessible name.
**How to avoid:** After any markup change to a DS-restyled button, grep the touched file's new markup
for added text nodes and confirm any new icon/decoration carries `aria-hidden="true"`.
**Warning signs:** Playwright red on an unrelated-seeming test after a markup-only CSS change is
almost always an accessible-name drift.

### Pitfall 3: Shared `.btn` classes vs. Svelte-scoped per-file styles — specificity conflicts

**What goes wrong:** Svelte scopes component `<style>` blocks by appending a hash class
(e.g. `.chip.svelte-abc123`), which has **higher specificity** than a plain global `.btn--accent`
class of equal specificity (both are single-class selectors, but Svelte's scoping adds an *extra*
attribute-like hash class, making the compiled selector two classes deep, e.g.
`.start-btn.svelte-xyz`). If a component keeps its OWN local `.start-btn { font-size: 18px }` rule
AND also adds `class="btn btn--cta"` from the global sheet, the local scoped rule (two-class
specificity via the hash) can silently win over the imported one-class-deep `.btn--cta` rule,
producing a residual old value that "looks fixed" in the diff but isn't at runtime.
**Why it happens:** `app.css`'s `@import` order (colors → typography → spacing → elevation → fonts →
NEW components.css) puts `components.css` last among globals, but Svelte-scoped `<style>` blocks are
injected into the document in component-mount order, which is unpredictable relative to the head
`<link>`/inlined global CSS — specificity, not source order, decides the winner here, and Svelte's
scoping hash tips specificity in the local file's favor.
**How to avoid:** When migrating a button to shared `.btn` classes, **delete the old local CSS rule
in the same commit** (per CONTEXT.md/UI-SPEC's explicit instruction: "residual per-file button CSS
that should be DELETED in the same pass") — do not leave both rules coexisting even temporarily. Verify
visually per component after the swap, not just by reading the diff.
**Warning signs:** A component's local `<style>` block still contains a selector matching a class
that's also defined in `components.css` after the "restyle" task is marked done.

### Pitfall 4: Isolated component tests need `app.css` imported for `var(--token)` to resolve

**What goes wrong:** Per the established Phase 8 pattern (`ReloadPrompt.test.ts:20-26`, explicitly
documented in that file's comments and in STATE.md's Phase 08-03 decision log), a Svelte component
rendered in isolation via `vitest-browser-svelte`'s `render()` has **no root `+layout.svelte`**, so
`:root` custom properties are absent from the test document unless the test file itself does
`import '../../app.css'`. Any new browser-mode test asserting `getComputedStyle(...).backgroundColor`
etc. on a `.btn` variant, chip, or toggle will read unresolved/initial values without this import.
**How to avoid:** Any new test added this phase for "genuinely new shared contracts" (CONTEXT.md's
phrase) must follow the exact `import '../../app.css'` (or correct relative path) pattern already
established.
**Warning signs:** A new computed-style assertion passes locally with a nonsensical expected value
(e.g. `rgba(0,0,0,0)` or `initial`) instead of the actual resolved token — the token isn't loaded.

## Code Examples

### Confirmed exact values from DS source (all read directly this session)

```jsx
// Source: design/components/core/Button.jsx (5 variants — no ghost/secondary/icon variant exists)
const variants = {
  menu: { height: 'var(--row-h)', /* 64px */ background: 'var(--surface)', border: '1px solid var(--line)' },
  accent: { /* accentFill gradient */ height: 'var(--row-h)', fontWeight: 600 },
  cta: { /* accentFill gradient */ minHeight: 'var(--row-h)', fontSize: 'var(--text-lg)', fontWeight: 700, letterSpacing: '0.01em' },
  destructive: { height: 56, background: 'var(--destructive)', color: '#fff', fontWeight: 600 },
  cancel: { height: 56, background: 'var(--surface)', border: '1px solid var(--border-input)', fontWeight: 600 },
};
```

```jsx
// Source: design/components/core/ConfirmDialog.jsx:7-26 — exact scrim/panel/motion values
backdropFilter: 'blur(var(--blur-backdrop))',
borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)',
maxWidth: 420, width: 'calc(100% - 48px)',
animation: 'nd-pop var(--dur-med) var(--ease-spring)', // from scale(.94) translateY(8px) -> none
// Actions use the shared Button component directly:
<Button variant={ctaStyle === 'accent' ? 'accent' : 'destructive'}>{ctaLabel}</Button>
<Button variant="cancel">Abbrechen</Button>
```

```jsx
// Source: design/components/core/StatCard.jsx:6-18 — exact container/value/label styling
padding: 'var(--space-md) var(--space-lg)', // 16px 24px, NOT uniform var(--space-md)
fontSize: 'var(--text-3xl)' /* 40px */, fontWeight: 700, letterSpacing: 'var(--tracking-tight)' /* -0.02em */,
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Native `<input type="checkbox" role="switch">` for all toggles | Custom `<button role="switch" aria-checked>` + styled thumb `<span>` | This phase (COMP-02) | Full visual control over 56×34 size/spring animation; accessibility semantics unchanged (button+role+aria-checked is an equally valid ARIA switch pattern) |
| Per-file hardcoded button styles (`.menu-btn`, `.start-btn`, `.cta-btn`, etc., one definition per file) | Shared `.btn` + variant classes in `components.css` | This phase (COMP-01) | Reduces future drift; but requires deleting each old local rule in the same commit (Pitfall 3) |
| `ConfirmDialog.svelte`'s local `.cta-btn`/`.cancel-btn` | Consumes shared `.btn--destructive`/`.btn--accent`/`.btn--cancel` (per CONTEXT.md's architecture note in UI-SPEC's ConfirmDialog gap row) | This phase | Planner's call whether ConfirmDialog imports the shared classes or keeps scoped equivalents with matching values — UI-SPEC flags this explicitly as "architecture call for planner" |

**Deprecated/outdated:** None — this is the first restyle of these components; there is no prior DS
version to deprecate.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Icon-only 44×44 `.back-btn` (identical in `data/+page.svelte`, `history/+page.svelte`, `history/[id]/+page.svelte`, `stats/+page.svelte`) and MatchSetup's text+icon `.back-btn` should get a new discretionary "ghost" `.btn` extension class rather than being left unstyled or forced into one of the 5 DS variants | Architecture Patterns / Don't Hand-Roll; Open Questions | If wrong, planner might either leave these buttons untouched (violating "every button" success criterion 1) or force an ill-fitting DS variant onto an icon-only 44px button (visually wrong — DS has no icon-button spec) |
| A2 | `data/+page.svelte`'s `.action-btn` ("Exportieren"/"Datei auswählen", 52px, flat `--surface` bg, 16px/400 font) should map to a **secondary/ghost-filled** treatment rather than `cancel` (which is bordered) or `menu` (which is a full nav row with implied navigation, not an action trigger) | Architecture Patterns; Open Questions | If wrong, the plan might reuse `.btn--cancel` (bordered) where a filled-surface look was intended, or vice versa — a visual mismatch the UAT reviewer would need to catch |
| A3 | `history/[id]/+page.svelte`'s outline-style `.delete-btn` ("Spiel löschen", border `--destructive`, transparent bg) should follow the SAME "Claude's discretion: keep outline pattern, align tokens" treatment CONTEXT.md explicitly grants to `ResumePrompt.svelte`'s `.btn-discard`, rather than being converted to filled `destructive` | Common Pitfalls; Open Questions | If wrong, this button's visual identity (outline vs. filled) would inconsistently differ from an equivalent risk-communicating action elsewhere in the app; low risk since either choice is internally consistent, but CONTEXT.md never explicitly names this file |
| A4 | CSS `:active` pseudo-class press-state (already used by `ConfirmDialog.svelte`'s existing `.cta-accent:active`/`.cancel-btn:active`) is preferred over porting `Button.jsx`'s literal JS `onPointerDown`/`onPointerUp` handlers | Architecture Patterns Pattern 1 | Low risk — CSS `:active` is standard and already proven in this codebase; if a reviewer insists on exact JS-handler parity with the `.jsx` reference (which is a React authoring convenience, not a DS requirement), this would need reverting |
| A5 | The `/match` audio-bar row-height conflict (Pitfall 1) should be resolved by growing the row to fit the full 56×34 switch, rather than shrinking the switch | Common Pitfalls Pitfall 1 | Medium risk — this changes `/match`'s vertical layout budget on a live-scoring screen; if wrong, could crowd out board/numpad space that Phase 10 depends on. **Recommend this be raised explicitly to the user in `/gsd-discuss-phase` follow-up or flagged as a `checkpoint:human-verify` task**, since it has cross-phase (Phase 10) layout implications not fully covered by CONTEXT.md |

## Open Questions

1. **How should non-DS-covered buttons (icon-only back buttons, `.action-btn`, outline
   `.delete-btn`) be classed?**
   - What we know: `Button.jsx` defines exactly 5 variants (menu/accent/cta/destructive/cancel);
     none is icon-only or a plain flat-surface action trigger.
   - What's unclear: Whether the planner should invent one shared "ghost"/"secondary" extension
     class (this research's recommendation, A1/A2) or leave these buttons' current styling
     untouched as out-of-DS-scope exceptions.
   - Recommendation: Add a small `.btn--ghost` (transparent bg, `--text-muted` color, no border —
     matches the existing `.back-btn` look almost exactly already) and a `.btn--surface` (flat
     `--surface` bg, no border, for `.action-btn`) to `components.css` this phase, since leaving 6+
     buttons across 5 files unstyled would violate success criterion 1's "every button."

2. **Should the `/match` audio ToggleRow rows grow to 64px (full DS row-height) or keep their
   current 36px compact footprint with a scaled-down switch?**
   - What we know: CONTEXT.md locks these 2 rows in scope; DS defines only one ToggleRow size
     (56×34 switch in a 64px row).
   - What's unclear: The vertical space budget impact on `/match`'s control deck, which is shared
     with Phase 10's board/numpad area.
   - Recommendation: Surface this explicitly in the PLAN as a `checkpoint:human-verify` task before
     implementing, since it has visual layout consequences beyond this phase's file scope (see
     Assumption A5).

3. **Does `ConfirmDialog.svelte` consume the new shared `.btn--destructive`/`.btn--accent`/
   `.btn--cancel` classes directly, or keep locally-scoped styles with matching values?**
   - What we know: UI-SPEC.md explicitly flags this as "architecture call for planner."
   - What's unclear: Whether reusing shared classes here risks the Pitfall-3 specificity conflict
     inside a component that's rendered via `{#if}` (mount/unmount, not always-present) — likely
     low risk since ConfirmDialog has no pre-existing local rule of the exact same class name as
     the shared `.btn--*` classes (naming won't collide) as long as the class names in
     `components.css` are chosen distinctly (e.g. `.btn--cta` vs. local `.cta-btn` — different
     names, so no accidental cascade collision either way).
   - Recommendation: Reuse shared classes directly — simplest, matches CONTEXT.md's "shared classes
     only where a pattern appears in ≥2 files" rule (destructive/accent/cancel buttons appear in
     ConfirmDialog, ProfileManager, ResumePrompt, and more — well past the ≥2 threshold).

## Environment Availability

Skipped — no external tool/service dependencies for this phase (pure Svelte/CSS edits within an
already-configured project; Vitest/Playwright/svelte-check are already installed per
`package.json`, confirmed present: `vitest@^4.1.8`, `@vitest/browser@^4.1.8`,
`vitest-browser-svelte@^2.1.1`, `playwright@^1.60.0`, `svelte-check@^4.6.0`).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8 (`unit` + `browser` projects) + Playwright 1.60.0 (E2E, config at `playwright.config.ts`) |
| Config file | `vite.config.ts` (Vitest projects), `playwright.config.ts` (E2E) |
| Quick run command | `npm run test:browser -- ProfileManager` (targeted) or `npm test` (all Vitest, unit+browser) |
| Full suite command | `npm test && npx playwright test` |

### Phase Requirement → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COMP-01 | Buttons render correct DS variant classes, ≥48px, press-scale | browser (computed-style, new) | `npx vitest run --project=browser -t "btn variant"` | ❌ Wave 0 — no existing `.btn`-class test |
| COMP-01 | All existing E2E flows still find buttons by accessible name | e2e (existing, regression) | `npx playwright test` | ✅ `e2e/full-match-flow.spec.ts`, `e2e/resume.spec.ts`, `e2e/spectator-sync.spec.ts` |
| COMP-02 | Chip/Segmented/Stepper computed sizes (56px chip, 46px segment option, 48px stepper button) | browser (computed-style, new) | `npx vitest run --project=browser -t "chip\|segmented\|stepper"` | ❌ Wave 0 |
| COMP-02 | ToggleRow custom switch preserves `id`/`role=switch`/`aria-checked` contract | browser (existing pattern extension) or e2e | manual per-component check; no dedicated existing test | ❌ Wave 0 (optional per CONTEXT.md: "no mandatory new test file") |
| COMP-02 | `/match` audio toggles still function (checked state, volume slider enable/disable) | e2e (existing, regression risk) | `npx playwright test` | ⚠️ No E2E spec currently exercises `#match-caller-toggle`/`#match-sfx-toggle` directly (confirmed via grep) — markup swap here has **no existing automated regression net**; recommend a Wave 0 addition or explicit manual verification note |
| COMP-03 | ConfirmDialog/DartsAtDoubleDialog/ResumePrompt: scrim blur, radius, scale-in present | browser (computed-style, new) | `npx vitest run --project=browser -t "ConfirmDialog"` | ❌ Wave 0 (no current ConfirmDialog.test.ts) |
| COMP-03 | Existing dialog flows (new-match warning, resume, delete profile) still pass E2E | e2e (existing, regression) | `npx playwright test` | ✅ `e2e/resume.spec.ts`, `ProfileManager.test.ts` |
| COMP-04 | StatCard renders 40px/700 value + 17px/500 label | browser (computed-style, new) | `npx vitest run --project=browser -t "StatCard"` | ❌ Wave 0 (no current StatCard.test.ts) |
| (regression) | No forbidden pre-DS hex values reintroduced | unit (existing) | `npx vitest run --project=unit -t "design tokens"` | ✅ `src/lib/design-tokens.test.ts` |

### Sampling Rate

- **Per task commit:** targeted `npx vitest run --project=browser -t "<component>"` for the file(s)
  just touched, plus `npx vitest run --project=unit -t "design tokens"` (fast, catches hardcoded
  hex regressions immediately).
- **Per wave merge:** `npm test` (full Vitest unit+browser) + `npx playwright test` (full E2E, per
  CONTEXT.md's explicit gate: "run the full suite per plan wave").
- **Phase gate:** Full Playwright E2E suite green (8/8, matching the state at Phase 9 start) before
  `/gsd-verify-work`.

### Wave 0 Gaps

- [ ] No `ConfirmDialog.test.ts` — component test asserting computed backdrop-filter/border-radius/
  max-width exists. Recommended per CONTEXT.md's discretion clause ("small browser-mode assertions
  only for genuinely new shared contracts").
- [ ] No `StatCard.test.ts` — same recommendation for 40px/700 value assertion.
- [ ] No dedicated test file for `.btn` variant classes in `components.css` — recommended as a
  small new browser test asserting `getComputedStyle` height/background for at least the `accent`
  and `cta` variants (highest-visibility, most gradient-dependent).
- [ ] No E2E coverage of `/match`'s audio ToggleRow markup swap — flag for manual verification if
  no automated test is added (per Pitfall 1 / Open Question 2, this area carries the highest visual
  risk in the phase).
- Framework install: none needed — all frameworks already present.

## Security Domain

Not applicable in the ASVS sense — this phase makes no changes to authentication, session,
input-validation-of-untrusted-data, or cryptography surfaces. All existing security invariants
noted in the source comments (T-03-03: no `{@html}` for interpolated strings, confirmed still true
in every file read this session — `ConfirmDialog.svelte`, `StatCard.svelte`, `ResumePrompt.svelte`,
`ProfileManager.svelte`, `PlayerPicker.svelte`, `BullOffOrder.svelte`, `DartsAtDoubleDialog.svelte`,
route files — all use Svelte `{interpolation}` exclusively, zero `{@html}` occurrences found) are
unaffected since this phase changes only `<style>` blocks, class attributes, and (for ToggleRow)
element type (`<input>` → `<button>`) with no new data-rendering paths introduced.

## Sources

### Primary (HIGH confidence — direct file reads this session)

- `design/components/core/Button.jsx` — 5 variant definitions, press-state handlers, chevron markup
- `design/components/core/Chip.jsx` — active/inactive fill, gradient string, press transform
- `design/components/core/SegmentedControl.jsx` — recessed track, per-option sizing
- `design/components/core/Stepper.jsx` — 48px buttons, disabled opacity, aria-labels
- `design/components/core/ToggleRow.jsx` — custom switch markup, spring thumb transition
- `design/components/core/StatCard.jsx` — container/value/label exact styling
- `design/components/core/ConfirmDialog.jsx` — scrim/panel/motion/button composition
- `src/styles/{colors,typography,spacing,elevation}.css`, `src/app.css` — confirmed every token used
  above exists with the exact name/value referenced
- `src/routes/+page.svelte`, `src/routes/{data,history,history/[id],stats}/+page.svelte`,
  `src/routes/match/+page.svelte` (relevant sections) — full read, current markup/CSS confirmed
- `src/ui/setup/{MatchSetup,PlayerPicker,ProfileManager,BullOffOrder}.svelte` — full read
- `src/ui/dialogs/ConfirmDialog.svelte`, `src/ui/input/DartsAtDoubleDialog.svelte`,
  `src/ui/start/ResumePrompt.svelte`, `src/ui/stats/StatCard.svelte` — full read
- `src/ui/setup/ProfileManager.test.ts`, `src/ui/pwa/ReloadPrompt.test.ts`,
  `src/lib/design-tokens.test.ts` — full read, confirmed E2E/component test lock points
- `e2e/*.spec.ts` (grep across all 5 specs) — confirmed accessible-name assertions on in-scope
  buttons
- `.planning/phases/09-core-components/09-CONTEXT.md`, `09-UI-SPEC.md`,
  `.planning/REQUIREMENTS.md`, `.planning/STATE.md` — upstream decisions and prior gap analysis

### Secondary (MEDIUM confidence)

None — no web/external documentation lookup was needed; every claim traces to a local file read.

### Tertiary (LOW confidence)

None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new packages, all tokens verified present by direct file read
- Architecture: HIGH — file-by-file diff against DS source confirmed for every in-scope file
- Pitfalls: HIGH for Pitfalls 2-4 (directly observed in test/CSS files); MEDIUM for Pitfall 1 (the
  sizing conflict is observed as fact, but its resolution is a design decision outside this
  research's authority)

**Research date:** 2026-07-14
**Valid until:** No expiry concern — this is a closed-codebase snapshot; valid until the next
`/gsd-plan-phase 9` run or until `design/components/core/*.jsx` changes.
