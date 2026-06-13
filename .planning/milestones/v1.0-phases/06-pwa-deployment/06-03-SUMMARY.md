---
phase: 06-pwa-deployment
plan: "03"
subsystem: infra
tags: [github-actions, github-pages, cicd, pwa, sveltekit, deploy, workflow]
dependency_graph:
  requires:
    - phase: 06-02
      provides: SvelteKitPWA plugin wired, subpath build config, static/.nojekyll, build/ artifact structure
  provides:
    - GitHub Actions workflow (.github/workflows/deploy.yml) that builds with BASE_PATH and deploys build/ to GitHub Pages on push to main
  affects: [user-go-live, github-pages-cicd]
tech_stack:
  added:
    - "GitHub Actions (actions/checkout@v4, actions/setup-node@v4, actions/upload-pages-artifact@v3, actions/deploy-pages@v4)"
  patterns:
    - "Two-job Pages deploy: build job uploads artifact; deploy job uses deploy-pages with pages+id-token:write least-privilege permissions"
    - "BASE_PATH derived from github.event.repository.name — stays correct if repo is renamed"
    - "Concurrency group pages with cancel-in-progress false (safe: never cancels an in-flight deploy)"
key_files:
  created:
    - .github/workflows/deploy.yml
  modified: []
key-decisions:
  - "BASE_PATH derived from github.event.repository.name (not hardcoded) — repo rename stays correct automatically"
  - "cancel-in-progress: false for the concurrency group — never interrupt a live deploy mid-flight"
  - "workflow_dispatch added alongside push:main so the user can trigger a manual re-deploy without a push"
  - "contents: read permission omitted from deploy job — only pages:write + id-token:write are needed; principle of least privilege"
patterns-established:
  - "Two-job Pages workflow pattern: build (artifact) → deploy (deploy-pages)"
requirements-completed: [PLAT-02, PLAT-03]
duration: ~2min
completed: "2026-06-13"
---

# Phase 06 Plan 03: GitHub Actions Pages Deploy Workflow Summary

**GitHub Actions two-job workflow committed: builds SvelteKit PWA with BASE_PATH from repo name and deploys build/ to GitHub Pages via actions/deploy-pages@v4 on push to main.**

## Performance

- **Duration:** ~2 minutes
- **Started:** 2026-06-13T00:33:13Z
- **Completed:** 2026-06-13T00:35:xx Z
- **Tasks:** 2 of 2 complete
- **Files created:** 1 (.github/workflows/deploy.yml)
- **Files modified:** 0

## Accomplishments

- Created `.github/workflows/deploy.yml` with the canonical SvelteKit static → GitHub Pages deploy flow (build + deploy jobs, least-privilege permissions, concurrency group)
- Verified `static/.nojekyll` is present and copied into `build/` by adapter-static (guards against Jekyll stripping `_app/` assets on Pages)
- Confirmed `BASE_PATH=//neverman-darts-app npm run build` produces a complete, Pages-deployable artifact: `build/404.html`, `build/sw.js`, `build/manifest.webmanifest`, `build/.nojekyll`, and `build/_app/` — 67 precache entries (454.31 KiB)
- 353 unit tests remain green; no source changes required

## User Go-Live Steps

The workflow is committed and will run automatically once the following one-time steps are performed:

1. **Create the GitHub repository**
   - Go to https://github.com/new
   - Name it exactly `neverman-darts-app` (matches the BASE_PATH in the workflow)
   - Visibility: Public (required for free GitHub Pages)

2. **Enable Pages with GitHub Actions as the source**
   - Repo → Settings → Pages
   - Under "Build and deployment" → Source: **GitHub Actions**
   - Save

3. **Push this repo to GitHub**
   ```bash
   git remote add origin https://github.com/<your-username>/neverman-darts-app.git
   git push -u origin master:main
   ```
   (The default branch in the remote is `main` — the workflow triggers on push to `main`)

4. **Watch the workflow run**
   - Repo → Actions → "Deploy to GitHub Pages"
   - First run takes ~2–3 minutes (npm ci + build)

5. **Verify the live site**
   - Once the deploy job completes, the app is live at:
     `https://<your-username>.github.io/neverman-darts-app/`
   - Confirm: app loads, dartboard is interactive, spectator display works

**Manual re-deploy:** Use the "Run workflow" button in GitHub Actions (workflow_dispatch trigger) without needing a code push.

## Task Commits

1. **Task 1: Add GitHub Actions Pages deploy workflow + confirm .nojekyll** - `4acedde` (chore)
2. **Task 2: Verify subpath build produces complete Pages artifact** - `78f65b9` (chore, build-gate)

## Files Created/Modified

- `.github/workflows/deploy.yml` — Two-job GitHub Actions workflow: build (npm ci + BASE_PATH build + upload-pages-artifact@v3) and deploy (deploy-pages@v4, pages:write + id-token:write, github-pages environment)

## Decisions Made

- **BASE_PATH from repo name:** `env: BASE_PATH: '/${{ github.event.repository.name }}'` — derives the value dynamically rather than hardcoding `/neverman-darts-app`. If the user renames the repo, the BASE_PATH stays correct.
- **cancel-in-progress: false:** A Pages deploy mid-flight should never be interrupted. If two pushes land in quick succession, the second waits for the first to complete.
- **workflow_dispatch included:** Lets the user manually trigger a re-deploy without making a dummy commit. Useful after enabling Pages or troubleshooting.
- **Node 22:** Current LTS; matches the local development environment (v22.22.0).
- **contents: read not added:** The deploy job only needs `pages: write` + `id-token: write`. Adding `contents: read` would be unnecessary privilege on the deploy job.

## Deviations from Plan

None — plan executed exactly as written. The workflow was created per Pattern 6 in RESEARCH.md with all specified actions, permissions, and configuration. No source fixes were required.

## Known Stubs

None — the deploy workflow is fully functional and will run as written once the user creates the repo and enables Pages.

## Threat Flags

None — the workflow introduces no new network endpoints, auth paths, or file-access patterns beyond what the plan's threat model documents. Permissions are scoped to least privilege for Pages deploy (T-06-07 mitigated). The `.nojekyll` guard is verified in `build/` (T-06-08 mitigated).

## Self-Check: PASSED

- `.github/workflows/deploy.yml` exists: FOUND
- `static/.nojekyll` exists: FOUND
- `build/404.html` exists: FOUND
- `build/sw.js` exists: FOUND
- `build/manifest.webmanifest` exists: FOUND
- `build/.nojekyll` exists (copied by adapter-static): FOUND
- `build/_app/` directory exists: FOUND
- Task 1 commit `4acedde` exists: FOUND
- Task 2 commit `78f65b9` exists: FOUND
- 353 unit tests green: CONFIRMED
