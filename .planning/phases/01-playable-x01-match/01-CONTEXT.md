# Phase 1: Playable X01 Match - Context

**Gathered:** 2026-06-10
**Status:** Ready for planning

<domain>
## Phase Boundary

A complete X01 match playable in-browser from setup to finish by 1–4 players: touch dartboard input with numpad fallback, correct bust handling, per-dart undo, checkout suggestions, match setup with bull-off order entry, and basic player/guest profiles. No spectator display (Phase 2), no match persistence/history (Phase 3), no stats dashboards/achievements (Phase 4), no audio/auto-pause (Phase 5), no PWA packaging (Phase 6).

</domain>

<decisions>
## Implementation Decisions

### Dartboard input ergonomics
- **D-01:** Triple/double rings drawn enlarged (roughly 2–3× realistic width). The board is deliberately stylized so every segment is reliably finger-hittable — authenticity loses to tappability.
- **D-02:** Scoring view is responsive for both orientations: portrait (scores on top, board below) and landscape (board beside score panel).
- **D-03:** Dart taps register instantly — no confirm step. The hit segment flashes/highlights and the dart appears in a visit strip (e.g. "T20 · 20 · –"). Mistakes are fixed via undo.
- **D-04:** Miss entry: tapping the outer area of the SVG (outside the double ring but inside the board area) counts as miss (0). Bounce-outs are entered as miss. No dedicated miss button.

### Visit flow, correction & undo
- **D-05:** Correction window (INP-04): after a visit ends (3 darts, bust, or leg win), the visit summary shows for ~2–3 seconds with darts still editable, then the turn passes automatically. Tapping the summary keeps it open for corrections.
- **D-06:** Undo is per dart and unlimited (ENG-05): each undo removes exactly one dart, stepping back through visits, legs, and sets without limit. The event-log reducer makes this the single mental model — no separate per-visit undo.
- **D-07:** Numpad coexistence (INP-02): a toggle on the scoring view flips between dartboard and numpad; the app remembers the last-used input mode per player within the match.
- **D-08:** Darts-at-double capture (INP-03): only when a numpad-entered visit wins a leg, a quick dialog asks darts used (1/2/3) and darts thrown at a double. Non-finishing numpad visits assume 3 darts, 0 at double. Dartboard-entered visits need no prompt — per-dart data is exact.

### Checkout suggestions
- **D-09:** Placement: compact suggestion line beside the active player's remaining score (e.g. "170: T20 T20 Bull"). Always visible when in finish range; never overlays the board.
- **D-10:** A single route is shown, recalculated live after every dart in the visit (100 → hit S20 → shows "80: T16 D16"). No alternative routes.
- **D-11:** Routes follow standard pro tournament checkout tables (T20-oriented setups, classic leaves like 32/40).
- **D-12:** Single Out mode also gets suggestions (any score ≤ 180 with a 3-dart route, ending on any segment). In Double Out, bogey numbers (159, 162, 163, 165, 166, 168, 169) and scores > 170 show nothing at all — no placeholder text.

### Match setup & bull-off
- **D-13:** Setup is a single scrollable screen: player picker, mode chips (301/401/501), out-rule toggle (Single/Double Out), legs/sets steppers, start button.
- **D-14:** Format semantics: first-to legs (default: 501, Double Out, first to 3 legs, sets off). Sets can be enabled as first to N sets, each set first to M legs. No best-of UI.
- **D-15:** Bull-off (ENG-06): after the real bull-off at the board, the user arranges ALL players into throwing order (tap in sequence or drag to sort) — not just picking a winner. Works for 3–4 players.
- **D-16:** Profiles use Dexie/IndexedDB from day one (PROF-01 satisfied literally in Phase 1): profile = name plus optional color/avatar initial, with create/edit/delete. Guests (PROF-02) are match-scoped entries, not persisted. Phase 3 adds match history/state persistence onto the existing DB — no migration from in-memory needed.

### Claude's Discretion
- Exact correction-window duration (within the ~2–3 s band) and its visual treatment.
- Specific enlarged ring proportions — tune for finger size on a typical 10" tablet.
- Which standard checkout table to encode (they differ marginally on a few scores) — pick one consistent published table.
- Numpad layout details, invalid-total handling (reject impossible scores like 179), undo button placement.
- Leg/set starter rotation (alternating per standard darts rules) — follow standard rules, no user preference expressed.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project planning
- `.planning/REQUIREMENTS.md` — requirement IDs ENG-01..07, INP-01..05, FLOW-01, PROF-01/02 define this phase's scope with precise acceptance wording (bust conditions, bogey list, correction window).
- `.planning/ROADMAP.md` — Phase 1 goal and the five success criteria.
- `.planning/PROJECT.md` — constraints (touch-first, German UI, dark mode, GitHub Pages static) and out-of-scope list.

### Stack guidance
- `CLAUDE.md` (repo root) — locked technology stack (SvelteKit 2 + Svelte 5 runes, TypeScript ~5.9, Dexie 4, Vitest/Playwright) and domain-specific guidance: SVG dartboard with polar-math hit detection, Pointer Events, pure-reducer engine.

No other external specs or ADRs exist — greenfield repo.

</canonical_refs>

<code_context>
## Existing Code Insights

Greenfield repository — no code exists yet (only `.planning/` and `CLAUDE.md`). Phase 1 scaffolds the project.

### Established Patterns (from project decisions, to establish in this phase)
- Engine: pure reducer `reduce(state, action) -> state` over an event log, exhaustively unit-tested before UI work (STATE.md decision).
- Dartboard: SVG segments for display, polar-coordinate math (`getScreenCTM().inverse()` + radius/angle) for scoring hit detection (CLAUDE.md guidance).
- Per-dart event log doubles as the undo mechanism (D-06) and later feeds Phase 3 persistence and Phase 4 stats.

### Integration Points
- Dexie DB created in this phase (profiles table) is the same DB Phase 3 extends with match/history tables — design the schema versioning accordingly.
- The reducer/event-log state shape is what Phase 2's spectator view will consume via BroadcastChannel — keep it serializable.

</code_context>

<specifics>
## Specific Ideas

- Visit strip showing the three darts of the current visit (e.g. "T20 · 20 · –") as the primary entry feedback.
- Checkout line format like "170: T20 T20 Bull" next to the remaining score.
- Reference apps for feel: DartCounter-style portrait scoring layout was discussed; user wants both orientations supported.
- German UI throughout (e.g. miss = "Daneben" wording came up; final wording at Claude's discretion).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Playable X01 Match*
*Context gathered: 2026-06-10*
