import React from 'react';

/** Format a dart as app notation: T20, D16, 20, Bull, Outer, ✕ (miss). */
export function formatDart(dart) {
  if (dart.segment === 0) return '✕';
  if (dart.multiplier === 2 && dart.segment === 25) return 'Bull';
  if (dart.multiplier === 1 && dart.segment === 25) return 'Outer';
  const prefix = dart.multiplier === 3 ? 'T' : dart.multiplier === 2 ? 'D' : '';
  return prefix + dart.segment;
}

/** Rounded pill showing one dart. Triples/bull glow amber; doubles pale amber; misses dashed; bust struck through. */
export function DartPill({ dart, bust = false, size = 18 }) {
  const isTriple = dart.multiplier === 3 && dart.segment !== 25;
  const isDouble = dart.multiplier === 2 && dart.segment !== 25;
  const isBull = dart.segment === 25;
  const isMiss = dart.segment === 0;
  let color = 'var(--text-soft)', bg = 'rgba(255, 255, 255, 0.06)', border = '1px solid var(--line)';
  if (isTriple || isBull) { color = 'var(--accent)'; bg = 'var(--accent-soft)'; border = '1px solid var(--accent-line)'; }
  else if (isDouble) { color = 'var(--accent-double)'; bg = 'color-mix(in oklab, var(--accent) 7%, transparent)'; border = '1px solid color-mix(in oklab, var(--accent) 30%, transparent)'; }
  else if (isMiss) { color = 'var(--text-faint)'; border = '1px dashed var(--line-strong)'; }
  if (bust) { color = 'color-mix(in oklab, var(--destructive) 75%, white)'; bg = 'var(--destructive-soft)'; border = '1px solid var(--destructive-line)'; }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-ui)', fontSize: size, fontWeight: 600, lineHeight: 1.1, letterSpacing: '0.01em',
      padding: '0.12em 0.55em', borderRadius: 'var(--radius-pill)', whiteSpace: 'nowrap',
      color, background: bg, border, textDecoration: bust ? 'line-through' : 'none',
      fontVariantNumeric: 'tabular-nums',
    }}>{formatDart(dart)}</span>
  );
}
