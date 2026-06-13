# Phase 2: Spectator Display - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-11
**Phase:** 2-Spectator Display
**Areas discussed:** Screen layout & hierarchy, Live dart behavior, Transitions & special states, Opening & controlling the view

---

## Screen layout & hierarchy

| Option | Description | Selected |
|--------|-------------|----------|
| Equal split | Screen divided into equal halves like a TV darts broadcast, active player highlighted, nothing moves between turns | ✓ |
| Active player dominant | Throwing player takes ~70% of screen; layout jumps every turn | |
| Scoreboard rows | Table-like horizontal rows; scales uniformly but smaller scores | |

**User's choice:** Equal split (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Vertical columns | 3 players = thirds, 4 = quarters side by side; same structure as 2-player split | ✓ |
| 2×2 grid for 4 | Wider panels at 4 players but structure changes between 3 and 4 | |
| You decide | Claude picks per player count | |

**User's choice:** Vertical columns (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Glow + accent border | Bright accent border/glow + brighter background on active panel; others dimmed | ✓ |
| Arrow/dart icon only | Subtle ▶ next to name | |
| You decide | Claude picks treatment | |

**User's choice:** Glow + accent border (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Slim header bar | Thin top bar with game mode, format, current leg number | ✓ |
| No header | 100% of screen for panels | |
| You decide | Claude decides if header earns its space | |

**User's choice:** Slim header bar (recommended)

---

## Live dart behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Live per dart | Each dart appears the moment it's entered; remaining counts down live | ✓ |
| Completed visits only | Score updates only when visit finalizes | |

**User's choice:** Live per dart (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, show the route | Suggested checkout route in the active player's panel | ✓ |
| Finish indicator only | Signal "auf Finish" without revealing the route | |
| No finish info | Scores only | |

**User's choice:** Yes, show the route (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Total + darts | Big visit total with individual darts beneath; numpad entries total-only | ✓ |
| Total only | Just the visit total | |
| You decide | Claude decides based on panel space | |

**User's choice:** Total + darts (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Current replaces last | One visit slot: fills dart-by-dart while throwing, becomes last visit after turn | ✓ |
| Both visible | Live current visit AND previous visit | |
| You decide | Claude decides | |

**User's choice:** Current replaces last (recommended)

---

## Transitions & special states

| Option | Description | Selected |
|--------|-------------|----------|
| Brief BUST flash | Prominent red "BUST" (~2 s), then visible score revert | ✓ |
| Subtle marker only | "Bust" as text in last-visit line | |
| You decide | Claude picks treatment | |

**User's choice:** Brief BUST flash (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Full-screen banner | "Leg für ALEX!" overlay held until next leg's first dart | ✓ |
| Timed banner (~5s) | Overlay for a few seconds, then back to panels | |
| In-panel only | Leg counter increments, no overlay | |

**User's choice:** Full-screen banner (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Winner screen, stays | Full-screen winner display with final result + match averages, stays until new match | ✓ |
| Winner + last scoreboard | Banner on top, final panels beneath | |
| You decide | Claude designs it | |

**User's choice:** Winner screen, stays (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Waiting screen | Dark screen with app name + "Warte auf Match…", auto-switches on match start | ✓ |
| Redirect to main app | Spectator route bounces back when no active match | |
| You decide | Claude designs idle state | |

**User's choice:** Waiting screen (recommended)

---

## Opening & controlling the view

| Option | Description | Selected |
|--------|-------------|----------|
| Scoring view, small icon | Monitor/cast icon in scoring view corner, reachable mid-match | ✓ |
| Setup + scoring view | Button in both places | |
| Setup screen only | Only at match setup | |

**User's choice:** Scoring view, small icon (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Small chooser menu | "Zweites Fenster öffnen" / "Anzeige hier im Vollbild" — explicit choice | ✓ |
| Auto-detect device | Touch + small screen → fullscreen; desktop → second window | |
| You decide | Claude picks approach | |

**User's choice:** Small chooser menu (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Tap anywhere → button | Temporary "Zurück zur Eingabe" button, auto-hides after ~3 s | ✓ |
| Permanent small button | Always-visible corner button | |
| You decide | Claude picks exit mechanism | |

**User's choice:** Tap anywhere → button (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, fullscreen toggle | In-app Fullscreen API toggle for borderless second-monitor display | ✓ |
| No, browser window is fine | Users press F11 themselves | |

**User's choice:** Yes, fullscreen toggle (recommended)

---

## Claude's Discretion

- Typography scale, dimming/glow values, panel spacing (27" at 3 m is the bar)
- Average precision and German labels; standard 3-dart average semantics
- BUST flash duration/animation and banner styling
- Undo rendering on spectator (plain score update)
- Sync protocol details within the locked BroadcastChannel + localStorage snapshot approach

## Deferred Ideas

None — discussion stayed within phase scope.
