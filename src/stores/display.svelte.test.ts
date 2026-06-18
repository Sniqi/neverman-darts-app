// src/stores/display.svelte.test.ts
// Unit tests for DisplayStore: localStorage hydration + BroadcastChannel subscription.
// Runs in the `unit` vitest project (node environment).
// BroadcastChannel and localStorage are mocked below.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DisplayStore } from './display.svelte.js';
import type { MatchState } from '../engine/types.js';
import type { CastDisplayState } from '../lib/cast-types.js';

// ── Minimal MatchState fixture ─────────────────────────────────────────────

const sampleState: MatchState = {
	config: {
		startScore: 501,
		outRule: 'double',
		legsToWin: 3,
		setsEnabled: false,
		setsToWin: 1,
	},
	players: [
		{
			id: 'p1',
			name: 'Alice',
			isGuest: false,
			remaining: 441,
			legsWon: 0,
			setsWon: 0,
			visits: [],
		},
	],
	activePlayerIndex: 0,
	legStarterIndex: 0,
	currentVisit: [],
	phase: 'playing',
	eventLog: [],
	legStartVisitIndex: { p1: 0 },
};

// ── BroadcastChannel mock ──────────────────────────────────────────────────

type MessageHandler = (event: MessageEvent) => void;

class MockBroadcastChannel {
	static instances: MockBroadcastChannel[] = [];
	name: string;
	closed = false;
	private listeners: MessageHandler[] = [];

	constructor(name: string) {
		this.name = name;
		MockBroadcastChannel.instances.push(this);
	}

	addEventListener(_type: string, handler: MessageHandler) {
		this.listeners.push(handler);
	}

	removeEventListener(_type: string, handler: MessageHandler) {
		this.listeners = this.listeners.filter(l => l !== handler);
	}

	postMessage(data: unknown) {
		// Dispatch to all OTHER instances on the same channel (BroadcastChannel
		// does not deliver to the sender — but for tests we trigger via simulateMessage)
		for (const inst of MockBroadcastChannel.instances) {
			if (inst !== this && inst.name === this.name && !inst.closed) {
				inst._dispatch(data);
			}
		}
	}

	_dispatch(data: unknown) {
		const evt = { data } as MessageEvent;
		for (const l of this.listeners) l(evt);
	}

	close() {
		this.closed = true;
		MockBroadcastChannel.instances = MockBroadcastChannel.instances.filter(i => i !== this);
	}
}

// ── localStorage mock ──────────────────────────────────────────────────────

const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] ?? null,
		setItem: (key: string, value: string) => { store[key] = value; },
		removeItem: (key: string) => { delete store[key]; },
		clear: () => { store = {}; },
	};
})();

// ── Setup globals ──────────────────────────────────────────────────────────

beforeEach(() => {
	MockBroadcastChannel.instances = [];
	localStorageMock.clear();
	// Install globals
	vi.stubGlobal('BroadcastChannel', MockBroadcastChannel);
	vi.stubGlobal('localStorage', localStorageMock);
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe('DisplayStore', () => {
	it('starts with state === null', () => {
		const store = new DisplayStore();
		expect(store.state).toBeNull();
	});

	it('connect() hydrates state from a pre-seeded localStorage snapshot', () => {
		localStorageMock.setItem('neverman-match-snapshot', JSON.stringify(sampleState));
		const store = new DisplayStore();
		const cleanup = store.connect();
		expect(store.state).toEqual(sampleState);
		cleanup();
	});

	it('connect() with a corrupt/invalid JSON snapshot does NOT throw and leaves state null', () => {
		localStorageMock.setItem('neverman-match-snapshot', 'NOT VALID JSON {{{');
		const store = new DisplayStore();
		expect(() => {
			const cleanup = store.connect();
			cleanup();
		}).not.toThrow();
		// State must remain null — corrupt snapshot should not crash
		const store2 = new DisplayStore();
		const cleanup2 = store2.connect();
		expect(store2.state).toBeNull();
		cleanup2();
	});

	it('connect() with missing localStorage key leaves state null', () => {
		const store = new DisplayStore();
		const cleanup = store.connect();
		expect(store.state).toBeNull();
		cleanup();
	});

	it('after connect(), a BroadcastChannel message updates store.state', async () => {
		const store = new DisplayStore();
		const cleanup = store.connect();

		// Get the channel instance that connect() created
		const channel = MockBroadcastChannel.instances.find(
			c => c.name === 'neverman-match'
		)!;
		expect(channel).toBeDefined();

		// Simulate an incoming message with new state
		const newState: MatchState = { ...sampleState, activePlayerIndex: 0 };
		channel._dispatch(newState);

		// State should be updated
		expect(store.state).toEqual(newState);
		cleanup();
	});

	it('cleanup function closes the channel; the channel is marked closed', () => {
		const store = new DisplayStore();
		const cleanup = store.connect();

		const channel = MockBroadcastChannel.instances.find(
			c => c.name === 'neverman-match'
		)!;
		expect(channel).toBeDefined();
		expect(channel.closed).toBe(false);

		// Call cleanup — should close the channel
		cleanup();
		expect(channel.closed).toBe(true);

		// After cleanup, the channel is removed from instances
		expect(MockBroadcastChannel.instances).not.toContain(channel);
	});

	it('after cleanup, postMessage from another channel does not update state', () => {
		const store = new DisplayStore();
		const cleanup = store.connect();

		// Call cleanup first
		cleanup();

		const stateBefore = store.state;

		// A new sender on the same channel name should not reach the closed subscriber
		const sender = new MockBroadcastChannel('neverman-match');
		sender.postMessage({ ...sampleState, activePlayerIndex: 99 });
		sender.close();

		// Since our store's channel was closed and removed from instances,
		// postMessage finds no matching instances to deliver to
		expect(store.state).toBe(stateBefore);
	});

	it('uses exact channel name "neverman-match"', () => {
		const store = new DisplayStore();
		const cleanup = store.connect();
		const channel = MockBroadcastChannel.instances[0];
		expect(channel?.name).toBe('neverman-match');
		cleanup();
	});

	it('reads localStorage key "neverman-match-snapshot"', () => {
		const getSpy = vi.spyOn(localStorageMock, 'getItem');
		const store = new DisplayStore();
		const cleanup = store.connect();
		expect(getSpy).toHaveBeenCalledWith('neverman-match-snapshot');
		cleanup();
	});
});

// ── receiveSnapshot (SYNC-01, SYNC-03, RECV-03, T-07-IV) ──────────────────

/** Minimal valid CastDisplayState fixture for receiveSnapshot tests. */
const sampleCastState: CastDisplayState = {
	config: {
		startScore: 501,
		outRule: 'double',
		legsToWin: 3,
		setsEnabled: false,
		setsToWin: 1,
	},
	players: [
		{
			id: 'p1',
			name: 'Alice',
			remaining: 441,
			legsWon: 0,
			setsWon: 0,
			visits: [],
		},
	],
	activePlayerIndex: 0,
	currentVisit: [],
	phase: 'playing',
	legStartVisitIndex: { p1: 0 },
	pauseActive: false,
	pauseRemainingSeconds: 0,
};

describe('DisplayStore.receiveSnapshot', () => {
	it('sets state to the payload on a valid CastDisplayState (SYNC-01)', () => {
		const store = new DisplayStore();
		store.receiveSnapshot(sampleCastState);
		// receiveSnapshot pads CastDisplayState to MatchState (CR-01): isGuest, legCompleted,
		// legStarterIndex, eventLog are added with safe defaults. Verify transmitted fields
		// are preserved and padded fields are defined.
		expect(store.state).toEqual(expect.objectContaining({
			config: sampleCastState.config,
			activePlayerIndex: sampleCastState.activePlayerIndex,
			currentVisit: sampleCastState.currentVisit,
			phase: sampleCastState.phase,
			legStartVisitIndex: sampleCastState.legStartVisitIndex,
			legStarterIndex: 0,
			eventLog: [],
		}));
		expect(store.state?.players[0]).toEqual(expect.objectContaining({
			id: 'p1',
			name: 'Alice',
			isGuest: false,
			legCompleted: [],
		}));
	});

	it('sets pauseActive and pauseRemainingSeconds from the payload (SYNC-03)', () => {
		const store = new DisplayStore();
		const withPause: CastDisplayState = {
			...sampleCastState,
			pauseActive: true,
			pauseRemainingSeconds: 42,
		};
		store.receiveSnapshot(withPause);
		expect(store.pauseActive).toBe(true);
		expect(store.pauseRemainingSeconds).toBe(42);
	});

	it('leaves state unchanged on an invalid payload (T-07-IV)', () => {
		const store = new DisplayStore();
		// Set a valid state first
		store.receiveSnapshot(sampleCastState);
		const stateBefore = store.state;

		// Attempt to inject invalid payload (empty players array — fails isValidCastState)
		const invalid = { ...sampleCastState, players: [] } as unknown as CastDisplayState;
		store.receiveSnapshot(invalid);

		// State must be unchanged
		expect(store.state).toEqual(stateBefore);
	});

	it('leaves state unchanged on a malformed non-null payload (T-07-IV)', () => {
		const store = new DisplayStore();
		// Establish a known-good state first.
		store.receiveSnapshot(sampleCastState);
		const stateBefore = store.state;

		// A non-null but structurally malformed payload (wrong shape, no players/config)
		// must be rejected by isValidCastState before it can reach this.state.
		const malformed = { not: 'a cast state' } as unknown as CastDisplayState;
		store.receiveSnapshot(malformed);

		// State is unchanged — the guard rejected the malformed payload.
		expect(store.state).toEqual(stateBefore);
	});

	it('sets state to null and clears pause on null (RECV-03 idle on disconnect)', () => {
		const store = new DisplayStore();
		store.receiveSnapshot(sampleCastState);
		expect(store.state).not.toBeNull();

		store.receiveSnapshot(null);
		expect(store.state).toBeNull();
		expect(store.pauseActive).toBe(false);
		expect(store.pauseRemainingSeconds).toBe(0);
	});

	it('rejects activePlayerIndex out of range (T-07-IV guard)', () => {
		const store = new DisplayStore();
		store.receiveSnapshot(sampleCastState);
		const stateBefore = store.state;

		const outOfRange: CastDisplayState = { ...sampleCastState, activePlayerIndex: 99 };
		store.receiveSnapshot(outOfRange);
		expect(store.state).toEqual(stateBefore);
	});
});
