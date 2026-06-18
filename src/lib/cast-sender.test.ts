// src/lib/cast-sender.test.ts
// Full state-machine unit tests for CastSenderManager (Plan 07-03, RED phase).
//
// The Cast SDK is absent in Node, so we assign a mock onto globalThis before
// exercising the manager — the same global-mock approach used throughout the
// project's unit test suite (see test-setup-node.ts and display.test.ts).
//
// Each test instantiates a fresh `new CastSenderManager()` (never the singleton)
// and cleans up globalThis after each test.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CAST_NS } from './sync-constants.js';
import type { CastDisplayState } from './cast-types.js';

// ── Mock Cast SDK ─────────────────────────────────────────────────────────────

/** Recorded setOptions calls for assertion. */
let capturedSetOptionsArg: Record<string, unknown> | null = null;

/** Registered SESSION_STATE_CHANGED handler captured from addEventListener. */
let registeredSessionHandler: ((event: MockSessionStateEvent) => void) | null = null;

interface MockSessionStateEvent {
	sessionState: string;
	session: MockCastSession | null;
}

interface MockCastDevice {
	friendlyName: string;
}

interface MockCastSession {
	getCastDevice(): MockCastDevice;
	sendMessage: ReturnType<typeof vi.fn>;
}

function makeMockSession(friendlyName = 'Wohnzimmer TV'): MockCastSession {
	return {
		getCastDevice: () => ({ friendlyName }),
		sendMessage: vi.fn().mockResolvedValue(undefined),
	};
}

function buildCastMock() {
	capturedSetOptionsArg = null;
	registeredSessionHandler = null;

	const mockCastContext = {
		setOptions: vi.fn((opts: Record<string, unknown>) => {
			capturedSetOptionsArg = opts;
		}),
		addEventListener: vi.fn(
			(_type: string, handler: (event: MockSessionStateEvent) => void) => {
				registeredSessionHandler = handler;
			},
		),
		getCurrentSession: vi.fn(() => null as MockCastSession | null),
	};

	const mockFramework = {
		CastContext: {
			getInstance: vi.fn(() => mockCastContext),
		},
		CastContextEventType: {
			SESSION_STATE_CHANGED: 'sessionstatechanged',
		},
		SessionState: {
			SESSION_STARTED: 'SESSION_STARTED',
			SESSION_ENDED: 'SESSION_ENDED',
			SESSION_RESUMED: 'SESSION_RESUMED',
		},
	};

	const mockChrome = {
		cast: {
			AutoJoinPolicy: {
				ORIGIN_SCOPED: 'origin_scoped',
			},
		},
	};

	return { mockCastContext, mockFramework, mockChrome };
}

/** Helper: dispatch a SESSION_STATE_CHANGED event to the registered listener. */
function fireSessionState(
	state: string,
	session: MockCastSession | null,
	mockCastContext: { getCurrentSession: ReturnType<typeof vi.fn> },
): void {
	if (!registeredSessionHandler) {
		throw new Error('No SESSION_STATE_CHANGED handler registered — did you call init()?');
	}
	mockCastContext.getCurrentSession.mockReturnValue(session);
	registeredSessionHandler({ sessionState: state, session });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CastSenderManager', () => {
	let mocks: ReturnType<typeof buildCastMock>;

	beforeEach(() => {
		mocks = buildCastMock();
		// Assign the mock SDK onto globalThis BEFORE importing the manager
		(globalThis as Record<string, unknown>).cast = { framework: mocks.mockFramework };
		(globalThis as Record<string, unknown>).chrome = mocks.mockChrome;
		// Stub document.createElement + document.head.appendChild so init() can
		// inject the SDK script without a real DOM
		(globalThis as Record<string, unknown>).document = {
			createElement: vi.fn(() => ({ src: '' })),
			head: { appendChild: vi.fn() },
		};
		// Stub window (globalThis IS window in the test; expose separately for clarity)
		(globalThis as Record<string, unknown>).window = globalThis;
	});

	afterEach(() => {
		delete (globalThis as Record<string, unknown>).cast;
		delete (globalThis as Record<string, unknown>).chrome;
		delete (globalThis as Record<string, unknown>).document;
		delete (globalThis as Record<string, unknown>).window;
		delete (globalThis as Record<string, unknown>).__onGCastApiAvailable;
	});

	// ── Initial state ─────────────────────────────────────────────────────────

	it('initial: castAvailable is false before init()', async () => {
		const { CastSenderManager } = await import('./cast-sender.svelte.js');
		const manager = new CastSenderManager();
		expect(manager.castAvailable).toBe(false);
	});

	it('initial: activeSession is null before init()', async () => {
		const { CastSenderManager } = await import('./cast-sender.svelte.js');
		const manager = new CastSenderManager();
		expect(manager.activeSession).toBeNull();
	});

	// ── Load-order safety (Pitfall 2) ─────────────────────────────────────────

	it('load-order: __onGCastApiAvailable is a function immediately after init()', async () => {
		const { CastSenderManager } = await import('./cast-sender.svelte.js');
		const manager = new CastSenderManager();
		manager.init('test-app-id');
		expect(typeof (globalThis as Record<string, unknown>).__onGCastApiAvailable).toBe('function');
	});

	// ── Availability: non-Chrome path (CAST-04) ───────────────────────────────

	it('availability: __onGCastApiAvailable(false) leaves castAvailable false', async () => {
		const { CastSenderManager } = await import('./cast-sender.svelte.js');
		const manager = new CastSenderManager();
		manager.init('test-app-id');
		(globalThis as Record<string, unknown>).__onGCastApiAvailable(false);
		expect(manager.castAvailable).toBe(false);
	});

	// ── Availability: Chrome path (CAST-04) ───────────────────────────────────

	it('availability: __onGCastApiAvailable(true) sets castAvailable to true', async () => {
		const { CastSenderManager } = await import('./cast-sender.svelte.js');
		const manager = new CastSenderManager();
		manager.init('test-app-id');
		(globalThis as Record<string, unknown>).__onGCastApiAvailable(true);
		expect(manager.castAvailable).toBe(true);
	});

	// ── App ID + auto-join policy (CAST-05, SETUP-02) ─────────────────────────

	it('options: setOptions called with the appId passed to init() — not a literal', async () => {
		const { CastSenderManager } = await import('./cast-sender.svelte.js');
		const manager = new CastSenderManager();
		const appId = 'ABCD1234';
		manager.init(appId);
		(globalThis as Record<string, unknown>).__onGCastApiAvailable(true);
		expect(capturedSetOptionsArg).not.toBeNull();
		expect(capturedSetOptionsArg?.receiverApplicationId).toBe(appId);
	});

	it('options: setOptions uses ORIGIN_SCOPED auto-join policy (CAST-05)', async () => {
		const { CastSenderManager } = await import('./cast-sender.svelte.js');
		const manager = new CastSenderManager();
		manager.init('any-id');
		(globalThis as Record<string, unknown>).__onGCastApiAvailable(true);
		expect(capturedSetOptionsArg?.autoJoinPolicy).toBe('origin_scoped');
	});

	// ── Session transitions (CAST-02) ─────────────────────────────────────────

	it('session: SESSION_STARTED sets activeSession to the current session', async () => {
		const { CastSenderManager } = await import('./cast-sender.svelte.js');
		const manager = new CastSenderManager();
		manager.init('app-id');
		(globalThis as Record<string, unknown>).__onGCastApiAvailable(true);

		const mockSession = makeMockSession();
		fireSessionState('SESSION_STARTED', mockSession, mocks.mockCastContext);
		expect(manager.activeSession).toBe(mockSession);
	});

	it('session: SESSION_ENDED clears activeSession to null', async () => {
		const { CastSenderManager } = await import('./cast-sender.svelte.js');
		const manager = new CastSenderManager();
		manager.init('app-id');
		(globalThis as Record<string, unknown>).__onGCastApiAvailable(true);

		const mockSession = makeMockSession();
		fireSessionState('SESSION_STARTED', mockSession, mocks.mockCastContext);
		expect(manager.activeSession).toBe(mockSession);

		fireSessionState('SESSION_ENDED', null, mocks.mockCastContext);
		expect(manager.activeSession).toBeNull();
	});

	// ── Resume signal (CAST-06) ───────────────────────────────────────────────

	it('resume: SESSION_RESUMED sets activeSession', async () => {
		const { CastSenderManager } = await import('./cast-sender.svelte.js');
		const manager = new CastSenderManager();
		manager.init('app-id');
		(globalThis as Record<string, unknown>).__onGCastApiAvailable(true);

		const mockSession = makeMockSession('Schlafzimmer');
		fireSessionState('SESSION_RESUMED', mockSession, mocks.mockCastContext);
		expect(manager.activeSession).toBe(mockSession);
	});

	it('resume: SESSION_RESUMED raises the one-shot resume signal with device friendlyName', async () => {
		const { CastSenderManager } = await import('./cast-sender.svelte.js');
		const manager = new CastSenderManager();
		manager.init('app-id');
		(globalThis as Record<string, unknown>).__onGCastApiAvailable(true);

		const deviceName = 'Küche TV';
		const mockSession = makeMockSession(deviceName);
		fireSessionState('SESSION_RESUMED', mockSession, mocks.mockCastContext);

		// Signal should carry the device friendlyName
		expect(manager.resumeDeviceName).toBe(deviceName);
	});

	it('resume: consumeResumeSignal() returns the name and then resets to null (one-shot)', async () => {
		const { CastSenderManager } = await import('./cast-sender.svelte.js');
		const manager = new CastSenderManager();
		manager.init('app-id');
		(globalThis as Record<string, unknown>).__onGCastApiAvailable(true);

		const mockSession = makeMockSession('Wohnzimmer TV');
		fireSessionState('SESSION_RESUMED', mockSession, mocks.mockCastContext);

		// First read returns the name
		const name = manager.consumeResumeSignal();
		expect(name).toBe('Wohnzimmer TV');

		// Second read returns null — signal consumed
		const name2 = manager.consumeResumeSignal();
		expect(name2).toBeNull();
	});

	it('resume: SESSION_STARTED does NOT set the resume signal', async () => {
		const { CastSenderManager } = await import('./cast-sender.svelte.js');
		const manager = new CastSenderManager();
		manager.init('app-id');
		(globalThis as Record<string, unknown>).__onGCastApiAvailable(true);

		const mockSession = makeMockSession('TV');
		fireSessionState('SESSION_STARTED', mockSession, mocks.mockCastContext);
		expect(manager.resumeDeviceName).toBeNull();
	});

	// ── sendSnapshot guard ────────────────────────────────────────────────────

	it('sendSnapshot: is a no-op when activeSession is null (does not throw)', async () => {
		const { CastSenderManager } = await import('./cast-sender.svelte.js');
		const manager = new CastSenderManager();
		const payload = { players: [], activePlayerIndex: 0 } as unknown as CastDisplayState;
		expect(() => manager.sendSnapshot(payload)).not.toThrow();
	});

	it('sendSnapshot: calls session.sendMessage(CAST_NS, {type:"snapshot", ...payload}) with an active session', async () => {
		const { CastSenderManager } = await import('./cast-sender.svelte.js');
		const manager = new CastSenderManager();
		manager.init('app-id');
		(globalThis as Record<string, unknown>).__onGCastApiAvailable(true);

		const mockSession = makeMockSession();
		fireSessionState('SESSION_STARTED', mockSession, mocks.mockCastContext);

		const payload = {
			players: [{ id: 'p1', name: 'Alice', remaining: 301, legsWon: 0, setsWon: 0, visits: [] }],
			activePlayerIndex: 0,
		} as unknown as CastDisplayState;
		manager.sendSnapshot(payload);

		// Must carry the `type: 'snapshot'` discriminant the receiver requires (cast-receiver.ts).
		expect(mockSession.sendMessage).toHaveBeenCalledOnce();
		expect(mockSession.sendMessage).toHaveBeenCalledWith(CAST_NS, { type: 'snapshot', ...payload });
	});

	it('sendSnapshot: swallows errors from session.sendMessage (non-fatal contract)', async () => {
		const { CastSenderManager } = await import('./cast-sender.svelte.js');
		const manager = new CastSenderManager();
		manager.init('app-id');
		(globalThis as Record<string, unknown>).__onGCastApiAvailable(true);

		const mockSession = makeMockSession();
		mockSession.sendMessage.mockImplementation(() => {
			throw new Error('Cast SDK error');
		});
		fireSessionState('SESSION_STARTED', mockSession, mocks.mockCastContext);

		const payload = { players: [], activePlayerIndex: 0 } as unknown as CastDisplayState;
		expect(() => manager.sendSnapshot(payload)).not.toThrow();
	});
});
