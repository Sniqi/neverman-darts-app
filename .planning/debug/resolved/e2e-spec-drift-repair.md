---
status: resolved
trigger: "DATA_START Repair 6 pre-existing red E2E tests (documented in .planning/phases/08-design-foundation/deferred-items.md) so the whole Playwright suite runs green. TEST-ONLY changes: e2e/ and playwright.config.ts ONLY. Do NOT edit src/. If a failure is a REAL product bug, STOP and document instead of fixing app. DATA_END"
created: 2026-07-14T00:00:00Z
updated: 2026-07-14T01:05:00Z
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

hypothesis: CONFIRMED root causes for all 3 specs, all from June 14 quick-task commits (predate Phase 8):
  1. full-match-flow: default legsToWin changed 3→2 (commit 877828b) — 2nd "Legs verringern" click hits disabled button (min=1).
  2. resume.spec + full-match-flow: CorrectionWindow overlay removed from /match entirely, replaced by dart-pill undo strip (commit 5be44aa, "replace CorrectionWindow with dart-pill strip") — `.overlay` never renders; visits commit immediately on Bestätigen.
  3. spectator-sync (all 3) + latent in full-match-flow/resume: default startScore changed 501→301, outRule double→single, setsEnabled false→true (commit b9e4ef4) — specs hardcode 501-based arithmetic (180→321 etc), actual default now yields 301-180=121. This is the actual cause of "getByText('501'/'321') never visible" — not a chooser/markup issue (no SpectatorChooser gating exists on /display route itself, confirmed by reading +page.svelte: only IdleScreen vs panels-grid based on matchState).
test: Ran each spec in isolation via `npx playwright test e2e/<file> --reporter=line`, read error-context.md dumps to confirm exact values (e.g. saw "121" not "321" in ScorePanel after 180 visit → confirmed startScore=301 not 501).
expecting: after selecting 501+Double Out explicitly in setup (not relying on defaults) and removing overlay wait/dismiss logic, all specs pass.
next_action: All 3 specs fixed and verified. Ran full Playwright suite 3x consecutively (all 8 tests pass, no flakiness observed — no playwright.config.ts changes needed). Ran full Vitest suite (523/523 unchanged). Next: update deferred-items.md and STATE.md, commit spec fixes + docs separately.

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: All 5 E2E spec files pass (full-match-flow, resume, spectator-sync, reduced-motion, offline-fonts)
actual: 6 tests across 3 spec files fail — full-match-flow (1), resume (2), spectator-sync (3)
errors: |
  1. full-match-flow.spec.ts: getByRole('button', {name:'Legs verringern'}) resolves but stays disabled
  2. resume.spec.ts (both tests): locator('.overlay') not found after clicking Bestätigen in numpad helper
  3. spectator-sync.spec.ts (3 tests): display page never shows score text ('501'/'321')
reproduction: npx playwright test e2e/<file> --reporter=line
started: Pre-existing since June quick tasks (260614-q02 etc changed setup defaults/labels/flows); documented in deferred-items.md 2026-07-13, attributed to predate Phase 8

## Eliminated
<!-- APPEND only - prevents re-investigating -->

- hypothesis: spectator-sync failures caused by /display requiring a SpectatorChooser selection before showing panels
  evidence: read src/routes/display/+page.svelte in full — the only branch is `matchState === null || phase === 'setup'` → IdleScreen, else panels-grid directly. No chooser gates this route. SpectatorChooser.svelte is mounted on /match, not /display.
  timestamp: 2026-07-14T00:28:00Z

## Evidence
<!-- APPEND only - facts discovered -->

- timestamp: 2026-07-14T00:10:00Z
  checked: src/ui/setup/MatchSetup.svelte (read-only)
  found: legsToWin default=2, adjustLegs bounds [1,9], stepper-btn disabled={legsToWin<=1}
  implication: clicking "Legs verringern" twice from default 2 hits a disabled button on the 2nd click (2→1, then disabled)
- timestamp: 2026-07-14T00:15:00Z
  checked: npx playwright test e2e/full-match-flow.spec.ts --reporter=line (isolated run)
  found: "Test timeout... waiting for getByRole('button',{name:'Legs verringern'})... element is not enabled" on the 2nd click
  implication: confirms hypothesis 1 directly
- timestamp: 2026-07-14T00:20:00Z
  checked: src/routes/match/+page.svelte imports + git log -S"CorrectionWindow" -- src/routes/match/+page.svelte
  found: CorrectionWindow is NOT imported/used in +page.svelte; commit 5be44aa (2026-06-14, "feat(match): replace CorrectionWindow with dart-pill strip") intentionally removed it in favor of a dart-pill undo column
  implication: `.overlay` locator can never resolve on /match anymore; this is an intentional flow change, not a bug
- timestamp: 2026-07-14T00:22:00Z
  checked: re-ran full-match-flow.spec.ts after legs fix
  found: "Error: locator('.overlay') ... element(s) not found" at the assertOverlay check
  implication: confirms hypothesis 2 directly
- timestamp: 2026-07-14T00:30:00Z
  checked: re-ran full-match-flow.spec.ts after removing overlay wait/dismiss logic; read test-results error-context.md ARIA snapshot
  found: ScorePanel showed remaining "121" after a single 180 numpad visit, not the expected "321"
  implication: 501-180=321 expected, but 301-180=121 observed → default startScore is 301, not 501
- timestamp: 2026-07-14T00:32:00Z
  checked: git log -S for startScore/outRule defaults in src/ui/setup/MatchSetup.svelte
  found: commit b9e4ef4 (2026-06-14, "feat: profile management on landing page, back button on /setup") changed startScore default 501→301, outRule double→single, setsEnabled false→true
  implication: root cause of spectator-sync.spec.ts failures too (asserts '501'/'321' text) — not a SpectatorChooser/markup gating issue as hinted; confirmed by reading src/routes/display/+page.svelte (no chooser gates the panels-grid, only matchState null/setup vs active)
- timestamp: 2026-07-14T00:40:00Z
  checked: full-match-flow.spec.ts re-run after selecting 501+Double Out+legs fix; error-context.md ARIA snapshot showed remaining stuck at "16" with D8 checkout suggestion, no win heading
  found: setsEnabled defaults to true (b9e4ef4) with setsToWin=2, so legsToWin applies per-set — winning 1 leg only completes the first set, not the match, so the DartsAtDoubleDialog is deferred instead of an immediate match-complete dispatch
  implication: must explicitly turn OFF the "Sets" toggle in setup to restore "one leg win = match win" semantics the test relies on
- timestamp: 2026-07-14T00:45:00Z
  checked: full-match-flow.spec.ts after toggling Sets off — PASSED (11.0s)
  found: n/a
  implication: hypothesis 1+2+3 fully confirmed and fixed for full-match-flow.spec.ts
- timestamp: 2026-07-14T00:48:00Z
  checked: resume.spec.ts after adding explicit '501' selection (no overlay/sets changes needed — test never finishes a leg) — both tests PASSED (12.9s)
  found: n/a
  implication: hypothesis 2+3 fully confirmed and fixed for resume.spec.ts
- timestamp: 2026-07-14T00:52:00Z
  checked: spectator-sync.spec.ts after adding explicit '501' selection in setupAndStartMatch
  found: Playwright strict-mode violation — getByText('321') matched 2 elements: the `.remaining-score` div AND a history-row's `.h-remaining` span rendering "→321" (PlayerPanel shows a breadcrumb "→{scoreAfterVisit}" for each completed visit, and "321" is a substring of "→321")
  implication: needed exact:true on the '321'/'141' text assertions (matching the pattern already used for '501' in Test 3) — not a new regression, just exposed now that the score assertion actually finds real data
- timestamp: 2026-07-14T00:55:00Z
  checked: spectator-sync.spec.ts after adding exact:true to '321'/'141' assertions — all 3 tests PASSED (12.9s)
  found: n/a
  implication: all 6 originally-failing tests now green in isolation

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: |
  Three independent June-14 quick-task commits (all predate Phase 8) caused spec drift:
  1. commit 877828b — default legsToWin 3→2 (min still 1) → full-match-flow's 2nd decrement click hits a disabled button.
  2. commit 5be44aa — CorrectionWindow overlay removed from /match, replaced by dart-pill undo strip → `.overlay` locator never resolves in full-match-flow.spec.ts and resume.spec.ts.
  3. commit b9e4ef4 — default startScore 501→301, outRule double→single → specs hardcoding 501-based numpad arithmetic (180→321 etc.) get wrong remaining values; this is the actual cause of spectator-sync.spec.ts's "501"/"321" never appearing (no SpectatorChooser/markup issue exists).
fix: |
  - full-match-flow.spec.ts: explicitly select 501 + Double Out in setup (preserves the double-out checkout test intent instead of relying on defaults); reduce legs by 1 click (not 2); remove correction-overlay wait/dismiss from enterNumpadVisit, replace with remaining-score assertions after each visit.
  - resume.spec.ts: explicitly select 501 in setup; remove correction-overlay wait/dismiss from enterNumpadVisit helper (visits commit immediately on Bestätigen).
  - spectator-sync.spec.ts: explicitly select 501 in setupAndStartMatch helper.
verification: |
  - Each spec passed in isolation after its fix (full-match-flow: 1/1, resume: 2/2, spectator-sync: 3/3).
  - Full Playwright suite (8 tests, 5 spec files) run 3x consecutively with default parallel workers: 8/8 passed every time, zero flakiness — no playwright.config.ts changes needed.
  - Full Vitest suite: 523/523 passed (unchanged).
files_changed:
  - e2e/full-match-flow.spec.ts
  - e2e/resume.spec.ts
  - e2e/spectator-sync.spec.ts
</content>
