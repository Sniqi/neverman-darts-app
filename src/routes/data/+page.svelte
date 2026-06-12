<script lang="ts">
	// src/routes/data/+page.svelte
	// Daten / Backup screen (Plan 03-03, Task 3 — replaces the Plan 03-01 shell).
	// Export: exportAllData() → download neverman-backup-YYYY-MM-DD.json (D-10).
	// Import: file picker → validateImportFile → ConfirmDialog (D-12) → importAllData (D-11).
	// Security T-03-07: foreign/corrupt file rejected inline; no dialog opened, DB unchanged.
	// Security T-03-09: all strings via {interpolation} — no {@html}.
	// Security T-03-10: storage warning surfaced from getStorageWarning().

	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { exportAllData, validateImportFile, importAllData } from '../../lib/backup.js';
	import { getStorageWarning } from '../../lib/storage.js';
	import ConfirmDialog from '../../ui/dialogs/ConfirmDialog.svelte';

	export const prerender = false;
	export const ssr = false;

	// ── State ──────────────────────────────────────────────────────────────────
	let exporting = $state(false);
	let exportError = $state<string | null>(null);

	let importError = $state<string | null>(null);
	let importSuccess = $state(false);
	let importing = $state(false);
	let showImportConfirm = $state(false);
	let pendingImportBlob = $state<Blob | null>(null);

	let storageWarning = $state<string | null>(null);

	let fileInput: HTMLInputElement;

	// ── Mount-time side effects ────────────────────────────────────────────────
	$effect(() => {
		getStorageWarning().then((w) => (storageWarning = w));
	});

	// ── Export handler ─────────────────────────────────────────────────────────
	async function handleExport() {
		exporting = true;
		exportError = null;
		try {
			await exportAllData();
		} catch {
			exportError = 'Export fehlgeschlagen.';
		} finally {
			exporting = false;
		}
	}

	// ── Import handlers ────────────────────────────────────────────────────────
	async function handleFileSelected(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		// Reset previous state
		importError = null;
		importSuccess = false;

		const blob = new Blob([await file.arrayBuffer()], { type: file.type });
		const validation = await validateImportFile(blob);

		if (!validation.valid) {
			// Reject with German error; open no dialog, change nothing (T-03-07)
			importError = validation.errorDe;
			// Reset the file input so the same file can be re-selected after fixing
			input.value = '';
			return;
		}

		// Valid Neverman file — stash blob and open confirm dialog (D-12)
		pendingImportBlob = blob;
		showImportConfirm = true;
		input.value = '';
	}

	async function handleImportConfirm() {
		if (!pendingImportBlob) return;
		showImportConfirm = false;
		importing = true;
		importError = null;
		importSuccess = false;
		try {
			await importAllData(pendingImportBlob);
			importSuccess = true;
		} catch {
			importError = 'Import fehlgeschlagen. Bitte erneut versuchen.';
		} finally {
			importing = false;
			pendingImportBlob = null;
		}
	}

	function handleImportCancel() {
		showImportConfirm = false;
		pendingImportBlob = null;
	}
</script>

<div class="screen">
	<header class="heading-bar">
		<button class="back-btn" onclick={() => goto(`${base}/`)} aria-label="Zurück">
			<svg
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M15 18l-6-6 6-6" />
			</svg>
		</button>
		<h1 class="screen-title">Daten / Backup</h1>
	</header>

	<div class="content">
		<!-- Export section -->
		<section class="section">
			<h2 class="section-heading">Exportieren</h2>
			<div class="description-card">
				<p class="description-text">Erstellt eine JSON-Datei mit allen Profilen und dem Match-Verlauf.</p>
			</div>
			<button
				class="action-btn"
				onclick={handleExport}
				disabled={exporting}
				aria-busy={exporting}
			>
				{exporting ? 'Exportiere…' : 'Exportieren'}
			</button>
			{#if exportError}
				<p class="inline-error" role="alert">{exportError}</p>
			{/if}
		</section>

		<hr class="section-divider" />

		<!-- Import section -->
		<section class="section">
			<h2 class="section-heading">Importieren</h2>
			<div class="description-card">
				<p class="description-text">
					Lädt eine Backup-Datei und ersetzt alle lokalen Daten. Laufende Spiele sind nicht enthalten.
				</p>
			</div>

			<!-- Hidden file input — screen-reader accessible via button trigger (UI-SPEC accessibility) -->
			<input
				type="file"
				accept=".json"
				class="file-input-hidden"
				bind:this={fileInput}
				onchange={handleFileSelected}
				aria-label="Backup-Datei auswählen"
			/>
			<button
				class="action-btn"
				onclick={() => fileInput.click()}
				disabled={importing}
			>
				Datei auswählen
			</button>

			{#if importError}
				<p class="inline-error" role="alert">{importError}</p>
			{/if}

			<!-- aria-live region for async success/failure feedback (UI-SPEC accessibility) -->
			<div role="status" aria-live="polite" class="status-region">
				{#if importSuccess}
					<p class="inline-success">Import abgeschlossen.</p>
				{/if}
			</div>
		</section>

		<!-- Storage warning banner (conditional) -->
		{#if storageWarning}
			<div class="storage-warning" role="status">
				<p class="storage-warning-text">{storageWarning}</p>
			</div>
		{/if}
	</div>
</div>

<!-- Import replace-all confirmation dialog (D-12: backdropDismiss false — explicit choice required) -->
{#if showImportConfirm}
	<ConfirmDialog
		heading="Daten ersetzen?"
		body="Ersetzt alle aktuellen Profile und den Verlauf. Diese Aktion kann nicht rückgängig gemacht werden."
		ctaLabel={importing ? 'Importiere…' : 'Importieren'}
		ctaStyle="destructive"
		backdropDismiss={false}
		onconfirm={handleImportConfirm}
		oncancel={handleImportCancel}
	/>
{/if}

<style>
	.screen {
		max-width: 480px;
		margin: 0 auto;
		min-height: 100dvh;
		background: #111318;
		color: #f0f0f0;
	}

	.heading-bar {
		display: flex;
		align-items: center;
		gap: var(--space-sm, 8px);
		height: 40px;
		padding: 0 var(--space-md, 16px);
		background: #111318;
		border-bottom: 1px solid #2d2d2d;
	}

	.back-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		background: transparent;
		border: none;
		color: #f0f0f0;
		cursor: pointer;
		flex-shrink: 0;
		margin-left: calc(-1 * var(--space-sm, 8px));
	}

	.back-btn:active {
		opacity: 0.7;
	}

	.screen-title {
		font-size: 20px;
		font-weight: 600;
		margin: 0;
		color: #f0f0f0;
	}

	.content {
		padding: var(--space-lg, 24px) var(--space-md, 16px);
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: var(--space-md, 16px);
	}

	.section-heading {
		font-size: 20px;
		font-weight: 600;
		margin: 0;
		color: #f0f0f0;
	}

	.description-card {
		background: #1e2027;
		border-radius: 8px;
		padding: var(--space-md, 16px);
	}

	.description-text {
		font-size: 14px;
		font-weight: 400;
		line-height: 1.4;
		color: #888888;
		margin: 0;
	}

	.action-btn {
		width: 100%;
		height: 52px;
		background: #1e2027;
		color: #f0f0f0;
		border: none;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 400;
		cursor: pointer;
	}

	.action-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.action-btn:active:not(:disabled) {
		background: #22242d;
	}

	.file-input-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.section-divider {
		border: none;
		border-top: 1px solid #2d2d2d;
		margin: var(--space-lg, 24px) 0;
	}

	.inline-error {
		font-size: 14px;
		font-weight: 400;
		color: #c0392b;
		margin: 0;
	}

	.inline-success {
		font-size: 14px;
		font-weight: 400;
		color: #f0f0f0;
		margin: 0;
	}

	.status-region {
		min-height: 20px;
	}

	/* Storage warning banner — accent tint (UI-SPEC Surface 5) */
	.storage-warning {
		margin-top: var(--space-lg, 24px);
		background: rgba(232, 160, 32, 0.12);
		border: 1px solid rgba(232, 160, 32, 0.35);
		border-radius: 8px;
		padding: var(--space-sm, 8px) var(--space-sm, 8px);
	}

	.storage-warning-text {
		font-size: 14px;
		font-weight: 400;
		color: #e8a020;
		margin: 0;
		line-height: 1.4;
	}
</style>
