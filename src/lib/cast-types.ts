// src/lib/cast-types.ts
// CastDisplayState projection for Chromecast payload (Plan 07-02, D-05/D-07).
//
// VISITS TRIM RATIONALE (Claude's Discretion per 07-02-PLAN.md behavior block):
//
// The /display components use player.visits for three things:
//   1. recentVisitsWithScores: the last 4 visits (player.visits, no slice needed)
//   2. legAverage: visits.slice(legStartVisitIndex[id]) — current-leg visits only
//   3. matchAverage: all visits — but per averages.ts comment, for the live display
//      the formula (startScore - remaining) / dartsThrown captures only the current
//      leg's scoring regardless of how many visits are passed.
//
// Decision: trim each player's visits to the current leg only
//   (visits.slice(legStartVisitIndex[id])) and rebase legStartVisitIndex to 0.
//
// This means:
//   - recentVisitsWithScores works correctly (shows last 4 current-leg visits)
//   - legAverage is numerically identical (rebased slice=[0..], same window)
//   - matchAverage is numerically identical for the live display (same formula
//     with startScore and remaining; the cross-leg matchAverageCrossLeg function
//     is used by StatDrawer, not by the /display PlayerPanel)
//   - Payload size drops dramatically: 4 players × 40 visits → 4 players × 10 visits
//     for a match where legStartVisitIndex = 30, keeping the payload well under 32 KB.
//
// Pure module: no Svelte runes, no DOM, no side effects.
// Safe to import from both sender (.svelte.ts) and receiver (.ts) contexts.

import type { MatchConfig, DartScore, Visit } from '../engine/types.js';
import type { MatchState } from '../engine/types.js';

// ── CastDisplayState ───────────────────────────────────────────────────────

/** Per-player state projected for the Cast receiver scoreboard. */
export interface CastPlayerState {
	id: string;
	name: string;
	remaining: number;
	legsWon: number;
	setsWon: number;
	/** Current-leg visits only (trimmed and rebased — see file header). */
	visits: Visit[];
}

/**
 * The trimmed snapshot that the Cast sender publishes and the receiver renders.
 * Contains exactly the fields the /display components read, plus pause state.
 *
 * Corresponds to D-05 (payload shape) and D-07 (size bound).
 */
export interface CastDisplayState {
	/** Match configuration (startScore, outRule, legsToWin, setsEnabled, setsToWin). */
	config: MatchConfig;
	/** Projected per-player state — visits trimmed to current leg, legStartVisitIndex rebased to 0. */
	players: CastPlayerState[];
	activePlayerIndex: number;
	/** The current in-progress visit darts (active player only; empty array for others). */
	currentVisit: DartScore[];
	phase: MatchState['phase'];
	/**
	 * Per-player index into visits[] where the current leg starts.
	 * Always 0 after projection (visits are pre-trimmed to current leg only).
	 */
	legStartVisitIndex: Record<string, number>;
	/** True when the auto-pause countdown is active (SYNC-03). */
	pauseActive: boolean;
	/** Remaining seconds on the auto-pause countdown (SYNC-03). */
	pauseRemainingSeconds: number;
}

/**
 * On-wire message type for Cast snapshot messages.
 * The `type` discriminant lets the receiver bridge route snapshots vs.
 * future record/request message types on the same Cast namespace.
 */
export type CastSnapshotMessage = { type: 'snapshot' } & CastDisplayState;

// ── toDisplayState ─────────────────────────────────────────────────────────

/**
 * Projects a full MatchState into the trimmed CastDisplayState.
 *
 * Pure function — no side effects, no mutations of the input.
 *
 * @param state - The full match state from MatchStore.
 * @param pauseActive - Whether the auto-pause countdown is currently running.
 * @param pauseRemainingSeconds - Remaining seconds on the countdown.
 */
export function toDisplayState(
	state: MatchState,
	pauseActive: boolean,
	pauseRemainingSeconds: number,
): CastDisplayState {
	// Build per-player projection with visits trimmed to current leg.
	const players: CastPlayerState[] = state.players.map(player => {
		const legStart = state.legStartVisitIndex[player.id] ?? 0;
		// Slice to current-leg visits only; shallow-copy the visits array.
		const visits: Visit[] = player.visits.slice(legStart).map(v => ({
			darts: v.darts.map(d => ({ multiplier: d.multiplier, segment: d.segment })),
			dartsAtDouble: v.dartsAtDouble,
			bust: v.bust,
			...(v.wasCheckout !== undefined ? { wasCheckout: v.wasCheckout } : {}),
		}));
		return {
			id: player.id,
			name: player.name,
			remaining: player.remaining,
			legsWon: player.legsWon,
			setsWon: player.setsWon,
			visits,
		};
	});

	// Rebase legStartVisitIndex: all players now start at 0.
	const legStartVisitIndex: Record<string, number> = {};
	for (const player of state.players) {
		legStartVisitIndex[player.id] = 0;
	}

	// Shallow-copy config (all fields are primitives — no deep clone needed).
	const config: MatchConfig = {
		startScore: state.config.startScore,
		outRule: state.config.outRule,
		legsToWin: state.config.legsToWin,
		setsEnabled: state.config.setsEnabled,
		setsToWin: state.config.setsToWin,
	};

	// Shallow-copy currentVisit darts.
	const currentVisit: DartScore[] = state.currentVisit.map(d => ({
		multiplier: d.multiplier,
		segment: d.segment,
	}));

	return {
		config,
		players,
		activePlayerIndex: state.activePlayerIndex,
		currentVisit,
		phase: state.phase,
		legStartVisitIndex,
		pauseActive,
		pauseRemainingSeconds,
	};
}

// ── isValidCastState ───────────────────────────────────────────────────────

/**
 * Receiver-side shape guard for incoming Cast snapshot messages.
 *
 * Mirrors the `isValidMatchState` discipline in display.svelte.ts:
 * returns true only when `players` is a non-empty array AND `activePlayerIndex`
 * is a number in the range [0, players.length).
 *
 * Applied at the receiver ingress (Plan 04) before assigning to display state.
 * Also safe to call on a full CastSnapshotMessage (the extra `type` field is ignored).
 */
export function isValidCastState(msg: unknown): msg is CastDisplayState {
	const m = msg as CastDisplayState | null;
	return (
		!!m &&
		Array.isArray(m.players) &&
		m.players.length > 0 &&
		typeof m.activePlayerIndex === 'number' &&
		m.activePlayerIndex >= 0 &&
		m.activePlayerIndex < m.players.length
	);
}
