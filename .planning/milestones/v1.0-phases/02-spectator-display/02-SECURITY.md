---
phase: 2
slug: spectator-display
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-11
---

# Phase 2 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Spectator display: a second same-origin browser context (window or in-app route)
> mirrors live `MatchState` via `BroadcastChannel('neverman-match')` and a
> `localStorage('neverman-match-snapshot')` cold-start hydration path.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| scoring tab → spectator tab (`BroadcastChannel('neverman-match')`) | Same-origin only; another browser context receives live `MatchState` snapshots | Local match state (scores, player names) — no PII, no secrets |
| `localStorage('neverman-match-snapshot')` → `DisplayStore` (`JSON.parse`) | Untrusted-*shaped* string deserialized into `MatchState` on cold-start hydrate (same-origin writer only) | Serialized `MatchState` JSON |
| player-supplied name → display DOM | Player/guest names rendered into spectator panels, banners, and win overlays | Free-text player names |
| scoring view → second browser window (`window.open('/display')`) | A second same-origin window is opened to the display route | Window handle (`opener`) |
| user gesture → Fullscreen API (`requestFullscreen`) | Fullscreen requested from a click/tap handler on `/display` | — (capability request) |

All cross-context channels (`BroadcastChannel`, `localStorage`) are **same-origin only** by the HTML spec — no cross-origin sender can publish to the channel or write the snapshot key. The only producer is this same app.

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-02-01 | Tampering | `JSON.parse` of localStorage snapshot in `DisplayStore.connect()` | mitigate | Parse wrapped in try/catch; on failure `state` stays `null` (idle screen). No deep schema validation (ASVS L1, same-origin local app). Verified: `src/stores/display.svelte.ts:33-40`. | closed |
| T-02-02 | Spoofing | `BroadcastChannel('neverman-match')` message source | accept | BroadcastChannel is same-origin only; no cross-origin injection possible (ASVS L1). | closed |
| T-02-03 | Denial of Service | localStorage quota / private-mode write failure in publisher | accept | `setItem` (and `postMessage`) wrapped in try/catch; live channel authoritative; cold-start falls back to idle. Non-fatal by design. Verified: `src/stores/match.svelte.ts:32-41`. | closed |
| T-02-04 | Injection (XSS) | Player-name interpolation in PlayerPanel / VisitLine / LegWinBanner / MatchWinDisplay / SpectatorChooser | mitigate | Names rendered via Svelte `{name}` interpolation only (auto-escaped); `{@html}` prohibited (constraint T-03-04). Verified: zero `{@html}` directives in `src/ui/display/` (only documentary comments). | closed |
| T-02-05 | Tampering | `legsWon`-delta watcher fires a false banner after a manipulated snapshot | accept | Same-origin channel; snapshot integrity equals the scoring tab's own state (ASVS L1). Undo correctly reverts `legsWon` so the banner clears. | closed |
| T-02-06 | Spoofing / Elevation of Privilege (reverse tabnabbing) | `SpectatorChooser.openSecondWindow()` (`window.open('/display')`) | mitigate | `win.opener = null` set immediately after open (gap-closure 02-05 superseded the `noopener` features-string approach to fix the popup-blocked false positive). Target is same-origin content; no cross-origin opener leak possible. Verified: `src/ui/display/SpectatorChooser.svelte:26-28`. | closed |
| T-02-07 | Denial of Service / UX | Fullscreen request denied or popup blocked | mitigate | `window.open` null → inline "Bitte Popups für diese Seite erlauben" message, no crash; `requestFullscreen()` chained with `.catch(() => {})` — display works in a normal window on denial. Verified: `src/ui/display/SpectatorChooser.svelte:30-32,120-140` and `src/routes/display/+page.svelte:93,98`. | closed |
| T-02-INFO | Information Disclosure | `BroadcastChannel('neverman-match')` payload | accept | Channel is same-origin; data is local match scores with no PII or secrets. `$state.snapshot()` produces a plain serializable clone of already-local data — no new exposure. | closed |
| T-02-SC | Supply chain | npm/pip/cargo installs during phase | n/a | No package installs introduced in this phase; all changes are edits to existing source/test files. No supply-chain surface introduced. | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-02-1 | T-02-02 | `BroadcastChannel` is same-origin by browser spec; no cross-origin sender can spoof messages. ASVS L1 requires no further control for a local, no-backend PWA. | Sniqi | 2026-06-11 |
| AR-02-2 | T-02-03 | localStorage write failure (quota / private mode) is non-fatal: the live channel stays authoritative and cold-start degrades to the idle screen. Wrapped in try/catch defensively. | Sniqi | 2026-06-11 |
| AR-02-3 | T-02-05 | A false leg/set banner from a tampered snapshot requires same-origin access equal to the scoring tab's own state; undo reverts `legsWon` so the banner self-corrects. No high-severity exposure. | Sniqi | 2026-06-11 |
| AR-02-4 | T-02-INFO | Match state crossing the channel contains no PII or secrets — only local game scores generated by this same app. | Sniqi | 2026-06-11 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-11 | 9 | 9 | 0 | gsd-secure-phase (orchestrator-verified, plan-time register) |

**Audit notes:** Register authored at plan time across all five plan files (`register_authored_at_plan_time: true`) with `threats_open: 0` reported in every SUMMARY — short-circuit path applied (no separate auditor spawn). All four `mitigate`-disposition threats were independently grounded in current source: T-02-01 (try/catch), T-02-04 (zero `{@html}`), T-02-06 (`win.opener = null` — the 02-05 gap-closure form, not the stale `noopener` flag), T-02-07 (popup null-check + `requestFullscreen().catch()`).

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-11
