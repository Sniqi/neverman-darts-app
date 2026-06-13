# Phase 1: Playable X01 Match - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-10
**Phase:** 1-Playable X01 Match
**Areas discussed:** Dartboard input ergonomics, Visit flow/correction/undo, Checkout suggestions display, Match setup & bull-off entry

---

## Dartboard input ergonomics

| Option | Description | Selected |
|--------|-------------|----------|
| Enlarged rings (Recommended) | Triple/double rings drawn 2–3× thicker; stylized but reliably finger-hittable | ✓ |
| Realistic + invisible hit zones | Real-looking board with enlarged invisible touch overlays | |
| Realistic + tap-to-zoom | Tap sector zooms in for precise S/D/T pick | |

**User's choice:** Enlarged rings

| Option | Description | Selected |
|--------|-------------|----------|
| Portrait: board below scores (Recommended) | Scores top, board below — DartCounter style | |
| Landscape: board beside scores | Board one side, score panel other | |
| Both, responsive | Layout adapts to orientation | ✓ |

**User's choice:** Both, responsive

| Option | Description | Selected |
|--------|-------------|----------|
| Instant + visual flash (Recommended) | Tap registers immediately; segment flashes; dart shows in visit strip | ✓ |
| Tap shows preview, confirm to commit | Second tap commits | |
| Instant, minimal feedback | Only score updates | |

**User's choice:** Instant + visual flash

| Option | Description | Selected |
|--------|-------------|----------|
| Button next to board (Recommended) | Dedicated "Daneben" button beside board | |
| Outer area of the SVG = miss | Tap outside double ring but inside board area = miss | ✓ |
| Both | Button and outer area | |

**User's choice:** Outer area of the SVG = miss (bounce-outs entered as miss)

---

## Visit flow, correction & undo

| Option | Description | Selected |
|--------|-------------|----------|
| Short auto-timer (Recommended) | ~2–3 s editable summary, then turn passes; tap to hold open | ✓ |
| Explicit confirm button | Turn passes only on "Weiter" | |
| Auto-timer with longer hold on leg win | Confirmation required for leg/set wins and busts | |

**User's choice:** Short auto-timer

| Option | Description | Selected |
|--------|-------------|----------|
| Per dart, unlimited (Recommended) | Each undo removes one dart, back through legs/sets without limit | ✓ |
| Per dart in visit, per visit after | Finalized visits revert as a whole | |
| Current + previous visit only | Limited to last two visits | |

**User's choice:** Per dart, unlimited

| Option | Description | Selected |
|--------|-------------|----------|
| Toggle per player/visit (Recommended) | Switch flips dartboard/numpad; last mode remembered per player | ✓ |
| Global setting per match | Mode chosen once at setup | |
| Numpad always visible alongside | Both on screen, smaller board | |

**User's choice:** Toggle per player/visit

| Option | Description | Selected |
|--------|-------------|----------|
| Prompt only on finish (Recommended) | Leg-winning numpad entry asks darts used + darts at double | ✓ |
| Prompt on finish + possible-finish busts | Also asks in checkout range | |
| Never prompt, estimate | Checkout % only from dartboard visits | |

**User's choice:** Prompt only on finish

---

## Checkout suggestions display

| Option | Description | Selected |
|--------|-------------|----------|
| Beside active player's score (Recommended) | Compact line near remaining score, e.g. "170: T20 T20 Bull" | ✓ |
| Banner above the dartboard | Prominent strip, costs board space | |
| Subtle, tap to reveal | Indicator + tap to show route | |

**User's choice:** Beside active player's score

| Option | Description | Selected |
|--------|-------------|----------|
| One route only (Recommended) | Single standard route per score | |
| One route + update after each dart | Recalculates live within the visit | ✓ |
| Up to 2–3 alternatives | Standard route plus alternatives | |

**User's choice:** One route, recalculated after each dart

| Option | Description | Selected |
|--------|-------------|----------|
| Standard pro tables (Recommended) | Classic tournament checkout charts | ✓ |
| Prefer D16/D8 leaves | Routes engineered for halvable doubles | |
| You decide | Claude picks during planning | |

**User's choice:** Standard pro tables

| Option | Description | Selected |
|--------|-------------|----------|
| Single Out: suggest too (Recommended) | Suggestions in Single Out for ≤180; nothing for bogey/>170 | ✓ |
| Suggestions only in Double Out | No Single Out suggestions | |
| Show setup advice outside range | Setup hints above 170 | |

**User's choice:** Single Out gets suggestions too

---

## Match setup & bull-off entry

| Option | Description | Selected |
|--------|-------------|----------|
| Single screen (Recommended) | One scrollable page: players, mode chips, out toggle, legs/sets steppers | ✓ |
| Two steps: players → rules | Split into two screens | |
| Wizard (3+ steps) | Guided step-by-step | |

**User's choice:** Single screen

| Option | Description | Selected |
|--------|-------------|----------|
| First-to legs, sets optional (Recommended) | Default 501/DO/first-to-3; sets toggleable | ✓ |
| Best-of semantics | "Best of 5 legs" framing | |
| Both selectable | First-to/best-of switch | |

**User's choice:** First-to legs, sets optional

| Option | Description | Selected |
|--------|-------------|----------|
| Drag/tap full order (Recommended) | Arrange all players into throwing order | ✓ |
| Tap winner only | Winner first, rest keep setup order | |
| Optional: skip = setup order | Skippable bull-off entry | |

**User's choice:** Drag/tap full order

| Option | Description | Selected |
|--------|-------------|----------|
| Dexie from day one (Recommended) | Profiles in IndexedDB in Phase 1; Phase 3 adds history | ✓ |
| In-memory now, Dexie in Phase 3 | Profiles lost on reload until Phase 3 | |
| Names only, no profile management | Typed names every time | |

**User's choice:** Dexie from day one

---

## Claude's Discretion

- Exact correction-window duration (~2–3 s band) and visuals
- Enlarged ring proportions tuning for 10" tablet fingers
- Which published standard checkout table to encode
- Numpad layout, invalid-total rejection, undo button placement
- Leg/set starter rotation per standard darts rules

## Deferred Ideas

None — discussion stayed within phase scope.
