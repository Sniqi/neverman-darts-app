import React from 'react';

/** Stepper row: label left, − value + right, optional unit. 48px round buttons on a surface row. */
export function Stepper({ label, value, min = 1, max = 9, unit, onChange }) {
  const btn = (dis) => ({
    width: 'var(--hit-min)', height: 'var(--hit-min)',
    background: 'var(--surface-3)', color: 'var(--text)',
    border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-xl)', fontWeight: 500, lineHeight: 1,
    cursor: dis ? 'default' : 'pointer', opacity: dis ? 0.3 : 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-ui)', boxShadow: 'var(--edge-highlight)',
    transition: 'transform var(--dur-fast) var(--ease)',
    WebkitTapHighlightColor: 'transparent', flexShrink: 0,
  });
  const press = {
    onPointerDown: (e) => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = 'scale(var(--press-scale))'; },
    onPointerUp: (e) => { e.currentTarget.style.transform = 'none'; },
    onPointerLeave: (e) => { e.currentTarget.style.transform = 'none'; },
  };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'var(--surface)', border: '1px solid var(--line)',
      padding: 'var(--space-sm) var(--space-md)', minHeight: 'var(--row-h)',
      boxSizing: 'border-box', borderRadius: 'var(--radius-sm)', gap: 'var(--space-sm)',
      boxShadow: 'var(--edge-highlight)',
    }}>
      <span style={{ fontSize: 'var(--text-md)', fontWeight: 500 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <button {...press} style={btn(value <= min)} disabled={value <= min} onClick={() => onChange && onChange(value - 1)} aria-label="Weniger">−</button>
        <span style={{ fontSize: 'var(--text-xl)', fontWeight: 700, minWidth: 32, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
        <button {...press} style={btn(value >= max)} disabled={value >= max} onClick={() => onChange && onChange(value + 1)} aria-label="Mehr">+</button>
      </div>
      {unit && <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', minWidth: 48 }}>{unit}</span>}
    </div>
  );
}
