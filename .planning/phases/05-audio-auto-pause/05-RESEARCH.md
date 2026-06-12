# Phase 5: Audio & Auto-Pause — Research

**Researched:** 2026-06-12
**Domain:** Web Speech API (SpeechSynthesis), Web Audio / HTMLAudioElement, auto-pause state machine, BroadcastChannel sync
**Confidence:** MEDIUM (Web APIs well-understood; Android voice quality and Chrome SpeechSynthesis quirks confirmed via MDN + community sources)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 — Tech:** Caller uses the Web Speech API (`speechSynthesis`). No external TTS service (static offline PWA). German is the default voice; English is selectable.
- **D-02 — Fallback:** Web Speech German voice quality depends on OS TTS voice and may be absent. Design a **silent/text-only fallback from the start** — if `speechSynthesis` is unavailable or no voice exists for the selected language, degrade gracefully (no error, optionally a text caption); never block scoring.
- **D-03 — Caller content:** After each visit the caller announces the **visit score AND, when a checkout is possible, a checkout hint** derived from the existing `getSuggestion` function.
- **D-04 — Source:** SFX are **bundled audio files** (small mp3 in `static/sfx/`) for 180, high finish, and new personal record.
- **D-05 — Sync with overlay:** SFX play in sync with the Phase 4 celebration overlay (`neverman-record` event / 180 overlay).
- **D-06 — Audio default state:** Caller and SFX are **OFF by default** on a new match.
- **D-07 — Independent toggles:** Caller and SFX are configured **independently**. Settings persist in localStorage.
- **D-08 — Default ON:** Auto-pause is **enabled by default**, triggering after every **5 legs**, with an **8-minute countdown**. Both the leg interval and the countdown duration are configurable in match setup, and auto-pause can be turned off.
- **D-09 — Both views + resume:** The pause screen with the live countdown appears on **both** the input (`/match`) and spectator (`/display`) views (synced via the existing BroadcastChannel). The match **auto-continues when the countdown expires OR when the player presses a continue button**.

### Claude's Discretion

- Exact audio asset selection/encoding, volume defaults, and the specific German phrasing of the checkout hint.
- Whether the caller/SFX toggles live in match setup, an in-match settings affordance, or both — follow established Phase 1–4 UI patterns.
- Countdown visual treatment (reuse spectator typography/large-readable style from Phase 2).

### Deferred Ideas (OUT OF SCOPE)

- Continuous crowd/ambience background audio.
- Per-voice selection UI beyond a DE/EN toggle.
- Configurable per-event SFX choices / custom sound upload.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUD-01 | Caller voice announces visit scores via speech synthesis, with selectable language German or English | Web Speech API SpeechSynthesisUtterance; voice selection via `getVoices()` filtered by `lang`; `onvoiceschanged` async loading pattern |
| AUD-02 | Sound effects play on 180s, high finishes, and new records, reinforcing the celebration overlay | `new Audio(src).play()` fire-and-forget pattern; trigger hooks in `matchStore.dispatch` post-detect path and `pendingRecords` watcher |
| AUD-03 | Player can mute or configure caller and sound effects independently | localStorage prefs (`nvm_caller_enabled`, `nvm_sfx_enabled`, `nvm_caller_lang`); AudioSettings section in MatchSetup |
| FLOW-02 | After a configurable number of legs, a pause screen with countdown timer appears on both views; match continues after timer or button press | Leg-count tracking in MatchStore; pause state broadcast via `neverman-match` BroadcastChannel; countdown `setInterval` in MatchStore with `$effect` cleanup; PauseOverlay on both routes |
</phase_requirements>

---

## Summary

Phase 5 adds two orthogonal audio features and a match-flow feature to an already-complete X01 match engine. The Web Speech API (`speechSynthesis`) handles the caller voice: it is platform-native (no library), fires utterances as fire-and-forget side effects after `CONFIRM_VISIT`, and must be gated behind a prior user gesture on Chrome (satisfied because the first utterance always fires after the player taps a dart or the correction-window confirm button). The German voice quality is OS-dependent; the fallback is silent degradation.

SFX (180, high finish, record) use `new Audio(src).play()` — the simplest possible pattern, no `AudioContext` overhead, and fully offline-capable once assets are cached by the service worker in Phase 6. Both audio features share a single `AudioPrefs` localStorage object and are completely independent from the match state machine.

Auto-pause is the most structurally complex piece: it adds a countdown timer to `MatchStore` and two new fields to the broadcast snapshot (or a separate small signal on `neverman-match`). The spectator display receives the pause state via the existing `BC_CHANNEL` and mounts `PauseOverlay` reactively. The timer lives in the scoring window only — the display is a pure subscriber. The planner should model this as: (a) `MatchStore` gains `pauseActive` + `pauseRemainingSeconds` reactive state, (b) leg-win detection inside `dispatch` increments a leg counter and triggers the pause, (c) the countdown runs as a `setInterval` inside a `$effect` on `/match`, and (d) every state change is published via the existing `BC_CHANNEL` so `/display` follows along.

**Primary recommendation:** No new dependencies. Web Speech API + `new Audio()` + `setInterval` with `$effect` cleanup cover all requirements. Add pause fields to the MatchStore snapshot; reuse the `neverman-match` channel.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Caller voice synthesis | Browser / Client (scoring window) | — | `speechSynthesis` is per-browsing-context; only the scoring window calls it to avoid double speech on the display window |
| SFX playback | Browser / Client (scoring window) | — | Same reason — fire from the scoring window only; the display is a visual-only subscriber |
| Audio prefs read/write | Browser / Client (both windows) | — | localStorage is same-origin shared; both windows read prefs but only scoring window mutates them |
| Auto-pause countdown | Browser / Client (scoring window — MatchStore) | — | Single source of truth; countdown `setInterval` lives in the scoring window |
| Pause state distribution | BroadcastChannel (`neverman-match`) | — | Pause is match state; encode `pauseActive` + `pauseRemainingSeconds` in the snapshot published after every dispatch/tick |
| Pause UI (input view) | Browser / Client (`/match` route) | — | Mounts `PauseOverlay`; owns the "Weiter" button that resumes |
| Pause UI (spectator) | Browser / Client (`/display` route) | — | Receives via `displayStore.state`; mounts `PauseOverlay` in read-only mode |
| Settings UI | Frontend (`MatchSetup.svelte`) | — | New `AudioSettings` section added inline; follows existing toggle/stepper patterns |

---

## Standard Stack

### Core

No new npm packages are required by this phase. All capabilities are covered by browser-native APIs.

| API / Asset | Spec / Source | Purpose | Why Standard |
|-------------|--------------|---------|--------------|
| `window.speechSynthesis` | Web Speech API (W3C) | Caller voice | Platform-native; no library needed; supported in all target browsers |
| `new Audio(src)` | `HTMLAudioElement` (HTML spec) | SFX playback | Simplest fire-and-forget approach; no `AudioContext` lifecycle to manage |
| `setInterval` / `clearInterval` | Browser built-in | Countdown timer | Idiomatic for 1-second tick; wrapped in `$effect` for Svelte 5 lifecycle safety |
| `localStorage` | Web Storage API | Audio/pause prefs | Existing pattern in `match.svelte.ts`; CLAUDE.md guidance for tiny prefs |
| `BroadcastChannel('neverman-match')` | Already exists in `sync-constants.ts` | Pause state sync to spectator | Existing channel; pause state is match state |

### Package Legitimacy Audit

> No new npm packages are introduced by Phase 5. Web Speech API, HTMLAudioElement, setInterval, localStorage, and BroadcastChannel are all browser built-ins. SFX files are static assets bundled in `static/sfx/`.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| (none) | — | — | — | — | — | No packages required |

**Packages removed due to SLOP verdict:** none
**Packages flagged as suspicious (SUS):** none

---

## Architecture Patterns

### System Architecture Diagram

```
SCORING WINDOW (/match)
├── User tap → matchStore.dispatch(DART_THROWN | NUMPAD_VISIT)
│   ├── → reducer produces new MatchState
│   ├── → BC_CHANNEL.postMessage(state snapshot)       [existing]
│   ├── → localStorage.setItem(LS_SNAPSHOT, snapshot)  [existing]
│   ├── → #detectRecords → pendingRecords[]             [Phase 4]
│   │       └── BC_RECORD_CHANNEL.postMessage(records) [Phase 4]
│   └── → [NEW] #checkAutoPause(prev, next)
│           ├── if leg count crossed threshold → pauseActive=true, start countdown
│           └── BC_CHANNEL.postMessage(state incl. pause fields)
│
├── [NEW] audioService.announceVisit(score, suggestion)  ← fires after dispatch
│   └── speechSynthesis.speak(utterance)  [fire-and-forget, after user gesture]
│
├── [NEW] sfxService.playIfEnabled(event)  ← fires alongside pendingRecords watcher
│   └── new Audio('/sfx/180.mp3').play()  [fire-and-forget]
│
└── [NEW] countdown setInterval ($effect, /match route)
        ├── decrements pauseRemainingSeconds every 1s
        ├── at 0 → dispatch RESUME_PAUSE
        └── publishes snapshot each tick via BC_CHANNEL

SPECTATOR WINDOW (/display)
└── displayStore.state ← BC_CHANNEL message
    └── if state.pauseActive → mount PauseOverlay (countdown display only, no Weiter button)
```

### Recommended Project Structure (additions only)

```
src/
├── lib/
│   ├── audio-caller.ts      # speechSynthesis wrapper (voice selection, announce, cancel, fallback)
│   ├── audio-sfx.ts         # SFX fire-and-forget helper (new Audio, ignore rejection)
│   └── audio-prefs.ts       # localStorage read/write for nvm_caller_*/nvm_sfx_*/nvm_pause_*
├── ui/
│   ├── overlays/
│   │   └── PauseOverlay.svelte   # Full-screen countdown, both views
│   └── setup/
│       └── MatchSetup.svelte     # Add AudioSettings section (no new file — inline section)
static/
└── sfx/
    ├── 180.mp3
    ├── highfinish.mp3
    └── record.mp3
```

### Pattern 1: Web Speech API — Voice Selection and Announcement

The core caller pattern: load voices asynchronously, filter by language, fall back silently.

```typescript
// src/lib/audio-caller.ts
// Source: MDN SpeechSynthesis (developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
//         MDN SpeechSynthesisUtterance (developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance)

let cachedVoices: SpeechSynthesisVoice[] = [];

/** Call once on app init (or at match start) to warm the voice list. */
export function initVoices(): void {
  if (typeof speechSynthesis === 'undefined') return;
  cachedVoices = speechSynthesis.getVoices();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => {
      cachedVoices = speechSynthesis.getVoices();
    };
  }
}

/**
 * Select the best available voice for the given BCP-47 language prefix.
 * Android returns lang strings with underscores (e.g. "de_DE") — normalize.
 * Prefer localService voices (offline-capable for PWA).
 * Returns null when no matching voice exists.
 */
function findVoice(langPrefix: string): SpeechSynthesisVoice | null {
  const normalized = cachedVoices.map(v => ({
    v,
    lang: v.lang.replace(/_/g, '-')
  }));
  // Prefer exact match, then prefix match, prefer localService
  const exact = normalized.filter(({ lang }) => lang.toLowerCase().startsWith(langPrefix.toLowerCase()));
  if (exact.length === 0) return null;
  return (exact.find(({ v }) => v.localService) ?? exact[0]).v;
}

/**
 * Announce a visit. Fire-and-forget — never throws.
 * Must be called from a user-gesture context (tap/click handler chain).
 *
 * D-03: announces score + checkout hint if suggestion is non-null.
 * D-02: if speechSynthesis unavailable or no matching voice, return silently.
 */
export function announceVisit(
  score: number,
  suggestion: string[] | null,
  lang: 'de' | 'en',
  callerEnabled: boolean
): void {
  if (!callerEnabled) return;
  if (typeof speechSynthesis === 'undefined') return;

  const langTag = lang === 'de' ? 'de-DE' : 'en-GB';
  const voice = findVoice(lang === 'de' ? 'de' : 'en');
  if (!voice) return; // D-02: silent fallback

  let text: string;
  if (lang === 'de') {
    text = suggestion
      ? `${score} — du brauchst ${suggestion.join(', ')}`
      : `${score}`;
  } else {
    text = suggestion
      ? `${score} — you need ${suggestion.join(', ')}`
      : `${score}`;
  }

  try {
    speechSynthesis.cancel(); // Clear any queued utterance from rapid scoring
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langTag;
    utterance.voice = voice;
    utterance.rate = 1.1; // Slightly faster for caller feel
    utterance.onerror = () => {}; // Silence "interrupted" errors from cancel()
    speechSynthesis.speak(utterance);
  } catch {
    // Silently degrade — never block scoring
  }
}
```

**Key insight:** Passing numbers directly to `SpeechSynthesisUtterance.text` works well — the browser TTS engine reads "140" as "one hundred and forty" or "hundert vierzig" depending on the voice's locale. No number-to-words library is needed. [ASSUMED — not a hard specification, but standard TTS engine behavior confirmed via MDN and community sources; verify in-browser before finalizing]

### Pattern 2: SFX Fire-and-Forget

```typescript
// src/lib/audio-sfx.ts
// Source: MDN HTMLAudioElement (developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement)

const SFX_PATHS = {
  '180': '/sfx/180.mp3',
  'highfinish': '/sfx/highfinish.mp3',
  'record': '/sfx/record.mp3',
} as const;

export type SfxEvent = keyof typeof SFX_PATHS;

/**
 * Play an SFX file. Fire-and-forget — ignores autoplay-policy rejections.
 * new Audio() per play is cheap and handles overlapping calls naturally.
 * Volume 0.8 per UI-SPEC.
 */
export function playSfx(event: SfxEvent, sfxEnabled: boolean): void {
  if (!sfxEnabled) return;
  try {
    const audio = new Audio(SFX_PATHS[event]);
    audio.volume = 0.8;
    audio.play().catch(() => {}); // Ignore NotAllowedError (autoplay policy)
  } catch {
    // Audio constructor may throw in SSR — ignore
  }
}
```

**Why `new Audio()` over `AudioContext`:** For 3 short one-shot SFX files, the HTMLAudioElement approach is correct. `AudioContext` adds ~20 ms startup latency per context and requires explicit user-gesture unlock. The `new Audio().play()` pattern ignores autoplay failures at the call site (`.catch(() => {})`), which is the documented pattern for fire-and-forget SFX in PWAs. [CITED: developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices]

### Pattern 3: Auto-Pause State in MatchStore

The pause feature requires two new fields in the match-related state. These are NOT added to `MatchState` (engine type) because: (1) the pure reducer should stay engine-only, (2) the pause countdown is UI state that doesn't need to survive a reload as part of the game log, and (3) adding them to `MatchStore` (the Svelte class) keeps them reactive without touching the serialized event log.

```typescript
// Addition to MatchStore class in src/stores/match.svelte.ts

/** Total legs completed across all players in the current match. */
pauseLegCount = $state(0);
/** True when the auto-pause countdown is running. */
pauseActive = $state(false);
/** Remaining seconds on the countdown (8 * 60 = 480 at start). */
pauseRemainingSeconds = $state(0);

// In dispatch(), after the existing BroadcastChannel publish:
// Check if a leg was just completed and the threshold is crossed.
// pauseConfig comes from AudioPrefs (localStorage).
```

**Broadcast pattern for pause:** The existing `BC_CHANNEL.postMessage($state.snapshot(this.state))` publishes `MatchState`. To communicate pause state to the spectator, either:
- **(A, recommended)** Extend the broadcast message to include pause fields: `{ matchState: snapshot, pauseActive, pauseRemainingSeconds }`.
- **(B)** Keep the broadcast as raw `MatchState` and add a second micro-message on `BC_CHANNEL` for pause events.

Option A is preferred: the spectator display already has a `isValidMatchState` guard, but it can be extended to accept an envelope. This keeps the channel count stable (CONTEXT.md D-09 says "ride the existing match-state channel"). However, the `DisplayStore` type currently casts `e.data` directly as `MatchState` — the plan must update `DisplayStore` to accept an envelope type. [See Pitfall 3 below]

### Pattern 4: Countdown Timer in `/match` Route

```typescript
// src/routes/match/+page.svelte (additions)
// Source: Svelte 5 $effect docs (svelte.dev/docs/svelte/$effect)

$effect(() => {
  if (!matchStore.pauseActive) return;

  const id = setInterval(() => {
    matchStore.decrementPause(); // decrements pauseRemainingSeconds; at 0 calls resumePause()
  }, 1000);

  return () => clearInterval(id); // cleanup on unmount or when pauseActive becomes false
});
```

The spectator display does NOT run its own timer — it reads `pauseRemainingSeconds` from the broadcast state snapshot (updated each tick by the scoring window).

### Anti-Patterns to Avoid

- **Calling `speechSynthesis.speak()` without a prior user gesture.** The first call must come from a user-gesture handler chain (tap/click). Since audio is off by default (D-06), the first `speak()` is always triggered by the player enabling the caller AND then tapping a dart segment — both are user gestures. Never call `speak()` from `onMount` or a `setTimeout` not initiated by a tap. [CITED: groups.google.com/a/chromium.org/g/blink-dev/c/XpkevOngqUs]
- **Running a countdown timer on the display window.** The display is a subscriber; two independent timers would drift. Only the scoring window maintains the authoritative countdown.
- **Adding `pauseActive` to `MatchState` / the reducer event log.** The reducer is a pure engine for X01 scoring. Pause is a UI/session-level concept. It belongs in `MatchStore` as class-level `$state`, not in the serialized event log.
- **Using a separate BroadcastChannel for pause state.** CONTEXT.md D-09 explicitly says "ride the existing match-state channel". Keep the channel count stable.
- **Not calling `speechSynthesis.cancel()` before a new utterance.** If a player scores quickly, utterances queue up. Cancel the queue before each new announcement so the latest score is always spoken promptly.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Voice synthesis | Custom TTS engine | `window.speechSynthesis` | Platform-native, offline-capable, multilingual |
| Audio file playback | Custom audio pipeline | `new Audio(src).play()` | HTMLAudioElement handles format negotiation, caching, and playback |
| Number-to-words conversion | Custom German/English number formatter | Let the TTS engine read numerals directly | Browsers read "180" as "einhundertachtzig" / "one hundred and eighty" based on `utterance.lang` [ASSUMED — verify in browser; see Assumptions Log] |
| Voice loading retry loop | Hand-rolled polling | `speechSynthesis.onvoiceschanged` + synchronous `getVoices()` | Standard async pattern; polling has timing bugs |
| Countdown timer (complex) | Custom rAF-based timer | `setInterval(fn, 1000)` in `$effect` | Sufficient precision for minute-resolution countdown display; rAF is overkill |

**Key insight:** Every audio/synthesis primitive needed by Phase 5 is already in the browser. Adding zero new dependencies keeps the PWA bundle minimal (Phase 6 offline precache budget) and eliminates version-pinning concerns.

---

## Common Pitfalls

### Pitfall 1: `getVoices()` returns empty array on first call (Chrome/Android)

**What goes wrong:** `speechSynthesis.getVoices()` called in `onMount` or at module level returns `[]` on Chrome (async voice loading). No voice is found, caller never speaks even when enabled.

**Why it happens:** Chrome loads the OS voice list asynchronously after page load.

**How to avoid:** Always register `speechSynthesis.onvoiceschanged` and re-run voice selection when it fires. Call `getVoices()` at module init AND again inside `onvoiceschanged`. Cache the result.

**Warning signs:** Voice is always null; `getVoices()` returns `[]` at the top of component lifecycle.

[CITED: developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices]

---

### Pitfall 2: Android returns `voice.lang` with underscores instead of hyphens

**What goes wrong:** Filtering voices with `voice.lang.startsWith('de-')` matches nothing on Android because Android reports `"de_DE"` (underscore) instead of the BCP-47 `"de-DE"` (hyphen).

**Why it happens:** Android's TTS subsystem uses locale strings with underscores; Chrome exposes them verbatim.

**How to avoid:** Normalize before comparison: `voice.lang.replace(/_/g, '-')`.

**Warning signs:** No voices found on Android even though German TTS is installed.

[CITED: talkrapp.com/speechSynthesis.html (community-documented bug)]

---

### Pitfall 3: DisplayStore type mismatch when pause fields are added to the broadcast message

**What goes wrong:** `DisplayStore.connect()` currently does `const parsed = JSON.parse(raw) as unknown` and passes it through `isValidMatchState()` which only checks for `MatchState` shape. If the broadcast message is changed to `{ matchState, pauseActive, pauseRemainingSeconds }`, the validator rejects the envelope and the display stays null.

**Why it happens:** The broadcast message shape and the validator are tightly coupled to the raw `MatchState` type.

**How to avoid:** Define a `BroadcastEnvelope` type:
```typescript
interface BroadcastEnvelope {
  matchState: MatchState;
  pauseActive: boolean;
  pauseRemainingSeconds: number;
}
```
Update `isValidMatchState` to also accept an envelope and unwrap it. Or — simpler — publish two things: the raw `MatchState` as before (spectator non-pause rendering unchanged) plus a small separate pause-state message that `DisplayStore` handles with a second listener on the same channel keyed by a `type` discriminant.

**Warning signs:** `/display` shows the idle screen after Phase 5 ships; `isValidMatchState` returning false for envelopes.

**Recommended approach (from CONTEXT.md D-09):** Add a `type` discriminant to the broadcast payload. Match-state snapshots get `{ type: 'match-state', ...snapshot }`, pause ticks get `{ type: 'pause-tick', pauseActive, pauseRemainingSeconds }`. The existing `isValidMatchState` guard ignores non-`match-state` messages. DisplayStore handles both message types.

---

### Pitfall 4: SpeechSynthesis called without a prior user gesture (Chrome 71+)

**What goes wrong:** Caller announces the first score of a match but speech is silent; Chrome console shows "not-allowed" or deprecation warning.

**Why it happens:** Chrome 71+ requires at least one prior user gesture in the same frame before `speechSynthesis.speak()` is allowed.

**How to avoid:** Audio is OFF by default (D-06); the player must explicitly toggle it on before any speech is attempted. That toggle tap is a user gesture. The first `speak()` call will always be downstream of a user gesture chain (toggle → first dart tap → announcement). Do not attempt to pre-warm the voice or play a silent utterance at match start.

**Warning signs:** First score of a match is never called; subsequent scores work fine.

[CITED: groups.google.com/a/chromium.org/g/blink-dev/c/XpkevOngqUs — Intent to Deprecate speechSynthesis.speak without user activation]

---

### Pitfall 5: Double speech when both scoring and spectator windows are open on PC

**What goes wrong:** The caller fires in both windows simultaneously, producing an echo.

**Why it happens:** Both windows share `window.speechSynthesis` indirectly (same origin, separate browsing contexts) but have independent speech queues. If both windows set up their own caller listeners, both speak.

**How to avoid:** Only call `speechSynthesis.speak()` from the scoring window (`/match`). The spectator window (`/display`) is a read-only subscriber; it must NEVER call `speak()`. Enforce this by keeping all caller logic in `src/lib/audio-caller.ts` imported only by the `/match` route (not by `/display`).

**Warning signs:** Two slightly offset voices heard simultaneously when second window is open.

---

### Pitfall 6: SFX plays on the spectator window as well as the scoring window

**What goes wrong:** Same as Pitfall 5 but for SFX — `display/+page.svelte` subscribes to `BC_RECORD_CHANNEL` and a naive implementation triggers `playSfx()` there too, causing double audio.

**How to avoid:** The existing `display/+page.svelte` subscribes to `BC_RECORD_CHANNEL` to show the `RecordOverlay`. Do NOT add SFX calls to the display route. Keep `playSfx()` calls in the `/match` route's record watcher only. The display route already has the record channel subscription code — be careful not to add audio side effects there.

**Warning signs:** SFX heard twice, slightly offset.

---

### Pitfall 7: Auto-pause countdown timer not cleaned up on route navigation

**What goes wrong:** Player navigates away from `/match` mid-pause; `setInterval` continues running, consuming CPU and leaking memory.

**Why it happens:** `setInterval` set up imperatively without cleanup.

**How to avoid:** Always set the interval inside `$effect(() => { ...; return () => clearInterval(id); })`. The cleanup return runs on component unmount automatically in Svelte 5.

**Warning signs:** Console logs from the countdown tick appearing after navigating to `/setup`.

[CITED: svelte.dev/docs/svelte/$effect — "The function returned from $effect is called... when the component is destroyed."]

---

## Code Examples

### Visit Score Announcement — Integration Point

The caller fires after a visit is confirmed. The existing `CorrectionWindow.svelte` dispatches `CONFIRM_VISIT` via `matchStore.dispatch({ type: 'CONFIRM_VISIT' })` after the 2.5s timer. The `/match` page watches `player.visits.length` changes to set `pendingCorrection`. The announcement should fire at the same moment as `pendingCorrection` is set (i.e., when a new visit is detected in the `$effect` that watches visit counts):

```typescript
// In src/routes/match/+page.svelte — existing $effect that watches for new visits
$effect(() => {
  const state = matchStore.state;
  if (state.phase !== 'playing') return;

  for (const player of state.players) {
    const prevCount = lastVisitCounts[player.id] ?? 0;
    if (player.visits.length > prevCount && pendingCorrection === null) {
      const lastVisit = player.visits[player.visits.length - 1];
      const visitScore = /* ... existing calculation ... */;

      // NEW: announce the visit score
      if (!lastVisit.bust) {
        announceVisit(
          visitScore,
          matchStore.suggestion,   // suggestion at the START of the next player's turn
          audioPrefs.callerLang,
          audioPrefs.callerEnabled
        );
      }
      // ... rest of existing logic
    }
  }
});
```

Note: `matchStore.suggestion` after a visit will be the suggestion for the NEXT player (or the same player after their remaining changes). For the caller's checkout hint, compute the remaining BEFORE the visit or pass it explicitly. See Assumptions Log A3.

### SFX Trigger — Integration Point

SFX fires alongside the record detection. The existing `match.svelte.ts` sets `pendingRecords` after each dispatch. The `/match` route can watch `matchStore.pendingRecords` in a `$derived` and fire SFX:

```typescript
// In src/routes/match/+page.svelte
$effect(() => {
  const records = matchStore.pendingRecords;
  if (records.length === 0) return;

  // Fire SFX based on record types
  const has180 = records.some(r => r.type === '180');
  const hasRecord = records.some(r => r.type !== '180');

  if (has180) playSfx('180', audioPrefs.sfxEnabled);
  else if (hasRecord) playSfx('record', audioPrefs.sfxEnabled);
  // highfinish: triggered at leg close, checkout >= 100 (see note below)
});
```

High-finish SFX (checkout ≥ 100) is a separate trigger: detect at leg close in the `pendingRecords` watcher when `r.type === 'highest-checkout'` and `(r.value ?? 0) >= 100`, or watch the `legCompleted` length increase. The UI-SPEC defines "checkout ≥ 100" as the threshold. [ASSUMED: exact threshold is 100 per UI-SPEC — matches CONTEXT.md "high finish" band]

---

## Settings Persistence

Audio and pause preferences use `localStorage` (not Dexie), matching CLAUDE.md "tiny prefs" guidance. All keys use the `nvm_` prefix to match existing conventions.

| Key | Type | Default | Notes |
|-----|------|---------|-------|
| `nvm_caller_enabled` | boolean | `false` | Caller voice on/off |
| `nvm_caller_lang` | `"de"` \| `"en"` | `"de"` | Caller language |
| `nvm_sfx_enabled` | boolean | `false` | Sound effects on/off |
| `nvm_pause_enabled` | boolean | `true` | Auto-pause on/off |
| `nvm_pause_legs` | number | `5` | Legs between pauses |
| `nvm_pause_minutes` | number | `8` | Countdown duration in minutes |

These keys do NOT exist yet in the codebase. They must be defined in a new `src/lib/audio-prefs.ts` helper (or inline in `MatchSetup.svelte`). The helper follows the try/catch pattern already used in `src/lib/storage.ts`.

```typescript
// src/lib/audio-prefs.ts
export interface AudioPrefs {
  callerEnabled: boolean;
  callerLang: 'de' | 'en';
  sfxEnabled: boolean;
  pauseEnabled: boolean;
  pauseLegs: number;
  pauseMinutes: number;
}

const DEFAULTS: AudioPrefs = {
  callerEnabled: false,
  callerLang: 'de',
  sfxEnabled: false,
  pauseEnabled: true,
  pauseLegs: 5,
  pauseMinutes: 8,
};

export function loadAudioPrefs(): AudioPrefs {
  try {
    return {
      callerEnabled: localStorage.getItem('nvm_caller_enabled') === 'true',
      callerLang: (localStorage.getItem('nvm_caller_lang') as 'de' | 'en') ?? 'de',
      sfxEnabled: localStorage.getItem('nvm_sfx_enabled') === 'true',
      pauseEnabled: localStorage.getItem('nvm_pause_enabled') !== 'false', // default true
      pauseLegs: Number(localStorage.getItem('nvm_pause_legs')) || 5,
      pauseMinutes: Number(localStorage.getItem('nvm_pause_minutes')) || 8,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveAudioPref<K extends keyof AudioPrefs>(key: K, value: AudioPrefs[K]): void {
  const lsKey = `nvm_${key.replace(/([A-Z])/g, '_$1').toLowerCase()}`;
  try {
    localStorage.setItem(lsKey, String(value));
  } catch { /* ignore */ }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `speechSynthesis.speak()` unrestricted | Requires user gesture (Chrome 71+, Dec 2018) | Chrome 71 | Must gate first call behind user interaction |
| `onvoiceschanged` as string property | `addEventListener('voiceschanged', ...)` also works; `onvoiceschanged` still supported | W3C spec 2020 | Use `onvoiceschanged` property OR `addEventListener`; both fine |
| Web Audio API for all sounds | `HTMLAudioElement` accepted for simple one-shot SFX | Ongoing | `new Audio().play()` is simpler and sufficient for non-overlapping short SFX |

**Deprecated/outdated:**
- `SpeechSynthesis.speak()` on page load (no gesture): blocked since Chrome 71 — any sample code showing this pattern must not be copied.
- Passing `voice: null` explicitly to SpeechSynthesisUtterance: use `utterance.lang` instead; let the browser pick the voice for the locale when a named voice is unavailable.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Browser TTS reads numeric strings (e.g. "180") in the correct spoken form based on `utterance.lang` without manual number-to-words conversion | Code Examples, Don't Hand-Roll | If wrong: numbers read as digits ("one-eight-zero" instead of "one hundred and eighty"); fix by adding a small lookup table for 0–180 or the `written-number` npm package |
| A2 | `new Audio('/sfx/180.mp3').play()` works offline after Phase 6 service worker precaches `/sfx/*.mp3` | Standard Stack, SFX | If SW doesn't precache `static/sfx/`; fix: add `static/sfx/**` to vite-plugin-pwa `globPatterns` in Phase 6 |
| A3 | After `matchStore.dispatch(DART_THROWN)`, `matchStore.suggestion` reflects the ACTIVE player's remaining BEFORE the visit, making it useful as the checkout hint | Code Examples | If wrong: suggestion reflects next player's state; fix: capture `matchStore.suggestion` BEFORE dispatch, pass to announceVisit |
| A4 | The `high finish` threshold for SFX is checkout ≥ 100 (as stated in UI-SPEC) | Common Pitfalls (Pitfall description), Code Examples | If threshold should be different (e.g. ≥ 61); fix: update the condition in the SFX trigger |
| A5 | Android Chrome returns at least one German voice with `lang` starting with `"de"` when the Google TTS engine is installed (default on most Android devices) | Code Examples (findVoice) | If wrong: no German voice found; fallback per D-02 is silent. User impact: caller doesn't work without additional TTS installation |

---

## Open Questions

1. **Checkout hint phrasing — `suggestion` array format**
   - What we know: `getSuggestion()` returns `string[] | null` like `['T20', 'T20', 'D20']`.
   - What's unclear: How should this array be spoken? "T20, T20, D20" or "Triple 20, Triple 20, Double 20"? Should the checkout hint always include the full route or only when it fits in one utterance?
   - Recommendation: For DE, speak the raw array joined by ", " (`getSuggestion` format): "T20, T20, D20". Chrome TTS reads "T20" fine. If full expansion is desired later, add a small `expandDartNotation(dart: string, lang: 'de' | 'en')` utility.

2. **Pause state broadcast envelope vs. raw MatchState**
   - What we know: `DisplayStore` currently does a strict `isValidMatchState` cast on every BC_CHANNEL message.
   - What's unclear: Whether to wrap the message in an envelope `{ type, matchState, ...pause }` or keep MatchState raw and publish pause state as a separate message type on the same channel.
   - Recommendation: Use a type-discriminated envelope on `BC_CHANNEL`. The plan must update both `MatchStore.dispatch()` broadcast and `DisplayStore.connect()` message handler. See Pitfall 3.

3. **Where does the visit score for the caller come from?**
   - What we know: After `CONFIRM_VISIT`, the visit is in `player.visits[last]`. For board visits, `darts.reduce(sum)`. For numpad visits, remaining delta.
   - What's unclear: The `pendingCorrection` state in `/match` already computes `visitTotal` for display in `CorrectionWindow`. The announcement should use this same computed value, not recompute.
   - Recommendation: Re-use `pendingCorrection.total` from the existing visit-detection `$effect` to pass to `announceVisit`. Bust visits should not be announced (callers don't announce busts in real darts, or say "überworfen" — outside scope per CONTEXT.md).

---

## Environment Availability

Step 2.6 — no new external tools or services required. All APIs are browser-native; all assets are static files committed to `static/sfx/`. No probing needed.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8 (two projects: `unit` + `browser`) |
| Config file | `vite.config.ts` (vitest config embedded) |
| Quick run command | `npm run test:unit` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUD-01 | `announceVisit()` calls `speechSynthesis.speak()` with correct lang/text | unit | `npm run test:unit -- --grep "audio-caller"` | ❌ Wave 0: `src/lib/audio-caller.test.ts` |
| AUD-01 | `announceVisit()` is silent when `callerEnabled=false` | unit | same | ❌ Wave 0 |
| AUD-01 | `findVoice()` normalizes Android underscore lang strings | unit | same | ❌ Wave 0 |
| AUD-01 | `findVoice()` returns null when no matching voice; no speech attempted | unit | same | ❌ Wave 0 |
| AUD-02 | `playSfx('180', true)` creates Audio with correct path | unit | `npm run test:unit -- --grep "audio-sfx"` | ❌ Wave 0: `src/lib/audio-sfx.test.ts` |
| AUD-02 | `playSfx` is no-op when `sfxEnabled=false` | unit | same | ❌ Wave 0 |
| AUD-03 | `loadAudioPrefs()` returns defaults when localStorage is empty | unit | `npm run test:unit -- --grep "audio-prefs"` | ❌ Wave 0: `src/lib/audio-prefs.test.ts` |
| AUD-03 | `saveAudioPref` writes correct localStorage key | unit | same | ❌ Wave 0 |
| FLOW-02 | `MatchStore` tracks `pauseLegCount` correctly across leg completions | unit | `npm run test:unit -- --grep "matchStore.pause"` | ❌ Wave 0 (extend `match.svelte.test.ts`) |
| FLOW-02 | `pauseActive` becomes true when leg count crosses threshold | unit | same | ❌ Wave 0 |
| FLOW-02 | `decrementPause()` reaches 0 and sets `pauseActive=false` | unit | same | ❌ Wave 0 |
| FLOW-02 | PauseOverlay renders countdown and Weiter button | browser | `npm run test:browser -- --grep "PauseOverlay"` | ❌ Wave 0: `src/ui/overlays/PauseOverlay.test.ts` |
| FLOW-02 | PauseOverlay on /display hides Weiter button | browser | same | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test:unit`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/lib/audio-caller.test.ts` — covers AUD-01 (voice selection, speak call, fallback, normalization)
- [ ] `src/lib/audio-sfx.test.ts` — covers AUD-02 (SFX fire-and-forget, disabled guard)
- [ ] `src/lib/audio-prefs.test.ts` — covers AUD-03 (localStorage prefs defaults and save)
- [ ] Extend `src/stores/match.svelte.test.ts` — covers FLOW-02 (pauseLegCount, pauseActive transitions)
- [ ] `src/ui/overlays/PauseOverlay.test.ts` — covers FLOW-02 UI (countdown display, Weiter button visibility)

**Test infrastructure note:** `speechSynthesis` and `Audio` are not available in the Node `unit` project. Mock them with `vi.stubGlobal('speechSynthesis', { speak: vi.fn(), cancel: vi.fn(), getVoices: vi.fn(() => []), onvoiceschanged: null })` in test setup or per-test. `Audio` mock: `vi.stubGlobal('Audio', vi.fn(() => ({ play: vi.fn().mockResolvedValue(undefined), volume: 1 })))`.

---

## Security Domain

Security enforcement is enabled. ASVS Level 1 applies.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes (limited) | Audio prefs values read from localStorage — validate types before use; never eval or innerHTML |
| V6 Cryptography | no | — |

### Known Threat Patterns for Web Speech / Audio Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via TTS (injecting malicious text into `utterance.text`) | Tampering | Only pass score numbers and `getSuggestion()` output — both are computed from the game state, not user-supplied strings. No `{@html}` or template interpolation paths. |
| localStorage prefs injection | Tampering | Validate all localStorage reads before use (boolean coercion, Number(), fallback to defaults). Never pass localStorage values to `eval`, `innerHTML`, or similar. |
| Audio URL injection | Tampering | SFX paths are compile-time constants (`/sfx/180.mp3` etc.) — never constructed from user input. |

**Risk level:** LOW. Phase 5 adds no new user input paths. Audio/speech is purely computed output. The primary security risk is TTS speaking unexpected text if game state is corrupted, which is blocked by using only derived numeric values.

---

## Sources

### Primary (MEDIUM confidence — MDN official docs via WebFetch)

- [MDN SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis) — `speak()`, `cancel()`, `getVoices()`, `onvoiceschanged` async pattern
- [MDN SpeechSynthesisUtterance](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance) — `text`, `lang`, `voice`, `rate`, `onerror` properties
- [MDN HTMLAudioElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement) — `Audio()` constructor, `preload`, autoplay policy
- [MDN Web Audio API Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) — fire-and-forget SFX pattern, AudioContext cost
- [Svelte $effect docs](https://svelte.dev/docs/svelte/$effect) — cleanup return from `$effect`, `setInterval` pattern

### Secondary (LOW confidence — community-verified bug reports and practitioner guides)

- [Chrome Intent to Deprecate speechSynthesis.speak without user activation](https://groups.google.com/a/chromium.org/g/blink-dev/c/XpkevOngqUs) — user gesture requirement since Chrome 71
- [talkrapp.com — Lessons Learned Using SpeechSynthesis API](https://talkrapp.com/speechSynthesis.html) — Android underscore lang bug, Chrome 15s limit, getVoices async
- [codersblock.com — JavaScript Text to Speech Quirks](https://codersblock.com/blog/javascript-text-to-speech-and-its-many-quirks/) — cross-browser quirks, voice loading
- [puruvj.dev — Building Smart Intervals with Svelte 5](https://www.puruvj.dev/blog/svelte-5-interval-rune) — Svelte 5 setInterval pattern
- [HadrienGardeur/web-speech-recommended-voices](https://github.com/HadrienGardeur/web-speech-recommended-voices) — voice quality notes per platform

### Codebase (HIGH confidence — verified by direct file reads)

- `src/stores/match.svelte.ts` — `#detectRecords`, `pendingRecords`, `BC_CHANNEL` publish pattern
- `src/lib/sync-constants.ts` — `BC_CHANNEL`, `BC_RECORD_CHANNEL`, `LS_SNAPSHOT` names
- `src/stores/display.svelte.ts` — `isValidMatchState` guard, `BC_CHANNEL` subscription
- `src/routes/match/+page.svelte` — visit detection `$effect`, `CorrectionWindow` integration, overlay mounting
- `src/routes/display/+page.svelte` — `BC_RECORD_CHANNEL` subscription, overlay mounting
- `src/ui/setup/MatchSetup.svelte` — stepper/toggle/segmented-control patterns to reuse
- `src/ui/overlays/RecordOverlay.svelte` — overlay animation, z-index, `$effect` auto-dismiss pattern
- `src/ui/overlays/MatchWinOverlay.svelte` — `fadeIn 300ms ease-out` pattern, z-index 100
- `src/engine/checkout.ts` — `getSuggestion()` API for D-03 caller checkout hint
- `src/engine/reducer.ts` — `handleLegWinFromPlayers`, leg-count increment logic
- `src/lib/storage.ts` — try/catch localStorage pattern, key naming convention

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps; browser-native APIs confirmed via MDN
- Architecture: MEDIUM — patterns confirmed from codebase reads; broadcast envelope design is a new addition
- Pitfalls: MEDIUM — Chrome 71 user-gesture requirement and Android lang normalization verified via official blink-dev posts and practitioner sources
- Audio quality: LOW — TTS voice quality is OS/device-dependent; cannot be predicted

**Research date:** 2026-06-12
**Valid until:** 2026-09-12 (Web Speech API is stable; no known deprecation in progress)
