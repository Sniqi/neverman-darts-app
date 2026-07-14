---
phase: 8
overall_score: 18/24
baseline: UI-SPEC.md (08-UI-SPEC.md)
screenshots: not captured (no dev server running; code-only audit)
---

# Phase 8 — UI Review: Design Foundation

**Audited:** 2026-07-14
**Baseline:** `.planning/phases/08-design-foundation/08-UI-SPEC.md` + `08-CONTEXT.md` (locked decisions, phase boundary)
**Screenshots:** not captured — no dev server detected on 3000/5173/8080; audit performed via source grep, token-file diff against spec, and `npx vitest run --project unit` (446/446 passed).

Scope respected: this audit does NOT penalize missing component-exact treatments (Button gradients, chip/dialog layout, cqw display wiring) — those are explicitly Phase 9–12 per CONTEXT.md. Findings below are all within the Phase 8 foundation boundary (tokens, fonts, base styles, motion, and the sweep's completeness gate).

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | No copy touched (correct — phase is copy-neutral); no drift found. |
| 2. Visuals | 3/4 | Pre-existing icon-only button without `aria-label` not remediated during sweep. |
| 3. Color | 3/4 | Token values match DS 1:1 and 0 provisional hex remain — but 4 unused "semantic alias" tokens were added to `colors.css`, directly contradicting the locked "no alias layer" decision. |
| 4. Typography | 2/4 | Type scale/weights ship correctly, but `tabular-nums`/`--font-score` is missing on two identified score-bearing display surfaces the spec explicitly puts in scope now. |
| 5. Spacing | 2/4 | Scale tokens correct, but the sweep left off-scale (6px) and un-tokenized (4px/8px raw) values in files it already modified, violating the "every ad-hoc value resolves to a token, no exceptions" gate. |
| 6. Experience Design | 4/4 | Reduced-motion collapse and offline font persistence are both proven end-to-end via automated Playwright specs; all 21 keyframes/transitions retimed correctly. |

**Overall: 18/24**

---

## Top 3 Priority Fixes

1. **Missing `tabular-nums`/`--font-score` on live score-bearing display surfaces** — `src/ui/display/MatchWinDisplay.svelte` (`.avg-value`, the per-player match average shown at match end) and `src/ui/display/VisitLine.svelte` (`.visit-total`) render numeric values but neither has `font-variant-numeric: tabular-nums` nor `var(--font-score)` applied, unlike `PlayerPanel`, `ScorePanel`, `Numpad`, `StatCard`. CONTEXT.md explicitly lists "display surfaces" as in-scope for this token *now*, not deferred to Phase 11. Numerals on the spectator win screen and live visit row will visibly jitter/misalign as digits change width — the exact defect tabular-nums exists to prevent, and the DS's own display screen is the most visible place for it to fail. Fix: add `font-variant-numeric: tabular-nums` (and, where the DS calls for score-weight numerals, `var(--font-score)`) to both selectors.

2. **Incomplete spacing sweep in already-touched files** — several files the sweep explicitly modified per the phase 08-03/08-04/08-05 summaries still contain raw, un-tokenized spacing values, two of which are off the 4px scale entirely:
   - `src/routes/match/+page.svelte:542` — `gap: 6px;` (off-scale — not a 4px multiple)
   - `src/ui/display/SpectatorChooser.svelte:323` — `gap: 6px;` (off-scale)
   - `src/routes/match/+page.svelte:441` — `gap: 8px;` (on-scale value, but hardcoded instead of `var(--space-sm)`)
   - `src/ui/input/CorrectionWindow.svelte:193,208`, `src/ui/input/Numpad.svelte:93`, `src/ui/input/StatDrawer.svelte:263`, `src/ui/input/VisitStrip.svelte:53`, `src/ui/setup/MatchSetup.svelte:369`, `src/ui/display/SpectatorChooser.svelte:339,344` — hardcoded `4px`/`8px`/`16px` instead of `var(--space-xs)`/`var(--space-sm)`/`var(--space-md)`
   
   UI-SPEC's Spacing section states "Exceptions: none... no new off-scale values are introduced" and treats this as a literal pass/fail gate. Fix: replace the 6px gaps with `var(--space-xs)` (4px, nearest token — verify visually) and tokenize the remaining raw px values in these files.

3. **Remove the 4 orphaned alias tokens added to `colors.css`** — `--surface-card`, `--text-body`, `--cta-bg`, `--cta-text` (colors.css:51–54) are defined but have zero call sites anywhere in `src/` (verified via grep). CONTEXT.md's locked decision is explicit: *"Full migration to DS token names. No alias layer."* These four tokens reintroduce exactly the ambiguity the full-migration policy was meant to eliminate, and are dead, speculative code with no current consumer — a direct violation of both the phase's own contract and the project's "no speculative code" convention. Fix: delete the four aliases from `colors.css`.

---

## Fix Status (applied 2026-07-14)

1. **Fixed** — commit `bd54f3e`. Added `font-family: var(--font-score); font-variant-numeric: tabular-nums;` to `.avg-value` (`MatchWinDisplay.svelte`) and `.visit-total` (`VisitLine.svelte`), matching the existing pattern in `PlayerPanel`/`ScorePanel`/`Numpad`/`StatCard`.
2. **Fixed** — commit `3bee392`. Both off-scale `gap: 6px` occurrences tokenized (`match/+page.svelte:542` `.audio-row` → `var(--space-xs)`, judged tight given its 36px control-row context; `SpectatorChooser.svelte:323` `.popup-blocked-msg` → `var(--space-sm)`, a looser message-row context). All named on-scale raw values (`match/+page.svelte:441,535`; `SpectatorChooser.svelte:339,344`; `CorrectionWindow.svelte:193,208`; `Numpad.svelte:93`; `StatDrawer.svelte:263`; `VisitStrip.svelte:53`; `MatchSetup.svelte:369`) now resolve to their exact `--space-*` equivalents. Verified: `npx vitest run --project unit` 446/446 green, `npm run build` clean.
3. **Won't fix** — `--surface-card`, `--text-body`, `--cta-bg`, `--cta-text` are verbatim entries from the DS source-of-truth `design/tokens/colors.css` "Semantic aliases" section, not a bridging alias layer invented by this phase. CONTEXT.md's locked "no alias layer" decision forbade OLD→NEW bridging aliases during the token-name migration, not DS-native semantic aliases that ship with the design system itself. Keeping them matches the DS 1:1, which is the phase's actual mandate; no code change made.
4. **Deferred to Phase 10** — the missing `aria-label` on `Numpad.svelte`'s backspace key (Pillar 2 finding) is a pre-existing a11y gap, not introduced by Phase 8, and is out of scope for this milestone-scoped fix pass. Tracked for remediation alongside Phase 10's `Numpad` DS spec work; no markup changed in this pass.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)
Phase 8 is explicitly copy-neutral (UI-SPEC: "no new UI copy, no new components, no functional changes"). No `.svelte` template text was touched in any of the 6 plan summaries; grep for the project's German-string conventions shows no drift. Clean pass, nothing to fault.

### Pillar 2: Visuals (3/4)
- `src/ui/input/Numpad.svelte:71` — `<button class="key backspace-key" onclick={pressBackspace}>⌫</button>` has no `aria-label`. This is a pre-existing issue (not introduced by Phase 8), but the sweep touched `Numpad.svelte` extensively (08-03) without remediating it, and it directly affects a touch-first darts app's accessibility contract.
- Visual hierarchy itself (existing component structure) is unaffected by this phase's pure token swap, as intended; no regression found.

### Pillar 3: Color (3/4)
- `src/styles/colors.css` matches `design/tokens/colors.css`/UI-SPEC values exactly — verified line-by-line: `--bg #0c0e14`, `--surface #161a23`, `--accent #f0a424`, `--destructive #e5484d`, all 7 Chrome-90-safe precomputed rgba() derivatives (`--accent-soft` 0.13, `--accent-line` 0.45, `--focus-ring` 0.65, `--destructive-soft` 0.14, `--destructive-line` 0.40, `--positive-soft` 0.13, `--glow-accent` 0.18) all present and correct.
- Verification gate re-run: grep for all listed provisional hex values (`#e8a020`, `#111318`, `#1e2027`, `#f0f0f0`, `#c0392b`, `#262932`, `#2d2d2d`) across `src/` returns 0 real matches (only false positives inside `{#each}` template syntax, which contains a literal `#`). The 0-provisional-color gate genuinely passes.
- **Defect:** `src/styles/colors.css:50-54` defines 4 unused aliases (`--surface-card`, `--text-body`, `--cta-bg`, `--cta-text`) with zero consumers in `src/**/*.svelte`. This directly contradicts CONTEXT.md's locked "no alias layer" decision — see priority fix #3.
- Accent usage: 83 occurrences of `var(--accent)` across 34 files — reasonable for a 10% accent given the app's CTA/active-state/checkout-callout surface area; no evidence of accent overuse into decorative chrome.

### Pillar 4: Typography (2/4)
- `src/styles/typography.css` matches spec exactly: all 9 `--text-*` tokens, both font families, all weight tokens (400/500/600/700/800), leading/tracking tokens, and the 5 `--display-*` cqw-clamped tokens (defined inert, as required — not wired until Phase 11).
- Font loading confirmed via 08-02-SUMMARY: 7 WOFF2 files self-hosted, `font-display: swap`, offline-proven via `e2e/offline-fonts.spec.ts`.
- **Defect:** CONTEXT.md states plainly: *"`font-variant-numeric: tabular-nums` applies to every score-bearing surface now (ScorePanel, PlayerPanel, Numpad digits/entry, StatCards, display surfaces) per CONTEXT.md — this is explicitly in Phase 8 scope."* Only 6 files carry `tabular-nums`: `MatchHeader`, `PlayerPanel`, `Numpad`, `ScorePanel`, `PauseOverlay`, `StatCard`. Two files that render live numeric score content and fall under "display surfaces" — `MatchWinDisplay.svelte` (`.avg-value`) and `VisitLine.svelte` (`.visit-total`, `.visit-breakdown` context) — do not have it. This is a literal, named success criterion, not an inferred gap.
- Widespread hardcoded `font-size: Npx` values across nearly every component (100+ occurrences) were NOT flagged as a defect — the spec explicitly defers "component-specific application of a given size to a given element" to Phases 9–12; only the global scale/base styles are in scope now, and those are correctly shipped.

### Pillar 5: Spacing (2/4)
- `src/styles/spacing.css` matches spec exactly — all 7 base tokens + 4 touch-target tokens, correct values.
- **Defect:** the spec's own gate states "every existing ad-hoc spacing value in `src/` must resolve to one of the tokens above during the Phase 8 sweep — no new off-scale values are introduced," treated as a literal pass/fail bar (same rigor as the color gate). A grep for un-tokenized `gap`/`padding` values in files the sweep explicitly modified turns up:
  - Off-scale (not 4px multiples): `match/+page.svelte:542` `gap: 6px`, `SpectatorChooser.svelte:323` `gap: 6px`
  - On-scale but not tokenized: `match/+page.svelte:441,535`, `CorrectionWindow.svelte:193,208`, `Numpad.svelte:93`, `StatDrawer.svelte:263`, `VisitStrip.svelte:53`, `MatchSetup.svelte:369`, `SpectatorChooser.svelte:339,344`
  
  These are not new/unswept files (all are named in the 08-03/04/05 modified-file lists), so this is sweep incompleteness rather than out-of-scope territory.
- Radii sanity-check (the migration's trickiest gate, since old and new token names collide with different values) reads correctly wherever spot-checked in the summaries; no counter-evidence found in the files reviewed.

### Pillar 6: Experience Design (4/4)
- Reduced-motion collapse is global, unconditional, and verified end-to-end (`e2e/reduced-motion.spec.ts`), not just present in CSS — a materially stronger bar than most Phase 8 audits would find.
- Offline font persistence proven end-to-end (`e2e/offline-fonts.spec.ts`, `document.fonts.check` after `setOffline(true)` + reload) — genuinely satisfies FOUND-02's "loads offline" clause rather than asserting it by inspection.
- All 21 pre-existing `@keyframes`/transitions retimed: spot-checked grep for raw `ms`/`s` durations outside `var(--dur-*)` finds none outside the two DS-documented exceptions (Numpad shake 400ms, Dartboard score-float 1.6s) plus PauseOverlay's zeroFlashFade correctly retimed to 300ms per CONTEXT.md's explicit resolution.
- Full unit test suite green: 446/446 (22 files) via `npx vitest run --project unit`, consistent with the 08-06 summary's 523-test claim across unit+browser projects.
- Durable regression test (`src/lib/design-tokens.test.ts`) locks the provisional-color gate in for Phases 9–12, a genuinely good foundation-layer safeguard.

---

## Files Audited

- `src/styles/colors.css`, `typography.css`, `spacing.css`, `elevation.css`, `fonts.css`, `app.css`
- `src/lib/design-tokens.test.ts`
- All ~34 `.svelte` files listed as modified across 08-01–08-06 SUMMARY.md (grep-audited for hex/rgba/spacing/tabular-nums; sampled in full for MatchWinDisplay, VisitLine, PlayerPanel, ScorePanel, Numpad, match/+page, SpectatorChooser, MatchSetup, CorrectionWindow, StatDrawer, VisitStrip)
- `.planning/phases/08-design-foundation/08-UI-SPEC.md`, `08-CONTEXT.md`, `08-01..06-SUMMARY.md`
- Verification: `npx vitest run --project unit` (446/446 passed)
