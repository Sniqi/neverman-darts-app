# Milestones

## v1.2 Restyling (Shipped: 2026-07-14)

**Phases completed:** 5 phases (Phases 8–12), 27 plans, 60 tasks
**Requirements:** 20/20 complete (FOUND 4, COMP 4, SCOR 4, DISP 4, PAGE 4) — verified_closeout
**Character:** pure restyle to the `design/` system — zero functional/engine/store/sync/route changes; ~535 tests green through close
**Code:** src/ 75 files changed (+2 417 / −1 312) across 197 commits (46 feat), 2026-07-13 → 2026-07-14
**Verification:** all 5 phases verified + secured (threats_open 0); Phase 11 on-device Chromecast UAT 6/6, Phase 12 UAT 15/15 (7 human + 8 automated), 0 issues

**Key accomplishments:**

- **Phase 8 — Design Foundation:** DS color/spacing/radius/elevation tokens replace all provisional v1.0 styling app-wide (precomputed static, Chrome-90-safe values); Barlow + Barlow Semi Condensed self-hosted as WOFF2 and offline-precached (tabular-nums on score surfaces); DS motion with full `prefers-reduced-motion` collapse — zero provisional colors, durably grep-gated by a `design-tokens.test.ts` file-scanner.
- **Phase 9 — Core Components:** shared `.btn` (5 DS variants + 4 extensions) and `.switch` primitives in a new `src/styles/components.css`; ConfirmDialog / DartsAtDouble / ResumePrompt on the DS dialog spec (blur scrim, scale-in .94, 420px, stacked full-width buttons); chips, segmented control, steppers and toggle rows at DS sizes with spring switch thumbs; StatCard at 40px / Barlow Semi Condensed.
- **Phase 10 — Scoring Surface:** Numpad at DS 76px keys / 40px entry with an amber-gradient "Bestätigen" + ⌫ aria-label; Dartboard recolored with the last flash/float literals closed while polar hit-detection stays byte-identical; a shared `dart-notation.ts` powers the DS DartPill visit strip; ScoreCard at 96px/800 amber-edge active with a 3–4-player landscape compact clamp (E2E-regression-guarded).
- **Phase 11 — Spectator Display:** `/display` restyled to DS on all three surfaces (PC window, tablet fullscreen, Cast receiver) — cqw display-scale typography, amber active-player edge/inner-glow/tint, inactive panels at 55%, header gradients + amber bloom, every modern CSS feature gated behind `@supports` for Chrome 90 — plus the pause-on-Chromecast delivery gap closed (`#broadcastPause()` → `#publishToCast()`); on-device UAT 6/6.
- **Phase 12 — Pages & Overlays:** Hub/Setup (centered 520px column, DS list boxes, collapsible "Profile verwalten"), History list+detail (boxed DS HistoryRow), Stats dashboard (DS type/colors; bespoke SVG charts recolored, not rebuilt), Data/backup page, and every global overlay/toast (Pause/Record/MatchWin blur-scrim panels + shared `.btn--cta`, ReloadPrompt + Cast ResumeToast) brought onto DS specs.
- **Milestone character held:** a pure visual adoption of the design system — dartboard geometry byte-identical, all existing E2E flows green, and the app permanently guarded against provisional-color regressions by the token file-scanner.

---

## v1.1 Chromecast-Integration (Shipped: 2026-07-13)

**Phases completed:** 1 phase (Phase 7), 6 plans, 19 tasks
**Requirements:** 18/18 complete (CAST 6, RECV 5, SYNC 4, SETUP 3) — verified_closeout
**On-device UAT:** 5/5 passed 2026-06-19 (3rd pass, commit 35ec3c8); formally closed 2026-07-13

**Key accomplishments:**

- Google Cast sender integrated in `/match`: official Cast button in the SpectatorChooser with connection states, "Überträgt auf: <Gerät>" status and stop-casting — the entire Cast row is absent on browsers without Cast support (graceful degradation)
- `/display` doubles as a Custom Web Receiver on the Chromecast: prerendered route (`trailingSlash='always'`), receiver SDK gated on `isCastReceiverContext()`, idle timeout disabled (`disableIdleTimeout` + `maxInactivity:3600`) so sessions survive long auto-pause breaks
- Live state sync over a Cast custom channel: trimmed `CastDisplayState` projection (current-leg visit slice, verified < 32 KB for worst-case 4-player sets matches), full-snapshot hydration on connect + per-throw deltas, auto-pause countdown in sync on the TV
- Session resilience: `ORIGIN_SCOPED` auto-rejoin after tablet reload, `/match` restores the in-progress match on mount and re-pushes the snapshot on the reconnect edge, "Verbindung wiederhergestellt" toast (CAST-05/06)
- GitHub-Pages deployment hardening from on-device UAT: absolute asset paths (`kit.paths.relative=false` — fixes receiver 404s on the no-trailing-slash `/display` URL), SW `navigateFallbackDenylist` for `/display`, `VITE_CAST_APP_ID` via repo variable, PWA `autoUpdate`, and Chrome-90 receiver CSS fallbacks via `@supports` (no container queries/dvh/subgrid on the Cast device)
- Written Cast Console registration guide (`docs/CAST-SETUP.md`): unpublished receiver, own Chromecast registered by serial, $5 one-time fee, 15-min propagation — plus existing PC second-window and tablet fullscreen spectator paths verified unchanged (SYNC-04)

---

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
