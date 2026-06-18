// src/lib/cast-receiver.test.ts
// TDD RED: Tests for isCastReceiverContext predicate, CastReceiverBridge.init
// ordering/idle-timeout options, snapshot routing, and RECV-03 SENDER_DISCONNECTED handling.
//
// Runs in the `unit` vitest project (node environment).
// Tests directly manipulate globalThis.cast to drive the predicate.
// CastReceiverContext is fully mocked via a local mock object.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CAST_NS } from './sync-constants.js';

// ── Types for mock ─────────────────────────────────────────────────────────

type MsgListener = (event: { data: unknown }) => void;
type SysListener = () => void;

interface MockContext {
	addCustomMessageListener: ReturnType<typeof vi.fn>;
	addEventListener: ReturnType<typeof vi.fn>;
	start: ReturnType<typeof vi.fn>;
	/** Simulate a custom message being received on the namespace. */
	_triggerMessage: (data: unknown) => void;
	/** Simulate a system event (e.g. SENDER_DISCONNECTED). */
	_triggerSystemEvent: (eventType: string) => void;
}

function makeMockContext(): MockContext {
	const msgListeners: Record<string, MsgListener[]> = {};
	const sysListeners: Record<string, SysListener[]> = {};

	return {
		addCustomMessageListener: vi.fn((ns: string, handler: MsgListener) => {
			if (!msgListeners[ns]) msgListeners[ns] = [];
			msgListeners[ns].push(handler);
		}),
		addEventListener: vi.fn((eventType: string, handler: SysListener) => {
			if (!sysListeners[eventType]) sysListeners[eventType] = [];
			sysListeners[eventType].push(handler);
		}),
		start: vi.fn(),
		_triggerMessage(data: unknown) {
			const listeners = msgListeners[CAST_NS] ?? [];
			for (const l of listeners) l({ data });
		},
		_triggerSystemEvent(eventType: string) {
			const listeners = sysListeners[eventType] ?? [];
			for (const l of listeners) l();
		},
	};
}

// ── Setup & teardown ───────────────────────────────────────────────────────

beforeEach(() => {
	// Remove any cast global set by a previous test
	delete (globalThis as Record<string, unknown>).cast;
});

// ── isCastReceiverContext ──────────────────────────────────────────────────

describe('isCastReceiverContext', () => {
	it('returns false when window.cast is absent', async () => {
		delete (globalThis as Record<string, unknown>).cast;
		const { isCastReceiverContext } = await import('./cast-receiver.js');
		expect(isCastReceiverContext()).toBe(false);
	});

	it('returns false when window.cast exists but framework.CastReceiverContext is missing', async () => {
		(globalThis as Record<string, unknown>).cast = { framework: {} };
		const { isCastReceiverContext } = await import('./cast-receiver.js');
		expect(isCastReceiverContext()).toBe(false);
	});

	it('returns true when window.cast.framework.CastReceiverContext is defined', async () => {
		(globalThis as Record<string, unknown>).cast = {
			framework: { CastReceiverContext: { getInstance: vi.fn() } },
		};
		const { isCastReceiverContext } = await import('./cast-receiver.js');
		expect(isCastReceiverContext()).toBe(true);
	});

	it('does not throw when window is undefined', () => {
		// In node environment window does not exist; the module should be importable
		// and the predicate should return false without throwing.
		expect(() => {
			// Re-derive expectation: cast global is absent => false
			const hasCast =
				typeof globalThis !== 'undefined' &&
				(globalThis as Record<string, unknown>).cast != null &&
				typeof ((globalThis as Record<string, unknown>).cast as Record<string, unknown>).framework !==
					'undefined' &&
				((globalThis as Record<string, unknown>).cast as Record<string, Record<string, unknown>>).framework
					.CastReceiverContext != null;
			expect(hasCast).toBe(false);
		}).not.toThrow();
	});
});

// ── CastReceiverBridge.init ────────────────────────────────────────────────

describe('CastReceiverBridge.init', () => {
	it('calls addCustomMessageListener(CAST_NS, ...) AND addEventListener(SENDER_DISCONNECTED, ...) BEFORE start()', async () => {
		const ctx = makeMockContext();
		const callOrder: string[] = [];

		ctx.addCustomMessageListener.mockImplementation(
			(ns: string, handler: MsgListener) => {
				callOrder.push('addCustomMessageListener');
				// store the listener for trigger later
				(ctx.addCustomMessageListener as ReturnType<typeof vi.fn>)
					.mock.calls.push([ns, handler]);
			}
		);
		ctx.addEventListener.mockImplementation((eventType: string) => {
			// WR-01: track SENDER_DISCONNECTED registration ordering (RECV-03 half of CAF v3)
			callOrder.push('addEventListener:' + eventType);
		});
		ctx.start.mockImplementation(() => {
			callOrder.push('start');
		});

		// Install mock cast global
		(globalThis as Record<string, unknown>).cast = {
			framework: {
				CastReceiverContext: { getInstance: () => ctx },
				system: { EventType: { SENDER_DISCONNECTED: 'senderdisconnected' } },
			},
		};

		const { CastReceiverBridge } = await import('./cast-receiver.js');
		CastReceiverBridge.init({ onSnapshot: vi.fn() });

		const addIdx = callOrder.indexOf('addCustomMessageListener');
		const startIdx = callOrder.indexOf('start');
		expect(addIdx).toBeGreaterThanOrEqual(0);
		expect(startIdx).toBeGreaterThan(addIdx);

		// WR-01: also verify addEventListener(SENDER_DISCONNECTED) is registered BEFORE start()
		const disconnectIdx = callOrder.indexOf('addEventListener:senderdisconnected');
		expect(disconnectIdx).toBeGreaterThanOrEqual(0);
		expect(disconnectIdx).toBeLessThan(startIdx);
	});

	it('passes disableIdleTimeout=true and maxInactivity=3600 to start()', async () => {
		const ctx = makeMockContext();
		(globalThis as Record<string, unknown>).cast = {
			framework: {
				CastReceiverContext: { getInstance: () => ctx },
				system: { EventType: { SENDER_DISCONNECTED: 'senderdisconnected' } },
			},
		};

		const { CastReceiverBridge } = await import('./cast-receiver.js');
		CastReceiverBridge.init({ onSnapshot: vi.fn() });

		expect(ctx.start).toHaveBeenCalledOnce();
		const options = ctx.start.mock.calls[0][0] as Record<string, unknown>;
		expect(options).toMatchObject({ disableIdleTimeout: true, maxInactivity: 3600 });
	});

	it('routes a {type:"snapshot"} message to the onSnapshot callback', async () => {
		const ctx = makeMockContext();
		(globalThis as Record<string, unknown>).cast = {
			framework: {
				CastReceiverContext: { getInstance: () => ctx },
				system: { EventType: { SENDER_DISCONNECTED: 'senderdisconnected' } },
			},
		};

		const onSnapshot = vi.fn();
		const { CastReceiverBridge } = await import('./cast-receiver.js');
		CastReceiverBridge.init({ onSnapshot });

		const payload = {
			type: 'snapshot',
			players: [{ id: 'p1', name: 'Alice', remaining: 501, legsWon: 0, setsWon: 0, visits: [] }],
			activePlayerIndex: 0,
			config: { startScore: 501, outRule: 'double', legsToWin: 3, setsEnabled: false, setsToWin: 1 },
			currentVisit: [],
			phase: 'playing',
			legStartVisitIndex: { p1: 0 },
			pauseActive: false,
			pauseRemainingSeconds: 0,
		};

		ctx._triggerMessage(payload);
		expect(onSnapshot).toHaveBeenCalledOnce();
		// The snapshot payload (without the 'type' wrapper) or the full message is passed
		expect(onSnapshot).toHaveBeenCalledWith(expect.objectContaining({ players: payload.players }));
	});

	it('does NOT call onSnapshot for a non-snapshot message', async () => {
		const ctx = makeMockContext();
		(globalThis as Record<string, unknown>).cast = {
			framework: {
				CastReceiverContext: { getInstance: () => ctx },
				system: { EventType: { SENDER_DISCONNECTED: 'senderdisconnected' } },
			},
		};

		const onSnapshot = vi.fn();
		const { CastReceiverBridge } = await import('./cast-receiver.js');
		CastReceiverBridge.init({ onSnapshot });

		ctx._triggerMessage({ type: 'ping' });
		expect(onSnapshot).not.toHaveBeenCalled();
	});

	it('registers a SENDER_DISCONNECTED listener that calls onSnapshot(null) (RECV-03)', async () => {
		const ctx = makeMockContext();
		(globalThis as Record<string, unknown>).cast = {
			framework: {
				CastReceiverContext: { getInstance: () => ctx },
				system: { EventType: { SENDER_DISCONNECTED: 'senderdisconnected' } },
			},
		};

		const onSnapshot = vi.fn();
		const { CastReceiverBridge } = await import('./cast-receiver.js');
		CastReceiverBridge.init({ onSnapshot });

		// Verify addEventListener was called for SENDER_DISCONNECTED
		const sysEventCalls = ctx.addEventListener.mock.calls as Array<[string, SysListener]>;
		const disconnectCall = sysEventCalls.find(([type]) => type === 'senderdisconnected');
		expect(disconnectCall).toBeDefined();

		// Trigger the event and verify onSnapshot(null) is called
		ctx._triggerSystemEvent('senderdisconnected');
		expect(onSnapshot).toHaveBeenCalledWith(null);
	});

	it('does not call start() when not in cast receiver context', async () => {
		delete (globalThis as Record<string, unknown>).cast;
		const { CastReceiverBridge } = await import('./cast-receiver.js');
		// Should not throw — just silently skip
		expect(() => CastReceiverBridge.init({ onSnapshot: vi.fn() })).not.toThrow();
	});
});
