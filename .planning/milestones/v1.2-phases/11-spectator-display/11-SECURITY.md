---
phase: 11
slug: spectator-display
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-07-14
---

# Phase 11 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Match data (engine-validated) → display components | `dart-notation.ts` formatters, `MatchHeader.svelte`, and `PlayerPanel.svelte` render only engine-typed `DartScore`/`Visit`/`MatchConfig` values (numeric segments, `multiplier: 1\|2\|3`, enum-derived labels) — never raw player free text. | Typed scoring state (not user text) |
| Profile-entered `player.name` → PlayerPanel render | Pre-existing, unchanged-this-phase Svelte `{interpolation}` of profile free text; auto-escaped, never `{@html}`. | Player display name (auto-escaped) |
| MatchStore (trusted local sender) → Chromecast receiver | Outbound-only, pre-existing Cast custom-message channel (SYNC-02). Plan 11-04 changed only *when* a snapshot is sent, not its shape, contents, or trust boundary. | Display snapshot (outbound only) |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-11-01-01 | Tampering / Information Disclosure | `dart-notation.ts` formatters + `VisitLine.svelte` | low | accept | No `{@html}` in diff; formatters return a fixed set of literal strings or an engine-typed numeric `DartScore.segment` — no new interpolation surface. `VisitLine.svelte` is dead/unrouted code. | closed — below high threshold (non-blocking) |
| T-11-02-01 | Tampering / Information Disclosure | `MatchHeader.svelte` rendering | low | accept | No `{@html}`; all rendered values are numbers/enum-derived labels from `MatchConfig`. Diff is CSS-only (typography/spacing/bloom) — no binding touched. | closed — below high threshold (non-blocking) |
| T-11-03-01 | Tampering / Information Disclosure (XSS) | `PlayerPanel.svelte` `{player.name}` interpolation | low | accept | Pre-existing Svelte auto-escaping (file header: "T-03-04: no `{@html}`"). Diff (backgrounds, typography, formatDart consolidation, `@supports` sync) does not touch the name-rendering binding; no new `{@html}` introduced. | closed — below high threshold (non-blocking) |
| T-11-04-01 | Denial of Service (message flooding) | `#broadcastPause()` → `#publishToCast()` → `sendMessage(CAST_NS)` | low | accept | No new call frequency: `decrementPause()` already fired `#broadcastPause()` once/sec during a pause (BroadcastChannel-only); the fix adds one same-cadence Cast `sendMessage`, reusing `#publishToCast()`'s non-fatal try/catch + DEV-only 32 KB payload warning. `#broadcastPause()` still never calls `dispatch()`/`reduce()` (T-04-14 anti-infinite-loop invariant preserved). | closed — below high threshold (non-blocking) |
| T-11-04-02 | Tampering / Information Disclosure | Cast snapshot payload contents | low | accept | Unchanged: `toDisplayState()` already included `pauseActive`/`pauseRemainingSeconds` in every snapshot (SYNC-03); the fix changes only which mutators trigger a send, not payload shape or any new field exposure. | closed — below high threshold (non-blocking) |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-11-01 | T-11-01-01 | Formatters emit only fixed literals / engine-typed numeric segments; no `{@html}`. No new interpolation surface. | Sniqi | 2026-07-14 |
| AR-11-02 | T-11-02-01 | Header renders only numeric/enum `MatchConfig` fields; CSS-only diff. | Sniqi | 2026-07-14 |
| AR-11-03 | T-11-03-01 | Pre-existing Svelte auto-escaping of `player.name`; name binding untouched by this phase. | Sniqi | 2026-07-14 |
| AR-11-04 | T-11-04-01 | Same-cadence (1/sec) outbound send reusing existing non-fatal Cast path; no loop invariant broken. | Sniqi | 2026-07-14 |
| AR-11-05 | T-11-04-02 | Payload shape unchanged; pause fields already present in every snapshot (SYNC-03). | Sniqi | 2026-07-14 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-14 | 5 | 5 | 0 | Claude (secure-phase, L1 short-circuit) |

Short-circuit basis: `register_authored_at_plan_time: true` (all 4 PLAN files carry a `<threat_model>` block), `asvs_level: 1`, and `threats_open: 0` at or above the `high` block threshold — all 5 registered threats are low-severity accepted risks with documented rationale. Per secure-phase Step 3, L1 grep-depth is sufficient and no deeper auditor pass is required.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-14
