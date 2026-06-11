// src/engine/types.ts
// Canonical type definitions for the X01 match engine.
// Plans 03, 04, and Phase 3 all import from here — DO NOT rename fields.

export type OutRule = 'single' | 'double';

export interface DartScore {
	multiplier: 1 | 2 | 3;
	segment: number; // 0=miss, 1-20, 25=outer bull or inner bull (inner bull uses multiplier:2, segment:25 = 50 pts)
}

export interface Visit {
	darts: DartScore[];
	dartsAtDouble: number;
	bust: boolean;
}

export interface PlayerState {
	id: string;
	name: string;
	isGuest: boolean;
	remaining: number;
	legsWon: number;
	setsWon: number;
	visits: Visit[];
}

export interface MatchConfig {
	startScore: 301 | 401 | 501;
	outRule: OutRule;
	legsToWin: number;
	setsEnabled: boolean;
	setsToWin: number;
}

export interface MatchState {
	config: MatchConfig;
	players: PlayerState[];
	activePlayerIndex: number;
	legStarterIndex: number;
	currentVisit: DartScore[];
	phase: 'setup' | 'playing' | 'leg-complete' | 'match-complete';
	eventLog: MatchAction[];
	legStartVisitIndex: Record<string, number>;
}

export type MatchAction =
	| { type: 'START_MATCH'; config: MatchConfig; players: Omit<PlayerState, 'remaining' | 'legsWon' | 'setsWon' | 'visits'>[]; order: string[] }
	| { type: 'DART_THROWN'; dart: DartScore }
	| { type: 'NUMPAD_VISIT'; total: number; dartsUsed?: 1 | 2 | 3; dartsAtDouble?: number }
	| { type: 'CONFIRM_VISIT' }
	| { type: 'UNDO' };
