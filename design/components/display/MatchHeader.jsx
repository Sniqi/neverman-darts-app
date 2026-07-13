import React from 'react';

/** Spectator header: "501 Double Out ● First to 3 Sets ● Leg 2" with amber rule + bloom. Sized for 3 m viewing. */
export function MatchHeader({ startScore, outRule = 'double', setsEnabled = false, legsToWin = 2, setsToWin = 3, currentLeg = 1 }) {
  const outLabel = outRule === 'double' ? 'Double Out' : 'Single Out';
  const format = setsEnabled ? 'First to ' + setsToWin + ' Sets' : 'First to ' + legsToWin + ' Legs';
  const dot = <span aria-hidden="true" style={{ color: 'var(--accent)', fontSize: '0.4em', lineHeight: 1, opacity: 0.85, flexShrink: 0, transform: 'translateY(-0.15em)' }}>●</span>;
  return (
    <div style={{
      position: 'relative', display: 'flex', alignItems: 'center', gap: 'clamp(0.5rem, 1.2vw, 1.6rem)',
      padding: 'clamp(8px, 1vw, 20px) clamp(16px, 2.5vw, 48px)',
      background: 'linear-gradient(180deg, #212634 0%, #13161e 100%)',
      fontFamily: 'var(--font-score)', fontSize: 'clamp(1.75rem, 3.4vw, 6.5rem)', fontWeight: 600,
      lineHeight: 1.15, color: 'var(--text)',
      whiteSpace: 'nowrap', overflow: 'hidden', borderBottom: '3px solid var(--accent)',
      boxShadow: 'var(--shadow-panel)', fontVariantNumeric: 'tabular-nums',
    }}>
      <span style={{ fontWeight: 700, flexShrink: 0 }}>{startScore} {outLabel}</span>
      {dot}
      <span style={{ color: 'var(--text-soft)', fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{format}</span>
      {dot}
      <span style={{ color: 'var(--accent)', fontWeight: 800, flexShrink: 0 }}>Leg {currentLeg}</span>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: -3, height: 16, background: 'linear-gradient(180deg, color-mix(in oklab, var(--accent) 28%, transparent), transparent)', pointerEvents: 'none' }}></div>
    </div>
  );
}
