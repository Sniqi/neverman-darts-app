<script lang="ts">
	// src/ui/input/DartsAtDoubleDialog.svelte
	// Bottom sheet shown ONLY when a numpad-entered visit wins a leg (D-08, INP-03).
	// Asks "Wie viele Darts auf die Doppel?" with options 1/2/3.
	// Dispatches the original NUMPAD_VISIT with dartsAtDouble filled in.
	// Auto-skipped for non-finishing numpad visits (caller controls visibility).

	interface Props {
		visible: boolean;
		pendingTotal: number;
		onconfirm: (dartsAtDouble: number, dartsUsed: 1 | 2 | 3) => void;
	}

	let { visible, pendingTotal, onconfirm }: Props = $props();

	const options: Array<{ label: string; darts: 1 | 2 | 3 }> = [
		{ label: '1 Dart', darts: 1 },
		{ label: '2 Darts', darts: 2 },
		{ label: '3 Darts', darts: 3 }
	];

	function select(darts: 1 | 2 | 3) {
		// Phase 1: darts-used equals darts-at-double for a finishing visit — a finish's
		// last dart is always the double, so darts-at-double ≤ darts-used.
		// Precise darts-used (e.g. 2 at double but 3 darts total) is a Phase 4 stats concern.
		onconfirm(darts, darts);
	}
</script>

{#if visible}
	<div class="backdrop" role="dialog" aria-modal="true" aria-label="Darts auf die Doppel">
		<div class="sheet">
			<div class="heading">Wie viele Darts auf die Doppel?</div>

			<div class="options">
				{#each options as opt (opt.darts)}
					<button class="option-btn" onclick={() => select(opt.darts)}>
						{opt.label}
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: var(--backdrop);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		z-index: 20;
		animation: fadeIn var(--dur-med) var(--ease);
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to   { opacity: 1; }
	}

	.sheet {
		width: 100%;
		max-width: 480px;
		background: var(--surface);
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		padding: var(--space-lg, 24px);
		display: flex;
		flex-direction: column;
		gap: var(--space-md, 16px);
		animation: slideUp var(--dur-med) var(--ease);
	}

	@keyframes slideUp {
		from { transform: translateY(100%); }
		to   { transform: translateY(0); }
	}

	.heading {
		font-size: 16px;
		font-weight: 400;
		color: var(--text);
		text-align: center;
	}

	.options {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm, 8px);
	}

	.option-btn {
		height: 56px;
		background: var(--bg);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-sm);
		color: var(--text);
		font-size: 16px;
		font-weight: 400;
		cursor: pointer;
		transition: background-color var(--dur-fast) var(--ease);
	}

	.option-btn:active {
		background: var(--surface-3);
		transform: scale(var(--press-scale));
	}
</style>
