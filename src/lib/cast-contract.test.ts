// src/lib/cast-contract.test.ts
// Integration/contract test bridging the Cast SENDER and RECEIVER.
//
// Regression guard for the snapshot-discriminant contract (UAT 07, RECV-01 blocker):
// the sender MUST tag outgoing messages with `type: 'snapshot'`, which is exactly the
// discriminant the receiver's addCustomMessageListener handler requires. The original
// unit tests checked each side in isolation — the sender test asserted a BARE payload,
// the receiver test fed an already-tagged payload — so the mismatch slipped through and
// the receiver silently dropped every snapshot (TV stuck on "Warten auf Match").
//
// This test feeds the EXACT message the sender emits into the receiver's real handler.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { CAST_NS } from './sync-constants.js';
import type { CastDisplayState } from './cast-types.js';

afterEach(() => {
	delete (globalThis as Record<string, unknown>).cast;
});

describe('Cast sender ↔ receiver snapshot contract', () => {
	it('a snapshot emitted by the sender is accepted and routed by the receiver', async () => {
		// ── 1) SENDER: capture the exact message sendSnapshot() emits ──────────────
		const { CastSenderManager } = await import('./cast-sender.svelte.js');
		const manager = new CastSenderManager();
		const sendMessage = vi.fn();
		// activeSession is a public reactive field; assign a capturing stub directly so
		// we exercise the real message-construction path without the full Cast SDK.
		(manager as unknown as { activeSession: { sendMessage: typeof sendMessage } }).activeSession =
			{ sendMessage };

		const payload: CastDisplayState = {
			config: { startScore: 501, outRule: 'double', legsToWin: 3, setsEnabled: false, setsToWin: 1 },
			players: [{ id: 'p1', name: 'Alice', remaining: 420, legsWon: 0, setsWon: 0, visits: [] }],
			activePlayerIndex: 0,
			currentVisit: [],
			phase: 'playing',
			legStartVisitIndex: { p1: 0 },
			pauseActive: false,
			pauseRemainingSeconds: 0,
		};

		manager.sendSnapshot(payload);

		expect(sendMessage).toHaveBeenCalledOnce();
		const [ns, emitted] = sendMessage.mock.calls[0] as [string, { type?: string }];
		expect(ns).toBe(CAST_NS);
		// The discriminant the receiver REQUIRES (the bug: this was missing).
		expect(emitted.type).toBe('snapshot');

		// ── 2) RECEIVER: feed the sender's emitted message through the real bridge ──
		const msgListeners: Record<string, ((e: { data: unknown }) => void)[]> = {};
		const ctx = {
			addCustomMessageListener: vi.fn(
				(nsArg: string, handler: (e: { data: unknown }) => void) => {
					(msgListeners[nsArg] ??= []).push(handler);
				},
			),
			addEventListener: vi.fn(),
			start: vi.fn(),
		};
		(globalThis as Record<string, unknown>).cast = {
			framework: {
				CastReceiverContext: { getInstance: () => ctx },
				system: { EventType: { SENDER_DISCONNECTED: 'senderdisconnected' } },
			},
		};

		const { CastReceiverBridge } = await import('./cast-receiver.js');
		const onSnapshot = vi.fn();
		CastReceiverBridge.init({ onSnapshot });

		// Deliver the exact object the sender emitted.
		for (const l of msgListeners[CAST_NS] ?? []) l({ data: emitted });

		expect(onSnapshot).toHaveBeenCalledOnce();
		expect(onSnapshot).toHaveBeenCalledWith(expect.objectContaining({ players: payload.players }));
	});
});
