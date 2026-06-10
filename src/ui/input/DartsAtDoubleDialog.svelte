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
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		z-index: 20;
		animation: fadeIn 200ms ease-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to   { opacity: 1; }
	}

	.sheet {
		width: 100%;
		max-width: 480px;
		background: #1e2027;
		border-radius: 12px 12px 0 0;
		padding: var(--space-lg, 24px);
		display: flex;
		flex-direction: column;
		gap: var(--space-md, 16px);
		animation: slideUp 250ms ease-out;
	}

	@keyframes slideUp {
		from { transform: translateY(100%); }
		to   { transform: translateY(0); }
	}

	.heading {
		font-size: 16px;
		font-weight: 400;
		color: #f0f0f0;
		text-align: center;
	}

	.options {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm, 8px);
	}

	.option-btn {
		height: 56px;
		background: #111318;
		border: 1px solid #444444;
		border-radius: 6px;
		color: #f0f0f0;
		font-size: 16px;
		font-weight: 400;
		cursor: pointer;
		transition: background-color 100ms ease;
	}

	.option-btn:active {
		background: #2d2d2d;
	}
</style>
