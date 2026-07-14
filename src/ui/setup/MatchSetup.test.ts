// src/ui/setup/MatchSetup.test.ts
// Browser-mode component test for MatchSetup (Phase 9 review WR-01).
//
// svelte-check flags all 6 `<button role="switch">` toggles introduced by the
// checkbox→button conversion with a11y_consider_explicit_label, a documented false
// positive (09-05-SUMMARY.md): the native <label for="..."> -> button id association
// still produces the correct accessible name. That justification had E2E runtime
// proof for only 3 of 6 switches (Sets via full-match-flow.spec.ts:27, Caller/Musik
// on /match via match-audio-toggle.spec.ts) — MatchSetup's own Caller, Musik, and
// Automatische Pause toggles had no runtime proof. This test closes that gap for
// all 4 switches on this screen.
import 'fake-indexeddb/auto';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import MatchSetup from './MatchSetup.svelte';

test('all 4 MatchSetup switches resolve with their label-associated accessible name', async () => {
	render(MatchSetup);

	await expect.element(page.getByRole('switch', { name: 'Sets' })).toBeInTheDocument();
	await expect.element(page.getByRole('switch', { name: 'Caller' })).toBeInTheDocument();
	await expect.element(page.getByRole('switch', { name: 'Musik' })).toBeInTheDocument();
	await expect
		.element(page.getByRole('switch', { name: 'Automatische Pause' }))
		.toBeInTheDocument();
});
