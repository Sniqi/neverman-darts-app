---
phase: 09-core-components
plan: 02
subsystem: ui
tags: [css, svelte, design-system, buttons]

# Dependency graph
requires:
  - phase: 09-core-components
    plan: 01
    provides: src/styles/components.css (.btn base + .btn--ghost/.btn--icon/.btn--menu/.btn--surface/.btn--destructive-outline classes)
provides:
  - 4 route files (stats, history list, history detail, data/backup) fully migrated to shared button classes, closing out COMP-01
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Icon-only back buttons keep their original local class name (e.g. `back-btn`) alongside the new shared `btn btn--ghost btn--icon` classes only when a file-scoped rule (margin-left alignment quirk, :focus-visible outline) must remain; otherwise the local class is dropped entirely"

key-files:
  modified:
    - src/routes/stats/+page.svelte
    - src/routes/history/+page.svelte
    - src/routes/history/[id]/+page.svelte
    - src/routes/data/+page.svelte

key-decisions:
  - "stats/+page.svelte's back-btn and menu-btn local classes were kept (not dropped) alongside the new .btn classes, because both retain a scoped :focus-visible outline rule that has no shared-class equivalent — dropping the class name entirely would have made the :focus-visible rule an unused CSS selector (caught via Vite's dev-server unused-selector warning during verification)"
  - "history/+page.svelte, history/[id]/+page.svelte, and data/+page.svelte's back-btn also kept the local class name (for the margin-left alignment override) even though they have no :focus-visible rule of their own"

patterns-established: []

metrics:
  duration: 5min
  tasks_completed: 2
  files_changed: 4
  completed: 2026-07-14

status: complete
---

# Phase 09 Plan 02: Stats/History/Data Route Button Sweep Summary

Migrated the icon-only back buttons, stats profile-picker rows, history detail delete button, and both data/backup action buttons across 4 route files onto the shared `.btn` classes built in Plan 09-01, deleting all now-redundant local button CSS.

## What Was Built

- **`src/routes/stats/+page.svelte`**: back button → `btn btn--ghost btn--icon back-btn`; profile-picker rows → `btn btn--menu menu-btn`. Local `.back-btn`/`.menu-btn` sizing/color/border/`:active` rules deleted; `margin-left` and `:focus-visible` rules kept scoped to the retained class names.
- **`src/routes/history/+page.svelte`**: back button → `btn btn--ghost btn--icon back-btn`. Local sizing/color/border/`:active` rules deleted; `margin-left` kept.
- **`src/routes/history/[id]/+page.svelte`**: back button → `btn btn--ghost btn--icon back-btn` (margin-left kept); delete button ("Spiel löschen") → `btn btn--destructive-outline`, with the entire local `.delete-btn`/`.delete-btn:active` block deleted (fully superseded, no scoped exception needed).
- **`src/routes/data/+page.svelte`**: back button → `btn btn--ghost btn--icon back-btn` (margin-left kept); both "Exportieren" and "Datei auswählen" buttons → `btn btn--surface`, with the entire local `.action-btn`/`:disabled`/`:active` block deleted.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Kept `back-btn`/`menu-btn` local class names instead of fully removing them**
- **Found during:** Task 1 verification (Playwright dev-server output)
- **Issue:** The plan's acceptance criteria said "no `.back-btn {` sizing/color/border rule remains" but didn't explicitly say to keep the class attribute value. Initially I removed the `menu-btn` class entirely per the literal task action wording ("gets `class=\"btn btn--menu\"`"), which orphaned the local `.menu-btn:focus-visible` rule — Vite's dev server flagged it as `css_unused_selector`.
- **Fix:** Re-added `menu-btn` to the button's class list (alongside `btn btn--menu`) so the scoped `:focus-visible` rule still matches. `back-btn` was already kept from the start for the equivalent reason (margin-left/:focus-visible).
- **Files modified:** `src/routes/stats/+page.svelte`
- **Commit:** 748422f

Or otherwise: no other deviations — the remaining 3 files matched the plan's literal instructions exactly (delete rule blocks in full, no scoped exceptions needed for history list, history detail, or data page beyond `margin-left`).

## Known Stubs

None.

## Threat Flags

None — class-attribute-only edits, no new markup/handlers/network surface.

## Self-Check: PASSED

- FOUND: src/routes/stats/+page.svelte
- FOUND: src/routes/history/+page.svelte
- FOUND: src/routes/history/[id]/+page.svelte
- FOUND: src/routes/data/+page.svelte
- FOUND: 748422f
- FOUND: bfa9309
