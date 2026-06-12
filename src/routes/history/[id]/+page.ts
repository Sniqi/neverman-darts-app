// src/routes/history/[id]/+page.ts
// Dynamic loader for match detail view (STAT-06, D-05).
// Security T-03-04: params.id is a URL string — parseInt + isNaN guard before any DB query.
import type { PageLoad } from './$types.js';
import { db } from '../../../db/db.js';
import { error } from '@sveltejs/kit';

export const prerender = false;
export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	const id = parseInt(params.id, 10);
	if (isNaN(id)) throw error(404, 'Ungültige Match-ID');
	const record = await db.matches.get(id);
	if (!record) throw error(404, 'Match nicht gefunden');
	return { record };
};
