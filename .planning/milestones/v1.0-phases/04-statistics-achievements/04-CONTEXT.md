# Phase 4: Statistics & Achievements - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Layer full statistics and live achievement celebrations onto the existing match engine and persistence. Five deliverables:

1. **Live in-match stats (STAT-01..05):** during a match the player sees the live 3-dart average and first-9 average (leg + match), checkout %, score-band counts (180s, 140+, 100+, 60+), highest visit, highest checkout, and best/worst leg — with correct dart counting (busts = 3 darts; checkout legs count actual darts used).
2. **Lifetime stats per profile (STAT-07):** averages, checkout %, score bands, and records, aggregated across a profile's match history.
3. **Statistics dashboard with charts (STAT-08):** score distribution, average trend over time, darts per leg, win rate.
4. **Personal-record detection & celebration (ACHV-01..03):** new personal records detected in real time during play and celebrated with an overlay/animation on both the input and spectator views; records are permanently reflected in the player's statistics.
5. The match-detail view's existing empty "Phase 4 growth area" is filled with the per-match stats breakdown.

**Not this phase:** audio/caller voice and the 180/record SOUND effects (Phase 5 — this phase delivers the visual overlay only); auto-pause (Phase 5); PWA install/offline/deploy (Phase 6). No new game modes. No cross-device sync (out of scope project-wide).

</domain>

<decisions>
## Implementation Decisions

### Live in-match stats surfacing
- **D-01:** On the INPUT view, the extra live stats live behind a **tappable "Statistik" drawer/panel** — not always-on. The existing inline 3-dart average and checkout line stay as they are; the drawer holds the full live leg + match breakdown (first-9, checkout %, score bands, highest visit/checkout, best/worst leg). Keeps the touch-dense scoring surface uncluttered.
- **D-02:** The SPECTATOR view stays **minimal** — averages remain as today (leg avg, match avg). Do NOT add stat clutter to the 3 m view. The only new spectator element this phase adds is the record-celebration overlay (D-08).

### Which records celebrate + seeding
- **D-03:** Records that trigger the **live celebration overlay**: new **highest visit**, new **highest checkout**, new **best leg (fewest darts to close a leg)**, and new **highest match 3-dart average** (the last fires at match end, the others mid-play). All other tracked stats are still stored and shown in lifetime stats — this list is only about what interrupts the moment.
- **D-04:** A **180 always celebrates**, even when it only ties an existing personal best — it is the iconic darts moment. A first-time-this-match or record-setting 180 may read slightly bigger. (Phase 5 adds the 180 sound on top of this visual.)
- **D-05:** **Celebrate from first occurrence.** On a player's very first match (no prior records stored), the first 180 / first checkout / first completed leg each set AND celebrate the initial record. No silent baseline-seeding match.

### Record celebration overlay UX
- **D-06:** The celebration is a **transient auto-dismiss overlay/animation (~2–3 s)** on BOTH views; play continues underneath, no tap required. Matches the existing correction-window timing and the spectator leg/match-win banner language. (A modal-per-record would nag given how often 180s land.)
- **D-07:** Multiple milestones in one moment (e.g. a 180 that is also a new highest visit, or two records together) show as **one combined card** listing everything hit — e.g. "180! · Neuer Rekord: Höchste Aufnahme" — a single interruption, not a queue.
- **D-08:** When a record lands on a **leg- or match-winning throw**, the record **folds into the existing win banner** (a record badge/line on the banner) rather than stacking two overlays — e.g. "Leg für ALEX! · Neuer Rekord: Höchstes Finish 121". One clean moment.

### Lifetime model + dashboard home
- **D-09:** **Records and lifetime stats are recomputed from match history** — match blobs are the single source of truth. There is NO separate stored records table. Consequence (accepted): deleting the match that holds a record lets the record recede to the next-best; lifetime stats always stay consistent with the visible history, and export/import already carries everything via the matches table (Phase 3 D-10/D-11). Consistent with Phase 3 D-09 ("lifetime stats recompute from whatever matches remain").
- **D-10:** The **lifetime statistics dashboard (charts) lives behind a new "Statistik" entry on the start screen**, alongside Neues Spiel · Match-Verlauf · Daten/Backup (mirrors the Phase 3 D-07 menu). Selecting a profile shows that profile's lifetime stats + charts.
- **D-11:** **Lifetime stats are per-profile only.** Profile players carry `id = String(profile.id)`; guests are `guest-N` and are NOT persisted, so they have no lifetime stats and cannot hold records. Records are attributed to the profile id.

### Claude's Discretion
- **Cross-leg match-average implementation.** STAT-01 requires a correct match 3-dart average across all legs; the existing `computeAverage`/`matchAverage` only captures the **last** leg (remaining resets to startScore each leg — see `PlayerStatRow.svelte` which deliberately shows "—" for multi-leg matches). Implementing correct cross-leg accumulation (busts = 3 darts, checkout legs = actual darts used) is the core engine task here. Approach is the researcher/planner's.
- **Charting approach/library.** Given the static-PWA bundle constraint (CLAUDE.md favors the smallest runtime), choose between a lightweight chart lib and hand-rolled SVG during research. No heavyweight charting dependency unless justified.
- **Checkout-% definition edge cases** (STAT-03 = doubles hit / darts at double). `Visit.dartsAtDouble` is already captured; deriving "doubles hit" (leg-won-on-a-double events) and the exact denominator handling for Single-Out matches is implementation detail.
- **first-9 average** mechanics (first 9 darts = first 3 visits of a leg; leg-level and match-level) — standard definition, exact rounding/format at discretion (one decimal, consistent with Phase 2).
- **Best/worst leg** derivation (darts-per-leg from `legStartVisitIndex` + visits).
- **How current records are made available live during play** for real-time detection — e.g. load the profile's recomputed records into memory at match start so a throw can be compared. Mechanism is the planner's.
- Exact German labels, drawer layout, overlay animation styling, dashboard chart selection/order, stats-screen profile picker UX.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project planning
- `.planning/REQUIREMENTS.md` — STAT-01..05, STAT-07, STAT-08, ACHV-01..03 define this phase's scope with precise wording (dart counting rules, score-band thresholds, checkout-% formula, what records to detect, celebrate on both views, store permanently).
- `.planning/ROADMAP.md` — Phase 4 goal and the five success criteria.
- `.planning/PROJECT.md` — constraints (German UI, dark mode, GitHub Pages static / on-device only) and out-of-scope (no backend, no cross-device sync).

### Prior phase context (stay consistent)
- `.planning/phases/03-persistence-data/03-CONTEXT.md` — D-05 (match-detail view is the Phase 4 growth surface — extend, don't replace), D-08 (only completed matches recorded), D-09 (lifetime stats recompute from remaining matches), D-10/D-11 (export = single JSON of profiles + matches; import = replace-all). These directly ground D-09 here.
- `.planning/phases/02-spectator-display/02-CONTEXT.md` — spectator visual language (full-screen leg/match-win banners, 3 m readability bar) the record overlay must match; BroadcastChannel + localStorage snapshot sync the overlay must ride on.
- `.planning/phases/01-playable-x01-match/01-CONTEXT.md` — D-08 darts-at-double capture (feeds checkout %), visit/dart formatting conventions, German wording.

### Stack & code contracts
- `CLAUDE.md` (repo root) — locked stack (SvelteKit 2 + Svelte 5 runes, TS ~5.9, Dexie 4); smallest-runtime priority (informs the charting choice); Dexie for the data model, localStorage only for tiny prefs.
- `src/engine/types.ts` — `MatchState` / `PlayerState` / `Visit` (`darts`, `dartsAtDouble`, `bust`) are the frozen serializable shapes all stats derive from; `legStartVisitIndex` enables per-leg slicing. **DO NOT rename fields.**
- `src/engine/averages.ts` — `computeAverage` / `legAverage` / `matchAverage`; note the documented cross-leg limitation Phase 4 must resolve. New first-9, checkout-%, score-band, records derivations belong alongside these as pure functions.
- `src/db/db.ts` — `Profile` (has `createdAt` reserved "used by Phase 4 stats") and `MatchRecord` (`winnerId`, `completedAt` indexed; `state` = full MatchState blob — the source of truth for lifetime aggregation). v2 schema; if any new table is added it is v3 (do NOT mutate prior version blocks).
- `src/db/matches.ts` — `matchesLive()` / `getMatch()` / `toHistoryRow()`; the liveQuery → Svelte readable pattern to mirror for lifetime aggregation queries.
- `src/db/profiles.ts` — typed CRUD + `profilesLive()` pattern; profile id ↔ player id linkage (`String(profile.id)`).
- `src/stores/match.svelte.ts` — `MatchStore` dispatch + BroadcastChannel/localStorage publish on every action; record-detection hook and overlay broadcast attach here; `#persistCompletedMatch` is where match-end records/match-avg finalize.
- `src/routes/history/[id]/+page.svelte` + `src/ui/history/PlayerStatRow.svelte` — the match-detail growth area (intentionally empty `.phase4-region`) and the per-player stat row to extend.
- `src/routes/+page.svelte` — the start-screen menu that gains the "Statistik" entry (D-10).
- `src/ui/display/LegWinBanner.svelte`, `MatchWinDisplay.svelte`, `src/ui/overlays/MatchWinOverlay.svelte` — existing win-banner components the record overlay folds into (D-08).

No external ADRs/specs exist — greenfield repo; requirements fully captured above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/engine/averages.ts` — pure stateless average helpers; the home for new pure stats functions (first-9, checkout %, score bands, best/worst leg, records). Already encodes the busts = 3 darts rule.
- `MatchState.eventLog` + `PlayerState.visits` (with `darts`, `dartsAtDouble`, `bust`) + `legStartVisitIndex` — everything needed to derive all in-match and lifetime stats; no new per-dart capture required except verifying darts-at-double coverage for checkout %.
- `Profile.createdAt` is explicitly reserved for Phase 4 stats.
- `db.matches` blobs are the lifetime source of truth (D-09); aggregate by scanning `state.players` and matching `player.id === String(profile.id)`.
- Spectator BroadcastChannel + localStorage snapshot sync (`MatchStore.dispatch`) — reuse to push the record-celebration event to `/display`.
- Win-banner components (LegWinBanner / MatchWinDisplay / MatchWinOverlay) — record overlay folds into these (D-08).

### Established Patterns
- **Pure-function stats:** mirror `averages.ts` / `checkout.ts` — named exports, no side effects, exhaustively unit-tested before UI. Records/aggregation should be pure functions over `MatchState[]`.
- **liveQuery → Svelte readable** (`profilesLive`, `matchesLive`) for reactive DB-backed lifetime views.
- **Graceful storage degradation:** all DB/localStorage access wrapped in try/catch (guests still play if Dexie is unavailable).
- **Dexie versioning:** new tables get `this.version(3).stores({...})`; never mutate v1/v2 blocks (db.ts comment is explicit). D-09 likely means NO new table at all (derived from matches).
- German UI + dark mode throughout.

### Integration Points
- **Cross-leg match average** must be implemented in the engine (current limitation flagged in `averages.ts` + `PlayerStatRow.svelte`). This underpins STAT-01, the match-detail avg ("—" today), and the "highest match avg" record (D-03).
- **Record detection** hooks into `MatchStore.dispatch` (mid-visit: highest visit, 180; leg close: best leg, highest checkout; match end: highest match avg). Compare against records recomputed-from-history loaded at match start (D-09).
- **Overlay broadcast:** record events publish over the existing BroadcastChannel so both `/match` and `/display` show the transient overlay (D-06), and fold into the win banner when coincident (D-08).
- **New "Statistik" route(s):** start-screen entry → profile picker → lifetime dashboard with charts (base-path aware per GitHub Pages subpath).
- **Match-detail enrichment:** fill the existing `.phase4-region` with per-match score bands / checkout % / highest visit etc.; extend `PlayerStatRow` (which currently shows "—" for multi-leg avg) once cross-leg average exists.

</code_context>

<specifics>
## Specific Ideas

- German overlay/label phrasing surfaced in discussion: "180!", "Neuer Rekord: Höchste Aufnahme", "Neuer Rekord: Höchstes Finish 121", "Leg für [Name]! · Neuer Rekord: …", a "Statistik" start-screen entry.
- Records that players "brag about" drove D-03: highest visit, highest checkout, best leg, best match average.
- Spectator must stay TV-clean (Phase 2 reference) — the record overlay is the only new spectator element; no stat tables on the 3 m view.
- Match-detail view is the explicit growth surface from Phase 3 — the empty `.phase4-region` is where per-match stats land.

</specifics>

<deferred>
## Deferred Ideas

- **Sound effects for 180s / records** — this phase delivers the visual overlay only; the audio reinforcement is Phase 5 (AUD-02), designed to sit on top of D-06.
- **Always-on / spectator stat panels** — rejected for this phase (D-01 drawer, D-02 minimal spectator) to protect the touch surface and 3 m readability. Could be revisited if desired later.
- **Independently-stored permanent records table** — considered and rejected (D-09) in favor of recompute-from-history. If records must survive match deletion in the future, it's a scoped schema addition.

</deferred>

---

*Phase: 4-Statistics & Achievements*
*Context gathered: 2026-06-12*
