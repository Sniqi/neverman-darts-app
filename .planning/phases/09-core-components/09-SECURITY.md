---
phase: 09-core-components
audited: 2026-07-14
asvs_level: 1
block_on: high
threats_total: 18
threats_closed: 17
threats_open: 0
threats_open_non_blocking: 1
status: open_non_blocking
---

# Phase 9: Core Components — Security Audit

**Scope:** Pure CSS/markup restyle across 7 plans (shared `.btn`/`.switch` classes, dialog scrim/motion treatment, StatCard typography, checkbox→button `role="switch"` conversions). No new packages, no new endpoints, no new storage, no new inputs declared or found.

**Method:** Every threat below was independently re-verified against the current on-disk implementation (not against SUMMARY.md/PLAN.md claims alone) — grepped the actual files, opened the cited test files and confirmed their assertions, checked `git log`/`git diff` for the phase's commit range for package.json changes, and grepped for `{@html}` usage in every file this phase touched.

## Threat Verification

| Threat ID | Category | Severity | Disposition | Status | Evidence |
|-----------|----------|----------|-------------|--------|----------|
| T-09-01-01 | Tampering | low | accept | CLOSED | `e2e/full-match-flow.spec.ts:97` — `getByRole('button', {name:'Neues Spiel'})` present and asserted visible; hub page class-swap didn't touch `onclick` handlers (verified in `src/routes/+page.svelte`). |
| T-09-01-SC | Tampering (supply chain) | n/a | accept | CLOSED | `git log 742a130^..2a8bfab -- package.json` returns no commits; zero new dependencies added in phase 9's commit range. |
| T-09-02-01 | Tampering | low | accept | **OPEN (non-blocking)** | Mitigation plan claims "existing specs navigate through data/history/stats routes" — **false**: `grep` across `e2e/*.spec.ts` for `/stats`, `/history`, `/data` navigation found zero matches, and no co-located `.test.ts` exists for `src/routes/{stats,history,data}/+page.svelte`. These 4 route files' button-class swaps have no automated regression coverage at all. Severity is `low` (below `block_on: high`), so this does not block ship, but the declared mitigation is not actually in place. |
| T-09-02-SC | Tampering (supply chain) | n/a | accept | CLOSED | Same package.json check as above — no new deps. |
| T-09-03-01 | Tampering | low | accept | CLOSED | `src/ui/dialogs/ConfirmDialog.test.ts` exists and asserts computed `backdrop-filter`/`border-radius`/`max-width` + `Abbrechen` button presence; `e2e/resume.spec.ts` exercises `Fortsetzen`/`Verwerfen`. Both files confirmed on disk with real assertions (not stubs). |
| T-09-03-02 | Information Disclosure | low | accept | CLOSED | Grepped `ConfirmDialog.svelte`, `DartsAtDoubleDialog.svelte`, `ResumePrompt.svelte` for `{@html` — zero template usages (only a documenting comment in `ConfirmDialog.svelte`). Codebase-wide, the only real `{@html}` usage is `src/routes/+layout.svelte:10` (`webManifest`), untouched by this phase. |
| T-09-03-SC | Tampering (supply chain) | n/a | accept | CLOSED | No new deps. |
| T-09-04-01 | Information Disclosure | low | accept | CLOSED | Grepped `StatCard.svelte` for `{@html` — zero template usages (comment-only). |
| T-09-04-SC | Tampering (supply chain) | n/a | accept | CLOSED | No new deps. |
| T-09-05-01 | Tampering | medium | mitigate | CLOSED | `src/ui/setup/MatchSetup.svelte` confirmed: all 4 toggle buttons (`sets-toggle`/`caller-toggle`/`sfx-toggle`/`pause-toggle`) preserve `id`, `role="switch"`, `aria-checked` exactly. `e2e/full-match-flow.spec.ts:27` exercises `getByRole('switch', {name:'Sets'})`. Additionally, `src/ui/setup/MatchSetup.test.ts` (added in code-review-fix round, commit `92bbb5b`) asserts all 4 switches — Sets/Caller/Musik/Automatische Pause — resolve via `getByRole('switch', {name:...})`, closing the coverage gap the phase's own code review (09-REVIEW.md WR-01) flagged for the 3 switches E2E didn't reach. |
| T-09-05-02 | Tampering | low | accept | CLOSED | `aria-pressed` confirmed present and untouched on chip buttons (line 179) and segmented-control buttons (lines 194, 200) in `MatchSetup.svelte`. |
| T-09-05-SC | Tampering (supply chain) | n/a | accept | CLOSED | No new deps. |
| T-09-06-01 | Tampering | low | accept | CLOSED | `src/ui/setup/ProfileManager.test.ts` confirmed on disk with 4 real test cases (create/list, delete-sheet strings incl. `data-testid="confirm-delete"`, Abbrechen-cancels) matching the accessible names the mitigation plan cites. |
| T-09-06-02 | Information Disclosure | low | accept | CLOSED | Grepped `ProfileManager.svelte` for `{@html` — zero template usages (comment-only). |
| T-09-06-SC | Tampering (supply chain) | n/a | accept | CLOSED | No new deps. |
| T-09-07-01 | Tampering | medium | mitigate | CLOSED | `src/routes/match/+page.svelte` confirmed: `#match-caller-toggle`/`#match-sfx-toggle` preserve `role="switch"`/`aria-checked` exactly. New `e2e/match-audio-toggle.spec.ts` confirmed on disk, asserts both switches are visible and flip `aria-checked` correctly on click (real behavioral assertion, not just presence). |
| T-09-07-02 | Tampering | low | accept | CLOSED | `.audio-row` in `src/routes/match/+page.svelte:545` confirmed as `height: var(--hit-min);` (48px) — not `var(--row-h)` (64px), matching the CONTEXT.md Q2 bound cited in the mitigation plan. |
| T-09-07-SC | Tampering (supply chain) | n/a | accept | CLOSED | No new deps. |

## Open Threats

### Non-blocking (severity below `block_on: high` threshold)

| Threat ID | Category | Severity | Mitigation Expected | Files Searched | Gap |
|-----------|----------|----------|----------------------|-----------------|-----|
| T-09-02-01 | Tampering | low | "Full Playwright suite (existing specs navigate through data/history/stats routes) re-run after each task" | `e2e/*.spec.ts` (all 6 spec files), `src/routes/stats/`, `src/routes/history/`, `src/routes/data/` (no `.test.ts` present) | No E2E spec or component test actually exercises `/stats`, `/history`, or `/data`. The class-swap in these 4 files (back-buttons, menu rows, delete/export/import buttons) has zero automated regression coverage — a future regression to these buttons' `onclick` wiring or accessible names would not be caught by any existing test. Not a blocker at `low` severity / `block_on: high`, but the disposition's own stated evidence does not exist. |

**No blocking-open threats.** `threats_open: 0` (severity-filtered per `block_on: high` — only `high`/`critical` severity opens would count, and there are none).

## Unregistered Flags

None. Cross-checked SUMMARY.md `## Threat Flags` sections: 09-01 and 09-02 explicitly state "None — class-attribute-only edits, no new markup/handlers/network surface." Plans 09-03 through 09-07 omit the section entirely (process gap, not a security finding) — independently corroborated by 09-REVIEW.md's explicit statement: "No security issues, no `{@html}` usage, no hardcoded secrets, and no functional/state-logic regressions were found" across all 19 reviewed files, and by this audit's own greps (zero `{@html}`, zero new dependencies) covering every file those 5 plans touched.

## Accepted Risks Log

The following threats are formally accepted (not mitigated by code) per their PLAN.md disposition, verified as CLOSED above because the cited rationale/evidence was independently confirmed to exist and hold:

- T-09-01-01, T-09-03-01, T-09-03-02, T-09-04-01, T-09-05-02, T-09-06-01, T-09-06-02, T-09-07-02 — all `low` severity, accepted on the basis of existing/new test coverage or confirmed absence of `{@html}`.
- T-09-01-SC, T-09-02-SC, T-09-03-SC, T-09-05-SC, T-09-06-SC, T-09-07-SC — `n/a` severity, accepted supply-chain non-events (zero new packages this phase, confirmed via `git log` on `package.json`).
- **T-09-02-01** — `low` severity, accepted **despite** the disposition's cited evidence being unsubstantiated (see Open Threats above). Recorded here as an accepted risk with a documented gap rather than as a mitigated threat: the class-attribute-only nature of the change (no `onclick`/handler edits) keeps the actual risk low even without test coverage, but the coverage gap itself should be closed in a future phase touching these files.

## Recommendation

Non-blocking at ASVS Level 1 / `block_on: high`. Phase 9 may ship. Recommend (not required) adding minimal Playwright/component coverage for `src/routes/stats/+page.svelte`, `src/routes/history/+page.svelte`, `src/routes/history/[id]/+page.svelte`, and `src/routes/data/+page.svelte` in a future phase that touches these files, to close the T-09-02-01 gap before it compounds.

---
*Audited: 2026-07-14*
*Auditor: Claude (gsd-security-auditor)*
