# Retrospective — Neverman Darts App

## Milestone: v1.0 — MVP

**Shipped:** 2026-06-13
**Phases:** 6 | **Plans:** 33

### What Was Built
A touch-optimized X01 darts scoring PWA (German, dark mode): full playable match with SVG dartboard input, undo, bust handling, and checkout suggestions; a live spectator display (second window on PC / in-app fullscreen on tablet) synced over BroadcastChannel; Dexie/IndexedDB persistence with crash-resume, profiles, match history, and JSON export/import; live + lifetime statistics with hand-rolled SVG charts and live-celebrated personal records; a Web Speech caller plus sound effects with a master volume slider, and a configurable auto-pause countdown synced to both views; and an installable, fully-offline PWA with a German update prompt and a GitHub Actions deploy workflow for GitHub Pages.

### What Worked
- The discuss → research → plan → checker → execute → verify chain caught real issues before they shipped: the plan-checker flagged missing test coverage and unresolved research; the milestone integration audit caught a genuine deployment blocker (SFX absolute paths 404-ing on the Pages subpath) that all unit tests and the dev build had missed.
- Human UAT on audio (Phase 5) surfaced real product decisions a machine couldn't: audio source (scoring window, because passive windows can't autoplay), volume control, and a remastered SFX level.
- Sequential execution on the main tree (worktrees auto-degraded — no origin/HEAD) kept shared-file phases conflict-free.

### What Was Inefficient
- Several executor agents truncated their return right before committing SUMMARY.md (a Windows stdio pattern), requiring orchestrator recovery (commit summary + update tracking). Reliable but cost extra round-trips.
- The Git Bash `BASE_PATH=/...` path-mangling trap briefly looked like a build bug; PowerShell builds were needed to verify the subpath locally.

### Patterns Established
- Audio plays from the scoring window `/match` only (browser autoplay needs a user gesture) — see the audio-source decision.
- PWA virtual modules (`virtual:pwa-register/svelte`, `virtual:pwa-info`) are excluded under VITEST and aliased to mocks; their types come from a `src/app.d.ts` reference.
- Base-path-prefix every runtime asset URL (`new Audio(\`${base}/sfx/...\`)`) — absolute paths break on the Pages subpath.

### Key Lessons
- A cross-phase integration audit is worth its cost: a phase can pass in isolation (Phase 5 audio worked when base was `''`) yet break once a later phase (Phase 6 subpath) changes the environment.
- Carry inherently-manual acceptance criteria (install/offline/live-deploy, audible output) as explicit human-verification items rather than faking automated checks.

### Deferred at Close (accepted tech debt)
- Phase 3 persistence UAT — 9 manual scenarios never run (`03-UAT.md`); automated checks passed.
- Live GitHub Pages go-live (create repo, enable Pages, push) — the user's outward-facing step; workflow committed and ready.
- Nyquist `compliant` frontmatter flags stale on phases 4–6 (coverage exists).

### Cost Observations
- Model mix: planning on opus, research/execution/review/verify on sonnet.
- Notable: most rework came from environment-specific issues (Windows env mangling, subpath base paths, browser autoplay) rather than logic errors — the logic was well-covered by the test suite (430 tests green at close, `npm run check` clean).

---

## Cross-Milestone Trends

| Milestone | Phases | Plans | Tests at close | Shipped |
|-----------|--------|-------|----------------|---------|
| v1.0 MVP | 6 | 33 | 430 | 2026-06-13 |
