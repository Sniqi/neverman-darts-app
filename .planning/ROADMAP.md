# Roadmap: Neverman Darts App

## Overview

Starting from an empty repo, six phases deliver a fully installable darts scoring PWA. Phase 1 establishes the complete playable X01 match end-to-end in-memory. Phase 2 adds the spectator display. Phase 3 makes the match durable across reloads and adds data portability. Phase 4 layers in statistics and achievement celebrations. Phase 5 adds the caller voice, sound effects, and auto-pause. Phase 6 packages and deploys the app as an installable PWA on GitHub Pages.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Playable X01 Match** - Complete end-to-end X01 match playable in-browser with touch input, undo, checkout suggestions, and match setup (completed 2026-06-10)
- [x] **Phase 2: Spectator Display** - Live second-window and in-app fullscreen view showing all scores, readable at 3 m (completed 2026-06-11)
- [x] **Phase 3: Persistence & Data** - Match survives reload/crash; player profiles and match history stored; JSON export/import (completed 2026-06-12)
- [x] **Phase 4: Statistics & Achievements** - Full per-match and lifetime stats; personal records detected and celebrated live (completed 2026-06-12)
- [x] **Phase 5: Audio & Auto-Pause** - Caller voice announces scores; sound effects on 180s and records; auto-pause countdown between legs (completed 2026-06-12)
- [ ] **Phase 6: PWA & Deployment** - Installable offline-capable PWA on GitHub Pages with update prompt and German dark-mode UI

## Phase Details

### Phase 1: Playable X01 Match

**Goal**: A full X01 match can be played from setup to finish in-browser by 1–4 players with touch input, correct bust handling, undo, and checkout suggestions
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: ENG-01, ENG-02, ENG-03, ENG-04, ENG-05, ENG-06, ENG-07, INP-01, INP-02, INP-03, INP-04, INP-05, FLOW-01, PROF-01, PROF-02
**Success Criteria** (what must be TRUE):

  1. Player can configure a 301/401/501 match with Single Out or Double Out, set the number of legs/sets, add 1–4 named or guest players, and enter the bull-off result to set starting order
  2. Player can enter each dart by tapping the on-screen dartboard (all segments reliably hittable by finger) or by typing a visit total on the numeric keypad; the visit auto-finalizes after 3 darts, a bust, or a leg win with a correction window
  3. A bust (all three conditions: score < 0, reaching 1 on double-out, finishing on non-double) reverts the full visit and passes the turn immediately
  4. Player can undo any dart or completed visit, including a leg- or set-winning throw, without corrupting leg/set counts
  5. Checkout suggestions appear for the next 1–3 darts when a finish is possible; bogey numbers and scores above 170 show no suggestion; the screen stays awake throughout the match

**Plans:** 13/13 plans complete
**Wave 1**

- [x] 01-01-PLAN.md — Walking Skeleton: scaffold SvelteKit + adapter-static + Dexie + Vitest, real profile read/write + one wired dartboard tap, failing E2E baseline, SKELETON.md

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — X01 engine (TDD): pure reducer + event log, bust, rotation, checkout table, impossible scores, board polar math, real match store

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03-PLAN.md — Scoring view: Dartboard, ScorePanel, VisitStrip, CheckoutSuggestion, Numpad, CorrectionWindow, DartsAtDouble, MatchWinOverlay, undo, wake lock
- [x] 01-04-PLAN.md — Setup + profiles + bull-off: profile CRUD, MatchSetup, PlayerPicker, BullOffOrder, START_MATCH wiring, E2E green

**Wave 4 — Gap closure** *(all five plans touch disjoint file sets and run in parallel; close 9 verification defects)*

- [x] 01-05-PLAN.md — Engine fixes: reset event log on START_MATCH + drop CONFIRM_VISIT from log (CR-07/WR-01); add 163/166 to impossible scores (CR-02)
- [x] 01-06-PLAN.md — Dartboard viewBox expanded to show + hit the full double ring/miss zone (CR-01)
- [x] 01-07-PLAN.md — Correction window ondismiss + per-player visit tracking, Numpad onconfirm/darts-at-double, hardened E2E (CR-03/CR-04/CR-05, ENG-04 UI)
- [x] 01-08-PLAN.md — Live mid-visit remaining + checkout suggestion (CR-06)
- [x] 01-09-PLAN.md — Mount ProfileManager in setup so named profiles are reachable (CR-08)

**Wave 5 — Gap closure (re-verification 2026-06-11)** *(closes the 5 new Critical issues + WR-01 from the 2026-06-11 review; repairs ENG-04, ENG-07, INP-03, INP-04, FLOW-01)*

- [x] 01-10-PLAN.md — Inner-bull encoding fixed to 50 pts: board.ts {multiplier:2,segment:25}, bust.ts dead-branch removal, board/bust tests, VisitStrip 'Bull' label (CR-01)
- [x] 01-11-PLAN.md — CorrectionWindow untrack(startTimer) so auto-dismiss fires once + escapable paused state ('Fertig' button + outside-click), real-timer test (CR-03/CR-04)
- [x] 01-12-PLAN.md — Live ScorePanel score (CR-02), 0-player bull-off guard + reducer hardening (CR-05), record darts-at-double on numpad finish (WR-01)

**Wave 6 — Gap closure (re-verification round 3, 2026-06-11)** *(closes the 2 remaining defects from 01-VERIFICATION.md score 4/5: E2E-blocking match-win dialog regression + inner-bull flash region)*

- [x] 01-13-PLAN.md — Restore match-win darts-at-double suppression via trial reduce so the E2E happy-path passes (CR-01); fix Dartboard inner-bull flash region, remove dead segment===50 branch (WR-02)

### Phase 2: Spectator Display

**Goal**: A live spectator view shows all match state legibly on a 27" monitor from 3 m, opening as a second window on PC or as in-app fullscreen on tablet, and stays in sync automatically
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: DISP-01, DISP-02, DISP-03, DISP-04, DISP-05
**Success Criteria** (what must be TRUE):

  1. On PC, player can click a button to open the spectator view as a second browser window and drag it to a second monitor
  2. On tablet, player can switch the app into a fullscreen display view that shows current scores, legs/sets, player names, active player, last visit, leg average, and match average per player
  3. The spectator view is readable on a 27" monitor from 3 m (large typography, high contrast, dark mode) with correct layouts for 1–4 players
  4. The spectator window updates live on every dart entry and automatically re-syncs its state when closed and reopened or reloaded mid-match

**Plans:** 6/6 plans complete
**UI hint**: yes
Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Engine data foundation: legStartVisitIndex + averages.ts, DisplayStore subscriber, failing sync e2e baseline (Wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md — MVP slice: BroadcastChannel publisher + /display TV grid (PlayerPanel, MatchHeader, IdleScreen), live sync (Wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02-03-PLAN.md — Per-dart behavior + states: VisitLine, checkout route, BUST flash, LegWinBanner, MatchWinDisplay (Wave 3)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 02-04-PLAN.md — Launch + control: SpectatorChooser (PC window/tablet fullscreen), fullscreen toggle/exit, e2e green, human review (Wave 4)

**Wave 5 — Gap closure (verification 2026-06-11)** *(closes the 2 blockers + WR-02 from 02-VERIFICATION.md: dead live BroadcastChannel sync + infinite leg-win effect loop + popup-blocked false positive)*

- [x] 02-05-PLAN.md — Restore live sync ($state.snapshot publisher, CR-01/DISP-05), fix infinite $effect loop (CR-02), fix SpectatorChooser popup-blocked false positive (WR-02/DISP-01), add live no-reload e2e test (Wave 5)

**Wave 6 — Gap closure (UAT 2026-06-11)** *(closes the 1 DISP-02 UAT gap from 02-UAT.md Test 4: tablet "Vollbild aktivieren" prompt hidden during an active match)*

- [x] 02-06-PLAN.md — Widen the tablet fullscreen prompt to appear mid-match via a fullscreen-intent query flag, without regressing the PC second window (DISP-02) (Wave 6)

### Phase 3: Persistence & Data

**Goal**: A match survives a browser reload or crash and resumes exactly where it stopped; player profiles and match history are stored persistently; all data can be exported and imported
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: FLOW-03, STAT-06, PROF-03
**Success Criteria** (what must be TRUE):

  1. Reloading the browser mid-match restores the exact game state including scores, leg/set counts, and whose turn it is
  2. Player can browse past matches in a match history list showing results and key stats
  3. Player can export all profiles, history, and stats as a JSON file and import that file on another device or after clearing browser data

**Plans:** 3/3 plans complete
**Mode:** mvp (vertical slices) · **UI hint**: yes

**Wave 1**

- [x] 03-01-PLAN.md — Start screen hub (D-07) + crash-resume slice (FLOW-03): loadUnfinishedMatch, MatchStore.restore, ResumePrompt, reusable ConfirmDialog, new-match warning (D-02), resume E2E

**Wave 2** *(blocked on Wave 1 — shares match.svelte.ts)*

- [x] 03-02-PLAN.md — Match history slice (STAT-06): Dexie version(2) matches table, matches.ts CRUD + liveQuery, persist-on-complete (D-08), history list (D-04/D-06), detail view + single-match delete (D-05/D-09)

**Wave 3** *(blocked on Wave 2 — needs matches table + ConfirmDialog)*

- [x] 03-03-PLAN.md — Export/import slice (PROF-03): dexie-export-import (legitimacy checkpoint), backup.ts export/validate/replace-all import (D-10/D-11), Daten/Backup screen with guarded confirmation (D-12) + storage warning

### Phase 4: Statistics & Achievements

**Goal**: Players see live and lifetime statistics during and after every match; personal records are detected in real time and celebrated with an overlay
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: STAT-01, STAT-02, STAT-03, STAT-04, STAT-05, STAT-07, STAT-08, ACHV-01, ACHV-02, ACHV-03
**Success Criteria** (what must be TRUE):

  1. During a match, player sees the correct live 3-dart average and first-9 average for the current leg and the full match (busts counted as 3 darts; checkout legs count actual darts used)
  2. Player sees live checkout percentage, score-band counts (180s, 140+, 100+, 60+), highest visit, highest checkout, and best/worst leg
  3. Player can view lifetime statistics per profile including averages, checkout %, score bands, and all records
  4. Player can view a statistics dashboard with charts (score distribution, average trend, darts per leg, win rate)
  5. When a new personal record is set during play, an overlay/animation appears on both the input and spectator views and the record is permanently stored

**Plans:** 5/5 plans complete
**Mode:** mvp (vertical slices) · **UI hint**: yes

**Wave 1**

- [x] 04-01-PLAN.md — Engine stats core: legCompleted + wasCheckout fields, cross-leg average, first-9, checkout %, score bands, best/worst leg (pure, TDD)

**Wave 2** *(blocked on Wave 1; disjoint files, run in parallel)*

- [x] 04-02-PLAN.md — Live in-match StatDrawer slice (D-01): StatCard + StatDrawer mounted on /match
- [x] 04-03-PLAN.md — Lifetime stats + dashboard (STAT-07/08, D-09/D-10): db/stats.ts aggregation, SVG charts, ProfileStatDashboard, /stats route + Statistik start-screen entry
- [x] 04-04-PLAN.md — Match-detail breakdown: MatchStatBreakdown fills .phase4-region + PlayerStatRow cross-leg average

**Wave 3** *(blocked on Wave 2 — shares match route, needs computeLifetimeStats)*

- [x] 04-05-PLAN.md — Record detection + celebration (ACHV-01..03, D-03..D-08): MatchStore detection + preload, neverman-record channel, RecordOverlay on both views, win-banner fold-in

### Phase 5: Audio & Auto-Pause

**Goal**: The caller announces visit scores and celebrates 180s and high checkouts with sound; the match automatically pauses with a countdown after a configurable number of legs
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: AUD-01, AUD-02, AUD-03, FLOW-02
**Success Criteria** (what must be TRUE):

  1. After every visit, a caller voice announces the score in the selected language (German or English) via speech synthesis
  2. Sound effects play on 180s, high finishes, and new personal records, reinforcing the achievement overlay
  3. Player can mute or independently configure the caller voice and sound effects
  4. After a configurable number of legs, a pause screen with a countdown timer appears on both views; the match continues automatically when the timer expires or when the player presses a button

**Plans:** 3/3 plans complete
**Mode:** mvp (vertical slices) · **UI hint**: yes

**Wave 1**

- [x] 05-01-PLAN.md — Caller slice (AUD-01/AUD-03): audio-prefs localStorage helper + audio-caller (Web Speech, DE/EN, silent fallback), caller hook in /match visit-detection

**Wave 2** *(blocked on Wave 1 — shares match/+page.svelte; uses audio-prefs)*

- [x] 05-02-PLAN.md — SFX slice + settings UI (AUD-02/AUD-03): audio-sfx fire-and-forget + static/sfx assets, AudioSettings section in MatchSetup, SFX triggers (180/record/high-finish) in /match

**Wave 3** *(blocked on Wave 2 — shares match/+page.svelte; needs pause prefs)*

- [x] 05-03-PLAN.md — Auto-pause slice (FLOW-02): MatchStore pause state + leg-count detection + pause-tick channel, PauseOverlay on both views, DisplayStore pause handling, countdown $effect with auto/manual resume

### Phase 6: PWA & Deployment

**Goal**: The app is installable as a PWA on Android and desktop, works fully offline after first load, is deployed to GitHub Pages at the correct subpath, and shows an update prompt when a new version is available
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: PLAT-01, PLAT-02, PLAT-03, PLAT-04
**Success Criteria** (what must be TRUE):

  1. A user visiting the GitHub Pages URL can install the app to their Android home screen or Windows desktop and subsequently open it without a network connection
  2. The app loads and functions correctly at the GitHub Pages repository subpath (no broken assets, no routing failures)
  3. When a new version is deployed, a user running the installed app sees a prompt to update rather than silently loading a stale cached build
  4. The entire UI is in German with a native dark mode design

**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Playable X01 Match | 13/13 | Complete    | 2026-06-11 |
| 2. Spectator Display | 6/6 | Complete    | 2026-06-11 |
| 3. Persistence & Data | 3/3 | Complete    | 2026-06-12 |
| 4. Statistics & Achievements | 5/5 | Complete    | 2026-06-12 |
| 5. Audio & Auto-Pause | 3/3 | Complete   | 2026-06-12 |
| 6. PWA & Deployment | 0/? | Not started | - |
