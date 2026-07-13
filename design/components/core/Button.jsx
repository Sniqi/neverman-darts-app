import React from 'react';

/**
 * Neverman Darts button. Variants from the app:
 * - "menu": 64px surface row with right chevron (start-hub nav)
 * - "accent": amber fill, near-black text (primary CTA / "Neues Spiel")
 * - "cta": full-width 64px accent start button ("Spiel starten")
 * - "destructive": red fill (dialog confirm)
 * - "cancel": surface with hairline border ("Abbrechen")
 */
export function Button({ variant = 'menu', children, chevron = false, disabled = false, onClick, style }) {
  const base = {
    display: 'flex', alignItems: 'center',
    justifyContent: chevron ? 'space-between' : 'center',
    width: '100%', border: 'none', cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'var(--font-ui)', textAlign: 'left',
    opacity: disabled ? 0.4 : 1, gap: 'var(--space-sm)',
    transition: 'transform var(--dur-base) var(--ease), background var(--dur-base) var(--ease), filter var(--dur-base) var(--ease)',
    WebkitTapHighlightColor: 'transparent',
  };
  const accentFill = {
    background: 'linear-gradient(180deg, var(--accent-bright) 0%, var(--accent) 45%, var(--accent-deep) 130%)',
    color: 'var(--on-accent)', boxShadow: 'var(--shadow-raise), inset 0 1px 0 rgba(255,255,255,0.25)',
  };
  const variants = {
    menu: { height: 'var(--row-h)', padding: '0 var(--space-lg)', background: 'var(--surface)', color: 'var(--text)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-md)', fontWeight: 500, border: '1px solid var(--line)', boxShadow: 'var(--edge-highlight)' },
    accent: { ...accentFill, height: 'var(--row-h)', padding: '0 var(--space-lg)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-md)', fontWeight: 600 },
    cta: { ...accentFill, minHeight: 'var(--row-h)', padding: 'var(--space-sm) var(--space-lg)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-lg)', fontWeight: 700, justifyContent: 'center', letterSpacing: '0.01em' },
    destructive: { height: 56, background: 'var(--destructive)', color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-md)', fontWeight: 600, justifyContent: 'center', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)' },
    cancel: { height: 56, background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border-input)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-md)', fontWeight: 600, justifyContent: 'center' },
  };
  return (
    <button style={{ ...base, ...variants[variant], ...style }} disabled={disabled} onClick={onClick}
      onPointerDown={(e) => { if (!disabled) { e.currentTarget.style.transform = 'scale(var(--press-scale))'; e.currentTarget.style.filter = 'brightness(1.1)'; } }}
      onPointerUp={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.filter = 'none'; }}
      onPointerLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.filter = 'none'; }}>
      <span>{children}</span>
      {chevron && (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ opacity: 0.7, flexShrink: 0 }}>
          <path d="M9 18l6-6-6-6" />
        </svg>
      )}
    </button>
  );
}
