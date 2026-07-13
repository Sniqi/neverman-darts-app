import React from 'react';

/** Per-player score card on the match screen. Active player: amber edge + glow, 96px condensed score, checkout route. */
export function ScoreCard({ name, remaining, legs, sets, active = false, checkout }) {
  return (
    <div style={{
      flex: 1, minWidth: 150, display: 'flex', flexDirection: 'column',
      background: active
        ? 'linear-gradient(var(--accent-soft), var(--accent-soft)), var(--surface-2)'
        : 'var(--surface)',
      border: '1px solid ' + (active ? 'var(--accent-line)' : 'var(--line)'),
      boxShadow: active ? 'inset 4px 0 0 var(--accent), var(--glow-accent), var(--edge-highlight)' : 'var(--edge-highlight)',
      borderRadius: 'var(--radius-md)', padding: 'var(--space-md) var(--space-lg)',
      transition: 'background var(--dur-slow) var(--ease), box-shadow var(--dur-slow) var(--ease), border-color var(--dur-slow) var(--ease)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
        fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 2,
        color: active ? 'var(--text)' : 'var(--text-soft)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{name}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
        <span style={{
          fontFamily: 'var(--font-score)', fontWeight: active ? 800 : 700, lineHeight: 1,
          color: 'var(--text)', letterSpacing: 'var(--tracking-tight)',
          fontSize: active ? 'var(--text-score-active)' : 'var(--text-score-inactive)',
          fontVariantNumeric: 'tabular-nums',
          textShadow: active ? '0 0 40px color-mix(in oklab, var(--accent) 35%, transparent)' : 'none',
          transition: 'font-size var(--dur-med) var(--ease)',
        }}>{remaining}</span>
        {active && checkout && (
          <span style={{
            fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--accent)',
            background: 'var(--accent-soft)', border: '1px solid var(--accent-line)',
            borderRadius: 'var(--radius-pill)', padding: '4px 14px', lineHeight: 1.4,
            whiteSpace: 'nowrap', letterSpacing: '0.02em', fontVariantNumeric: 'tabular-nums',
          }}>{checkout}</span>
        )}
      </div>
      <div style={{ fontSize: 'var(--text-base)', fontWeight: 500, color: 'var(--text-muted)', marginTop: 'var(--space-xs)', fontVariantNumeric: 'tabular-nums' }}>
        {sets != null && <span>Sets: <span style={{ color: 'var(--text)', fontWeight: 700 }}>{sets}</span>&nbsp;&nbsp;</span>}
        <span>Legs: <span style={{ color: 'var(--text)', fontWeight: 700 }}>{legs}</span></span>
      </div>
    </div>
  );
}
