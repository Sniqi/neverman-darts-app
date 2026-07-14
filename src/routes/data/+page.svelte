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
		<button class="btn btn--ghost btn--icon back-btn" onclick={() => goto(`${base}/`)} aria-label="Zurück">
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
				class="btn btn--surface"
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
				class="btn btn--surface"
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
		ctaLabel="Importieren"
		ctaStyle="destructive"
		backdropDismiss={false}
		onconfirm={handleImportConfirm}
		oncancel={handleImportCancel}
	/>
{/if}

<style>
	.screen {
		max-width: 520px;
		margin: 0 auto;
		min-height: 100dvh;
		background: var(--bg);
		color: var(--text);
	}

	.heading-bar {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		height: 40px;
		padding: 0 var(--space-md);
		background: var(--bg);
		border-bottom: 1px solid var(--surface-3);
	}

	.back-btn {
		margin-left: calc(-1 * var(--space-sm));
	}

	.screen-title {
		font-size: var(--text-xl);
		font-weight: 600;
		margin: 0;
		color: var(--text);
	}

	.content {
		padding: var(--space-lg) var(--space-md);
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.section-heading {
		font-size: var(--text-lg);
		font-weight: 600;
		margin: 0;
		color: var(--text);
	}

	.description-card {
		background: var(--surface);
		border-radius: var(--radius-md);
		padding: var(--space-md);
	}

	.description-text {
		font-size: var(--text-sm);
		font-weight: 400;
		line-height: 1.4;
		color: var(--text-muted);
		margin: 0;
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
		border-top: 1px solid var(--surface-3);
		margin: var(--space-lg) 0;
	}

	.inline-error {
		font-size: var(--text-sm);
		font-weight: 400;
		color: var(--destructive);
		margin: 0;
	}

	.inline-success {
		font-size: var(--text-sm);
		font-weight: 400;
		color: var(--text);
		margin: 0;
	}

	.status-region {
		min-height: 20px;
	}

	/* Storage warning banner — accent tint (UI-SPEC Surface 5) */
	.storage-warning {
		margin-top: var(--space-lg);
		background: var(--accent-soft);
		border: 1px solid var(--accent-line);
		border-radius: var(--radius-sm);
		padding: var(--space-sm) var(--space-sm);
	}

	.storage-warning-text {
		font-size: var(--text-sm);
		font-weight: 400;
		color: var(--accent);
		margin: 0;
		line-height: 1.4;
	}
</style>
