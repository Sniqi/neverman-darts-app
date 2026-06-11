# Requirements: Neverman Darts App

**Defined:** 2026-06-10
**Core Value:** A full X01 darts match can be scored quickly and accurately by touch, with a large, readable live display for everyone in the room.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Game Engine

- [x] **ENG-01**: Player can play X01 matches with start scores 301, 401, or 501 and Single Out or Double Out finish rules
- [x] **ENG-02**: Player can configure legs and sets per match (first-to or best-of semantics)
- [x] **ENG-03**: Match supports 1–4 players with correct turn rotation and alternating leg/set starters
- [x] **ENG-04**: A bust (score below 0, exactly 1 remaining on double-out, or reaching 0 without a double on double-out) reverts the entire visit to the start-of-visit score and passes the turn
- [x] **ENG-05**: Player can undo any entered dart/visit, including reverting a leg- or set-winning throw without corrupting leg/set counts (reversible event-log state model)
- [x] **ENG-06**: Player can enter the bull-off result at match start to set the starting order (real throw happens at the board)
- [x] **ENG-07**: Player sees checkout suggestions for the next 1–3 darts when a finish is possible; bogey numbers (159, 162, 163, 165, 166, 168, 169) and scores above 170 show no suggestion; every suggested route ends on a double/bull in double-out

### Input

- [x] **INP-01**: Player can enter each dart by tapping an on-screen dartboard (Singles, Doubles, Triples 1–20, 25, Bull, Miss) with triple/double segments reliably hittable by finger on a tablet
- [x] **INP-02**: Player can alternatively enter the visit total via numeric keypad (e.g. "140")
- [x] **INP-03**: App tracks darts thrown at a double (from per-dart input, or via prompt on numpad-entered finishing visits) so checkout percentage can be computed
- [x] **INP-04**: Visit auto-finalizes after 3 darts, bust, or leg win, with a brief correction window before the turn passes
- [x] **INP-05**: Screen stays awake during an active match (wake lock, re-acquired on visibility change)

### Spectator Display

- [x] **DISP-01**: On PC, player can open the live game display as a second browser window and drag it to a second monitor
- [ ] **DISP-02**: On tablet, player can switch the app into a fullscreen display view
- [x] **DISP-03**: Display shows current scores, legs/sets, player names, active player, last visit, leg average, and match average per player
- [x] **DISP-04**: Display is readable on a 27" monitor from 3 m (large typography, high contrast, dark mode), with layouts for 1–4 players
- [x] **DISP-05**: Spectator window stays in sync live and re-syncs automatically after being closed, reloaded, or opened mid-match

### Game Flow

- [x] **FLOW-01**: Player can set up a match: select players/guests, game mode, in/out rules, legs/sets format, and starting order (via bull-off entry or manual)
- [ ] **FLOW-02**: After a configurable number of legs, a pause screen with countdown timer (e.g. 5 min) appears on both views; match continues after timer or button press
- [ ] **FLOW-03**: An in-progress match survives a browser reload or crash and can be resumed exactly where it stopped

### Statistics

- [ ] **STAT-01**: Player sees live 3-dart average for the current leg and the whole match (correct dart counting: busts = 3 darts, checkout visits = darts actually used)
- [ ] **STAT-02**: Player sees first-9 average per leg and match
- [ ] **STAT-03**: Player sees checkout percentage (doubles hit / darts at double)
- [ ] **STAT-04**: App counts score bands per leg/match/lifetime: 180s, 140+, 100+, 60+
- [ ] **STAT-05**: App tracks highest visit score, highest checkout, and best/worst leg (darts used) per player
- [ ] **STAT-06**: Player can browse match history (past matches with results and key stats)
- [ ] **STAT-07**: Player can view lifetime statistics per profile (averages, checkout %, score bands, records)
- [ ] **STAT-08**: Player can view a statistics dashboard with charts (score distribution, average trend over time, darts per leg, win rate)

### Profiles & Data

- [x] **PROF-01**: Player can create, edit, and delete persistent player profiles
- [x] **PROF-02**: Player can add guest players to a match without creating a profile (guest stats are not persisted)
- [ ] **PROF-03**: Player can export all data (profiles, history, stats) as a JSON file and import it again (backup / device transfer)

### Achievements

- [ ] **ACHV-01**: App detects new personal records during play (e.g. new highest visit score, new highest checkout)
- [ ] **ACHV-02**: New records are celebrated live with an overlay/animation on both views
- [ ] **ACHV-03**: Achievements/records are stored permanently in the player's statistics

### Audio

- [ ] **AUD-01**: Caller voice announces visit scores via speech synthesis, with selectable language German or English ("One hundred and eighty!")
- [ ] **AUD-02**: Sound effects play on 180s, high finishes, and new records, reinforcing the celebration overlay
- [ ] **AUD-03**: Player can mute or configure caller and sound effects

### Platform

- [ ] **PLAT-01**: App is installable as a PWA (Android home screen, desktop) and works fully offline after first load
- [ ] **PLAT-02**: App is deployed to GitHub Pages and works correctly under the repository subpath
- [ ] **PLAT-03**: When a new version is deployed, the app shows an update prompt instead of silently serving a stale cached build
- [ ] **PLAT-04**: UI is fully German with native dark mode design

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Training Modes

- **TRAIN-01**: Around the Clock (1→20→Bull, hit to advance)
- **TRAIN-02**: Bob's 27 (doubles ladder practice)
- **TRAIN-03**: Cricket (15–20 + Bull, close & score)
- **TRAIN-04**: Shanghai (rounds of S/D/T per number, instant Shanghai win)
- **TRAIN-05**: 121 / checkout training (finish from set targets)

### Extras

- **XTRA-01**: Per-player handicap (different start scores) at match setup
- **XTRA-02**: Recorded high-quality caller clips (replacing/augmenting speech synthesis)
- **XTRA-03**: Advanced touch speed aids (drag-to-modifier input)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Camera-based automatic dart detection | Manual touch input is the design premise; no camera hardware, heavy CV complexity |
| Online multiplayer / cross-device live sync | Requires a backend; GitHub Pages is static-only, all data stays on-device |
| Cloud accounts / login / leaderboards | No backend; local profiles + JSON export/import cover ≤4 known players |
| Computer/bot opponent | Steel darts requires real throws; solo value comes from training modes (v2) |
| Exhaustive game-mode library (Killer, Halve-It, etc.) | Each mode is its own engine; long tail dilutes polish — only proven modes in v2 |
| Tournament/bracket management | Far beyond a ≤4-player living-room match |
| Monetization (IAP/ads/subscription) | Personal home app; free, no tracking |
| Multi-language i18n framework | German-only UI is the target; caller voice handles DE/EN without an i18n layer |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ENG-01 | Phase 1 | Complete |
| ENG-02 | Phase 1 | Complete |
| ENG-03 | Phase 1 | Complete |
| ENG-04 | Phase 1 | Complete |
| ENG-05 | Phase 1 | Complete |
| ENG-06 | Phase 1 | Complete |
| ENG-07 | Phase 1 | Complete |
| INP-01 | Phase 1 | Complete |
| INP-02 | Phase 1 | Complete |
| INP-03 | Phase 1 | Complete |
| INP-04 | Phase 1 | Complete |
| INP-05 | Phase 1 | Complete |
| FLOW-01 | Phase 1 | Complete |
| PROF-01 | Phase 1 | Complete |
| PROF-02 | Phase 1 | Complete |
| DISP-01 | Phase 2 | Complete |
| DISP-02 | Phase 2 | Pending |
| DISP-03 | Phase 2 | Complete |
| DISP-04 | Phase 2 | Complete |
| DISP-05 | Phase 2 | Complete |
| FLOW-03 | Phase 3 | Pending |
| STAT-06 | Phase 3 | Pending |
| PROF-03 | Phase 3 | Pending |
| STAT-01 | Phase 4 | Pending |
| STAT-02 | Phase 4 | Pending |
| STAT-03 | Phase 4 | Pending |
| STAT-04 | Phase 4 | Pending |
| STAT-05 | Phase 4 | Pending |
| STAT-07 | Phase 4 | Pending |
| STAT-08 | Phase 4 | Pending |
| ACHV-01 | Phase 4 | Pending |
| ACHV-02 | Phase 4 | Pending |
| ACHV-03 | Phase 4 | Pending |
| AUD-01 | Phase 5 | Pending |
| AUD-02 | Phase 5 | Pending |
| AUD-03 | Phase 5 | Pending |
| FLOW-02 | Phase 5 | Pending |
| PLAT-01 | Phase 6 | Pending |
| PLAT-02 | Phase 6 | Pending |
| PLAT-03 | Phase 6 | Pending |
| PLAT-04 | Phase 6 | Pending |

**Coverage:**

- v1 requirements: 41 total
- Mapped to phases: 41
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-10*
*Last updated: 2026-06-10 after roadmap creation*
