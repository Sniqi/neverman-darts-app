import React from 'react';

/** Two-or-more segment control (e.g. Single Out / Double Out): recessed track, filled active segment. */
export function SegmentedControl({ options, value, onChange }) {
  return (
    <div role="group" style={{
      display: 'flex', gap: 4, padding: 4,
      background: 'var(--bg-deep)', border: '1px solid var(--line)',
      borderRadius: 'var(--radius-sm)',
    }}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button key={opt} aria-pressed={active} onClick={() => onChange && onChange(opt)} style={{
            flex: 1, minHeight: 'calc(var(--control-h) - 10px)',
            background: active
              ? 'linear-gradient(180deg, var(--accent-bright) 0%, var(--accent) 45%, var(--accent-deep) 130%)'
              : 'transparent',
            color: active ? 'var(--on-accent)' : 'var(--text-muted)',
            border: 'none', borderRadius: 'calc(var(--radius-sm) - 4px)',
            padding: 'var(--space-sm) var(--space-md)', fontSize: 'var(--text-md)',
            fontWeight: active ? 700 : 500, fontFamily: 'var(--font-ui)', cursor: 'pointer',
            boxShadow: active ? 'var(--shadow-raise), inset 0 1px 0 rgba(255,255,255,0.25)' : 'none',
            transition: 'background var(--dur-base) var(--ease), color var(--dur-base) var(--ease)',
            whiteSpace: 'nowrap', WebkitTapHighlightColor: 'transparent',
          }}>{opt}</button>
        );
      })}
    </div>
  );
}
