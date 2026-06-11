# Phase 2: Spectator Display - Context

**Gathered:** 2026-06-11
**Status:** Ready for planning

<domain>
## Phase Boundary

A live spectator view showing all match state — scores, legs/sets, player names, active player, last visit, leg average, and match average per player — legibly on a 27" monitor from 3 m. On PC it opens as a second browser window (draggable to a second monitor); on tablet it is an in-app fullscreen route. It updates live on every dart and automatically re-syncs after being closed, reloaded, or opened mid-match. Includes the minimal leg/match average computation needed for display (full statistics suite is Phase 4). No persistence (Phase 3), no achievements/records overlays (Phase 4), no audio (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Screen layout & hierarchy
- **D-01:** Equal-split player panels, TV-broadcast style: 2 players = halves, 3 = thirds, 4 = quarters — always vertical columns side by side. One consistent structure for every player count; nothing moves around between turns.
- **D-02:** Active player marked by glow + accent border with a slightly brighter panel background; waiting players are dimmed. Must be obvious from 3 m.
- **D-03:** Slim match-info header bar above the panels: game mode, out rule, format, current leg number (e.g. "501 Double Out · First to 3 Legs · Leg 3"). Player panels get the remaining ~95% of screen height.
- **D-04:** Per-panel content: player name, large remaining score (the dominant element), legs/sets won, leg average + match average, visit line (see D-07).

### Live dart behavior
- **D-05:** Live per-dart updates: each dart appears on the spectator the moment it's entered, and the active player's remaining score counts down live mid-visit (consistent with Phase 1's live `remaining` getter).
- **D-06:** Checkout suggestion shown on the spectator too: when the active player is on a finish, their panel shows the suggested route (e.g. "T20 T20 Bull"). Reuses the existing `getSuggestion()` engine function; same bogey/>170 suppression rules as the input view.
- **D-07:** One visit slot per panel: while a player throws, it fills dart-by-dart ("T20 · – · –"); after the turn passes it shows their last completed visit. Format: big visit total with individual darts beneath ("100 — T20 · 20 · 20"). Numpad-entered visits show only the total.

### Transitions & special states
- **D-08:** Bust: brief prominent red "BUST" flash in the player's panel (~2 s), then the score visibly reverts to the start-of-visit value.
- **D-09:** Leg/set win: full-screen banner ("Leg für ALEX!" + updated legs/sets standing) that holds until the first dart of the next leg is thrown — mirrors the input device waiting between legs.
- **D-10:** Match win: full-screen winner display (winner name, final leg/set result, match averages) that stays until a new match starts or the view is closed.
- **D-11:** Idle state: when no match is running, show a calm dark waiting screen (app name + "Warte auf Match…"); it auto-switches to the scoreboard the moment a match starts via the snapshot handshake.

### Opening & controlling the view
- **D-12:** A small monitor/cast icon in the scoring view (always reachable mid-match) opens the spectator feature.
- **D-13:** Tapping the icon shows a small chooser menu with both actions: "Zweites Fenster öffnen" (PC second window) and "Anzeige hier im Vollbild" (tablet in-app fullscreen). No device auto-detection — explicit choice works everywhere.
- **D-14:** Tablet fullscreen exit: tapping anywhere on the display shows a temporary "Zurück zur Eingabe" button that auto-hides after ~3 s. No permanent chrome on the spectator display.
- **D-15:** PC spectator window gets an in-app fullscreen toggle (Fullscreen API) for a borderless TV-style display on the second monitor.

### Claude's Discretion
- Exact typography scale, dimming/glow values, and panel spacing — tune for 27" at 3 m (project constraint is the acceptance bar).
- Average display precision and German labels (e.g. "Ø Leg 52.3" with one decimal); leg average resets per leg, match average spans the match — standard 3-dart averages.
- Exact BUST flash duration/animation and banner styling.
- How undo events render on the spectator (score simply updates back — no special animation required).
- Sync protocol details within the locked approach (message shape, channel name, snapshot timing) — BroadcastChannel + localStorage snapshot handshake is locked; implementation details are the planner/researcher's.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project planning
- `.planning/REQUIREMENTS.md` — DISP-01..05 define this phase's scope with precise wording (what the display shows, 27"/3 m readability, re-sync behavior).
- `.planning/ROADMAP.md` — Phase 2 goal and the four success criteria.
- `.planning/PROJECT.md` — constraints (dark mode, high contrast, German UI, GitHub Pages static) and the locked decision: spectator window only on PC, tablet uses in-app fullscreen view.
- `.planning/phases/01-playable-x01-match/01-CONTEXT.md` — Phase 1 decisions the spectator must stay consistent with (visit strip format, checkout line format, German wording).

### Stack guidance
- `CLAUDE.md` (repo root) — locked stack and the "Cross-window state sync" section: BroadcastChannel for live messages, hydrate-on-open pattern, channel layer is PC-only and degrades gracefully on tablet.

No other external specs or ADRs exist.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/stores/match.svelte.ts` — `MatchStore` class with serializable `MatchState`; comment explicitly reserves BroadcastChannel wiring for Phase 2. `remaining` getter already computes live mid-visit values; `suggestion` getter already returns the checkout route.
- `src/engine/checkout.ts` — `getSuggestion(remaining, outRule)` reused as-is for the spectator's finish route (D-06).
- `src/engine/types.ts` — `MatchState` is the wire format for sync; field names are frozen ("DO NOT rename fields").
- `src/ui/input/VisitStrip.svelte` — existing dart-formatting conventions (T20/D16/Bull labels) to mirror in the spectator visit line.

### Established Patterns
- Pure reducer + event log: spectator can derive everything (averages, last visit, bust) from broadcast `MatchState` snapshots — it needs no actions of its own, it's a pure render target.
- Svelte 5 runes class store pattern (`$state` + getters) — the spectator store should follow the same shape.
- German UI wording established in Phase 1 (e.g. "Daneben"); spectator labels continue this.

### Integration Points
- New SvelteKit route (e.g. `/display`) rendering the spectator view; same route serves both the PC second window and the tablet fullscreen mode.
- Scoring view (`src/routes/match/+page.svelte`) gets the spectator icon + chooser menu (D-12/D-13) and must publish state on every dispatch.
- Sync layer: BroadcastChannel for live deltas + localStorage snapshot for hydration on open/reload (locked project decision). Averages computed from `PlayerState.visits` — needs a small derivation utility (likely shared with Phase 4 later).
- Tablet fullscreen mode lives in the same app instance — it reads the local store directly, no channel required.

</code_context>

<specifics>
## Specific Ideas

- TV darts broadcast as the visual reference: equal panels, huge remaining scores, finish route shown like on TV.
- German labels seen in discussion previews: "Letzte Aufnahme", "Warte auf Match…", "Zweites Fenster öffnen", "Anzeige hier im Vollbild", "Zurück zur Eingabe", "Leg für [Name]!", "[Name] gewinnt!", "Ø Leg / Ø Match".
- Leg-win banner holds until the next leg's first dart (event-driven, not timed).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 2-Spectator Display*
*Context gathered: 2026-06-11*
