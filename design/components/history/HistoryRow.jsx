import React from 'react';

/** Match-history list row: date + result, winner in amber, format subtitle, trailing chevron. */
export function HistoryRow({ date, winnerName, otherNames = [], result, format, onClick }) {
  const twoPlayer = otherNames.length === 1;
  return (
    <li style={{ listStyle: 'none', margin: 0, padding: 0, borderBottom: '1px solid var(--line)' }}>
      <button onClick={onClick} style={{
        display: 'flex', alignItems: 'center', width: '100%', minHeight: 'var(--row-h)',
        padding: 'var(--space-sm) var(--space-md)', boxSizing: 'border-box',
        background: 'var(--surface)', border: 'none',
        color: 'var(--text)', cursor: 'pointer', textAlign: 'left', gap: 'var(--space-md)',
        fontFamily: 'var(--font-ui)', transition: 'background var(--dur-fast) var(--ease)',
        WebkitTapHighlightColor: 'transparent',
      }}
        onPointerDown={(e) => { e.currentTarget.style.background = 'var(--surface-3)'; }}
        onPointerUp={(e) => { e.currentTarget.style.background = 'var(--surface)'; }}
        onPointerLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{date}</span>
            {twoPlayer && <span style={{ fontFamily: 'var(--font-score)', fontSize: 'var(--text-md)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{result}</span>}
          </div>
          <div style={{ fontSize: 'var(--text-md)', lineHeight: 1.4 }}>
            <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{winnerName}</span>
            {twoPlayer
              ? <span style={{ color: 'var(--text-soft)' }}> · {otherNames[0]}</span>
              : <span style={{ color: 'var(--text-soft)' }}> gewinnt — {result}</span>}
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{format}</div>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </li>
  );
}
