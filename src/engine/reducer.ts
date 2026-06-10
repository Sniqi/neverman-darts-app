// src/engine/reducer.ts
// Pure X01 reducer over an append-only event log.
// ENG-01..06, INP-03, PROF-02.
//
// Key design decisions:
//   - Returns a NEW state object on every call (no mutation).
//   - `remaining` is ONLY committed at end of visit (after 3 darts, bust, or leg win).
//     During a visit, darts accumulate in `currentVisit` and the running total is
//     computed from currentVisit on every dart — but state.players[i].remaining
//     always holds the start-of-visit value until the visit finalises.
//     This makes bust reversion trivial: remaining is already correct.
//   - Derived counts (legsWon, setsWon) are updated in-place but UNDO resets via
//     full log replay.
//   - UNDO = reduce(initialState(), ...log.slice(0, -1)) — D-06 unlimited undo.
//   - MatchState is fully serializable (no functions, no circular refs).

import type { MatchState, MatchAction, MatchConfig, PlayerState, DartScore, Visit } from './types.js';
import { isBust } from './bust.js';
import { nextPlayerIndex, legStarterIndex } from './rotation.js';
import { isValidVisitTotal } from './impossible-scores.js';

// ── Initial state ──────────────────────────────────────────────────────────

export function initialState(): MatchState {
	return {
		config: {
			startScore: 501,
			outRule: 'double',
			legsToWin: 3,
			setsEnabled: false,
			setsToWin: 1,
		},
		players: [],
		activePlayerIndex: 0,
		legStarterIndex: 0,
		currentVisit: [],
		phase: 'setup',
		eventLog: [],
	};
}

// ── Main reducer ───────────────────────────────────────────────────────────

export function reduce(state: MatchState, action: MatchAction): MatchState {
	// UNDO: replay log minus last entry
	if (action.type === 'UNDO') {
		if (state.eventLog.length === 0) return state;
		const trimmed = state.eventLog.slice(0, -1);
		return trimmed.reduce(reduce, initialState());
	}

	// Append to event log for all other actions
	const newLog = [...state.eventLog, action];

	switch (action.type) {
		case 'START_MATCH':
			return applyStartMatch(action, newLog);
		case 'DART_THROWN':
			return applyDartThrown(state, action, newLog);
		case 'NUMPAD_VISIT':
			return applyNumpadVisit(state, action, newLog);
		case 'CONFIRM_VISIT':
			return { ...state, eventLog: newLog };
		default:
			return state;
	}
}

// ── Action handlers ────────────────────────────────────────────────────────

function applyStartMatch(
	action: Extract<MatchAction, { type: 'START_MATCH' }>,
	newLog: MatchAction[]
): MatchState {
	// Build players in the order specified by `action.order`
	const orderedPlayers: PlayerState[] = action.order.map(id => {
		const p = action.players.find(pl => pl.id === id)!;
		return {
			id: p.id,
			name: p.name,
			isGuest: p.isGuest,
			remaining: action.config.startScore,
			legsWon: 0,
			setsWon: 0,
			visits: [],
		};
	});

	return {
		config: action.config,
		players: orderedPlayers,
		activePlayerIndex: 0,
		legStarterIndex: 0,
		currentVisit: [],
		phase: 'playing',
		eventLog: newLog,
	};
}

function applyDartThrown(
	state: MatchState,
	action: Extract<MatchAction, { type: 'DART_THROWN' }>,
	newLog: MatchAction[]
): MatchState {
	if (state.phase !== 'playing') return state;

	const dart = action.dart;
	const playerIdx = state.activePlayerIndex;
	const player = state.players[playerIdx];

	// Accumulate darts in currentVisit
	const newVisit = [...state.currentVisit, dart];

	// Compute running total of current visit (not yet committed to remaining)
	const visitScored = newVisit.reduce((sum, d) => sum + d.multiplier * d.segment, 0);
	const newRemaining = player.remaining - visitScored;

	// Check bust using the start-of-visit remaining and the current dart
	const bust = isBust(player.remaining - (visitScored - dart.multiplier * dart.segment), dart, state.config.outRule);

	if (bust) {
		// Remaining stays at player.remaining (start-of-visit); mark visit bust; pass turn
		const bustVisit: Visit = {
			darts: newVisit,
			dartsAtDouble: 0,
			bust: true,
		};
		const updatedPlayer: PlayerState = {
			...player,
			// remaining unchanged — already holds start-of-visit value
			visits: [...player.visits, bustVisit],
		};
		const players = state.players.map((p, i) => i === playerIdx ? updatedPlayer : p);
		return {
			...state,
			players,
			activePlayerIndex: nextPlayerIndex(playerIdx, players.length),
			currentVisit: [],
			eventLog: newLog,
		};
	}

	// Not bust: check if leg won (newRemaining === 0)
	if (newRemaining === 0) {
		const winVisit: Visit = { darts: newVisit, dartsAtDouble: 0, bust: false };
		const updatedPlayer: PlayerState = {
			...player,
			remaining: 0,
			legsWon: player.legsWon + 1,
			visits: [...player.visits, winVisit],
		};
		const players = state.players.map((p, i) => i === playerIdx ? updatedPlayer : p);
		return handleLegWinFromPlayers(state, players, playerIdx, newLog);
	}

	// Normal dart mid-visit: keep currentVisit updated, do NOT commit to remaining yet
	if (newVisit.length === 3) {
		// Visit complete: commit remaining
		const visit: Visit = { darts: newVisit, dartsAtDouble: 0, bust: false };
		const updatedPlayers = state.players.map((p, i) =>
			i === playerIdx
				? { ...p, remaining: newRemaining, visits: [...p.visits, visit] }
				: p
		);
		return {
			...state,
			players: updatedPlayers,
			activePlayerIndex: nextPlayerIndex(playerIdx, updatedPlayers.length),
			currentVisit: [],
			eventLog: newLog,
		};
	}

	// Mid-visit, not bust, not finished: keep accumulating
	// Do NOT update player.remaining — it stays at start-of-visit value
	return {
		...state,
		currentVisit: newVisit,
		eventLog: newLog,
	};
}

function applyNumpadVisit(
	state: MatchState,
	action: Extract<MatchAction, { type: 'NUMPAD_VISIT' }>,
	newLog: MatchAction[]
): MatchState {
	if (state.phase !== 'playing') return state;

	const { total, dartsUsed = 3, dartsAtDouble = 0 } = action;

	// Validate total (T-02-01)
	if (!isValidVisitTotal(total)) return state;

	const playerIdx = state.activePlayerIndex;
	const player = state.players[playerIdx];
	const newRemaining = player.remaining - total;

	// Overshoot
	if (newRemaining < 0) return state;

	// Leaves 1 in double-out → invalid
	if (newRemaining === 1 && state.config.outRule === 'double') return state;

	// Leg win
	if (newRemaining === 0) {
		const finishingVisit: Visit = {
			darts: [],
			dartsAtDouble,
			bust: false,
		};
		const updatedPlayer: PlayerState = {
			...player,
			remaining: 0,
			legsWon: player.legsWon + 1,
			visits: [...player.visits, finishingVisit],
		};
		const players = state.players.map((p, i) => i === playerIdx ? updatedPlayer : p);
		return handleLegWinFromPlayers(state, players, playerIdx, newLog);
	}

	// Normal visit
	const visit: Visit = { darts: [], dartsAtDouble: 0, bust: false };
	const updatedPlayers = state.players.map((p, i) =>
		i === playerIdx
			? { ...p, remaining: newRemaining, visits: [...p.visits, visit] }
			: p
	);

	return {
		...state,
		players: updatedPlayers,
		activePlayerIndex: nextPlayerIndex(playerIdx, updatedPlayers.length),
		currentVisit: [],
		eventLog: newLog,
	};
}

// ── Leg/set win helpers ────────────────────────────────────────────────────

function handleLegWinFromPlayers(
	state: MatchState,
	players: PlayerState[],
	playerIdx: number,
	newLog: MatchAction[]
): MatchState {
	const winner = players[playerIdx];
	const config = state.config;
	const numPlayers = players.length;

	const legsWon = winner.legsWon;

	if (legsWon >= config.legsToWin) {
		if (config.setsEnabled) {
			const newSetsWon = winner.setsWon + 1;
			const updatedPlayers = players.map((p, i) => ({
				...p,
				legsWon: 0,
				remaining: config.startScore,
				setsWon: i === playerIdx ? newSetsWon : p.setsWon,
			}));
			if (newSetsWon >= config.setsToWin) {
				return {
					...state,
					players: updatedPlayers,
					activePlayerIndex: playerIdx,
					currentVisit: [],
					phase: 'match-complete',
					eventLog: newLog,
				};
			}
			// Won a set but not the match — start next set
			const totalLegsCompleted = 0; // reset after set win
			const nextLegStarter = legStarterIndex(totalLegsCompleted, numPlayers);
			return {
				...state,
				players: updatedPlayers,
				activePlayerIndex: nextLegStarter,
				legStarterIndex: nextLegStarter,
				currentVisit: [],
				phase: 'playing',
				eventLog: newLog,
			};
		} else {
			// No sets — match complete
			return {
				...state,
				players,
				activePlayerIndex: playerIdx,
				currentVisit: [],
				phase: 'match-complete',
				eventLog: newLog,
			};
		}
	}

	// Leg won but not match: advance to next leg
	// Total legs completed = sum of all legsWon
	const totalLegsCompleted = players.reduce((sum, p) => sum + p.legsWon, 0);
	const nextLegStarter = legStarterIndex(totalLegsCompleted, numPlayers);

	// Reset all players' remaining for the new leg
	const resetPlayers = players.map(p => ({ ...p, remaining: config.startScore }));

	return {
		...state,
		players: resetPlayers,
		activePlayerIndex: nextLegStarter,
		legStarterIndex: nextLegStarter,
		currentVisit: [],
		phase: 'playing',
		eventLog: newLog,
	};
}
