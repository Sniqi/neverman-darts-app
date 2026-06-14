<script lang="ts">
	// src/ui/input/Dartboard.svelte
	// SVG dartboard with polar-math hit detection (D-01 enlarged rings).
	// Dispatches DART_THROWN to matchStore via screenToBoard + classifyHit.
	// Polar math (screenToBoard → classifyHit) is the source of truth — NOT SVG contains().
	import { matchStore } from '../../stores/match.svelte.js';
	import { classifyHit, screenToBoard, SEGMENT_ORDER } from '../../engine/board.js';
	import type { DartScore } from '../../engine/types.js';

	// Ring radii — touch-optimized: double/triple/bull rings ~2x real-world proportions
	const R_INNER_BULL = 30;
	const R_OUTER_BULL = 74;
	const R_INNER_SINGLE = 150;
	const R_TRIPLE_END = 200;
	const R_OUTER_SINGLE = 290;
	const R_DOUBLE_END = 340;
	const R_MISS_OUTER = 400;
	const CX = 200;
	const CY = 200;

	// Flash state: which SVG element key is currently flashing
	let flashKey = $state<string | null>(null);

	// SVG element ref for screenToBoard
	let svgEl = $state<SVGSVGElement | null>(null);

	// Floating score animations
	interface FloatAnim { id: number; x: number; y: number; label: string; color: string; }
	let floats = $state<FloatAnim[]>([]);
	let floatId = 0;

	function spawnFloat(svgX: number, svgY: number, dart: DartScore) {
		let label: string;
		let color: string;
		if (dart.segment === 0) {
			label = '✕'; color = '#666666';
		} else if (dart.segment === 25 && dart.multiplier === 2) {
			// Bulls Eye (50 pts) → triple color
			label = 'Bull (50)'; color = '#f87171';
		} else if (dart.segment === 25) {
			// Outer bull (25 pts) → double color
			label = 'Bull (25)'; color = '#e8a020';
		} else if (dart.multiplier === 3) {
			label = `T${dart.segment} (${dart.multiplier * dart.segment})`; color = '#f87171';
		} else if (dart.multiplier === 2) {
			label = `D${dart.segment} (${dart.multiplier * dart.segment})`; color = '#e8a020';
		} else {
			label = String(dart.segment); color = '#ffffff';
		}
		const id = floatId++;
		floats = [...floats, { id, x: svgX, y: svgY, label, color }];
		setTimeout(() => { floats = floats.filter(f => f.id !== id); }, 1600);
	}

	// Segment angle helpers
	function segmentStartAngle(idx: number): number {
		// Segment 20 is centered at 270° (top). Each segment = 18°.
		// Segment at index 0 in SEGMENT_ORDER starts at 270 - 9 = 261°.
		return (261 + idx * 18) % 360;
	}

	function polarToXY(r: number, angleDeg: number): { x: number; y: number } {
		const rad = (angleDeg * Math.PI) / 180;
		return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
	}

	function describeAnnularSlice(
		r1: number,
		r2: number,
		startAngle: number,
		endAngle: number
	): string {
		const s1 = polarToXY(r1, startAngle);
		const s2 = polarToXY(r2, startAngle);
		const e1 = polarToXY(r1, endAngle);
		const e2 = polarToXY(r2, endAngle);
		// Large-arc flag: 0 for 18°, which is always < 180
		return [
			`M ${s1.x} ${s1.y}`,
			`A ${r1} ${r1} 0 0 1 ${e1.x} ${e1.y}`,
			`L ${e2.x} ${e2.y}`,
			`A ${r2} ${r2} 0 0 0 ${s2.x} ${s2.y}`,
			'Z'
		].join(' ');
	}

	function describeFullCircle(r: number): string {
		return `M ${CX + r} ${CY} A ${r} ${r} 0 1 1 ${CX - r} ${CY} A ${r} ${r} 0 1 1 ${CX + r} ${CY} Z`;
	}

	// Build segment regions
	interface Region {
		key: string;
		path: string;
		fill: string;
		segment: number;
		multiplier: 1 | 2 | 3;
	}

	function buildRegions(): Region[] {
		const regions: Region[] = [];

		// Standard board colors: even indices (0,2,...) get one color, odd get the other
		// Triple/double alternate green/red per segment
		// For standard board: segments at even SEGMENT_ORDER position often match the pattern
		// We use the segment index in SEGMENT_ORDER to determine color.
		// Segments at index 0,2,4,... (20,18,13,10,...) get "primary" color variant

		for (let i = 0; i < 20; i++) {
			const seg = SEGMENT_ORDER[i];
			const startAngle = segmentStartAngle(i);
			const endAngle = startAngle + 18;
			const isAlt = i % 2 === 1; // alternate color variant

			// Inner single (bull edge → triple ring)
			regions.push({
				key: `is-${seg}`,
				path: describeAnnularSlice(R_OUTER_BULL, R_INNER_SINGLE, startAngle, endAngle),
				fill: '#2d2d2d', // all singles same dark color
				segment: seg,
				multiplier: 1
			});

			// Triple ring (green or alternate)
			regions.push({
				key: `tr-${seg}`,
				path: describeAnnularSlice(R_INNER_SINGLE, R_TRIPLE_END, startAngle, endAngle),
				fill: isAlt ? '#8b1a1a' : '#1a5c2e',
				segment: seg,
				multiplier: 3
			});

			// Outer single (triple ring → double ring)
			regions.push({
				key: `os-${seg}`,
				path: describeAnnularSlice(R_TRIPLE_END, R_OUTER_SINGLE, startAngle, endAngle),
				fill: '#2d2d2d',
				segment: seg,
				multiplier: 1
			});

			// Double ring (red or alternate)
			regions.push({
				key: `db-${seg}`,
				path: describeAnnularSlice(R_OUTER_SINGLE, R_DOUBLE_END, startAngle, endAngle),
				fill: isAlt ? '#1a5c2e' : '#8b1a1a',
				segment: seg,
				multiplier: 2
			});
		}

		return regions;
	}

	const regions = buildRegions();

	// Segment number label positions (outside double ring)
	const R_LABEL = 368;
	function labelPos(i: number): { x: number; y: number } {
		const midAngle = segmentStartAngle(i) + 9;
		return polarToXY(R_LABEL, midAngle);
	}

	function handlePointerDown(e: PointerEvent) {
		if (!svgEl) return;
		e.preventDefault();

		const { r, angleDeg } = screenToBoard(e, svgEl);
		if (r > R_MISS_OUTER) return;
		const dart = classifyHit(r, angleDeg);

		const rad = (angleDeg * Math.PI) / 180;
		spawnFloat(CX + r * Math.cos(rad), CY + r * Math.sin(rad), dart);

		// Flash the region that was hit.
		// classifyHit returns {multiplier:2, segment:25} for inner bull (50 pts)
		// and {multiplier:1, segment:25} for outer bull (25 pts); segment 50 is never produced.
		if (dart.segment === 0) {
			flashKey = 'miss';
		} else if (dart.multiplier === 2 && dart.segment === 25) {
			flashKey = 'inner-bull';
		} else if (dart.multiplier === 1 && dart.segment === 25) {
			flashKey = 'outer-bull';
		} else {
			const prefix = dart.multiplier === 3 ? 'tr' : dart.multiplier === 2 ? 'db' : (r < R_INNER_SINGLE ? 'is' : 'os');
			flashKey = `${prefix}-${dart.segment}`;
		}

		setTimeout(() => { flashKey = null; }, 300);

		matchStore.dispatch({ type: 'DART_THROWN', dart });
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<svg
	bind:this={svgEl}
	viewBox="-200 -200 800 800"
	xmlns="http://www.w3.org/2000/svg"
	class="dartboard"
	style="touch-action: none; width: 100%; height: 100%; max-width: 100%; max-height: 100%;"
	onpointerdown={handlePointerDown}
	role="img"
	aria-label="Dartboard"
>
	<!-- Board background -->
	<circle cx={CX} cy={CY} r={R_MISS_OUTER} fill="#111318" pointer-events="none" />

	<!-- Scored regions (data-segment for E2E test targeting, pointer-events:all so Playwright can click) -->
	{#each regions as region (region.key)}
		<path
			d={region.path}
			fill={flashKey === region.key ? 'rgba(255,255,255,0.35)' : region.fill}
			stroke="#444444"
			stroke-width="0.5"
			data-segment={`${region.multiplier === 3 ? 'T' : region.multiplier === 2 ? 'D' : 'S'}${region.segment}`}
			data-segment-key={region.key}
		/>
	{/each}

	<!-- Outer bull (25) -->
	<circle
		cx={CX}
		cy={CY}
		r={R_OUTER_BULL}
		fill={flashKey === 'outer-bull' ? 'rgba(255,255,255,0.35)' : '#1a5c2e'}
		stroke="#444444"
		stroke-width="0.5"
		pointer-events="none"
	/>

	<!-- Inner bull (50) -->
	<circle
		cx={CX}
		cy={CY}
		r={R_INNER_BULL}
		fill={flashKey === 'inner-bull' ? 'rgba(255,255,255,0.35)' : '#c0392b'}
		stroke="#444444"
		stroke-width="0.5"
		pointer-events="none"
	/>

	<!-- Dark outer ring (number zone) — only valid miss tap area -->
	<path
		d={`${describeFullCircle(R_MISS_OUTER)} ${describeFullCircle(R_DOUBLE_END)}`}
		fill={flashKey === 'miss' ? 'rgba(255,255,255,0.15)' : '#0d0d0f'}
		fill-rule="evenodd"
		class="miss-zone"
	/>

	<!-- Floating score animations -->
	{#each floats as f (f.id)}
		<text
			x={f.x}
			y={f.y}
			text-anchor="middle"
			dominant-baseline="central"
			font-size="52"
			font-weight="800"
			fill={f.color}
			stroke="rgba(0,0,0,0.75)"
			stroke-width="4"
			paint-order="stroke"
			pointer-events="none"
			class="score-float"
		>{f.label}</text>
	{/each}

	<!-- Segment number labels — decorative only, pointer-events: none -->
	{#each SEGMENT_ORDER as seg, i}
		{@const pos = labelPos(i)}
		<text
			x={pos.x}
			y={pos.y}
			text-anchor="middle"
			dominant-baseline="central"
			font-size="28"
			font-weight="600"
			fill="#cccccc"
			pointer-events="none"
		>{seg}</text>
	{/each}
</svg>

<style>
	.dartboard {
		display: block;
	}

	.miss-zone {
		cursor: default;
	}

	@keyframes score-float {
		0%   { opacity: 1;   transform: translateY(0px)   scale(1.3); }
		15%  { opacity: 1;   transform: translateY(-18px) scale(1);   }
		100% { opacity: 0;   transform: translateY(-95px) scale(0.85); }
	}

	.score-float {
		animation: score-float 1.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
		pointer-events: none;
	}
</style>
