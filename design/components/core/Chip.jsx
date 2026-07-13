import React from 'react';

/** Game-mode chip (301/401/501). Equal-width in a row, 56px min height, radius 12. */
export function Chip({ active = false, children, onClick, style }) {
  return (
    <button onClick={onClick} aria-pressed={active} style={{
      flex: 1, minHeight: 'var(--control-h)',
      background: active
        ? 'linear-gradient(180deg, var(--accent-bright) 0%, var(--accent) 45%, var(--accent-deep) 130%)'
        : 'var(--surface)',
      color: active ? 'var(--on-accent)' : 'var(--text-soft)',
      border: '1px solid ' + (active ? 'transparent' : 'var(--border-input)'),
      borderRadius: 'var(--radius-sm)', padding: 'var(--space-sm)',
      fontSize: 'var(--text-md)', fontWeight: active ? 700 : 500,
      fontFamily: 'var(--font-ui)', cursor: 'pointer',
      boxShadow: active ? 'var(--shadow-raise), inset 0 1px 0 rgba(255,255,255,0.25)' : 'var(--edge-highlight)',
      transition: 'background var(--dur-base) var(--ease), color var(--dur-base) var(--ease), transform var(--dur-base) var(--ease)',
      fontVariantNumeric: 'tabular-nums', WebkitTapHighlightColor: 'transparent', ...style,
    }}
      onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(var(--press-scale))'; }}
      onPointerUp={(e) => { e.currentTarget.style.transform = 'none'; }}
      onPointerLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
    >{children}</button>
  );
}
