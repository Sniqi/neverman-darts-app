import React from 'react';
import { Button } from './Button.jsx';

/** Modal confirm dialog: heading, one-sentence body, stacked CTA + "Abbrechen". Blurred scrim, scale-in. */
export function ConfirmDialog({ heading, body, ctaLabel, ctaStyle = 'destructive', onConfirm, onCancel, backdropDismiss = false }) {
  return (
    <div role="dialog" aria-modal="true" onClick={() => backdropDismiss && onCancel && onCancel()} style={{
      position: 'fixed', inset: 0, background: 'var(--backdrop)',
      backdropFilter: 'blur(var(--blur-backdrop))', WebkitBackdropFilter: 'blur(var(--blur-backdrop))',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40,
      animation: 'nd-fade var(--dur-med) var(--ease)',
    }}>
      <style>{'@keyframes nd-fade{from{opacity:0}to{opacity:1}}@keyframes nd-pop{from{opacity:0;transform:scale(.94) translateY(8px)}to{opacity:1;transform:none}}'}</style>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--surface-2)', border: '1px solid var(--line-strong)',
        borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)',
        maxWidth: 420, width: 'calc(100% - 48px)', boxSizing: 'border-box',
        boxShadow: 'var(--shadow-panel), var(--edge-highlight)',
        animation: 'nd-pop var(--dur-med) var(--ease-spring)',
      }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, margin: '0 0 var(--space-sm) 0', color: 'var(--text)', lineHeight: 1.25 }}>{heading}</h2>
        <p style={{ fontSize: 'var(--text-base)', margin: '0 0 var(--space-lg) 0', color: 'var(--text-soft)', lineHeight: 1.5 }}>{body}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <Button variant={ctaStyle === 'accent' ? 'accent' : 'destructive'} onClick={onConfirm} style={{ justifyContent: 'center' }}>{ctaLabel}</Button>
          <Button variant="cancel" onClick={onCancel}>Abbrechen</Button>
        </div>
      </div>
    </div>
  );
}
