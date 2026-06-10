// PLACEHOLDER — replaced by the real matchStore in Plan 02. Do not build on this.
// Proves the runes-store → component reactivity wiring end-to-end.

class SkeletonStore {
	score = $state(501);

	tap(value: number): void {
		this.score = Math.max(0, this.score - value);
	}
}

export const skeletonStore = new SkeletonStore();
