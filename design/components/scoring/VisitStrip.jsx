import React from 'react';
import { formatDart } from './DartPill.jsx';

function slotLabel(dart) {
  if (!dart) return '—';
  if (dart.segment === 0) return '0 (Daneben)';
  if (dart.multiplier === 2 && dart.segment === 25) return 'Bull';
  if (dart.multiplier === 1 && dart.segment === 25) return 'Outer Bull';
  return formatDart(dart);
}

/** Three 56px dart slots for the current visit. Tapping a filled slot = UNDO. Bust tints the strip red. */
export function VisitStrip({ darts = [], bust = false, onUndo }) {
  return (
    <div style={{
      display: 'flex', gap: 'var(--space-sm)', alignItems: 'center',
      padding: 'var(--space-xs) var(--space-md)', borderRadius: 'var(--radius-md)',
      transition: 'background-color var(--dur-slow) var(--ease)',
      backgroundColor: bust ? 'var(--destructive-soft)' : 'transparent',
      boxShadow: bust ? 'inset 0 0 0 1px var(--destructive-line)' : 'none',
    }}>
      {[0, 1, 2].map((i) => {
        const filled = !!darts[i];
        return (
          <button key={i} disabled={darts.length === 0} onClick={onUndo} style={{
            height: 'var(--control-h)', flex: 1, minWidth: 80,
            background: filled ? 'var(--surface-2)' : 'var(--surface)',
            border: filled ? '1px solid var(--line-strong)' : '1px dashed var(--line-strong)',
            borderRadius: 'var(--radius-sm)',
            color: filled ? 'var(--text)' : 'var(--text-faint)',
            fontSize: 'var(--text-md)', fontWeight: filled ? 600 : 400,
            cursor: darts.length === 0 ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums',
            boxShadow: filled ? 'var(--edge-highlight)' : 'none',
            transition: 'background var(--dur-base) var(--ease), border-color var(--dur-base) var(--ease)',
            WebkitTapHighlightColor: 'transparent',
          }}>{slotLabel(darts[i])}</button>
        );
      })}
    </div>
  );
}
