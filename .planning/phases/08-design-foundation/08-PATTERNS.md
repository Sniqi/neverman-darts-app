# Phase 8: Design Foundation - Pattern Map

**Mapped:** 2026-07-13
**Files analyzed:** ~50 (5 new token files, 1 new fonts dir, 1 modified entry CSS, 1 modified vite.config.ts, ~44 modified .svelte components, 1 modified profiles.ts, 2 modified test files)
**Analogs found:** 5 exact source-of-truth analogs (the `design/tokens/*.css` files themselves) + in-repo sweep analogs / 6 categories

This phase is a token/asset copy + mechanical sweep, not new-feature code. The "analog" for every new token file is its DS source file (already read in full above); the "analog" for the sweep is the existing provisional `src/app.css` plus a handful of representative hotspot components. No controller/service/model files are involved.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/styles/colors.css` (new) | config (design tokens) | transform (copy+adapt) | `design/tokens/colors.css` | exact (verbatim copy, color-mix → static rgba) |
| `src/styles/typography.css` (new) | config (design tokens) | transform (copy+adapt) | `design/tokens/typography.css` | exact (verbatim copy) |
| `src/styles/spacing.css` (new) | config (design tokens) | transform (copy) | `design/tokens/spacing.css` | exact (verbatim copy, no changes needed) |
| `src/styles/elevation.css` (new) | config (design tokens) | transform (copy+adapt) | `design/tokens/elevation.css` | exact (verbatim copy, color-mix → static rgba, reduced-motion block already present verbatim) |
| `src/styles/fonts.css` (new) | config (font-face declarations) | file-I/O (asset references) | `design/tokens/fonts.css` | exact (copy, but rewrite `url()` paths from `../assets/fonts/*.ttf` → `./fonts/*.woff2` with ttf fallback) |
| `src/styles/fonts/*.woff2` + `OFL.txt` (new, 7 files) | asset | file-I/O | `design/assets/fonts/*.ttf` | exact (converted via fonttools, not copied) |
| `src/app.css` (modified — becomes import aggregator) | config (entry stylesheet) | transform | itself, current 42-line version | role-match (same file, full rewrite) |
| `vite.config.ts` (modified — 1 line) | config (build) | transform | itself, `workbox.globPatterns` line 60 | exact (single-line edit, pattern shown below) |
| `src/ui/**/*.svelte` (~44 files, sweep) | component | transform (CSS token substitution) | `src/ui/input/Dartboard.svelte`, `src/ui/display/PlayerPanel.svelte`, `src/ui/input/Numpad.svelte` | role-match (representative hotspots covering hex→token, radius-collision, keyframe-retime, tabular-nums patterns) |
| `src/db/profiles.ts` (modified — 1 line, `Profile.color` default) | model | CRUD (default value) | itself | exact (single literal change) |
| `src/db/profiles.test.ts`, `src/lib/backup.test.ts` (modified — literal updates) | test | transform | themselves | exact (update asserted hex literal to match new default) |
| `src/ui/pwa/ReloadPrompt.test.ts` (modified — 1 assertion) | test | transform | itself, line 86-95 | exact (update expected `rgb()` literal) |

## Pattern Assignments

### `src/styles/colors.css`

**Analog:** `design/tokens/colors.css` (read in full — see Standard Stack / RESEARCH.md; reproduced verbatim above in context)

**Copy pattern:** Copy the file's `:root` block verbatim EXCEPT the 7 `color-mix()` derived tokens, which must become static `rgba()` per CONTEXT.md's Chrome-90 decision.

**Substitution pattern** (per RESEARCH.md Pattern 1, values pre-computed and verified in RESEARCH.md Code Examples):
```css
/* design/tokens/colors.css has: */
--accent-soft: color-mix(in oklab, var(--accent) 13%, transparent);
--accent-line: color-mix(in oklab, var(--accent) 45%, transparent);

/* src/styles/colors.css must have instead: */
--accent-soft: rgba(240, 164, 36, 0.13);
--accent-line: rgba(240, 164, 36, 0.45);
```
Full precomputed set (from RESEARCH.md Code Examples, base colors `--accent #f0a424`, `--destructive #e5484d`, `--positive #3dd68c`):
```css
--accent-soft: rgba(240, 164, 36, 0.13);
--accent-line: rgba(240, 164, 36, 0.45);
--focus-ring: rgba(240, 164, 36, 0.65);
--destructive-soft: rgba(229, 72, 77, 0.14);
--destructive-line: rgba(229, 72, 77, 0.40);
--positive-soft: rgba(61, 214, 140, 0.13);
```
(`--glow-accent` lives in elevation.css, see below.)

All other lines (bg/surface/text/board/hairline tokens) copy unchanged.

---

### `src/styles/elevation.css`

**Analog:** `design/tokens/elevation.css` (read in full above)

**Copy pattern:** Verbatim copy INCLUDING the `@media (prefers-reduced-motion: reduce)` block at the bottom (lines 33-38) — per CONTEXT.md this is adopted "verbatim" and per RESEARCH.md Pitfall 5, this exact block is what makes FOUND-04's reduced-motion collapse work for every component with zero per-component logic.

**Substitution pattern:** Only `--glow-accent` needs the color-mix → static rgba fix:
```css
/* design/tokens/elevation.css has: */
--glow-accent: 0 0 28px color-mix(in oklab, var(--accent) 18%, transparent);

/* src/styles/elevation.css must have instead: */
--glow-accent: 0 0 28px rgba(240, 164, 36, 0.18);
```
Everything else (radii, shadows, `--dur-*`, `--ease*`, `--press-scale`, `--press-opacity`, `--backdrop`, `--blur-backdrop`) copies unchanged.

---

### `src/styles/typography.css`

**Analog:** `design/tokens/typography.css` (read in full above)

**Copy pattern:** Verbatim, no changes. Includes the `:root` type-scale tokens AND the base `body`, `a`, `::selection`, `:focus-visible` rules (lines 41-59) — CONTEXT.md says these DS base styles are "adopted completely." This file's `body{}` rule supersedes the old `src/app.css` body rule.

---

### `src/styles/spacing.css`

**Analog:** `design/tokens/spacing.css` (read in full above) — verbatim copy, no adaptation needed (no color-mix, no offline concerns).

---

### `src/styles/fonts.css`

**Analog:** `design/tokens/fonts.css` (read in full above, 7 `@font-face` blocks)

**Path rewrite pattern:** DS source references `../assets/fonts/*.ttf` (relative to `design/tokens/`); the app copy must reference `./fonts/*.woff2` (relative to `src/styles/`), with WOFF2 first and TTF as an explicit fallback source if both are shipped:
```css
/* design/tokens/fonts.css has: */
@font-face {
	font-family: "Barlow";
	src: url("../assets/fonts/Barlow-Regular.ttf") format("truetype");
	font-weight: 400;
	font-style: normal;
	font-display: swap;
}

/* src/styles/fonts.css must have instead: */
@font-face {
	font-family: "Barlow";
	src: url("./fonts/Barlow-Regular.woff2") format("woff2");
	font-weight: 400;
	font-style: normal;
	font-display: swap;
}
```
Repeat for all 7 weight/family combinations (Barlow 400/500/600/700, Barlow Semi Condensed 600/700/800). `font-display: swap` carries over unchanged on every block.

---

### `src/app.css` (entry aggregator)

**Analog:** itself, current version (read in full above — 42 lines, single `:root` + box-sizing + body rule)

**New pattern:** Replace the entire file with import statements only; the 5 new files supply all tokens and the base body rule (from typography.css):
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
(`box-sizing: border-box` is the one rule from the old file that isn't in any DS token file — keep it here since it's a global reset, not a token.)

**Import site (unchanged):** `src/routes/+layout.svelte` line 2 — `import '../app.css';` — no change needed, same relative path.

---

### `vite.config.ts` — PWA globPatterns (Pitfall 4)

**Analog:** itself, line 60

**Current:**
```ts
globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,webmanifest,mp3}'],
```
**Required change** (add font extensions so fonts precache offline, per RESEARCH.md Pitfall 4):
```ts
globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,webmanifest,mp3,woff2,ttf}'],
```
Match the existing inline-comment style above this line (`// mp3 explicitly included so SFX are precached for offline play (Pitfall 4)`) — add a comparable comment noting fonts.

Also check `manifest.theme_color`/`background_color` at lines 42-43 (`'#111318'`) — these are old provisional bg color and fall under the FOUND-01 "0 provisional hex" sweep; update to the new `--bg` value `#0c0e14`.

---

### Component sweep — hex/rgba → token substitution

**Analog:** `src/ui/input/Dartboard.svelte` (representative hotspot — 20 hardcoded hex occurrences, lines 36-279 read above)

**Pattern found (inline SVG fill assignment, not CSS custom property):**
```svelte
<!-- Before (line 42): -->
label = 'Bull (25)'; color = '#e8a020';
<!-- After: -->
label = 'Bull (25)'; color = 'var(--accent)';

<!-- Before (line 119): -->
fill: '#2d2d2d', // all singles same dark color
<!-- After (nearest DS token by role — board single fill): -->
fill: 'var(--board-single)', // #222835 in new palette

<!-- Before (line 128): -->
fill: isAlt ? '#8b1a1a' : '#1a5c2e',
<!-- After: -->
fill: isAlt ? 'var(--board-red)' : 'var(--board-green)',
```
Old→new palette mapping table (from CONTEXT.md `<specifics>`, apply during sweep):
| Old hex | New token | New value |
|---|---|---|
| `#111318` | `--bg` | `#0c0e14` |
| `#1e2027` | `--surface` | `#161a23` |
| `#262932` / `#2d2d2d` | `--surface-2` / `--surface-3` | `#1d2330` / `#29303f` |
| `#e8a020` / `#f0ab2c` | `--accent` | `#f0a424` |
| `#f0f0f0` | `--text` | `#eef1f6` |
| `#888` | `--text-muted` | `#8a92a6` |
| `#c0392b` | `--destructive` | `#e5484d` |
| `#1a5c2e` (board green) | `--board-green` | `#1d7a46` |
| `#8b1a1a` (board red) | `--board-red` | `#ab2430` |
| `#444`/`#444444` (board stroke) | `--board-stroke` | `#39404f` |
| `#333` | nearest by role (usually `--surface-3` or `--line-strong`) | judgment call, per CONTEXT.md discretion |

Per CONTEXT.md, board treatment only needs "nearest token now" — exact board colors are Phase 10 (SCOR-02), so `--board-*` substitution here is sufficient, not a full redesign.

---

### Component sweep — `var(--token, #fallback)` cleanup

**Analog:** `src/ui/display/PlayerPanel.svelte` lines 229, 312, 350, 380, 390, 400-401, 431, 497 (8 occurrences of this pattern in one file; 52 total across `src/`)

**Pattern found:**
```css
/* Before (line 229): */
border-top-color: var(--accent, #e8a020);
/* Before (line 312): */
border-radius: var(--radius-sm, 8px);

/* After (drop the now-meaningless fallback, per RESEARCH.md Pattern 3 — simpler than updating the literal): */
border-top-color: var(--accent);
border-radius: var(--radius-sm);
```
**Radius-collision note (RESEARCH.md Pattern 2):** `--radius-sm` changes 8px→12px. Line 312/380 in `PlayerPanel.svelte` use `var(--radius-sm, 8px)` — check each call site during sweep: if the element must stay 8px, change the variable to `var(--radius-xs)` (new 8px slot); if 12px is acceptable/intended (buttons/keys/chips/inputs — the DS's stated intent for `--radius-sm`), just drop the fallback and keep the same variable name.

---

### Component sweep — motion retiming to DS duration/ease tokens

**Analog:** `src/ui/input/Numpad.svelte` lines 107, 114-126, 154, 179 (read above)

**Pattern found (standard interactive transition, safe to retime literally):**
```css
/* Before (line 107): */
transition: border-color 150ms ease;
/* Before (line 154): */
transition: background-color 100ms ease;
/* Before (line 179): */
transition: opacity 150ms ease;

/* After: */
transition: border-color var(--dur-base) var(--ease);
transition: background-color var(--dur-fast) var(--ease);
transition: opacity var(--dur-base) var(--ease);
```
**Out-of-band case (needs the Open Question 1 decision — RESEARCH.md Pitfall 2, do NOT silently pick):**
```css
/* Numpad.svelte lines 114-126, current: */
@keyframes shake { /* ±6px */ }
.something { animation: shake 400ms ease-in-out; }

/* 400ms exceeds --dur-slow (300ms). Two defensible directions — planner/user must lock one:
   Reading A (strict): animation: shake var(--dur-slow) var(--ease);          /* compresses felt duration to 300ms */
   Reading B (scoped): animation: shake calc(var(--dur-slow) * 1.33) var(--ease); /* keeps 400ms, expressed via token */
*/
```
Same ambiguity applies to `Dartboard.svelte:301` (score-float, 1.6s), `PlayerPanel.svelte:396` (liveRowPulse, 1.6s infinite), `PauseOverlay.svelte:121` (zeroFlashFade, 800ms) — flag these four in the plan with the resolved reading, don't leave to sweep-time judgment (RESEARCH.md Open Questions 1-2).

---

### Component sweep — tabular-nums score display

**Analog:** DS `typography.css` defines `--font-score` (line 6) and the numeral tokens (`--text-score-inactive`, `--text-score-active`); CONTEXT.md names the exact 4 target components: ScorePanel, PlayerPanel, Numpad (digits/entry), StatCards, display surfaces.

**Pattern to apply per component's score-number element:**
```css
.score-value {
	font-family: var(--font-score);
	font-variant-numeric: tabular-nums;
}
```
No existing analog for `font-variant-numeric` in the repo (new rule) — apply directly per CONTEXT.md's explicit component list.

---

### `src/db/profiles.ts` — Profile.color default (Pitfall 3, flag explicitly)

**Analog:** itself, line 20

**Current:**
```ts
color: '#e8a020',
```
**Change (per RESEARCH.md Pitfall 3 / Assumption A1 — confirmed no `.svelte` file currently renders `profile.color`):**
```ts
color: '#f0a424',
```
Flag this task explicitly in the plan with rationale ("default profile color updated for DS consistency; field is currently unused by any UI render path") since it's data, not CSS — per CLAUDE.md's "no functional changes" framing this needs a one-line call-out, not a silent sweep inclusion.

**Companion test updates (exact literal match required):**
- `src/db/profiles.test.ts:20` — update expected `'#e8a020'` → `'#f0a424'`
- `src/lib/backup.test.ts:25,61,80` — same literal update, 3 occurrences

---

### `src/ui/pwa/ReloadPrompt.test.ts` — accent RGB assertion (Pitfall 1)

**Analog:** itself, lines 86-95 (read in full above)

**Current:**
```ts
test('PLAT-04: toast has position:fixed and accent (#e8a020) border color', async () => {
	// ...
	expect(style.borderColor).toMatch(/rgb\(232,\s*160,\s*32\)/);
});
```
**Change (new accent `#f0a424` = `rgb(240, 164, 36)`):**
```ts
test('PLAT-04: toast has position:fixed and accent (#f0a424) border color', async () => {
	// ...
	expect(style.borderColor).toMatch(/rgb\(240,\s*164,\s*36\)/);
});
```
Confirmed (per RESEARCH.md) this is the ONLY test in the suite asserting a literal color via `getComputedStyle`.

## Shared Patterns

### Global reduced-motion collapse
**Source:** `design/tokens/elevation.css` lines 33-38 — copy verbatim into `src/styles/elevation.css`
**Apply to:** Every component in the app automatically (universal selector + `!important`) — no per-component code needed.
```css
@media (prefers-reduced-motion: reduce) {
	*, *::before, *::after {
		animation-duration: 0.01ms !important;
		transition-duration: 0.01ms !important;
	}
}
```

### Base typography / focus-visible / selection
**Source:** `design/tokens/typography.css` lines 41-59 — copy verbatim into `src/styles/typography.css`
**Apply to:** Global (`body`, `a`, `::selection`, `:focus-visible`) — supersedes old `src/app.css` body rule (line 35-42) and introduces link/selection/focus-ring styling that didn't exist before.

### `--font-score` + `tabular-nums`
**Source:** `design/tokens/typography.css` line 6 (`--font-score` definition)
**Apply to:** ScorePanel, PlayerPanel, Numpad (digits/entry display), StatCards, all display-surface score elements — see per-component sweep note above.

### Old→new provisional color map
**Source:** CONTEXT.md `<specifics>` section, cross-referenced against `design/tokens/colors.css`
**Apply to:** Every `.svelte` file in the sweep — use the mapping table under "Component sweep — hex/rgba → token substitution" above as the canonical lookup for the ~391 hex + ~96 rgba occurrences.

### `var(--token, #fallback)` cleanup
**Source:** `src/ui/display/PlayerPanel.svelte` (8 of the 52 total occurrences)
**Apply to:** All 52 occurrences across `src/ui/**` and `src/routes/**` — drop the fallback literal entirely per RESEARCH.md Pattern 3, except where the radius-collision check (Pattern 2) requires switching to a different token name.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| Wave-0 "no provisional colors" regression test (new, location TBD e.g. `src/lib/design-tokens.test.ts`) | test | batch (grep-style scan) | No existing pattern in the repo for a "scan source files for forbidden strings" test (RESEARCH.md Open Question 3); recommended but not locked — planner should decide whether to include it in Wave 0 |
| Reduced-motion browser test (new, likely alongside an existing animated component's `.test.ts`) | test | event-driven (media query emulation) | Zero existing coverage of `prefers-reduced-motion` anywhere in the suite (RESEARCH.md Pitfall 5 / Validation Architecture); no analog test using `page.emulateMedia({ reducedMotion: 'reduce' })` exists yet in this codebase |
| Offline font-loading Playwright test (new) | test | event-driven (offline simulation) | No existing test toggles `context.setOffline(true)` and checks `document.fonts.check(...)`; closest existing offline-related tests should be checked but none confirmed reused (RESEARCH.md Validation Architecture) |

## Metadata

**Analog search scope:** `design/tokens/*.css`, `design/assets/fonts/*`, `src/app.css`, `vite.config.ts`, `src/routes/+layout.svelte`, `src/ui/input/Dartboard.svelte`, `src/ui/input/Numpad.svelte`, `src/ui/display/PlayerPanel.svelte`, `src/ui/pwa/ReloadPrompt.test.ts`, `src/db/profiles.ts`, `src/db/db.ts`
**Files scanned:** 5 DS token files (read in full), 6 representative sweep-hotspot files (read in full or targeted grep), 1 test file, 1 db file, 1 build config, 1 layout — all read/grepped this session
**Pattern extraction date:** 2026-07-13
