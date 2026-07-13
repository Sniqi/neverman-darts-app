import React from 'react';
import { DartPill } from '../scoring/DartPill.jsx';

/**
 * One spectator player column: giant name/score, leg/set chips, recessed visit
 * history (newest amber-edged), checkout route pill, Ø footer.
 * All type uses the --display-* scale (readable on 27" at 3 m).
 * visits: [{darts:[DartScore], total, scoreAfter, bust?, live?}] oldest→newest.
 */
export function PlayerPanel({ name, remaining, legs, sets, active = false, visits = [], checkout, legAvg = '—', matchAvg = '—', bustFlash = false }) {
  const chip = {
    display: 'inline-flex', alignItems: 'baseline', fontSize: 'var(--display-body)', fontWeight: 600,
    lineHeight: 1.15, whiteSpace: 'nowrap', color: 'var(--text)',
    background: active ? 'var(--accent-soft)' : 'rgba(255,255,255,0.05)',
    border: '1px solid ' + (active ? 'var(--accent-line)' : 'var(--line)'),
    borderRadius: 'var(--radius-sm)', padding: '0.06em 0.45em', fontVariantNumeric: 'tabular-nums',
  };
  return (
    <div style={{
      position: 'relative', display: 'flex', flexDirection: 'column',
      padding: 'clamp(10px, 2cqw, 28px) clamp(10px, 2cqw, 22px)',
      background: active ? 'linear-gradient(165deg, #272d3c 0%, #191d28 100%)' : 'linear-gradient(165deg, #1a1e29 0%, #12151d 100%)',
      borderTop: '5px solid ' + (active ? 'var(--accent)' : 'transparent'),
      boxShadow: active ? 'inset 0 0 80px color-mix(in oklab, var(--accent) 7%, transparent), inset 0 5px 0 color-mix(in oklab, var(--accent) 22%, transparent)' : 'none',
      opacity: active ? 1 : 0.55, height: '100%', overflow: 'hidden', boxSizing: 'border-box',
      gap: 'clamp(4px, 1.2cqw, 14px)', fontVariantNumeric: 'tabular-nums', containerType: 'inline-size',
      transition: 'opacity var(--dur-slow) var(--ease)',
    }}>
      {bustFlash && (
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'color-mix(in oklab, var(--destructive) 16%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5, pointerEvents: 'none' }}>
          <span style={{ fontFamily: 'var(--font-score)', fontSize: 'clamp(3rem, 14cqw, 12rem)', fontWeight: 800, color: 'var(--destructive)', letterSpacing: 'var(--tracking-caps)', textShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>BUST</span>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(4px, 0.8cqw, 10px)', paddingBottom: 'clamp(8px, 1.4cqw, 18px)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.4em', minWidth: 0 }}>
          <div style={{ flex: '0 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 'var(--display-name)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.01em', color: 'var(--text)' }}>{name}</div>
          <div style={{
            flex: '0 0 auto', fontFamily: 'var(--font-score)', fontSize: 'var(--display-score)', fontWeight: 800,
            lineHeight: 0.95, letterSpacing: 'var(--tracking-tight)', textAlign: 'right',
            color: active ? '#ffffff' : 'var(--text)',
            textShadow: active ? '0 0 70px color-mix(in oklab, var(--accent) 40%, transparent), 0 2px 12px rgba(0,0,0,0.5)' : 'none',
          }}>{remaining}</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(6px, 1cqw, 14px)' }}>
          {sets != null && <span style={chip}>Sets: {sets}</span>}
          <span style={chip}>Legs: {legs}</span>
        </div>
      </div>
      {checkout && (
        <div style={{
          alignSelf: 'flex-start', fontFamily: 'var(--font-score)', fontSize: 'var(--display-emph)', fontWeight: 700,
          letterSpacing: '0.02em', color: 'var(--accent)', background: 'var(--accent-soft)',
          border: '1px solid var(--accent-line)', borderRadius: 'var(--radius-pill)',
          padding: '0.08em 0.7em', boxShadow: 'var(--glow-accent)', lineHeight: 1.2,
        }}>{checkout}</div>
      )}
      <div style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', background: 'rgba(0,0,0,0.22)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: 'clamp(5px, 1cqw, 12px)', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
        <div style={{ flex: '1 1 auto', display: 'grid', gridTemplateColumns: '1fr auto auto', alignContent: 'end', rowGap: 'clamp(4px, 0.8cqw, 10px)', overflow: 'hidden' }}>
          {visits.map((v, i) => {
            const last = i === visits.length - 1;
            return (
              <div key={i} style={{
                display: 'grid', gridColumn: '1 / -1', gridTemplateColumns: 'subgrid', alignItems: 'center',
                columnGap: 'clamp(0.4em, 1.5cqw, 1em)', padding: 'clamp(4px, 0.9cqw, 10px) clamp(8px, 1.6cqw, 16px)',
                borderRadius: 'var(--radius-sm)',
                background: v.live ? 'color-mix(in oklab, var(--accent) 17%, transparent)' : last ? 'var(--accent-soft)' : 'rgba(255,255,255,0.03)',
                opacity: last ? 1 : 0.62, boxShadow: last ? 'inset 4px 0 0 var(--accent)' : 'none',
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(0.15em, 0.6cqw, 0.4em)', minWidth: 0, fontSize: 'var(--display-body)' }}>
                  {v.darts.map((d, j) => <DartPill key={j} dart={d} bust={v.bust} size="0.82em" />)}
                </div>
                <span style={{ fontFamily: 'var(--font-score)', fontSize: v.bust ? 'var(--display-body)' : 'var(--display-emph)', fontWeight: 700, lineHeight: 1, textAlign: 'right', color: v.bust ? 'var(--destructive)' : 'var(--text)', whiteSpace: 'nowrap' }}>{v.bust ? 'BUST' : v.total}</span>
                <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.25em', fontFamily: 'var(--font-score)', fontSize: 'var(--display-body)', fontWeight: 600, color: last ? 'var(--text-soft)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  <span aria-hidden="true" style={{ opacity: 0.5, fontWeight: 400 }}>→</span>{v.scoreAfter}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-xs) clamp(12px, 2cqw, 28px)', paddingTop: 'clamp(6px, 1cqw, 12px)', borderTop: '1px solid var(--line)', fontSize: 'var(--display-caption)', lineHeight: 1.2, color: 'var(--text)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.3em', whiteSpace: 'nowrap' }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Ø Leg</span> <span style={{ fontFamily: 'var(--font-score)', fontWeight: 700 }}>{legAvg}</span>
        </span>
        <span aria-hidden="true" style={{ alignSelf: 'stretch', width: 1, margin: '0.15em 0', background: 'var(--line-strong)' }}></span>
        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.3em', whiteSpace: 'nowrap' }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Ø Match</span> <span style={{ fontFamily: 'var(--font-score)', fontWeight: 700 }}>{matchAvg}</span>
        </span>
      </div>
    </div>
  );
}
