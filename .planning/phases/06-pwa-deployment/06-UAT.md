---
status: testing
phase: 06-pwa-deployment
source: [06-VERIFICATION.md]
started: 2026-06-13
updated: 2026-06-13
---

## Current Test

number: 1
name: PWA install + offline operation
expected: |
  Served at the /neverman-darts-app/ subpath, the app offers an install affordance,
  registers the service worker, works after going offline (reload still loads), and
  SFX still play offline.
awaiting: user response

## Tests

### 1. PWA install + offline operation (PLAT-01/02)
expected: Build with BASE_PATH and `npm run preview`; open http://localhost:4173/neverman-darts-app/ . The browser shows an install affordance (DevTools → Application → Manifest is error-free, SW registered). After the SW installs, DevTools → Network → Offline, reload → the app still loads; trigger a 180 → SFX still plays.
result: [pending]

### 2. German UI completeness (PLAT-04)
expected: Navigate all routes (start, setup, match, display, stats, history) — every visible string is German; dark mode throughout. The update toast reads "Neue Version verfügbar" with "Aktualisieren"/"Schließen".
result: [pending]

### 3. Live GitHub Pages deploy + update prompt (PLAT-02/03 live)
expected: After go-live (create the neverman-darts-app repo, Settings → Pages → Source: GitHub Actions, push), the app loads at https://<user>.github.io/neverman-darts-app/ with no broken assets/routes; deploying a second version makes the installed app show the update toast (not a silent stale load).
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps

(none yet)

## User Go-Live Steps (outward-facing — not done by the autonomous run; no remote exists)

1. Create a GitHub repo named `neverman-darts-app` (so the Pages subpath matches BASE_PATH).
2. Repo Settings → Pages → Source: **GitHub Actions**.
3. Add the remote and push the default branch:
   `git remote add origin git@github.com:<user>/neverman-darts-app.git`
   `git push -u origin master:main`  (workflow triggers on main+master)
4. The `Deploy to GitHub Pages` Action builds with `BASE_PATH=/neverman-darts-app` and publishes.
5. Visit `https://<user>.github.io/neverman-darts-app/`, install it, then redeploy to confirm the update prompt.
