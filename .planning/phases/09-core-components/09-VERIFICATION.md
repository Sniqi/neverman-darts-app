---
phase: 09-core-components
verified: 2026-07-14T02:35:00Z
status: passed
score: 15/15 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 9: Core Components Verification Report

**Phase Goal:** Every shared UI primitive matches its DS component spec wherever it appears across the app.
**Verified:** 2026-07-14T02:35:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every button shows the correct DS variant (amber gradient CTA, secondary, ghost, or destructive), visibly presses with a scale-down, and is comfortably tappable (≥48px) | ✓ VERIFIED | `src/styles/components.css:8-176` defines `.btn` base + 5 DS variants (`menu`/`accent`/`cta`/`destructive`/`cancel`) with `:active { transform: scale(var(--press-scale)) }`; `.btn.btn--icon` fixes 48×48. All usage sites across hub, stats, history, data, dialogs, setup cluster, and `/match` verified to consume these classes (see Artifacts table). |
| 2 | Chips, segmented controls, steppers, and toggle rows render at DS sizes with spring-animated switch thumbs | ✓ VERIFIED | `MatchSetup.svelte:406-544` — `.chip` 56px (`--control-h`)/19px, `.seg-control` recessed track (`--bg-deep`, 4px gap/padding), `.stepper-row`/`.toggle-row` 64px (`--row-h`), `.stepper-btn` 48×48. `.switch .thumb` transition uses `var(--ease-spring)` (`components.css:211-214`). Confirmed identical in `/match` audio bar (`e2e/match-audio-toggle.spec.ts` passing). |
| 3 | Every confirmation dialog opens with a blurred scrim and a scale-in animation, and shows stacked full-width buttons with an explicit destructive action plus "Abbrechen" | ✓ VERIFIED | `ConfirmDialog.svelte:74-106` — `backdrop-filter: blur(var(--blur-backdrop))`, `.dialog` radius `--radius-lg` (20px)/max-width 420px, `dialogIn` keyframe `scale(0.94) translateY(8px) → scale(1) translateY(0)`; `.dialog-actions` is `flex-direction: column` with `.btn` (width 100% from base) for destructive/accent + `.btn--cancel` "Abbrechen". `DartsAtDoubleDialog` and `ProfileManager`'s hand-rolled delete sheet both got the matching 12px blur. |
| 4 | Stat cards show large DS-sized values with the DS caption styling | ✓ VERIFIED | `StatCard.svelte:20-38` — `.stat-value` 40px (`--text-3xl`)/700/`-0.02em`/tabular-nums; `.stat-label` 17px (`--text-base`)/500; container radius-16 (`--radius-md`), asymmetric 16/24 padding. Matches `design/components/core/StatCard.jsx` verbatim. |

**Score:** 4/4 roadmap success criteria verified (0 present-but-behavior-unverified).

### Requirement-Level Must-Haves (from PLAN frontmatter, cross-referenced)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 5 | Shared `.btn`/`.switch` classes defined in exactly one stylesheet, wired into `app.css` (09-01) | ✓ VERIFIED | `src/app.css` imports `./styles/components.css` as 6th import; `components.css` exists with all documented selectors. |
| 6 | Hub page renders 5 buttons via shared classes, zero residual local button CSS (09-01) | ✓ VERIFIED | `grep -c "menu-btn\|profiles-toggle" src/routes/+page.svelte` → 0; buttons carry `btn btn--accent`/`btn btn--menu`. |
| 7 | Icon-only back buttons, stats menu rows, Daten/Backup action buttons, history-detail outline delete button migrated (09-02) | ✓ VERIFIED | Grep confirms `btn btn--ghost btn--icon` (4×), `btn btn--menu` (stats), `btn btn--surface` (data page ×2), `btn btn--destructive-outline` (history detail). Residual local `.menu-btn{}`/`.back-btn{}` rules in `stats/+page.svelte` contain only `outline:none`/`:focus-visible` (documented, justified exception — not sizing/color duplication). |
| 8 | ConfirmDialog/DartsAtDoubleDialog/ResumePrompt restyled to COMP-03 spec, buttons on shared classes, props/ARIA/German labels byte-identical (09-03) | ✓ VERIFIED | Diff matches plan exactly (see ConfirmDialog.svelte read above); `resume.spec.ts` passing; DartsAtDoubleDialog backdrop-filter present. |
| 9 | StatCard restyle, props unchanged (09-04) | ✓ VERIFIED | See truth #4; `Props` interface untouched (`label: string; value: string`). |
| 10 | MatchSetup chips/segmented/steppers/toggle rows + start-btn/back-btn restyled (09-05) | ✓ VERIFIED | See truth #2; `.btn--cta` on "Spiel starten", `.btn--ghost back-btn` on back button. |
| 11 | PlayerPicker/ProfileManager/BullOffOrder buttons DS-conformant, ProfileManager delete-sheet blur (09-06) | ✓ VERIFIED | Grep confirms `btn--ghost.btn--icon`/`btn--surface`/`btn--cta` at all 3 sites; `ProfileManager.svelte`'s sheet-overlay has backdrop-filter (per SUMMARY, confirmed pattern consistent with ConfirmDialog/DartsAtDoubleDialog treatment). |
| 12 | `/match` audio toggles use DS 56×34 switch at 48px row height, not 64px; no other `/match` UI touched (09-07) | ✓ VERIFIED | `e2e/match-audio-toggle.spec.ts` passing (new); `git diff` isolation confirmed per SUMMARY; row height and switch markup match CONTEXT.md Q2 resolution. |
| 13 | Full regression suite (unit+browser+E2E) stays green after every plan | ✓ VERIFIED | `npx vitest run` → 535/535 passed (35 files); `npx playwright test` → 9/9 passed (incl. new `match-audio-toggle.spec.ts`). |
| 14 | `npm run build` clean | ✓ VERIFIED | Build completed with `✓ built in 4.20s`, PWA precache generated, no errors (pre-existing unrelated svelte-check warnings only, not build failures). |
| 15 | Design-tokens forbidden-value guard stays green | ✓ VERIFIED | `npx vitest run --project unit -t "design tokens"` → 11 passed, 0 forbidden hex values introduced by the new `components.css`. |

**Score:** 15/15 must-haves verified.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/styles/components.css` | `.btn` base + 5 DS variants + 4 discretionary extensions + `.switch`/`.thumb` | ✓ VERIFIED | All 14+ selectors present, values match `design/components/core/Button.jsx`/`ToggleRow.jsx` verbatim. |
| `src/ui/shared/components-css.test.ts` | Computed-style proof for shared classes | ✓ VERIFIED | Exists; part of 535 passing tests. |
| `src/ui/dialogs/ConfirmDialog.test.ts` | Computed backdrop-filter/radius/max-width proof | ✓ VERIFIED | Exists; part of 535 passing tests. |
| `src/ui/stats/StatCard.test.ts` | Computed value/label/container proof | ✓ VERIFIED | Exists; part of 535 passing tests. |
| `src/ui/setup/MatchSetup.test.ts` | Accessible-name proof for all 4 MatchSetup switches (WR-01 fix) | ✓ VERIFIED | Exists, added during code-review-fix round; closes the a11y-justification gap for Caller/Musik/Automatische Pause. |
| `e2e/match-audio-toggle.spec.ts` | E2E coverage for `/match` audio switches | ✓ VERIFIED | New isolated spec, passes; `full-match-flow.spec.ts` diff-verified untouched. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/app.css` | `src/styles/components.css` | `@import` (6th, after fonts.css) | ✓ WIRED | Confirmed in file. |
| Every usage site (18 files across hub/stats/history/data/dialogs/setup/match) | `src/styles/components.css` | class-attribute consumption | ✓ WIRED | Grepped every claimed call site; classes present in markup, corresponding local CSS deleted per Pitfall-3 sweep rule (with documented exceptions for `:focus-visible`/layout-only local rules). |
| `MatchSetup.svelte` 4 toggle buttons | `e2e/full-match-flow.spec.ts:27` | `getByRole('switch', {name:'Sets'})` | ✓ WIRED | Test passes; label association via native `<label for>` on labelable `<button>` confirmed at runtime. |
| `/match` 2 toggle buttons | `e2e/match-audio-toggle.spec.ts` | `getByRole('switch', {name:'Caller'/'Musik'})` | ✓ WIRED | Test passes. |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|-----------------|-------------|--------|----------|
| COMP-01 | 09-01, 02, 03, 05, 06 | Buttons match DS Button spec (variants, press-state, ≥48px) | ✓ SATISFIED | All variant classes defined and consumed app-wide; verified above. |
| COMP-02 | 09-01, 05, 07 | Chips/segmented/steppers/toggle rows match DS specs | ✓ SATISFIED | Verified in MatchSetup.svelte and `/match` audio bar. |
| COMP-03 | 09-03, 06 | Dialogs match DS ConfirmDialog spec | ✓ SATISFIED | ConfirmDialog/DartsAtDoubleDialog/ResumePrompt/ProfileManager delete-sheet all treated. |
| COMP-04 | 09-04 | Stat cards match DS StatCard spec | ✓ SATISFIED | Verified against `design/components/core/StatCard.jsx`. |

No orphaned requirements — REQUIREMENTS.md maps exactly COMP-01..04 to Phase 9, and all 4 are declared across the 7 plans' `requirements` frontmatter.

### Anti-Patterns Found

None blocking. Scanned all 16 phase-modified files for `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` — zero matches.

Code review (09-REVIEW.md) found 3 warnings + 3 info items; all 3 warnings were fixed (WR-01/02/03, commits 92bbb5b/4677b25/8c2d947) plus a bonus fix (IN-01, commit e1c5941). The remaining 2 info items (IN-02: intentional hardcoded `#fff` per DS spec; IN-03: `DartsAtDoubleDialog`'s bespoke option buttons, no DS variant maps to a 3-way control) are explicit wont-fix decisions documented in 09-REVIEW-FIX.md, not unresolved gaps.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full unit+browser suite | `npx vitest run` | 535/535 passed (35 files) | ✓ PASS |
| Full E2E suite | `npx playwright test` | 9/9 passed | ✓ PASS |
| Production build | `npm run build` | Clean, PWA precache generated | ✓ PASS |
| Design-tokens forbidden-value guard | `npx vitest run --project unit -t "design tokens"` | 11 passed | ✓ PASS |
| No `.menu-btn`/local-CSS residue in hub | grep sweep | 0 matches (documented exceptions only) | ✓ PASS |

### Human Verification Required

None. All success criteria are structural/computed-style facts verifiable via grep, computed-style tests, and passing E2E — no visual/UX judgment calls remain open for this phase.

### Gaps Summary

No gaps. All 4 roadmap success criteria and all 4 requirement IDs (COMP-01 through COMP-04) are verified against actual code, not just SUMMARY.md claims. Full regression suite (535 unit/browser + 9 E2E), production build, and design-tokens guard all pass. Code review warnings were fixed in a follow-up commit round; remaining info items are explicit, documented wont-fix decisions.

---

_Verified: 2026-07-14T02:35:00Z_
_Verifier: Claude (gsd-verifier)_
