---
phase: 09-core-components
fixed_at: 2026-07-14T00:29:43Z
review_path: .planning/phases/09-core-components/09-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 4
skipped: 2
status: partial
---

# Phase 09: Code Review Fix Report

**Fixed at:** 2026-07-14T00:29:43Z
**Source review:** .planning/phases/09-core-components/09-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 6 (3 Warning, 3 Info)
- Fixed: 4 (all 3 Warnings + 1 Info, IN-01, as a mechanical bonus)
- Skipped: 2 (Info, both intentional wont-fix per project decision — see below)

## Fixed Issues

### WR-01: Checkbox→button switch conversion introduces new a11y lint warnings; the "verified by E2E" justification only covers 3 of 7 switches

**Files modified:** `src/ui/setup/MatchSetup.test.ts` (new file)
**Commit:** 92bbb5b
**Applied fix:** Added a browser-mode component test rendering `MatchSetup` and asserting all 4 `role="switch"` elements (Sets, Caller, Musik, Automatische Pause) resolve via `page.getByRole('switch', { name: ... })` with their exact label-associated accessible name. This closes the runtime-proof gap for the 3 switches (Caller, Musik, Automatische Pause) that previously had no E2E/test coverage backing the phase's "verified via E2E" a11y-lint justification — only the `Sets` toggle (via `full-match-flow.spec.ts:27`) had prior proof. No source markup was changed; `svelte-check`'s `a11y_consider_explicit_label` warnings remain (expected — they're the documented false positive this test substantiates, not a defect to silence).

### WR-02: `.btn.btn--icon` doc comment misattributes the override it exists for

**Files modified:** `src/styles/components.css`
**Commit:** 4677b25
**Applied fix:** Corrected the comment at `components.css:137-138` to state the two-class selector overrides `.btn`'s own `width: 100%` (not `.btn--ghost`'s, which never sets a width). Comment-only change, no functional impact.

### WR-03: `remove-btn` icon-button styling relies entirely on shared classes with no local visual regression test

**Files modified:** `src/ui/shared/components-css.test.ts`
**Commit:** 8c2d947
**Applied fix:** Added a browser-mode test asserting the real call-site class combinations (`btn btn--ghost btn--icon remove-btn` from `PlayerPicker.svelte:65`, `btn btn--ghost btn--icon icon-btn` and `btn btn--ghost btn--icon icon-btn destructive` from `ProfileManager.svelte:100-101`) still compute to ≥48px width/height, guarding against a future `.btn--icon` selector-specificity regression silently shrinking these real-world hit targets.

### IN-01: `.btn--menu svg` CSS forces 20×20 icons, but markup still hardcodes `width="16" height="16"`

**Files modified:** `src/routes/+page.svelte`, `src/routes/stats/+page.svelte`
**Commit:** e1c5941
**Applied fix:** Updated the inline `width`/`height` attributes from `16` to `20` at the 4 affected `.btn--menu` call sites (Match-Verlauf, Statistik, Daten/Backup on the hub, and the profile-select row on `/stats`) so markup matches the CSS-forced rendered size. The `.btn--accent` "Neues Spiel" chevron (which genuinely renders at 16px — the `.btn--menu svg` rule doesn't apply to it) was correctly left untouched. `history/+page.svelte`/`HistoryRow` was left untouched per the review's own "out of scope" note. Purely markup-accuracy — CSS already governed the rendered size, so there is no visual change. Done as a bonus fix per the fix dispatch's judgment-call allowance (mechanical, no call-site churn beyond the 4 real drift instances).

## Skipped Issues

### IN-02: Hardcoded `color: #fff` on `.btn--destructive` — intentional per spec, but breaks the file's own token-only convention

**File:** `src/styles/components.css:95`
**Reason:** wont-fix by explicit project decision — this is a deliberate, spec-mandated exception (`09-UI-SPEC.md:99` specifies `#fff`, not a token, for this variant's text color). No action taken.
**Original issue:** See 09-REVIEW.md IN-02.

### IN-03: `DartsAtDoubleDialog`'s option buttons are not migrated to the shared `.btn` system

**File:** `src/ui/input/DartsAtDoubleDialog.svelte:37,95-110`
**Reason:** wont-fix by explicit project decision — the option-sheet buttons are intentionally bespoke (no DS variant maps to a 3-way option control); revisit only if this pattern recurs in a future phase.
**Original issue:** See 09-REVIEW.md IN-03.

## Verification

- `npx vitest run`: 535/535 passed (35 test files), including the 2 new assertions added by WR-01/WR-03.
- `npx playwright test`: 9/9 passed.
- `npx svelte-check`: no new errors introduced by any fix; pre-existing 28 errors are all in unrelated Chromecast/cast-sender files (unchanged from the original review's own note). The `a11y_consider_explicit_label` warnings on MatchSetup/`/match` switches are expected and unchanged (documented false positive, now substantiated by WR-01's test).

---

_Fixed: 2026-07-14T00:29:43Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
