import React, { useState } from 'react';

/** 10-key visit-total entry with validation shake. onConfirm(total) receives the parsed score. */
export function Numpad({ onConfirm, validate }) {
  const [value, setValue] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [shaking, setShaking] = useState(false);

  const press = (d) => { if (value.length < 3) { setValue(value + d); setInvalid(false); } };
  const confirm = () => {
    const total = parseInt(value, 10);
    const ok = !isNaN(total) && total <= 180 && (!validate || validate(total));
    if (!ok) {
      setInvalid(true); setShaking(true); setTimeout(() => setShaking(false), 400);
      return;
    }
    onConfirm && onConfirm(total); setValue(''); setInvalid(false);
  };

  const key = {
    height: 'var(--key-h)', minWidth: 64, background: 'var(--surface)',
    border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-sm)',
    color: 'var(--text)', fontSize: 'var(--text-2xl)', fontWeight: 500, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-ui)', boxShadow: 'var(--edge-highlight)',
    transition: 'transform var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease)',
    fontVariantNumeric: 'tabular-nums', WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  };
  const pressFx = {
    onPointerDown: (e) => { e.currentTarget.style.transform = 'scale(var(--press-scale))'; e.currentTarget.style.background = 'var(--surface-3)'; },
    onPointerUp: (e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = 'var(--surface)'; },
    onPointerLeave: (e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = 'var(--surface)'; },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', padding: 'var(--space-md)', background: 'var(--bg)', width: '100%', maxWidth: 380, margin: '0 auto', boxSizing: 'border-box' }}>
      <style>{'@keyframes np-shake{0%{transform:translateX(0)}15%{transform:translateX(-6px)}30%{transform:translateX(6px)}45%{transform:translateX(-6px)}60%{transform:translateX(6px)}75%{transform:translateX(-4px)}90%{transform:translateX(4px)}100%{transform:translateX(0)}}'}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{
          height: 'var(--key-h)', background: 'var(--bg-deep)', borderRadius: 'var(--radius-sm)',
          color: invalid ? 'var(--destructive)' : 'var(--text)',
          border: '2px solid ' + (invalid ? 'var(--destructive)' : 'var(--line-strong)'),
          fontFamily: 'var(--font-score)', fontSize: 'var(--text-3xl)', fontWeight: 700,
          letterSpacing: 'var(--tracking-tight)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color var(--dur-base) var(--ease), color var(--dur-base) var(--ease)',
          animation: shaking ? 'np-shake 400ms ease-in-out' : 'none',
          fontVariantNumeric: 'tabular-nums', boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.35)',
        }}>{value || '—'}</div>
        {invalid && <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--destructive)', textAlign: 'center' }}>Ungültige Punktzahl</div>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-sm)' }}>
        {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((d) => (
          <button key={d} {...pressFx} style={key} onClick={() => press(String(d))}>{d}</button>
        ))}
        <button {...pressFx} style={{ ...key, color: 'var(--destructive)', fontSize: 'var(--text-xl)', fontWeight: 600 }} onClick={() => { setValue(''); setInvalid(false); }}>C</button>
        <button {...pressFx} style={key} onClick={() => press('0')}>0</button>
        <button {...pressFx} style={{ ...key, fontSize: 'var(--text-xl)' }} onClick={() => { setValue(value.slice(0, -1)); setInvalid(false); }} aria-label="Letzte Ziffer löschen">⌫</button>
      </div>
      <button onClick={confirm} style={{
        height: 'var(--key-h)', width: '100%',
        background: 'linear-gradient(180deg, var(--accent-bright) 0%, var(--accent) 45%, var(--accent-deep) 130%)',
        border: 'none', borderRadius: 'var(--radius-sm)', color: 'var(--on-accent)',
        fontSize: 'var(--text-lg)', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-ui)',
        boxShadow: 'var(--shadow-raise), inset 0 1px 0 rgba(255,255,255,0.25)', letterSpacing: '0.01em',
        transition: 'transform var(--dur-fast) var(--ease)', WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
      }}
        onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(var(--press-scale))'; }}
        onPointerUp={(e) => { e.currentTarget.style.transform = 'none'; }}
        onPointerLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
      >Bestätigen</button>
    </div>
  );
}
