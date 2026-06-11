// src/stores/display.svelte.test.ts
// Unit tests for DisplayStore: localStorage hydration + BroadcastChannel subscription.
// Runs in the `unit` vitest project (node environment).
// BroadcastChannel and localStorage are mocked below.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DisplayStore } from './display.svelte.js';
import type { MatchState } from '../engine/types.js';

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
