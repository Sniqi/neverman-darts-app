---
phase: 08-design-foundation
audited: 2026-07-14
asvs_level: 1
block_on: high
threats_total: 13
threats_closed: 13
threats_open: 0
status: SECURED
---

# Phase 8: Security Audit Report

**Phase:** 08 — Design Foundation (pure CSS/font restyling)
**ASVS Level:** 1 (grep-level: mitigation must be present in the cited file/location)
**Block threshold:** high (only open high/critical threats block ship)

## Scope note

This phase is a static CSS-token / self-hosted-font restyling sweep across 6 plans (08-01
through 08-06). No new input, endpoint, auth, session, or data-flow surface was introduced
anywhere in the phase — every plan's own threat register explicitly states this, and the
independent 08-REVIEW.md code review (diffed every file against pre-phase commit `93ece5f`)
confirms the diff is CSS-value-only across all 36 `.svelte` files plus `db.ts`/`profiles.ts`/
`vite.config.ts`, with exactly the two script-level literal changes the phase intended
(`Profile.color` default, `ReloadPrompt.test.ts` assertion). This scope was verified, not
assumed on the auditor's part — see Verification Method below.

## Threat Register — Verification

| Threat ID | Category | Plan | Severity | Disposition | Status | Evidence |
|-----------|----------|------|----------|-------------|--------|----------|
| T-08-01-01 | Tampering | 08-01 | low | accept | CLOSED | `src/styles/{colors,elevation,typography,spacing}.css` are static, committed CSS custom-property files with no runtime input path; confirmed by reading all 4 files — no dynamic interpolation, no user-supplied values. Requires repo write access to alter (not externally reachable). Logged in Accepted Risks below. |
| T-08-01-02 | Information Disclosure | 08-01 | low | accept | CLOSED | `e2e/reduced-motion.spec.ts` — grepped for `api[_-]?key\|password\|secret\|token\|bearer`: 0 matches. Runs only against the local build/preview server. Logged in Accepted Risks below. |
| T-08-02-SC | Tampering (supply chain) | 08-02 | **high** | mitigate | CLOSED | Blocking human-verify checkpoint (Task 0, `gate="blocking-human"`) is present in `08-02-PLAN.md`. Resolution evidence independently confirmed: commit `44ef6ab` body states *"fonttools/brotli legitimacy verified via Task 0 human-verify checkpoint (approved): fonttools -> github.com/fonttools/fonttools, brotli -> github.com/google/brotli"* (verified via `git show 44ef6ab`); `08-02-SUMMARY.md`'s Task Commits section records the same approval with version numbers (fonttools 4.63.0, brotli 1.2.0) and notes both packages are dev-time only. Confirmed no `requirements.txt`/pip lockfile was added to the repo (consistent with "dev-time-only, never bundled" — these are one-shot conversion tools, not a persisted dependency of the shipped app). Audit trail exists at both the commit and SUMMARY level as declared. |
| T-08-02-02 | Information Disclosure | 08-02 | low | accept | CLOSED | Font binaries (`src/styles/fonts/*.woff2`) + `OFL.txt` are publicly licensed (SIL Open Font License) static assets — confirmed present on disk, no embedded secrets possible in a font binary/license text. Logged in Accepted Risks below. |
| T-08-02-03 | Tampering | 08-02 | low | accept | CLOSED | `vite.config.ts` manifest colors verified static: `theme_color: '#0c0e14'`, `background_color: '#0c0e14'` (grep-confirmed), no runtime input. Logged in Accepted Risks below. |
| T-08-03-01 | Tampering | 08-03 | low | accept | CLOSED | 15 component `<style>`/inline-SVG color literals — static, code-reviewed substitutions confirmed by `08-REVIEW.md`'s independent diff (CSS-value-only, no logic changes). Logged in Accepted Risks below. |
| T-08-03-02 | Information Disclosure | 08-03 | low | accept | CLOSED | No new data surface — confirmed, this plan only edits presentation values. Logged in Accepted Risks below. |
| T-08-04-01 | Tampering | 08-04 | low | accept | CLOSED | 14 component `<style>` color/radius/motion declarations — static substitutions, confirmed no script/logic diffs per `08-04-SUMMARY.md` (D5) and `08-REVIEW.md`. Logged in Accepted Risks below. |
| T-08-04-02 | Information Disclosure | 08-04 | low | accept | CLOSED | No new data surface touched — confirmed. Logged in Accepted Risks below. |
| T-08-05-01 | Tampering | 08-05 | low | accept | CLOSED | Route/component `<style>` color literals across 12 files — static, confirmed no `<script>` changes in `match/+page.svelte`/`display/+page.svelte` per plan acceptance criteria and `08-REVIEW.md`. Logged in Accepted Risks below. |
| T-08-05-02 | Information Disclosure | 08-05 | low | accept | CLOSED | No new data surface touched — confirmed. Logged in Accepted Risks below. |
| T-08-06-01 | Tampering | 08-06 | low | accept | CLOSED | `Profile.color` default change verified in code: `src/db/profiles.ts:21` → `color: '#f0a424'`; confirmed via grep that no UI render path reads `profile.color`/`player.color` (per `08-06-SUMMARY.md`), so behavior-invisible today. Logged in Accepted Risks below. |
| T-08-06-02 | Information Disclosure | 08-06 | low | accept | CLOSED | `src/lib/design-tokens.test.ts` confirmed present on disk (2416 bytes); reads only repo-committed files, no network access, no secrets. Logged in Accepted Risks below. |

**Closed:** 13/13 | **Open:** 0/13

## Unregistered Flags

Only one plan (`08-02-SUMMARY.md`) carries an explicit `## Threat Flags` section; it
states "None — no new attack surface beyond the plan's threat model." No other SUMMARY.md
in this phase includes a `## Threat Flags` section (checked all 6).

One new attack-surface-adjacent item was found by the auditor independent of any SUMMARY's
self-report and is logged here per the adversarial-stance requirement to not rely solely on
executor self-reporting:

- **UF-01 (informational, non-blocking):** `08-02-SUMMARY.md`'s Task 3 deviation log
  describes `e2e/offline-fonts.spec.ts` starting its own dependency-free `node:http` static
  server on port 4517 to serve `build/` (working around a `vite preview` / adapter-static
  incompatibility). This is a new local, test-only HTTP listener not mentioned in any
  `<threat_model>` block. Assessed as no practical risk: it binds to localhost, serves only
  already-public static build output, runs only inside the Playwright test process (never
  shipped to production, no production trust boundary), and mirrors GitHub Pages' own static
  file semantics. No action required; logged for visibility.

## Accepted Risks Log

All 12 `accept`-disposition threats above (everything except T-08-02-SC) are formally
accepted here, per the audit's disposition-verification requirement that an `accept`
threat is CLOSED only once an entry exists in this log:

| Threat ID | Rationale for acceptance |
|-----------|---------------------------|
| T-08-01-01, T-08-03-01, T-08-04-01, T-08-05-01, T-08-06-01 | Tampering risk on static, git-committed CSS/data values requires existing repository write access — not a new externally-reachable attack surface. Standard code-review/PR gating on this repo is the control. |
| T-08-01-02, T-08-03-02, T-08-04-02, T-08-05-02, T-08-06-02 | No secrets, credentials, or sensitive data are present in the touched E2E specs, component style blocks, or the new regression test; nothing is exposed that wasn't already public (this is a client-side, static-hosted PWA — all shipped code is inherently public). |
| T-08-02-02 | Font binaries + OFL.txt are publicly licensed (SIL OFL) assets with no confidentiality requirement. |
| T-08-02-03 | `vite.config.ts` manifest theme/background colors are non-sensitive static configuration, code-reviewed like any other source change. |

## Verification Method Notes (why this isn't a rubber stamp)

- Read all 6 PLAN.md `<threat_model>` blocks in full (13 threats total, no threat skipped).
- Read all 6 SUMMARY.md files in full, including frontmatter coverage tables and deviation
  logs, not just headline claims.
- Independently verified the one `mitigate` threat's evidence at the git level
  (`git show 44ef6ab`) rather than trusting the SUMMARY's paraphrase alone.
- Spot-checked 3 "accept" claims directly against the working tree rather than trusting
  prose: grepped e2e specs for secret-like tokens (0 matches), grepped `profiles.ts`/`db.ts`
  for the new default hex (confirmed `#f0a424`), grepped `vite.config.ts` for manifest
  colors and `globPatterns` (confirmed `#0c0e14` / `woff2,ttf`), confirmed
  `src/lib/design-tokens.test.ts` exists on disk.
- Cross-checked all findings against the independent `08-REVIEW.md` code review (which
  diffed the full phase against pre-phase commit `93ece5f`) to corroborate the "no
  functional/logic change, CSS-value-only" claim repeated across every plan's threat model —
  this is what makes the low-severity "accept" dispositions credible rather than merely
  asserted. Note `08-REVIEW.md`'s CR-01 (Chromecast `100dvh` regression, since fixed in
  commit `1ce517a`) and WR-01/WR-02/IN-01/IN-02 are code-quality/consistency findings, not
  STRIDE security threats, and are correctly out of this audit's scope.
- Confirmed no `requirements.txt` or pip lockfile exists in the repo, corroborating
  T-08-02-SC's "dev-time-only, never bundled" claim.

## Result

**SECURED.** 13/13 threats CLOSED. `threats_open: 0` (nothing at or above the `high`
block threshold remains open). Phase 8 may ship from a security-audit standpoint.
