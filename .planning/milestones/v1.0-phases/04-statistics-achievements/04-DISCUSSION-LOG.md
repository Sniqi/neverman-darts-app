# Phase 4: Statistics & Achievements - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-12
**Phase:** 4-Statistics & Achievements
**Areas discussed:** Live in-match stats surfacing, Which records celebrate + seeding, Record celebration overlay UX, Lifetime model + dashboard home

---

## Live in-match stats surfacing

### Input view placement
| Option | Description | Selected |
|--------|-------------|----------|
| Tappable stats drawer | 'Statistik' button opens a panel with full live leg+match breakdown; 3-dart avg stays inline | ✓ |
| Always-on compact panel | Small live stats block permanently visible beside/under the score panel | |
| Post-leg/match summary | Only live 3-dart avg during play; full breakdown on a leg/match-end summary | |

### Spectator view
| Option | Description | Selected |
|--------|-------------|----------|
| Keep minimal + record overlay | No stat clutter; averages as-is; only new element is the record overlay | ✓ |
| Add a subtle stat line | One compact extra line per panel (180s / checkout %) | |
| You decide | Preserve 3 m readability at discretion | |

**User's choice:** Tappable stats drawer (input) + minimal spectator with record overlay only.
**Notes:** Protects the touch-dense scoring surface and the 3 m spectator readability.

---

## Which records celebrate + seeding

### Record set
| Option | Description | Selected |
|--------|-------------|----------|
| Highest visit + highest checkout | The two ACHV-01 examples only | |
| + Best leg (fewest darts) | Add new personal-best leg | |
| + Best leg + highest match avg | Also new personal-best match 3-dart average at match end | ✓ |

### 180 handling
| Option | Description | Selected |
|--------|-------------|----------|
| 180 always celebrates | Every 180 gets the overlay regardless of records | ✓ |
| Only as a record | 180 overlay only when it's a new highest visit | |

### Seeding (first match)
| Option | Description | Selected |
|--------|-------------|----------|
| Celebrate from first occurrence | First-ever 180/checkout/leg set and celebrate the initial record | ✓ |
| Require an existing baseline | First match silently seeds; celebrate only when beaten afterwards | |

**User's choice:** Records = highest visit, highest checkout, best leg, highest match avg; 180 always celebrates; celebrate from first occurrence.
**Notes:** Covers the milestones darts players actually brag about; immediate reward early on.

---

## Record celebration overlay UX

### Intrusiveness (input view)
| Option | Description | Selected |
|--------|-------------|----------|
| Transient auto-dismiss (~2-3s) | Overlay/animation on both views, auto-clears, non-blocking | ✓ |
| Dismissable card | Stays until tapped / longer timeout; takes focus | |

### Multiple milestones at once
| Option | Description | Selected |
|--------|-------------|----------|
| One combined card | Single overlay lists everything hit ("180! · Neuer Rekord …") | ✓ |
| Queue sequentially | Each milestone as its own brief overlay | |

### Record on a winning throw
| Option | Description | Selected |
|--------|-------------|----------|
| Fold record into the win banner | Win banner gains a record badge/line; no stacked overlays | ✓ |
| Record overlay first, then win banner | Sequence the two | |

**User's choice:** Transient auto-dismiss; one combined card; fold record into win banner.
**Notes:** Mirrors correction-window timing and spectator banner language; avoids nagging on frequent 180s.

---

## Lifetime model + dashboard home

### Records source
| Option | Description | Selected |
|--------|-------------|----------|
| Recompute from history | Records derived from match blobs; deleting a match recedes the record; one source of truth | ✓ |
| Store records independently | Separate stored records table; survives match deletion; new schema + drift risk | |
| You decide | Decide at planning | |

### Dashboard home
| Option | Description | Selected |
|--------|-------------|----------|
| New 'Statistik' on start screen | Start-screen entry → pick profile → lifetime stats + charts | ✓ |
| Inside each profile | Reach stats by opening a profile | |
| Within Match-Verlauf | Lifetime/overview tab inside history | |

**User's choice:** Recompute from history (no records table); 'Statistik' entry on the start screen.
**Notes:** Consistent with Phase 3 D-09; export/import already carries everything via matches. Lifetime stats are per-profile (guests excluded).

---

## Claude's Discretion

- Cross-leg match-average implementation (current engine only captures the last leg — core STAT-01 task).
- Charting approach/library (lightweight vs hand-rolled SVG, given the static-PWA bundle constraint).
- Checkout-% edge cases (doubles-hit derivation, Single-Out denominator).
- first-9 average mechanics and rounding/format.
- Best/worst leg derivation from legStartVisitIndex + visits.
- How current records are loaded for live detection at match start.
- German labels, drawer layout, overlay animation styling, dashboard chart selection, stats profile-picker UX.

## Deferred Ideas

- Sound effects for 180s / records — Phase 5 (AUD-02), sits on top of the visual overlay.
- Always-on / spectator stat panels — rejected this phase to protect touch surface and 3 m readability.
- Independently-stored permanent records table — considered, rejected (D-09) in favor of recompute-from-history.
