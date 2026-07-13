# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## e2e-spec-drift-repair — E2E specs assumed stale setup defaults/flows after quick-task commits
- **Date:** 2026-07-14
- **Error patterns:** Legs verringern disabled, .overlay not found, getByText 501 321 not visible, correction window, startScore default, setsEnabled, CorrectionWindow removed, dart-pill undo strip
- **Root cause:** Three June-14 quick-task commits changed app defaults/flow without updating E2E specs: (1) commit 877828b changed default legsToWin 3→2; (2) commit 5be44aa removed the CorrectionWindow overlay from /match, replacing it with an immediate-commit dart-pill undo strip; (3) commit b9e4ef4 changed default startScore 501→301, outRule double→single, setsEnabled false→true, which also breaks "one leg win = match win" test math since legsToWin then applies per-set.
- **Fix:** Specs now explicitly select the desired game mode (501/Double Out, Sets off) in setup instead of relying on defaults; removed all overlay wait/dismiss logic since visits commit immediately on "Bestätigen"; disambiguated remaining-score text assertions with `exact: true` (PlayerPanel's history-row breadcrumb "→321" is a substring match otherwise).
- **Files changed:** e2e/full-match-flow.spec.ts, e2e/resume.spec.ts, e2e/spectator-sync.spec.ts
---

