import React from 'react';

/** Settings row with a custom switch (Sets, Caller, Musik, Automatische Pause). */
export function ToggleRow({ label, checked, onChange }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'var(--surface)', border: '1px solid var(--line)',
      padding: 'var(--space-sm) var(--space-md)', minHeight: 'var(--row-h)',
      boxSizing: 'border-box', borderRadius: 'var(--radius-sm)', gap: 'var(--space-md)',
      boxShadow: 'var(--edge-highlight)',
    }}>
      <label style={{ fontSize: 'var(--text-md)', fontWeight: 500 }}>{label}</label>
      <button role="switch" aria-checked={checked} onClick={() => onChange && onChange(!checked)} style={{
        position: 'relative', width: 56, height: 34, flexShrink: 0,
        background: checked ? 'var(--accent)' : 'var(--surface-3)',
        border: '1px solid ' + (checked ? 'var(--accent)' : 'var(--line-strong)'),
        borderRadius: 'var(--radius-pill)', cursor: 'pointer', padding: 0,
        transition: 'background var(--dur-med) var(--ease), border-color var(--dur-med) var(--ease)',
        boxShadow: checked ? 'var(--glow-accent)' : 'inset 0 1px 3px rgba(0,0,0,0.35)',
        WebkitTapHighlightColor: 'transparent',
      }}>
        <span aria-hidden="true" style={{
          position: 'absolute', top: 3, left: 3, width: 26, height: 26, borderRadius: '50%',
          background: checked ? 'var(--on-accent)' : 'var(--text-muted)',
          transform: checked ? 'translateX(22px)' : 'none',
          transition: 'transform var(--dur-med) var(--ease-spring), background var(--dur-med) var(--ease)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
        }}></span>
      </button>
    </div>
  );
}
