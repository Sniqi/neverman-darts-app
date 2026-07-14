import React, { useState, useRef } from 'react';

// Touch-optimized ring radii (double/triple/bull ~2x real proportions) — from Dartboard.svelte
const R_INNER_BULL = 30, R_OUTER_BULL = 74, R_INNER_SINGLE = 150, R_TRIPLE_END = 200,
  R_OUTER_SINGLE = 290, R_DOUBLE_END = 340, R_MISS_OUTER = 400, CX = 200, CY = 200;
const SEGMENT_ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

const startAngle = (i) => (261 + i * 18) % 360;
const xy = (r, a) => ({ x: CX + r * Math.cos((a * Math.PI) / 180), y: CY + r * Math.sin((a * Math.PI) / 180) });
function slice(r1, r2, a1, a2) {
  const s1 = xy(r1, a1), s2 = xy(r2, a1), e1 = xy(r1, a2), e2 = xy(r2, a2);
  return 'M ' + s1.x + ' ' + s1.y + ' A ' + r1 + ' ' + r1 + ' 0 0 1 ' + e1.x + ' ' + e1.y + ' L ' + e2.x + ' ' + e2.y + ' A ' + r2 + ' ' + r2 + ' 0 0 0 ' + s2.x + ' ' + s2.y + ' Z';
}
const circle = (r) => 'M ' + (CX + r) + ' ' + CY + ' A ' + r + ' ' + r + ' 0 1 1 ' + (CX - r) + ' ' + CY + ' A ' + r + ' ' + r + ' 0 1 1 ' + (CX + r) + ' ' + CY + ' Z';

function buildRegions() {
  const regions = [];
  for (let i = 0; i < 20; i++) {
    const seg = SEGMENT_ORDER[i], a1 = startAngle(i), a2 = a1 + 18, alt = i % 2 === 1;
    regions.push({ key: 'is-' + seg, path: slice(R_OUTER_BULL, R_INNER_SINGLE, a1, a2), fill: 'var(--board-single)', segment: seg, multiplier: 1 });
    regions.push({ key: 'tr-' + seg, path: slice(R_INNER_SINGLE, R_TRIPLE_END, a1, a2), fill: alt ? 'var(--board-green)' : 'var(--board-red)', segment: seg, multiplier: 3 });
    regions.push({ key: 'os-' + seg, path: slice(R_TRIPLE_END, R_OUTER_SINGLE, a1, a2), fill: 'var(--board-single)', segment: seg, multiplier: 1 });
    regions.push({ key: 'db-' + seg, path: slice(R_OUTER_SINGLE, R_DOUBLE_END, a1, a2), fill: alt ? 'var(--board-green)' : 'var(--board-red)', segment: seg, multiplier: 2 });
  }
  return regions;
}
const REGIONS = buildRegions();

/** Interactive SVG dartboard with polar hit detection; onDart({segment, multiplier}). Bull 50 = {25, mult 2}. */
export function Dartboard({ onDart, style }) {
  const svgRef = useRef(null);
  const [flash, setFlash] = useState(null);
  const [floats, setFloats] = useState([]);
  const idRef = useRef(0);

  function classify(r, angleDeg) {
    if (r <= R_INNER_BULL) return { segment: 25, multiplier: 2 };
    if (r <= R_OUTER_BULL) return { segment: 25, multiplier: 1 };
    if (r > R_DOUBLE_END) return { segment: 0, multiplier: 1 };
    const idx = Math.floor((((angleDeg - 261) % 360) + 360) % 360 / 18);
    const seg = SEGMENT_ORDER[idx];
    const mult = r <= R_TRIPLE_END && r > R_INNER_SINGLE ? 3 : r > R_OUTER_SINGLE ? 2 : 1;
    return { segment: seg, multiplier: mult };
  }

  function handlePointerDown(e) {
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    const dx = p.x - CX, dy = p.y - CY;
    const r = Math.sqrt(dx * dx + dy * dy);
    if (r > R_MISS_OUTER) return;
    const angleDeg = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    const dart = classify(r, angleDeg);

    let label, color;
    if (dart.segment === 0) { label = '✕'; color = '#7a8296'; }
    else if (dart.segment === 25 && dart.multiplier === 2) { label = 'Bull (50)'; color = '#ff7d75'; }
    else if (dart.segment === 25) { label = 'Bull (25)'; color = '#f0a424'; }
    else if (dart.multiplier === 3) { label = 'T' + dart.segment + ' (' + dart.segment * 3 + ')'; color = '#ff7d75'; }
    else if (dart.multiplier === 2) { label = 'D' + dart.segment + ' (' + dart.segment * 2 + ')'; color = '#f0a424'; }
    else { label = String(dart.segment); color = '#ffffff'; }
    const id = idRef.current++;
    setFloats((f) => [...f, { id, x: p.x, y: p.y, label, color }]);
    setTimeout(() => setFloats((f) => f.filter((fl) => fl.id !== id)), 1600);

    let key;
    if (dart.segment === 0) key = 'miss';
    else if (dart.segment === 25) key = dart.multiplier === 2 ? 'inner-bull' : 'outer-bull';
    else key = (dart.multiplier === 3 ? 'tr' : dart.multiplier === 2 ? 'db' : r < R_INNER_SINGLE ? 'is' : 'os') + '-' + dart.segment;
    setFlash(key);
    setTimeout(() => setFlash(null), 300);

    onDart && onDart(dart);
  }

  return (
    <svg ref={svgRef} viewBox="-200 -200 800 800" onPointerDown={handlePointerDown} role="img" aria-label="Dartboard"
      style={{ touchAction: 'none', width: '100%', height: '100%', display: 'block', ...style }}>
      <style>{'@keyframes db-float{0%{opacity:1;transform:translateY(0) scale(1.3)}15%{opacity:1;transform:translateY(-18px) scale(1)}100%{opacity:0;transform:translateY(-95px) scale(.85)}}'}</style>
      <circle cx={CX} cy={CY} r={R_MISS_OUTER} fill="var(--board-bg)" pointerEvents="none" />
      {REGIONS.map((reg) => (
        <path key={reg.key} d={reg.path} fill={flash === reg.key ? 'rgba(255,255,255,0.35)' : reg.fill}
          stroke="var(--board-stroke)" strokeWidth="0.5"
          data-segment={(reg.multiplier === 3 ? 'T' : reg.multiplier === 2 ? 'D' : 'S') + reg.segment} />
      ))}
      <circle cx={CX} cy={CY} r={R_OUTER_BULL} fill={flash === 'outer-bull' ? 'rgba(255,255,255,0.35)' : 'var(--board-green)'} stroke="var(--board-stroke)" strokeWidth="0.5" pointerEvents="none" />
      <circle cx={CX} cy={CY} r={R_INNER_BULL} fill={flash === 'inner-bull' ? 'rgba(255,255,255,0.35)' : 'var(--board-red)'} stroke="var(--board-stroke)" strokeWidth="0.5" pointerEvents="none" />
      <path d={circle(R_MISS_OUTER) + ' ' + circle(R_DOUBLE_END)} fill={flash === 'miss' ? 'rgba(255,255,255,0.15)' : 'var(--bg-deep)'} fillRule="evenodd" />
      {floats.map((f) => (
        <text key={f.id} x={f.x} y={f.y} textAnchor="middle" dominantBaseline="central" fontSize="56" fontWeight="800"
          fill={f.color} stroke="rgba(0,0,0,0.75)" strokeWidth="4" paintOrder="stroke" pointerEvents="none"
          fontFamily="var(--font-score)" style={{ animation: 'db-float 1.6s cubic-bezier(0.25,0.46,0.45,0.94) forwards' }}>{f.label}</text>
      ))}
      {SEGMENT_ORDER.map((seg, i) => {
        const pos = xy(368, startAngle(i) + 9);
        return <text key={seg} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" fontSize="32" fontWeight="600" fill="#aab1c2" fontFamily="var(--font-score)" pointerEvents="none">{seg}</text>;
      })}
    </svg>
  );
}
