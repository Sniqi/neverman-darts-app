import React from 'react';

/** KPI tile: pre-formatted value above muted label. Caller formats value ("42.3", "67%", "—"). */
export function StatCard({ label, value }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--line)',
      borderRadius: 'var(--radius-md)', padding: 'var(--space-md) var(--space-lg)',
      display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)',
      boxShadow: 'var(--edge-highlight)',
    }}>
      <span style={{
        fontFamily: 'var(--font-score)', fontSize: 'var(--text-3xl)', fontWeight: 700,
        color: 'var(--text)', lineHeight: 1.1, letterSpacing: 'var(--tracking-tight)',
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</span>
      <span style={{ fontSize: 'var(--text-base)', fontWeight: 500, color: 'var(--text-muted)', lineHeight: 1.4 }}>{label}</span>
    </div>
  );
}
