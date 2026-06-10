# Feature Research

**Domain:** Darts scoring app (steel darts, manual touch input, local/offline, home/hobby, up to 4 players)
**Researched:** 2026-06-10
**Confidence:** HIGH for table-stakes and training-game rules (corroborated across DartCounter, n01, Russ Bray, Score Darts); MEDIUM for prioritization calls (judgment applied to this specific offline 4-player home context).

> Scope note: The committed feature list in PROJECT.md (X01 301/401/501 single/double-out, legs & sets, ≤4 players, touch board input, checkout suggestions, bull-off result entry, spectator display, auto-pause, profiles, history, long-term stats, achievements, German UI, dark mode) is treated as **already decided**. This document covers features *beyond* that list and classifies the committed ones only where useful for dependency/MVP reasoning. The driving question was "what ELSE is sensible."

## Feature Landscape

### Table Stakes (Users Expect These)

Missing these makes a scoring app feel broken or frustrating during real play. All are present in essentially every reference app (DartCounter, n01, Russ Bray, Score Darts, DARTS Scorekeeper).

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Undo / correct last entry | Mis-taps are constant on touch; without one-tap undo the app is unusable for live scoring | LOW–MEDIUM | One-tap "remove last entry". **Critical correctness trap (Russ Bray bug):** undoing a leg-winning score must also revert the leg/set count, or a leg can be "won twice". Model the game state as an event log / reversible reducer from day one. |
| Bust handling | Going over, or leaving 1 on double-out, must auto-revert the visit to the start-of-visit score | MEDIUM | Standard rule: score >remaining, or =1 (double out), or finishing on a non-double in double-out = bust → score reverts, turn passes. Score Darts: bust = enter 0 / no score. Bust must be visually obvious. |
| Per-visit total entry (numeric keypad) | The fastest input method experienced scorers expect; many prefer typing "140" over tapping three segments | LOW–MEDIUM | Offer **alongside** the per-dart board input. Per-visit is faster for scoring; per-dart is needed for checkout/double tracking. See dependency notes. |
| Checkout / double-attempt tracking | Required to compute checkout % — the headline finishing stat. Needs to know which darts were thrown at a double | MEDIUM | App must record "darts at double" and "doubles hit". Per-visit total entry alone can't infer this, so you need a prompt: "how many darts at double? did you finish?" on possible-checkout visits. |
| Core stats: 3-dart match average, first-9 average, checkout %, highest score, highest checkout, best/worst leg (darts) | These are THE darts metrics; every serious app shows them. Average = score/darts ×3 | MEDIUM | first-9 avg = scoring power; checkout % = finishing; both are universally displayed. Average is computed over the whole match, not per leg. |
| Score-band counts: 180s, 140+, 100+, 60+, tons | Players brag about and track these; "number of 180s" is the single most celebrated stat in darts | LOW | Simple counters per leg/match/lifetime. Cheap to add, high perceived value. |
| Screen wake lock | A scoring app whose screen sleeps mid-leg is infuriating; tablet is the primary device | LOW | Web `navigator.wakeLock` API. Re-acquire on visibility change. Easy win, frequently forgotten. |
| Match setup flexibility (best-of vs first-to legs/sets, start score, in/out rules, player order) | Users expect to configure the match like the pros (sets & legs, single/double out) | LOW–MEDIUM | Mostly committed. Add **best-of vs first-to** semantics explicitly (best-of 5 = first-to-3). |
| Clear "whose turn / what's left / what was thrown" live state | Core scoring affordance; must show remaining score, last visit, darts-this-visit, suggested checkout | LOW | This is the main scoring screen; already implied by committed scope. |

### Differentiators (Competitive Advantage)

Not strictly required, but align with the Core Value ("scored quickly and accurately by touch, with a large readable live display for everyone in the room") and the social home-play setting. These are where a home app can feel *delightful* rather than utilitarian.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Caller voice ("One hundred and EIGHTY!", score + checkout calls) | The single most-loved feature of Russ Bray Scorer; turns scoring into an event. Perfect fit for a room full of spectators | MEDIUM | Web Speech API (`SpeechSynthesis`) gets you German number calls offline-ish with zero assets (ref: open-source klemenstraeger/darts-scorer). Pre-recorded clips sound far better (the "180" hype) but add asset weight and a recording effort. Recommend: WebSpeech for v1, optional recorded "180"/"Game shot" clips later. German-language calls fit the German UI. |
| Sound effects + live achievement celebration overlay | Reinforces 180s, high checkouts, new personal records; already committed for records — extend to 180/171/high-finish moments | LOW–MEDIUM | Pairs with caller voice. Committed scope already has live record overlays; sound is the cheap multiplier. |
| Training / practice modes | Big reason hobby players open the app between matches. DartCounter ships ~8; gives the app standalone value beyond match nights | MEDIUM–HIGH (per game) | Each mode is a self-contained mini-engine sharing the board input + stats persistence. Build incrementally. Recommended set & rules below. |
| → **Around the Clock** (1→20→bull, hit to advance; doubles variant) | Best beginner drill, trivial rules, board-coverage practice | LOW | No math, no bust. Easiest training mode to ship first. |
| → **Cricket** (15–20 + bull, close & score) | Most popular non-X01 game; many couples/groups want it as an alternative match | MEDIUM | Marks (open/closed) UI + points. Could be a 2nd "match" type, not just solo training. |
| → **Bob's 27** (doubles ladder D1→bull, start 27, lose the double's value on a miss, out at ≤0) | Premier doubles-practice drill; directly improves checkout %, which the app already tracks | LOW–MEDIUM | Pure scoring loop with a penalty rule. |
| → **Shanghai** (single/double/triple of round's number; instant win on S+D+T) | Fun, fast, social group game | LOW–MEDIUM | 7 (or 20) rounds, highest score or instant Shanghai win. |
| → **121 / checkout training** (practice finishing from set targets) | Targeted finishing practice; complements checkout suggestions | LOW–MEDIUM | Variants exist; simplest: present a target (e.g. 121), N darts to check out, advance on success. |
| → **Doubles / singles / score training** | Focused skill drills with progress tracking over time | LOW | Thin wrappers over board input + a target + stats. |
| Deep stat dashboard: score distribution chart, doubles hit-rate, darts-per-leg, win rate, head-to-head | Long-term progression is a key retention hook; the data is already being captured | MEDIUM | Charts over stored history. Visualizing improvement is what DartConnect/MyDartTraining win on. Build once persistence + core stats exist. |
| Per-player handicap / start-score offset | Lets a strong player and a beginner have a fair, fun home match — high value in a mixed-skill household | LOW–MEDIUM | E.g. different start scores per player, or a "head start". Pure config + engine tweak. |
| Guest players (play without creating a profile) | Friends visiting shouldn't force profile creation; lowers friction for casual nights | LOW | "Guest" slot whose stats are discarded (or optionally merged later). Pairs with profiles. |
| Data export / import / backup (JSON file) | All data is on-device with no server; users will fear losing years of stats on a browser cache wipe | LOW–MEDIUM | Export/import a JSON file via the browser download/file-picker. Critical insurance for an offline-only app. Strongly recommended despite "differentiator" label — borderline table-stakes given no backend. |
| German darts terminology in calls/UI ("Ausbullen", "Ton", "Bull's eye", "Rest") | Authentic feel for the German-speaking target users; differentiator vs English-first apps | LOW | Fits committed German UI; just extend to call phrases & stat labels. |
| Configurable input speed aids (drag-to-modifier, auto-advance after 3 darts) | Score Darts' hold-and-drag to single/double/treble speeds touch entry dramatically | MEDIUM | Quality-of-life for the touch-first goal. Auto-finalize visit after 3 darts / on win / on bust. |

### Anti-Features (Commonly Requested, Often Problematic)

Things that look attractive but conflict with the stated scope, the no-backend/offline constraint, or the home-hobby focus. Several are already correctly in PROJECT.md "Out of Scope"; restated here with the *why* for the requirements author.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Camera / auto dart detection (autodarts/Scolia) | "The cool apps do it automatically" | Needs cameras, calibration, heavy CV; explicitly out of scope; manual touch input is the entire design premise | Fast, reliable touch input + per-visit numeric entry. |
| Online multiplayer / cross-device live sync | "Play friends remotely / use phone as remote scorer" | Requires a backend/server; PROJECT.md mandates GitHub Pages static + on-device only; sync is a huge correctness/complexity sink | One device runs the match; spectator window is a 2nd window on the *same* PC. |
| Cloud accounts / login / leaderboards | "Save stats across devices, compete globally" | No backend allowed; auth + privacy + sync burden for a home app of ≤4 known people | Local profiles + JSON export/import for moving data between devices manually. |
| Computer/bot opponent (avg 20–120) | DartCounter has it; "practice solo vs AI" | For a steel-dart app you still throw real darts and enter them — a bot can't share the physical board meaningfully; adds a simulation engine for little real-play value | Solo training modes (Bob's 27, ATC, checkout drills) give solo value without a fake opponent. |
| Exhaustive game-mode library (Killer, Halve-It, Tactics, Gotcha, Mickey Mouse, Golf, Baseball, etc.) | "More games = more value" | Each mode is its own engine, stats, German strings, edge cases; long tail is rarely played; dilutes polish | Ship X01 + the 5–6 highest-value training modes listed above; add more only on real demand. |
| In-app purchases / subscription / ads | Monetization norm in the category (DartCounter, Russ Bray Pro) | This is a personal/home app on GitHub Pages; monetization adds SDKs, privacy concerns, and friction for zero benefit | Free, no accounts, no tracking. |
| Tournament / bracket management (n01 tournament system) | n01 is famous for it | Multi-match orchestration, seeding, scheduling — far beyond a ≤4-player living-room match | A simple match is the unit; run several matches manually if needed. |
| Multi-language i18n framework | "Support English too" | German is the explicit single target; an i18n layer is premature abstraction (violates simplicity) | Hard-code German now; revisit only if a real second-language user appears. |
| Real-time everything / animated board physics | "Make it flashy" | Animation/physics cost battery, distract from fast scoring, and risk performance on tablets | Crisp, high-contrast, large-typography UI; reserve motion for the celebration overlay. |

## Feature Dependencies

```
Game engine (X01: scores, legs, sets, bust, in/out rules)
    └──requires──> Reversible state model (event log / undoable reducer)
                       └──enables──> Undo / correct last entry
                       └──enables──> "win leg twice" bug avoidance

Per-dart board input ──enables──> Checkout/double-attempt tracking
                                       └──requires──> Checkout %  &  doubles hit-rate stats
Per-visit numeric input ──(alone)──> CANNOT compute checkout % (no per-dart granularity)
        └── conflict/gap: must add a "darts at double / finished?" prompt to recover the stat

Persistent profiles ──requires──> Match history ──requires──> Long-term stats
                                                                   └──enables──> Stat dashboard / charts
                                                                   └──enables──> Achievements / personal records
Profiles ──enhances──> Guest players (guest = profile-less slot)

Core stats (avg, first-9, 180/140/100 counts, highest score/checkout)
    └──feeds──> Achievement detection (new record → live overlay + sound)
    └──feeds──> Caller voice triggers ("180", "Game shot")

Caller voice ──enhances──> Sound effects / celebration overlay (same trigger points)

Training modes (ATC, Cricket, Bob's 27, Shanghai, 121, doubles/singles)
    └──reuse──> Board input + stats persistence (build engine first, modes are thin)

JSON export/import ──requires──> Persistent data store (defines the schema to serialize)

Wake lock, dark mode, German UI ──independent──> (no deps; do early, cheap)
```

### Dependency Notes

- **Undo requires a reversible state model:** Decide this at architecture time. A naive "subtract the last number" undo is the source of the documented "win a leg twice" bug. Model game state as an ordered list of visits/throws and recompute, or use an undoable reducer.
- **Checkout % requires per-dart (or a double-prompt) granularity:** Pure per-visit total entry cannot know how many darts were aimed at a double. Either rely on per-dart board input on finishing visits, or prompt "darts at double? finished?" Plan this into the input flow, not after.
- **Stat dashboard requires history + core stats first:** Charts are cheap once the data model exists; do not build charting before persistence + the core stat computations are stable.
- **Training modes reuse the engine, not duplicate it:** Build the board-input + stats-persistence layer so each training game is a small rules module on top. This keeps the long tail cheap (and makes the "more games" anti-feature pressure manageable).
- **Export/import defines the storage schema:** Designing serialization early forces a clean, versioned on-device data model — valuable insurance given there is no backend.

## MVP Definition

### Launch With (v1)

Minimum to validate "score a full X01 match quickly, accurately, and watchably." (Committed-scope items marked ✓committed.)

- [ ] X01 301/401/501, single/double out, legs & sets, ≤4 players ✓committed — the core loop
- [ ] Reversible game state + **Undo last entry** — without it, live scoring fails
- [ ] **Bust handling** (auto-revert visit) — correctness; legs are unplayable otherwise
- [ ] Touch board input ✓committed **+ per-visit numeric keypad** — fast entry is the Core Value
- [ ] Checkout suggestions (next 1–3 darts) ✓committed
- [ ] **Checkout/double-attempt tracking** — needed for the headline finishing stat
- [ ] Core stats: 3-dart avg, first-9 avg, checkout %, 180/140/100 counts, highest score/checkout, best/worst leg ✓(extends committed stats)
- [ ] Bull-off result entry ✓committed
- [ ] Spectator display (score, legs/sets, names, leg & match avg) ✓committed
- [ ] Auto-pause with countdown ✓committed
- [ ] Profiles, match history, long-term stats, achievements + live overlay ✓committed
- [ ] **Screen wake lock** — cheap, prevents a glaring annoyance
- [ ] PWA + offline + dark mode + German UI ✓committed

### Add After Validation (v1.x)

Add once the match loop is proven in real use.

- [ ] **Caller voice** (Web Speech, German) — biggest delight multiplier; trigger when match loop + achievement events are stable
- [ ] **Sound effects** tied to 180/high-checkout/record events — once celebration overlay exists
- [ ] **JSON export / import / backup** — once the data schema has settled (do not delay too long; it's data insurance)
- [ ] **Guest players** — when friction with visiting friends is observed
- [ ] **Training modes, in value order:** Around the Clock → Bob's 27 → Cricket → Shanghai → 121/checkout drill → doubles/singles
- [ ] **Stat dashboard / charts** (score distribution, doubles hit-rate, darts-per-leg, win rate, H2H) — once enough history accumulates to be interesting

### Future Consideration (v2+)

- [ ] **Handicaps / per-player start offsets** — defer until mixed-skill imbalance is actually felt
- [ ] **Recorded high-quality caller clips** (vs synthesized) — polish after WebSpeech proves the concept
- [ ] **Cricket as a full standalone match type** (not just training) — if the group plays it often
- [ ] **Drag-to-modifier / advanced touch speed aids** — optimize input after baseline UX is validated

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Undo last entry (reversible state) | HIGH | MEDIUM | P1 |
| Bust handling | HIGH | MEDIUM | P1 |
| Per-visit numeric input | HIGH | LOW | P1 |
| Checkout/double-attempt tracking | HIGH | MEDIUM | P1 |
| Core stats (avg/first-9/checkout%/180s/highs/best leg) | HIGH | MEDIUM | P1 |
| Screen wake lock | HIGH | LOW | P1 |
| Caller voice (German, Web Speech) | HIGH | MEDIUM | P2 |
| Sound effects + celebration audio | MEDIUM | LOW | P2 |
| JSON export/import/backup | HIGH | MEDIUM | P2 |
| Guest players | MEDIUM | LOW | P2 |
| Training: Around the Clock | MEDIUM | LOW | P2 |
| Training: Bob's 27 | MEDIUM | LOW–MED | P2 |
| Training: Cricket | MEDIUM | MEDIUM | P2 |
| Training: Shanghai / 121 / doubles drills | MEDIUM | LOW–MED | P3 |
| Stat dashboard / charts | MEDIUM | MEDIUM | P2/P3 |
| Handicaps / start offsets | MEDIUM | LOW–MED | P3 |
| Recorded caller clips | MEDIUM | MEDIUM | P3 |
| Camera detection / online sync / bot / IAP | (out of scope) | HIGH | NO |

## Competitor Feature Analysis

| Feature | DartCounter | n01 | Russ Bray Scorer | Score Darts | Our Approach |
|---------|-------------|-----|------------------|-------------|--------------|
| X01 + sets/legs + in/out | Yes | Yes (tournament-grade) | Yes | Yes | Committed; offline, ≤4 players |
| Per-dart + per-visit input | Both | Both | Both | Both (+ drag-to-modifier, voice) | Both: board (per-dart) + numeric (per-visit) |
| Undo / bust handling | Yes | Yes (return to prev leg) | Yes (has the win-twice bug) | Yes (clear docs) | Yes — reversible state, avoid win-twice bug |
| Caller voice / "180" | MasterCaller Ray Martin | No (scoring focus) | Russ Bray (signature feature) | Voice + caller | Web Speech (German) v1.x, recorded clips later |
| Training modes | ~8 (Cricket, ATC, Bob's 27, Shanghai, 121, doubles/singles/score) | Scoring-focused | Match-focused | X01 + Cricket | ATC, Bob's 27, Cricket, Shanghai, 121, drills — incremental |
| Stats depth | avg, first-9, checkout%, highs, best/worst leg | dart avg, winning avg, score stats | match stats | various + missed-double tracking | Full core stats + dashboard; all on-device |
| Computer/bot opponent | Yes (20–120) | Yes (12 levels) | — | — | NO — real darts, manual entry; solo = training modes |
| Online / accounts / IAP | Yes (subscription) | Tournament system | Pro paid tier | Plus tier | NO — free, offline, no backend, JSON export instead |
| Spectator/big display | — | — | — | — | Yes (our differentiator: 27" @ 3 m readable) |

## Sources

- DartCounter (Target) — modes, stats, callers, players: https://play.google.com/store/apps/details?id=com.dartcounter.mobile (HIGH)
- Darts Counter: Scoreboard (Flame Apps) — checkout suggestions, undo, tablet layout: https://play.google.com/store/apps/details?id=de.flame.dartcounter (HIGH)
- n01 (nakka) — scoring focus, stats, tournament system: https://nakka.com/soft/n01/index_eng.html , https://en.n01darts.com/ (HIGH)
- Russ Bray Darts Scorer Pro — caller voice, name calls, undo "win twice" bug: https://apps.apple.com/us/app/russ-bray-darts-scorer-pro/id1269100714 (HIGH)
- Score Darts X01 Help — bust handling, undo + missed doubles, input modes, auto-finalize: https://www.scoredarts.com/x01help/ (HIGH)
- DARTS Scorekeeper 2026 — configurable caller voice, per-visit input, keyboard input: https://apps.apple.com/us/app/darts-scorekeeper-2026/id1504732492 (MEDIUM)
- klemenstraeger/darts-scorer — Web Speech API announcer, checkout phrases: https://github.com/klemenstraeger/darts-scorer/issues/3 (MEDIUM)
- Training game rules (Cricket, ATC, Shanghai, Bob's 27, 121): https://beskardarts.com/games/ , https://dartsplanet.tv/bobs-27-darts-practice-game/ , https://dartsy.org/blog/dart-practice-games-to-play-alone (HIGH for rules)
- Stat definitions (first-9 avg, checkout %, 180/140/100 distribution, doubles): https://www.skysports.com/darts/news/12288/13271474/ , https://darts501.com/Scorer.html (HIGH)

---
*Feature research for: darts scoring app (steel darts, offline, touch, home/hobby)*
*Researched: 2026-06-10*
