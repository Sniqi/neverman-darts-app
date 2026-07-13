<script lang="ts">
	// src/ui/input/Numpad.svelte
	// 10-key numeric entry with validation (INP-02).
	// Validates via isValidVisitTotal; shakes + shows "Ungültige Punktzahl" on invalid.
	// Routes confirmed visits through the onconfirm callback so the parent can decide
	// whether to show the darts-at-double dialog (INP-03, CR-05).
	import { isValidVisitTotal } from '../../engine/impossible-scores.js';

	interface Props {
		onconfirm: (total: number) => void;
	}

	let { onconfirm }: Props = $props();

	let inputValue = $state('');
	let isInvalid = $state(false);
	let shaking = $state(false);

	function pressDigit(d: string) {
		if (inputValue.length >= 3) return; // max 180 = 3 digits
		inputValue += d;
		isInvalid = false;
	}

	function pressClear() {
		inputValue = '';
		isInvalid = false;
	}

	function pressConfirm() {
		const total = parseInt(inputValue, 10);
		if (isNaN(total) || !isValidVisitTotal(total)) {
			isInvalid = true;
			shaking = true;
			setTimeout(() => { shaking = false; }, 400);
			return;
		}
		onconfirm(total);
		inputValue = '';
		isInvalid = false;
	}

	function pressBackspace() {
		inputValue = inputValue.slice(0, -1);
		isInvalid = false;
	}


</script>

<div class="numpad">
	<!-- Input display -->
	<div class="input-row">
		<div class="input-display" class:invalid={isInvalid} class:shake={shaking}>
			{inputValue || '—'}
		</div>
		{#if isInvalid}
			<div class="error-msg">Ungültige Punktzahl</div>
		{/if}
	</div>

	<!-- Digit grid: 7 8 9 / 4 5 6 / 1 2 3 / C 0 ⌫ -->
	<div class="key-grid">
		{#each [7, 8, 9, 4, 5, 6, 1, 2, 3] as digit}
			<button class="key digit-key" onclick={() => pressDigit(String(digit))}>
				{digit}
			</button>
		{/each}
		<button class="key clear-key" onclick={pressClear}>C</button>
		<button class="key digit-key" onclick={() => pressDigit('0')}>0</button>
		<button class="key backspace-key" onclick={pressBackspace}>⌫</button>
	</div>

	<!-- Confirm button: full width, accent -->
	<button class="confirm-key" onclick={pressConfirm}>Bestätigen</button>
</div>

<style>
	.numpad {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm, 8px);
		padding: var(--space-md, 16px);
		background: var(--bg);
		width: 100%;
		max-width: 320px;
		margin: 0 auto;
	}

	.input-row {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.input-display {
		height: 56px;
		background: var(--surface);
		border: 2px solid var(--line-strong);
		border-radius: var(--radius-sm);
		color: var(--text);
		font-family: var(--font-score);
		font-variant-numeric: tabular-nums;
		font-size: 28px;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: border-color var(--dur-base) var(--ease);
	}

	.input-display.invalid {
		border-color: var(--destructive);
	}

	@keyframes shake {
		0%   { transform: translateX(0); }
		15%  { transform: translateX(-6px); }
		30%  { transform: translateX(6px); }
		45%  { transform: translateX(-6px); }
		60%  { transform: translateX(6px); }
		75%  { transform: translateX(-4px); }
		90%  { transform: translateX(4px); }
		100% { transform: translateX(0); }
	}

	.input-display.shake {
		animation: shake 400ms var(--ease);
	}

	.error-msg {
		font-size: 14px;
		color: var(--destructive);
		text-align: center;
	}

	.key-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-xs, 4px);
	}

	.key {
		height: 64px;
		min-width: 64px;
		background: var(--surface);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-sm);
		color: var(--text);
		font-size: 24px;
		font-weight: 400;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color var(--dur-fast) var(--ease);
	}

	.digit-key {
		font-family: var(--font-score);
		font-variant-numeric: tabular-nums;
	}

	.key:active {
		background: var(--surface-3);
		transform: scale(var(--press-scale));
	}

	.clear-key {
		color: var(--destructive);
	}

	.backspace-key {
		color: var(--text);
	}

	.confirm-key {
		height: 64px;
		width: 100%;
		background: var(--accent);
		border: none;
		border-radius: var(--radius-sm);
		color: var(--on-accent);
		font-size: 18px;
		font-weight: 600;
		cursor: pointer;
		transition: opacity var(--dur-base) var(--ease);
	}

	.confirm-key:active {
		opacity: var(--press-opacity);
		transform: scale(var(--press-scale));
	}
</style>
