// FOUND-01 — durable regression guard: no old provisional (pre-DS) colors
// anywhere in the swept source. Runs in the node unit project (pure file
// scanning, no DOM/browser need). Scans every .svelte file plus the global
// stylesheet entrypoints (app.css, styles/**/*.css) for each forbidden old
// hex value from RESEARCH.md's old->new palette mapping table.
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC_ROOT = join(import.meta.dirname, '..');

// Recursively collect files under `dir` whose name matches `predicate`.
function collectFiles(dir: string, predicate: (name: string) => boolean): string[] {
	const results: string[] = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		const stats = statSync(full);
		if (stats.isDirectory()) {
			results.push(...collectFiles(full, predicate));
		} else if (predicate(entry)) {
			results.push(full);
		}
	}
	return results;
}

// Forbidden old provisional values (RESEARCH.md palette mapping table).
// Bare 3-digit greys (#444, #333, #888) are intentionally excluded — they're
// too ambiguous to guard as a blanket src/ scan without false-positiving on
// legitimately new DS values.
const FORBIDDEN_VALUES = [
	'#e8a020',
	'#f0ab2c',
	'#111318',
	'#1e2027',
	'#262932',
	'#2d2d2d',
	'#f0f0f0',
	'#c0392b',
	'#1a5c2e',
	'#8b1a1a'
];

function scannedFileContents(): { path: string; contents: string }[] {
	const svelteFiles = collectFiles(SRC_ROOT, (name) => name.endsWith('.svelte'));
	const files = [
		...svelteFiles,
		join(SRC_ROOT, 'app.css'),
		...collectFiles(join(SRC_ROOT, 'styles'), (name) => name.endsWith('.css'))
	];
	return files.map((path) => ({ path, contents: readFileSync(path, 'utf-8') }));
}

describe('design tokens — no provisional colors regression (FOUND-01)', () => {
	const scanned = scannedFileContents();

	it('finds at least one .svelte file and one css file to scan (sanity check)', () => {
		expect(scanned.some((f) => f.path.endsWith('.svelte'))).toBe(true);
		expect(scanned.some((f) => f.path.endsWith('.css'))).toBe(true);
	});

	it.each(FORBIDDEN_VALUES)('contains zero occurrences of forbidden old value %s', (value) => {
		const matches = scanned.filter((f) => f.contents.toLowerCase().includes(value.toLowerCase()));
		expect(matches.map((f) => f.path)).toEqual([]);
	});
});
