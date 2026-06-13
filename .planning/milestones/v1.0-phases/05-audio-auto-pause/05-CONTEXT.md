# Phase 5: Audio & Auto-Pause - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning
**Mode:** Discuss (autonomous — user-confirmed design decisions)

<domain>
## Phase Boundary

The caller announces visit scores (and a checkout hint when a finish is on) via speech
synthesis; sound effects celebrate 180s, high finishes, and new personal records,
reinforcing the Phase 4 achievement overlay. Audio is off by default and independently
configurable (caller vs SFX). The match automatically pauses with a countdown — shown on
both the input and spectator views — after a configurable number of legs, and resumes on
timer expiry or a button press.

Requirements: AUD-01, AUD-02, AUD-03, FLOW-02.

</domain>

<decisions>
## Implementation Decisions

### Caller (speech)
- **D-01 — Tech:** Caller uses the Web Speech API (`speechSynthesis`). No external TTS
  service (static offline PWA). German is the default voice; English is selectable
  (success criterion 1).
- **D-02 — Fallback (locked from prior STATE note):** Web Speech German voice quality
  depends on the OS TTS voice and may be absent. Design a **silent/text-only fallback from
  the start** — if `speechSynthesis` is unavailable or no voice exists for the selected
  language, degrade gracefully (no error, optionally a text caption); never block scoring.
- **D-03 — Caller content:** After each visit the caller announces the **visit score AND,
  when a checkout is possible, a checkout hint** (e.g. "Du brauchst …") derived from the
  existing Phase 1 checkout suggestion (`getSuggestion`). Not the remaining score.

### Sound effects
- **D-04 — Source:** SFX are **bundled audio files** (small mp3/ogg in the build) for:
  180, high finish, and new personal record. Keep total asset size small — it counts
  toward the Phase 6 offline precache budget.
- **D-05 — Sync with overlay:** SFX play in sync with the Phase 4 celebration overlay
  (the `neverman-record` event / 180 overlay), reinforcing the visual achievement.

### Configuration & defaults
- **D-06 — Audio default state:** Caller and SFX are **OFF by default** on a new match;
  the player enables them deliberately (also sidesteps browser autoplay blocking).
- **D-07 — Independent toggles:** Caller and SFX are configured **independently** (mute or
  enable each separately) — success criterion 3. Settings persist as lightweight user
  prefs (localStorage per CLAUDE.md "tiny prefs" guidance, not Dexie).

### Auto-pause
- **D-08 — Default ON:** Auto-pause is **enabled by default**, triggering after every
  **5 legs**, with an **8-minute countdown**. Both the leg interval and the countdown
  duration are configurable in match setup, and auto-pause can be turned off.
- **D-09 — Both views + resume:** The pause screen with the live countdown appears on
  **both** the input (`/match`) and spectator (`/display`) views (synced via the existing
  BroadcastChannel). The match **auto-continues when the countdown expires OR when the
  player presses a continue button** (success criterion 4).

### Claude's Discretion
- Exact audio asset selection/encoding, volume defaults, and the specific German phrasing
  of the checkout hint.
- Whether the caller/SFX toggles live in match setup, an in-match settings affordance, or
  both — follow established Phase 1–4 UI patterns.
- Countdown visual treatment (reuse spectator typography/large-readable style from Phase 2).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Checkout hint (caller)
- `src/engine/checkout.ts` (`getSuggestion`) — Phase 1 checkout suggestion reused for D-03.

### Celebration sync (SFX)
- `src/stores/match.svelte.ts` — `#detectRecords` / `pendingRecords` and the
  `neverman-record` `BroadcastChannel` (Phase 4) — SFX trigger points (D-05).
- `src/lib/sync-constants.ts` — channel names.

### Cross-view sync (pause screen)
- `src/stores/display.svelte.ts` + the `neverman-match` BroadcastChannel (Phase 2) — the
  pause/countdown state must reach `/display` (D-09).
- `src/routes/match/+page.svelte`, `src/routes/display/+page.svelte` — where the pause
  overlay mounts on both views.

### Engine / match flow
- `src/engine/reducer.ts`, `src/engine/types.ts` — leg completion is where the leg counter
  for auto-pause is observed; add pause state without breaking the X01 state machine.

### Prefs persistence
- localStorage usage already present in `match.svelte.ts` (snapshot) — model audio/pause
  prefs the same lightweight way.

</canonical_refs>

<code_context>
## Existing Code Insights

- Static offline PWA (SvelteKit + Svelte 5 runes + Dexie). No backend, German UI.
- Phase 4 added a separate `BroadcastChannel('neverman-record')`; Phase 2 uses
  `neverman-match` for spectator state. The pause screen should ride the existing
  match-state channel (it is match state), not a new channel, unless research shows
  otherwise.
- Phase 1 checkout suggestions already compute what to throw — the caller's checkout hint
  should reuse that, not recompute.
- CLAUDE.md: smallest runtime; prefer no new deps. Web Speech API and Web Audio API are
  platform-native (no library). Bundled SFX assets are static files served by Pages.

</code_context>

<specifics>
## Specific Ideas

- Caller language toggle: German (default) / English; both gated behind the master
  "caller on" toggle (which is OFF by default per D-06).
- SFX events: 180, high finish (define threshold during planning — e.g. checkout ≥ 100 or
  a "big finish" band), new personal record (any record type from Phase 4 D-03).
- Auto-pause counts completed legs across the whole match; the countdown is visible and
  large on `/display` (3 m readability, Phase 2 constraint).
- Resume: a clearly tappable "Weiter" button plus automatic resume at 0:00.

</specifics>

<deferred>
## Deferred Ideas

- Continuous crowd/ambience background audio — not requested.
- Per-voice selection UI beyond a DE/EN toggle (e.g. choosing among installed OS voices) —
  only if the basic toggle proves insufficient.
- Configurable per-event SFX choices / custom sound upload — out of scope for v1.0.

</deferred>

---

*Phase: 05-audio-auto-pause*
*Context gathered: 2026-06-12 via autonomous discuss (user-confirmed decisions)*
