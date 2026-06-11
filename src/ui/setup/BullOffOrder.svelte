<script lang="ts">
	// BullOffOrder.svelte — arrange ALL players into throwing order (D-15, ENG-06).
	// Tap-to-sequence OR drag-to-reorder (hand-rolled pointer events — no SortableJS).
	// On confirm: dispatches START_MATCH and navigates to /match.
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { matchStore } from '../../stores/match.svelte.js';
	import type { MatchConfig } from '../../engine/types.js';

	interface MatchPlayer {
		id: string;
		name: string;
		isGuest: boolean;
	}

	interface PendingMatch {
		config: MatchConfig;
		players: MatchPlayer[];
	}

	// Load pending match config from sessionStorage (written by MatchSetup)
	function loadPending(): PendingMatch | null {
		try {
			const raw = sessionStorage.getItem('pendingMatch');
			if (!raw) return null;
			return JSON.parse(raw) as PendingMatch;
		} catch {
			return null;
		}
	}

	const pending = loadPending();
	const initialPlayers: MatchPlayer[] = pending?.players ?? [];
	const config: MatchConfig = pending?.config ?? {
		startScore: 501,
		outRule: 'double',
		legsToWin: 3,
		setsEnabled: false,
		setsToWin: 1
	};

	// Order list — starts as the input order; user reorders via tap or drag
	let order = $state<MatchPlayer[]>([...initialPlayers]);

	// ── Tap-to-sequence mode ─────────────────────────────────────────────────
	// First tap = first thrower, second tap = second, etc.
	let tapSequence = $state<string[]>([]);

	function handleTap(id: string) {
		if (isDragging) return; // ignore taps during drag
		if (tapSequence.includes(id)) {
			// Deselect: remove from sequence and rebuild order
			tapSequence = tapSequence.filter((x) => x !== id);
		} else {
			tapSequence = [...tapSequence, id];
		}

		// Rebuild order from tap sequence + remaining players
		const sequenced = tapSequence
			.map((tid) => initialPlayers.find((p) => p.id === tid)!)
			.filter(Boolean);
		const rest = initialPlayers.filter((p) => !tapSequence.includes(p.id));
		order = [...sequenced, ...rest];
	}

	function tapPosition(id: string): number | null {
		const idx = tapSequence.indexOf(id);
		return idx === -1 ? null : idx + 1;
	}

	// ── Drag-to-reorder (hand-rolled pointer events) ─────────────────────────
	let isDragging = $state(false);
	let dragId = $state<string | null>(null);
	let dragOverId = $state<string | null>(null);

	function onPointerDown(e: PointerEvent, id: string) {
		// Only start drag on a long-press or if tap mode not active for this item
		// Simple approach: pointer-move > 8px triggers drag mode
		const startX = e.clientX;
		const startY = e.clientY;

		function onMove(me: PointerEvent) {
			const dx = me.clientX - startX;
			const dy = me.clientY - startY;
			if (!isDragging && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
				isDragging = true;
				dragId = id;
				tapSequence = []; // clear tap sequence on drag
			}
		}

		function onUp() {
			if (isDragging && dragId && dragOverId && dragId !== dragOverId) {
				// Reorder: move dragId to position of dragOverId
				const from = order.findIndex((p) => p.id === dragId);
				const to = order.findIndex((p) => p.id === dragOverId);
				if (from !== -1 && to !== -1) {
					const newOrder = [...order];
					const [moved] = newOrder.splice(from, 1);
					newOrder.splice(to, 0, moved);
					order = newOrder;
				}
			}
			isDragging = false;
			dragId = null;
			dragOverId = null;
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
		}

		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	}

	function onPointerEnter(id: string) {
		if (isDragging) {
			dragOverId = id;
		}
	}

	// ── Confirm ──────────────────────────────────────────────────────────────
	function confirmOrder() {
		if (order.length === 0) {
			goto(`${base}/setup`);
			return;
		}

		const playerOrder = order.map((p) => p.id);
		const matchPlayers = order.map((p) => ({
			id: p.id,
			name: p.name,
			isGuest: p.isGuest
		}));

		matchStore.dispatch({
			type: 'START_MATCH',
			config,
			players: matchPlayers,
			order: playerOrder
		});

		sessionStorage.removeItem('pendingMatch');
		goto(`${base}/match`);
	}
</script>

<div class="bulloff-screen">
	<h1>Wer hat die Doppel getroffen?</h1>
	<p class="hint">Tippe in der Reihenfolge des Wurfes oder ziehe zum Sortieren.</p>

	<div class="player-order-list" role="list">
		{#each order as player, i (player.id)}
			{@const pos = tapSequence.length > 0 ? tapPosition(player.id) : i + 1}
			<div
				class="player-card"
				class:dragging={isDragging && dragId === player.id}
				class:dragover={isDragging && dragOverId === player.id}
				class:tapped={tapSequence.includes(player.id)}
				onpointerdown={(e) => onPointerDown(e, player.id)}
				onpointerenter={() => onPointerEnter(player.id)}
				onclick={() => handleTap(player.id)}
				role="button"
				tabindex="0"
				aria-label={`Spieler ${player.name}, Position ${pos}`}
				onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTap(player.id); }}
			>
				<span class="position">{pos}</span>
				<span class="avatar">{player.name[0]?.toUpperCase() ?? '?'}</span>
				<span class="player-name">{player.name}</span>
				{#if player.isGuest}
					<span class="guest-badge">Gast</span>
				{/if}
				<span class="drag-handle" aria-hidden="true">⠿</span>
			</div>
		{/each}
	</div>

	<button class="confirm-btn" onclick={confirmOrder} disabled={order.length === 0}>
		Spielreihenfolge bestätigen
	</button>
</div>

<style>
	.bulloff-screen {
		max-width: 480px;
		margin: 0 auto;
		padding: var(--space-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
		min-height: 100dvh;
	}

	h1 {
		font-size: 20px;
		font-weight: 600;
		margin: 0;
	}

	.hint {
		font-size: 14px;
		color: #888;
		margin: 0;
	}

	.player-order-list {
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.player-card {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		background: var(--surface);
		padding: var(--space-sm) var(--space-md);
		border-radius: 4px;
		min-height: 56px;
		cursor: pointer;
		user-select: none;
		touch-action: none;
		border: 2px solid transparent;
		transition: border-color 0.15s;
	}

	.player-card.tapped {
		border-color: var(--accent);
	}

	.player-card.dragging {
		opacity: 0.5;
	}

	.player-card.dragover {
		border-color: var(--accent);
		background: #2a2d35;
	}

	.position {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: #333;
		color: var(--text);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 14px;
		flex-shrink: 0;
	}

	.player-card.tapped .position {
		background: var(--accent);
		color: #111318;
	}

	.avatar {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--accent);
		color: #111318;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		flex-shrink: 0;
	}

	.player-name {
		flex: 1;
		font-size: 16px;
	}

	.guest-badge {
		font-size: 12px;
		color: #aaa;
		background: #333;
		padding: 2px 6px;
		border-radius: 10px;
	}

	.drag-handle {
		font-size: 20px;
		color: #555;
		cursor: grab;
	}

	.confirm-btn {
		width: 100%;
		background: var(--accent);
		color: #111318;
		border: none;
		border-radius: 4px;
		padding: var(--space-sm) var(--space-md);
		font-size: 18px;
		font-weight: 600;
		min-height: 56px;
		cursor: pointer;
		margin-top: auto;
	}
</style>
