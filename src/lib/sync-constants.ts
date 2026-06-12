// src/lib/sync-constants.ts
// Shared BroadcastChannel and localStorage key constants for match sync protocol.
// All consumers (match store, display store, display route) import from here
// to guarantee byte-identical values — a typo in any one file would silently
// break cross-window sync.
//
// Sync Protocol (02-UI-SPEC.md):
//   BC_CHANNEL      — match state snapshots (MatchState)
//   BC_RECORD_CHANNEL — record celebration events (RecordEvent), separate channel
//                       to avoid DisplayStore casting record payloads as MatchState
//                       (RESEARCH Pitfall 5, T-04-12).
//   LS_SNAPSHOT     — localStorage key for cold-start hydration snapshot

/** BroadcastChannel name for live match-state sync to the spectator display. */
export const BC_CHANNEL = 'neverman-match';

/** BroadcastChannel name for record-celebration events (ACHV-02).
 *  Kept separate from BC_CHANNEL so DisplayStore never receives a record payload
 *  and attempts to cast it as MatchState (RESEARCH Pitfall 5). */
export const BC_RECORD_CHANNEL = 'neverman-record';

/** localStorage key for the cold-start snapshot used by DisplayStore.connect(). */
export const LS_SNAPSHOT = 'neverman-match-snapshot';
