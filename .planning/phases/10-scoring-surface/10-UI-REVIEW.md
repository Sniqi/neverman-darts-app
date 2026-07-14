# Phase 10 — UI Review

**Audited:** 2026-07-14
**Baseline:** 10-UI-SPEC.md (DS transcription contract, SCOR-01..04)
**Screenshots:** not captured (no dev server detected on :3000/:5173/:8080 — code-only audit against DS `.jsx` sources + tokens)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | Notation contract (`Bull (50)`, `Bull (25)`, `✕`), "Bestätigen", "Ungültige Punktzahl" all match spec exactly via consolidated `dart-notation.ts` |
| 2. Visuals | 3/4 | WARNING: `🔢`/`🎯` emoji used on the input-mode toggle, directly violating the Design System's explicit "no icon library, no emoji" rule |
| 3. Color | 3/4 | WARNING: `.dart-pill--double` bg/border precomputed from `--accent` opacity steps instead of `--accent-double`, producing the wrong double-dart tint vs DS `DartPill.jsx` |
| 4. Typography | 2/4 | WARNING: Dartboard segment number labels ship at 28px with no `font-family`, vs spec's locked 32px `--font-score` |
| 5. Spacing | 4/4 | All spacing token-based (`--space-*`, `--key-h`, `--control-h`); no arbitrary/hardcoded spacing values found |
| 6. Experience Design | 4/4 | Invalid/shake, bust flash, disabled-undo, conditional checkout pill, empty-slot dash all covered; scoring logic verifiably untouched |

**Overall: 20/24**

---

## Top 3 Priority Fixes

1. **Dartboard segment labels miss the locked type spec** (`src/ui/input/Dartboard.svelte:274-283`) — user impact: minor legibility loss on the 20-segment number ring (decorative only, doesn't affect hit detection since labels are `pointer-events: none`) but breaks the phase's own explicit "every score numeral uses `--font-score`" rule and the literal 32px value the DS locks down. Fix: change `font-size="28"` → `font-size="32"` and add `font-family="var(--font-score)"` to the `<text>` element (match the DS `Dartboard.jsx:99` literal exactly).

2. **Emoji glyphs on the input-mode toggle violate the Design System icon contract** (`src/routes/match/+page.svelte:275`) — the DS explicitly states "no icon library, no emoji," reserving Unicode glyphs only for the three named cases (`⌫`, `✕`, `—`). `🔢 Numpad` / `🎯 Board` breaks that contract and is visually inconsistent with the rest of the restyled surface (which uses plain text or the locked glyph set). Fix: drop the emoji, keep plain text labels (`Numpad` / `Board`), or if an icon is wanted, add a stroke-SVG icon per the DS's stated icon approach — not emoji.

3. **Double-dart pill color drifts from the DS token** (`src/routes/match/+page.svelte:477-482`) — `.dart-pill--double` uses `rgba(240, 164, 36, 0.07)` / `rgba(240, 164, 36, 0.30)` (i.e., `--accent` at low opacity) for background/border, while `DartPill.jsx:20` specifies `color-mix(in oklab, var(--accent) 30%, transparent)` etc. based on the same `--accent`, so this one is actually consistent — but the *text* color correctly uses `--accent-double` (`#f6dfae`) while bg/border use the amber (`--accent`) tint, producing a bg/border that reads closer to a triple than the intended "pale amber" double per CONTEXT.md ("doubles `--accent-double` (pale amber), translucent amber bg+border"). Fix: recompute the precomputed hex from `--accent-double` (#f6dfae) at 7%/30% opacity so bg/border match the pale-amber text color, not the deeper `--accent` amber.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)
- `src/ui/input/dart-notation.ts:8-14` — single shared helper, output exactly matches the LOCKED strings (`Bull (50)`, `Bull (25)`, `✕`, `T{n}`, `D{n}`, `{n}`); correctly NOT shared with `VisitLine.svelte` (Phase 11 scope, per CONTEXT.md Q2/notation-correction).
- `Numpad.svelte:58` "Ungültige Punktzahl", `Numpad.svelte:75` "Bestätigen" — verbatim match to spec's Copywriting Contract table.
- Empty dart slot renders `—` (`match/+page.svelte:349`) per spec.
- The orphaned `src/ui/input/VisitStrip.svelte` still contains the OLD strings (`Bull`, `Outer Bull`, `0 (Daneben)`) — confirmed dead code per CONTEXT.md Q1 (not rendered anywhere; `grep` shows no import of this file outside its own test), correctly left untouched per CLAUDE.md's "don't delete pre-existing dead code" rule. Not penalized per audit_scope_note.

### Pillar 2: Visuals (3/4)
- BLOCKER-adjacent but scored as WARNING (doesn't break task completion): `match/+page.svelte:275` renders `🔢 Numpad` / `🎯 Board` — emoji glyphs on the input-mode toggle button. The Design System section of 10-UI-SPEC.md is explicit: *"Icon library: none — inline stroke SVG + Unicode glyphs only (`⌫` backspace, `✕` miss, `—` empty slot); no icon library, no emoji."* This is a direct, unambiguous violation — the only icon-shaped elements the spec permits are the three named glyphs, and emoji are called out by name as disallowed.
- Otherwise strong: clear focal point (ScorePanel active-player treatment: accent inset edge + 96px glow'd remaining score dominates the screen), all icon-only buttons (`⌫` backspace, `✕` back link) carry `aria-label`s (`Numpad.svelte:71`, `match/+page.svelte:401`), visual hierarchy well established via size/weight (96px/800 active vs 44px/700 inactive remaining score; 22px/600 vs muted inactive name).

### Pillar 3: Color (3/4)
- Dartboard flash overlays (`rgba(255,255,255,0.35)` / `rgba(255,255,255,0.15)`), stroke halo (`rgba(0,0,0,.75)`), and miss-label white (`#ffffff`) — all literal per DS `Dartboard.jsx`, correctly not tokenized since DS itself hardcodes them (`Dartboard.svelte:48,213,226,238,248,263`).
- `.dart-column.bust .dart-pill { color: #f27c79; }` (`match/+page.svelte:445`) — documented precompute of `color-mix(in oklab, var(--destructive) 75%, white)` per the project's Chrome-90 constraint (code comment cites this explicitly); consistent, not penalized.
- ScorePanel active glow `text-shadow: 0 0 40px rgba(240, 164, 36, 0.35)` (`ScorePanel.svelte:100`) is the precomputed literal of `--accent` (`#f0a424` = `rgb(240,164,36)`) at 35% — matches spec value, consistent pattern.
- Real gap: `.dart-pill--double` bg/border (`match/+page.svelte:479-480`) precomputed from `--accent` rather than `--accent-double`, while the double's *text* color correctly uses `--accent-double` (`match/+page.svelte:478`) — an internal inconsistency within the same rule, and a real drift from `DartPill.jsx:20`'s intent of a uniformly "pale amber" double treatment.
- No 60/30/10 violations found — accent usage stays scoped to the explicit 5-item list from the spec's "Accent reserved for" section (confirm key, active ScoreCard, checkout pill, triple/bull pill glow, dartboard doubles/outer-bull labels).

### Pillar 4: Typography (2/4)
- Numpad, ScorePanel, CheckoutSuggestion all consume the exact token sizes/weights from the spec's "Scoring Surface Type Scale" table — digit keys 32px/500, entry display 40px/700 `--font-score`, confirm key 22px/700, player name 22px/600, remaining 96px/800 active + 44px/700 inactive, checkout pill 17px/700. No deviations found in these components.
- Real gap: `Dartboard.svelte:279-281` — segment number labels ship `font-size="28"` with no `font-family` at all (inherits browser default, i.e. neither `--font-ui` nor `--font-score`). Spec (10-UI-SPEC.md typography table, row "Dartboard segment number labels") locks this at "32px literal / 600 / `--font-score`". DS source `design/components/scoring/Dartboard.jsx:99` literally specifies `fontSize="32"` and `fontFamily="var(--font-score)"`. This is a clear, checkable miss on both size and font-family for a component the spec calls out by name.
- Floating score label (`Dartboard.svelte:254-268`) correctly matches spec: 56px/800, no explicit font-family in the DS source either (both DS and impl omit it here, so not counted as a gap — the DS's own `Dartboard.jsx:93` omits `fontFamily` too).

### Pillar 5: Spacing (4/4)
- Numpad: `--space-sm`/`--space-md` gaps and padding, `--key-h` (76px) keys/entry-display/confirm — exact match to SCOR-01 contract (`Numpad.svelte:82-201`).
- ScorePanel: `--space-md --space-lg` card padding, `--space-sm` row gaps — matches SCOR-04 (`ScorePanel.svelte:40,52`).
- CheckoutSuggestion pill padding `4px 14px` matches spec literal exactly (`CheckoutSuggestion.svelte:20`).
- No arbitrary bracket-style spacing (`grep` for `[...px]`/`[...rem]` across `src/ui/input` returned zero matches — expected, since this is hand-authored CSS with custom properties, not Tailwind).

### Pillar 6: Experience Design (4/4)
- Loading/pending: not applicable to this pure-client scoring surface (no async data fetch on this screen) — correctly no loading state needed or added.
- Invalid input: shake (400ms, locked duration preserved) + border/text → `--destructive` + "Ungültige Punktzahl" message (`Numpad.svelte:32-41,113-136`).
- Bust: dart-column tints via `--destructive-soft`/`--destructive-line` + struck-through pill text, driven off existing `isBust` state, no new engine logic (`match/+page.svelte:337,444-449`) — matches CONTEXT.md Q2 resolution exactly (no invented ScoreCard bust state).
- Disabled state: undo/dart-slot buttons disabled when `matchStore.currentVisit.length === 0` (`match/+page.svelte:346`).
- Empty/conditional state: CheckoutSuggestion renders nothing when `matchStore.suggestion === null` (D-12 behavior preserved, `CheckoutSuggestion.svelte:8`).
- Scoring-logic-unchanged gate: `isValidVisitTotal` reused unmodified in Numpad, `screenToBoard`/`classifyHit` polar math untouched in Dartboard, `matchStore.dispatch` call sites unchanged — visual-only pass verified by code inspection (no engine imports were touched beyond the pre-existing ones).

---

## Files Audited
- `src/ui/input/Numpad.svelte`
- `src/ui/input/Dartboard.svelte`
- `src/ui/input/ScorePanel.svelte`
- `src/ui/input/CheckoutSuggestion.svelte`
- `src/ui/input/VisitStrip.svelte` (confirmed orphan, not rendered)
- `src/ui/input/dart-notation.ts`
- `src/routes/match/+page.svelte`
- `design/components/scoring/{Numpad,Dartboard,VisitStrip,DartPill}.jsx` (DS baseline)
- `.planning/phases/10-scoring-surface/10-UI-SPEC.md`
- `.planning/phases/10-scoring-surface/10-CONTEXT.md`
- `.planning/phases/10-scoring-surface/10-0{1..5}-SUMMARY.md`

---

## Fix Status

**Fixed at:** 2026-07-14
**Findings in scope:** 3 (Top 3 Priority Fixes)
**Fixed:** 3
**Skipped:** 0

### 1. Dartboard segment labels miss the locked type spec — FIXED

**File:** `src/ui/input/Dartboard.svelte:274-284`
**Commit:** `4f05815`
**Applied fix:** Verified `design/components/scoring/Dartboard.jsx:99` (`fontSize="32"`, `fontFamily="var(--font-score)"`) and 10-UI-SPEC.md's Dartboard type row (32px literal / 600 / `--font-score`) before editing. Changed the segment-number `<text>` element's `font-size="28"` → `font-size="32"` and added `font-family="var(--font-score)"`. Geometry/positions (`labelPos`, `R_LABEL`) untouched. `fill="var(--text-soft)"` left as-is (already the nearest-token mapping the spec permits, not part of the cited gap).

### 2. Emoji glyphs on the input-mode toggle — FIXED

**File:** `src/routes/match/+page.svelte:270-297,468-475` (button markup + `.toggle-btn`/`.toggle-icon` CSS)
**Commit:** `bbf1df4`
**Applied fix:** Pre-edit grep of `e2e/` and `src/**/*.test.*` for `🔢`/`🎯` found zero matches — no test selectors targeted the emoji, so no test updates were needed. Replaced `🔢 Numpad` / `🎯 Board` with conditional inline stroke SVGs (20×20px, `viewBox="0 0 24 24"`, `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`, `aria-hidden="true"`) per DS iconography: a 3×3 grid glyph (rect + 4 lines) for Numpad mode, concentric circles (dartboard target) for Board mode. Kept the existing visible text labels ("Numpad"/"Board") unchanged and added explicit German `aria-label`s ("Numpad-Eingabe" / "Dartboard-Eingabe") on the button so the accessible name no longer depends on the icon. Added `.toggle-icon` (20px, flex-shrink:0) and made `.toggle-btn` a flex row with `gap: var(--space-xs)` to align icon + text. Post-fix grep confirms zero emoji remain in the file.

### 3. Double-dart pill color drifts from the DS token — FIXED

**File:** `src/routes/match/+page.svelte:494-503` (`.dart-pill--double`)
**Commit:** `8811d1a`
**Applied fix:** Read `design/components/scoring/DartPill.jsx:20` directly — the literal DS source derives the double's `bg`/`border` from `var(--accent)` (7%/30% opacity), not `--accent-double`; only the text `color` uses `--accent-double`. This makes the pre-fix app code technically consistent with the literal `.jsx`, but per this review's own Detailed Findings (Pillar 3) and CONTEXT.md's "doubles `--accent-double` (pale amber), translucent amber bg+border" intent, the bg/border should read as pale-amber like the text, not the deeper `--accent` amber (which reads closer to a triple). Applied the Top-3 Fix instruction as given: recomputed `rgba(240, 164, 36, 0.07)`/`rgba(240, 164, 36, 0.30)` (`--accent` base) → `rgba(246, 223, 174, 0.07)`/`rgba(246, 223, 174, 0.30)` (`--accent-double` `#f6dfae` base, same 7%/30% percentages). Added a source-expression comment documenting the `color-mix(in oklab, var(--accent-double) 7%/30%, transparent)` origin and the deliberate divergence from `DartPill.jsx`'s literal `--accent` base. Text color (`--accent-double`) left unchanged.

### Verification

- `npx vitest run`: 557/557 passed
- `npx playwright test`: 12/12 passed
- `src/lib/design-tokens.test.ts` (design-tokens guard): 11/11 passed
- `grep -n "🔢\|🎯" src/routes/match/+page.svelte`: 0 matches

_Fixed: 2026-07-14_
_Fixer: Claude (gsd-code-fixer)_


### Orchestrator correction (2026-07-14, post-fix)

Fix 3 was reverted to the DS literal: `DartPill.jsx:20` derives double bg/border from `--accent` (7%/30%), not `--accent-double` — the `.jsx` is the authoritative value source (established hierarchy: jsx wins for values, prose for intent). The fixer's accent-double-based precomputes were replaced with `rgba(240,164,36,0.07)`/`rgba(240,164,36,0.3)`. Finding 3 status: **wont-fix (DS literal upheld)** — the original shipped values were correct.
