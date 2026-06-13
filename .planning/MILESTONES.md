# Milestones

## v1.0 MVP (Shipped: 2026-06-13)

**Phases completed:** 6 phases, 33 plans, 55 tasks

**Key accomplishments:**

- SvelteKit 2 + Svelte 5 static scaffold with a real Dexie profile write/read on /setup, one wired runes-store dartboard tap on /match, Vitest unit+browser projects, and the failing FLOW-01 E2E RED baseline
- Pure X01 reducer with append-only event-log undo, polar-math board classifier, full 170-entry checkout table, and Svelte 5 MatchStore — 126 unit tests all green
- Complete touch scoring view with SVG dartboard (polar-math hit detection, D-01 enlarged rings), numpad with impossible-score validation, 2.5s correction window, darts-at-double dialog, match-win overlay, and screen wake lock — 7 browser tests green
- Full setup-to-match flow: profile CRUD via Dexie, guest support, 501/Double Out/Legs/Sätze config, bull-off ordering, START_MATCH wiring — FLOW-01 E2E spec turned GREEN
- Event-log reset on START_MATCH, CONFIRM_VISIT excluded from log, and IMPOSSIBLE_3DART extended with 163 and 166 — all verified by 9 new unit tests.
- SVG viewBox expanded from "0 0 400 400" to "-190 -190 780 780" so the double ring, outer single, miss zone, and labels are fully visible and finger-hittable; polar hit-detection unchanged
- Wired `ondismiss`/`onconfirm` callback props to close the stuck correction-window overlay and route numpad visits through the parent for darts-at-double detection, with per-player visit tracking replacing the broken cross-player counter.
- Fixed `MatchStore.remaining` getter to subtract the current board visit's running dart total, so remaining score and checkout suggestion update live after every dart (ENG-07 / D-10).
- Collapsible "Profile verwalten" section added to MatchSetup, making ProfileManager reachable from the setup screen for the first time.
- Fixed inner-bull domain bug CR-01: canonical encoding changed to { multiplier:2, segment:25 } so bull taps score 50 pts, bull finishes from remaining=50 are valid double-out wins, and checkout routes 170/167/164/161/50 no longer bust.
- Fixed Svelte $effect timer livelock (CR-04) with `untrack(() => startTimer())` and added in-window 'Fertig' dismiss control for the paused state (CR-03), making the correction window reliably auto-dismiss once and always escapable
- Three surgical fixes: live mid-visit score display (CR-02/ENG-07), crash-proof 0-player match guard (CR-05/FLOW-01), and functional darts-at-double capture on numpad finishes (WR-01/INP-03)
- Restored match-win dialog suppression via trial reduce in handleNumpadVisit and fixed inner-bull flash to key off multiplier instead of the dead segment===50 branch
- legStartVisitIndex added to MatchState for per-leg visit isolation, averages.ts pure computation functions, DisplayStore BroadcastChannel subscriber with localStorage hydration, and failing DISP-05 e2e baseline committed.
- BroadcastChannel + localStorage publisher wired into MatchStore.dispatch(), and the /display route built as a TV-style 1–4 player grid with name, large remaining score, legs/sets, per-panel averages, slim header bar, and idle waiting screen.
- VisitLine dart-by-dart slot component, checkout route and BUST flash in PlayerPanel, leg/set win banner and match win display with overlay wiring in the /display route.
- SpectatorChooser icon+menu with noopener/noreferrer second-window and tablet fullscreen navigation, fullscreen controls in /display (PC toggle, tablet prompt, auto-hiding exit), and DISP-05 e2e tests green via localStorage snapshot hydration path.
- Three surgical fixes restoring live BroadcastChannel sync ($state.snapshot), eliminating infinite $effect loop (plain prev-value trackers), and correcting false popup-blocked detection (drop noopener, null opener manually), plus a live no-reload e2e guard.
- Widened the /display "Vollbild aktivieren" prompt to appear during an active match on the tablet path by adding a `fullscreen=1` URL flag in SpectatorChooser, closing the last DISP-02 UAT gap without regressing the PC second-window scoreboard.
- 1. [Rule 2 - Accessibility] tabindex on dialog backdrop
- 1. [Rule 1 - Bug] localStorage stub `_store` TypeScript error
- 1. [Rule 3 - Blocking] dexie-export-import requires browser globals in node unit env
- 1. [Rule 1 - Bug] Test expectation corrected for bust dart count
- 1. [Rule 1 - Bug] TypeScript double-cast for legacy-blob test
- 1. [Rule 3 - Cleanup] Removed unused `{#snippet recordBadgeText()}` block from match route
- `src/lib/audio-prefs.ts`
- `src/lib/audio-sfx.ts`
- FLOW-02 auto-pause end-to-end: configurable-leg countdown overlay synced to both /match and /display via type-discriminated pause-tick on BC_CHANNEL, with manual Weiter resume and auto-resume at 0:00
- PWA toolchain installed with Vitest virtual-module mocks; German dark `ReloadPrompt` toast built TDD with 6 passing browser tests.
- SvelteKitPWA plugin wired with subpath-correct German manifest and mp3 precache; placeholder brand icons generated from SVG; manifest link and ReloadPrompt mounted in root layout; subpath production build verified.
- GitHub Actions two-job workflow committed: builds SvelteKit PWA with BASE_PATH from repo name and deploys build/ to GitHub Pages via actions/deploy-pages@v4 on push to main.

---
