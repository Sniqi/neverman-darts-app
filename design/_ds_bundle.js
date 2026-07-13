/* @ds-bundle: {"format":4,"namespace":"NevermanDartsDesignSystem_61370c","components":[{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Chip","sourcePath":"components/core/Chip.jsx"},{"name":"ConfirmDialog","sourcePath":"components/core/ConfirmDialog.jsx"},{"name":"SegmentedControl","sourcePath":"components/core/SegmentedControl.jsx"},{"name":"StatCard","sourcePath":"components/core/StatCard.jsx"},{"name":"Stepper","sourcePath":"components/core/Stepper.jsx"},{"name":"ToggleRow","sourcePath":"components/core/ToggleRow.jsx"},{"name":"MatchHeader","sourcePath":"components/display/MatchHeader.jsx"},{"name":"PlayerPanel","sourcePath":"components/display/PlayerPanel.jsx"},{"name":"HistoryRow","sourcePath":"components/history/HistoryRow.jsx"},{"name":"DartPill","sourcePath":"components/scoring/DartPill.jsx"},{"name":"Dartboard","sourcePath":"components/scoring/Dartboard.jsx"},{"name":"Numpad","sourcePath":"components/scoring/Numpad.jsx"},{"name":"ScoreCard","sourcePath":"components/scoring/ScoreCard.jsx"},{"name":"VisitStrip","sourcePath":"components/scoring/VisitStrip.jsx"}],"sourceHashes":{"components/core/Button.jsx":"8978f287476e","components/core/Chip.jsx":"e7fd7bd42fe9","components/core/ConfirmDialog.jsx":"3598e7aea548","components/core/SegmentedControl.jsx":"b867de3a6106","components/core/StatCard.jsx":"a37e023c04fb","components/core/Stepper.jsx":"3e487f1f5030","components/core/ToggleRow.jsx":"0d7ee723a247","components/display/MatchHeader.jsx":"f0be4ba03f77","components/display/PlayerPanel.jsx":"b2d349c3b3cc","components/history/HistoryRow.jsx":"64c21f566472","components/scoring/DartPill.jsx":"827db795f72e","components/scoring/Dartboard.jsx":"40e8c1000d62","components/scoring/Numpad.jsx":"5b83c1c5e103","components/scoring/ScoreCard.jsx":"82997c323dcf","components/scoring/VisitStrip.jsx":"7ee1c63a0973","ui_kits/darts-app/screens.jsx":"0f12625e590a"},"inlinedExternals":[],"unexposedExports":[{"name":"formatDart","sourcePath":"components/scoring/DartPill.jsx"}]} */

(() => {

const __ds_ns = (window.NevermanDartsDesignSystem_61370c = window.NevermanDartsDesignSystem_61370c || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Button.jsx
try { (() => {
/**
 * Neverman Darts button. Variants from the app:
 * - "menu": 64px surface row with right chevron (start-hub nav)
 * - "accent": amber fill, near-black text (primary CTA / "Neues Spiel")
 * - "cta": full-width 64px accent start button ("Spiel starten")
 * - "destructive": red fill (dialog confirm)
 * - "cancel": surface with hairline border ("Abbrechen")
 */
function Button({
  variant = 'menu',
  children,
  chevron = false,
  disabled = false,
  onClick,
  style
}) {
  const base = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: chevron ? 'space-between' : 'center',
    width: '100%',
    border: 'none',
    cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'var(--font-ui)',
    textAlign: 'left',
    opacity: disabled ? 0.4 : 1,
    gap: 'var(--space-sm)',
    transition: 'transform var(--dur-base) var(--ease), background var(--dur-base) var(--ease), filter var(--dur-base) var(--ease)',
    WebkitTapHighlightColor: 'transparent'
  };
  const accentFill = {
    background: 'linear-gradient(180deg, var(--accent-bright) 0%, var(--accent) 45%, var(--accent-deep) 130%)',
    color: 'var(--on-accent)',
    boxShadow: 'var(--shadow-raise), inset 0 1px 0 rgba(255,255,255,0.25)'
  };
  const variants = {
    menu: {
      height: 'var(--row-h)',
      padding: '0 var(--space-lg)',
      background: 'var(--surface)',
      color: 'var(--text)',
      borderRadius: 'var(--radius-sm)',
      fontSize: 'var(--text-md)',
      fontWeight: 500,
      border: '1px solid var(--line)',
      boxShadow: 'var(--edge-highlight)'
    },
    accent: {
      ...accentFill,
      height: 'var(--row-h)',
      padding: '0 var(--space-lg)',
      borderRadius: 'var(--radius-sm)',
      fontSize: 'var(--text-md)',
      fontWeight: 600
    },
    cta: {
      ...accentFill,
      minHeight: 'var(--row-h)',
      padding: 'var(--space-sm) var(--space-lg)',
      borderRadius: 'var(--radius-sm)',
      fontSize: 'var(--text-lg)',
      fontWeight: 700,
      justifyContent: 'center',
      letterSpacing: '0.01em'
    },
    destructive: {
      height: 56,
      background: 'var(--destructive)',
      color: '#fff',
      borderRadius: 'var(--radius-sm)',
      fontSize: 'var(--text-md)',
      fontWeight: 600,
      justifyContent: 'center',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)'
    },
    cancel: {
      height: 56,
      background: 'var(--surface)',
      color: 'var(--text)',
      border: '1px solid var(--border-input)',
      borderRadius: 'var(--radius-sm)',
      fontSize: 'var(--text-md)',
      fontWeight: 600,
      justifyContent: 'center'
    }
  };
  return /*#__PURE__*/React.createElement("button", {
    style: {
      ...base,
      ...variants[variant],
      ...style
    },
    disabled: disabled,
    onClick: onClick,
    onPointerDown: e => {
      if (!disabled) {
        e.currentTarget.style.transform = 'scale(var(--press-scale))';
        e.currentTarget.style.filter = 'brightness(1.1)';
      }
    },
    onPointerUp: e => {
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.filter = 'none';
    },
    onPointerLeave: e => {
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.filter = 'none';
    }
  }, /*#__PURE__*/React.createElement("span", null, children), chevron && /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    style: {
      opacity: 0.7,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M9 18l6-6-6-6"
  })));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Chip.jsx
try { (() => {
/** Game-mode chip (301/401/501). Equal-width in a row, 56px min height, radius 12. */
function Chip({
  active = false,
  children,
  onClick,
  style
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    "aria-pressed": active,
    style: {
      flex: 1,
      minHeight: 'var(--control-h)',
      background: active ? 'linear-gradient(180deg, var(--accent-bright) 0%, var(--accent) 45%, var(--accent-deep) 130%)' : 'var(--surface)',
      color: active ? 'var(--on-accent)' : 'var(--text-soft)',
      border: '1px solid ' + (active ? 'transparent' : 'var(--border-input)'),
      borderRadius: 'var(--radius-sm)',
      padding: 'var(--space-sm)',
      fontSize: 'var(--text-md)',
      fontWeight: active ? 700 : 500,
      fontFamily: 'var(--font-ui)',
      cursor: 'pointer',
      boxShadow: active ? 'var(--shadow-raise), inset 0 1px 0 rgba(255,255,255,0.25)' : 'var(--edge-highlight)',
      transition: 'background var(--dur-base) var(--ease), color var(--dur-base) var(--ease), transform var(--dur-base) var(--ease)',
      fontVariantNumeric: 'tabular-nums',
      WebkitTapHighlightColor: 'transparent',
      ...style
    },
    onPointerDown: e => {
      e.currentTarget.style.transform = 'scale(var(--press-scale))';
    },
    onPointerUp: e => {
      e.currentTarget.style.transform = 'none';
    },
    onPointerLeave: e => {
      e.currentTarget.style.transform = 'none';
    }
  }, children);
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Chip.jsx", error: String((e && e.message) || e) }); }

// components/core/ConfirmDialog.jsx
try { (() => {
/** Modal confirm dialog: heading, one-sentence body, stacked CTA + "Abbrechen". Blurred scrim, scale-in. */
function ConfirmDialog({
  heading,
  body,
  ctaLabel,
  ctaStyle = 'destructive',
  onConfirm,
  onCancel,
  backdropDismiss = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    onClick: () => backdropDismiss && onCancel && onCancel(),
    style: {
      position: 'fixed',
      inset: 0,
      background: 'var(--backdrop)',
      backdropFilter: 'blur(var(--blur-backdrop))',
      WebkitBackdropFilter: 'blur(var(--blur-backdrop))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 40,
      animation: 'nd-fade var(--dur-med) var(--ease)'
    }
  }, /*#__PURE__*/React.createElement("style", null, '@keyframes nd-fade{from{opacity:0}to{opacity:1}}@keyframes nd-pop{from{opacity:0;transform:scale(.94) translateY(8px)}to{opacity:1;transform:none}}'), /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: 'var(--surface-2)',
      border: '1px solid var(--line-strong)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-xl)',
      maxWidth: 420,
      width: 'calc(100% - 48px)',
      boxSizing: 'border-box',
      boxShadow: 'var(--shadow-panel), var(--edge-highlight)',
      animation: 'nd-pop var(--dur-med) var(--ease-spring)'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 'var(--text-xl)',
      fontWeight: 600,
      margin: '0 0 var(--space-sm) 0',
      color: 'var(--text)',
      lineHeight: 1.25
    }
  }, heading), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--text-base)',
      margin: '0 0 var(--space-lg) 0',
      color: 'var(--text-soft)',
      lineHeight: 1.5
    }
  }, body), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-sm)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: ctaStyle === 'accent' ? 'accent' : 'destructive',
    onClick: onConfirm,
    style: {
      justifyContent: 'center'
    }
  }, ctaLabel), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "cancel",
    onClick: onCancel
  }, "Abbrechen"))));
}
Object.assign(__ds_scope, { ConfirmDialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ConfirmDialog.jsx", error: String((e && e.message) || e) }); }

// components/core/SegmentedControl.jsx
try { (() => {
/** Two-or-more segment control (e.g. Single Out / Double Out): recessed track, filled active segment. */
function SegmentedControl({
  options,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "group",
    style: {
      display: 'flex',
      gap: 4,
      padding: 4,
      background: 'var(--bg-deep)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--radius-sm)'
    }
  }, options.map(opt => {
    const active = opt === value;
    return /*#__PURE__*/React.createElement("button", {
      key: opt,
      "aria-pressed": active,
      onClick: () => onChange && onChange(opt),
      style: {
        flex: 1,
        minHeight: 'calc(var(--control-h) - 10px)',
        background: active ? 'linear-gradient(180deg, var(--accent-bright) 0%, var(--accent) 45%, var(--accent-deep) 130%)' : 'transparent',
        color: active ? 'var(--on-accent)' : 'var(--text-muted)',
        border: 'none',
        borderRadius: 'calc(var(--radius-sm) - 4px)',
        padding: 'var(--space-sm) var(--space-md)',
        fontSize: 'var(--text-md)',
        fontWeight: active ? 700 : 500,
        fontFamily: 'var(--font-ui)',
        cursor: 'pointer',
        boxShadow: active ? 'var(--shadow-raise), inset 0 1px 0 rgba(255,255,255,0.25)' : 'none',
        transition: 'background var(--dur-base) var(--ease), color var(--dur-base) var(--ease)',
        whiteSpace: 'nowrap',
        WebkitTapHighlightColor: 'transparent'
      }
    }, opt);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/core/StatCard.jsx
try { (() => {
/** KPI tile: pre-formatted value above muted label. Caller formats value ("42.3", "67%", "—"). */
function StatCard({
  label,
  value
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-md) var(--space-lg)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-xs)',
      boxShadow: 'var(--edge-highlight)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-score)',
      fontSize: 'var(--text-3xl)',
      fontWeight: 700,
      color: 'var(--text)',
      lineHeight: 1.1,
      letterSpacing: 'var(--tracking-tight)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, value), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-base)',
      fontWeight: 500,
      color: 'var(--text-muted)',
      lineHeight: 1.4
    }
  }, label));
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/core/Stepper.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Stepper row: label left, − value + right, optional unit. 48px round buttons on a surface row. */
function Stepper({
  label,
  value,
  min = 1,
  max = 9,
  unit,
  onChange
}) {
  const btn = dis => ({
    width: 'var(--hit-min)',
    height: 'var(--hit-min)',
    background: 'var(--surface-3)',
    color: 'var(--text)',
    border: '1px solid var(--line-strong)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-xl)',
    fontWeight: 500,
    lineHeight: 1,
    cursor: dis ? 'default' : 'pointer',
    opacity: dis ? 0.3 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-ui)',
    boxShadow: 'var(--edge-highlight)',
    transition: 'transform var(--dur-fast) var(--ease)',
    WebkitTapHighlightColor: 'transparent',
    flexShrink: 0
  });
  const press = {
    onPointerDown: e => {
      if (!e.currentTarget.disabled) e.currentTarget.style.transform = 'scale(var(--press-scale))';
    },
    onPointerUp: e => {
      e.currentTarget.style.transform = 'none';
    },
    onPointerLeave: e => {
      e.currentTarget.style.transform = 'none';
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'var(--surface)',
      border: '1px solid var(--line)',
      padding: 'var(--space-sm) var(--space-md)',
      minHeight: 'var(--row-h)',
      boxSizing: 'border-box',
      borderRadius: 'var(--radius-sm)',
      gap: 'var(--space-sm)',
      boxShadow: 'var(--edge-highlight)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-md)',
      fontWeight: 500
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)'
    }
  }, /*#__PURE__*/React.createElement("button", _extends({}, press, {
    style: btn(value <= min),
    disabled: value <= min,
    onClick: () => onChange && onChange(value - 1),
    "aria-label": "Weniger"
  }), "\u2212"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xl)',
      fontWeight: 700,
      minWidth: 32,
      textAlign: 'center',
      fontVariantNumeric: 'tabular-nums'
    }
  }, value), /*#__PURE__*/React.createElement("button", _extends({}, press, {
    style: btn(value >= max),
    disabled: value >= max,
    onClick: () => onChange && onChange(value + 1),
    "aria-label": "Mehr"
  }), "+")), unit && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)',
      minWidth: 48
    }
  }, unit));
}
Object.assign(__ds_scope, { Stepper });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Stepper.jsx", error: String((e && e.message) || e) }); }

// components/core/ToggleRow.jsx
try { (() => {
/** Settings row with a custom switch (Sets, Caller, Musik, Automatische Pause). */
function ToggleRow({
  label,
  checked,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'var(--surface)',
      border: '1px solid var(--line)',
      padding: 'var(--space-sm) var(--space-md)',
      minHeight: 'var(--row-h)',
      boxSizing: 'border-box',
      borderRadius: 'var(--radius-sm)',
      gap: 'var(--space-md)',
      boxShadow: 'var(--edge-highlight)'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 'var(--text-md)',
      fontWeight: 500
    }
  }, label), /*#__PURE__*/React.createElement("button", {
    role: "switch",
    "aria-checked": checked,
    onClick: () => onChange && onChange(!checked),
    style: {
      position: 'relative',
      width: 56,
      height: 34,
      flexShrink: 0,
      background: checked ? 'var(--accent)' : 'var(--surface-3)',
      border: '1px solid ' + (checked ? 'var(--accent)' : 'var(--line-strong)'),
      borderRadius: 'var(--radius-pill)',
      cursor: 'pointer',
      padding: 0,
      transition: 'background var(--dur-med) var(--ease), border-color var(--dur-med) var(--ease)',
      boxShadow: checked ? 'var(--glow-accent)' : 'inset 0 1px 3px rgba(0,0,0,0.35)',
      WebkitTapHighlightColor: 'transparent'
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      top: 3,
      left: 3,
      width: 26,
      height: 26,
      borderRadius: '50%',
      background: checked ? 'var(--on-accent)' : 'var(--text-muted)',
      transform: checked ? 'translateX(22px)' : 'none',
      transition: 'transform var(--dur-med) var(--ease-spring), background var(--dur-med) var(--ease)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.4)'
    }
  })));
}
Object.assign(__ds_scope, { ToggleRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ToggleRow.jsx", error: String((e && e.message) || e) }); }

// components/display/MatchHeader.jsx
try { (() => {
/** Spectator header: "501 Double Out ● First to 3 Sets ● Leg 2" with amber rule + bloom. Sized for 3 m viewing. */
function MatchHeader({
  startScore,
  outRule = 'double',
  setsEnabled = false,
  legsToWin = 2,
  setsToWin = 3,
  currentLeg = 1
}) {
  const outLabel = outRule === 'double' ? 'Double Out' : 'Single Out';
  const format = setsEnabled ? 'First to ' + setsToWin + ' Sets' : 'First to ' + legsToWin + ' Legs';
  const dot = /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      color: 'var(--accent)',
      fontSize: '0.4em',
      lineHeight: 1,
      opacity: 0.85,
      flexShrink: 0,
      transform: 'translateY(-0.15em)'
    }
  }, "\u25CF");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: 'clamp(0.5rem, 1.2vw, 1.6rem)',
      padding: 'clamp(8px, 1vw, 20px) clamp(16px, 2.5vw, 48px)',
      background: 'linear-gradient(180deg, #212634 0%, #13161e 100%)',
      fontFamily: 'var(--font-score)',
      fontSize: 'clamp(1.75rem, 3.4vw, 6.5rem)',
      fontWeight: 600,
      lineHeight: 1.15,
      color: 'var(--text)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      borderBottom: '3px solid var(--accent)',
      boxShadow: 'var(--shadow-panel)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      flexShrink: 0
    }
  }, startScore, " ", outLabel), dot, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-soft)',
      fontWeight: 600,
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, format), dot, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent)',
      fontWeight: 800,
      flexShrink: 0
    }
  }, "Leg ", currentLeg), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: -3,
      height: 16,
      background: 'linear-gradient(180deg, color-mix(in oklab, var(--accent) 28%, transparent), transparent)',
      pointerEvents: 'none'
    }
  }));
}
Object.assign(__ds_scope, { MatchHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/MatchHeader.jsx", error: String((e && e.message) || e) }); }

// components/history/HistoryRow.jsx
try { (() => {
/** Match-history list row: date + result, winner in amber, format subtitle, trailing chevron. */
function HistoryRow({
  date,
  winnerName,
  otherNames = [],
  result,
  format,
  onClick
}) {
  const twoPlayer = otherNames.length === 1;
  return /*#__PURE__*/React.createElement("li", {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      borderBottom: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      minHeight: 'var(--row-h)',
      padding: 'var(--space-sm) var(--space-md)',
      boxSizing: 'border-box',
      background: 'var(--surface)',
      border: 'none',
      color: 'var(--text)',
      cursor: 'pointer',
      textAlign: 'left',
      gap: 'var(--space-md)',
      fontFamily: 'var(--font-ui)',
      transition: 'background var(--dur-fast) var(--ease)',
      WebkitTapHighlightColor: 'transparent'
    },
    onPointerDown: e => {
      e.currentTarget.style.background = 'var(--surface-3)';
    },
    onPointerUp: e => {
      e.currentTarget.style.background = 'var(--surface)';
    },
    onPointerLeave: e => {
      e.currentTarget.style.background = 'var(--surface)';
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 'var(--space-sm)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, date), twoPlayer && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-score)',
      fontSize: 'var(--text-md)',
      fontWeight: 700,
      fontVariantNumeric: 'tabular-nums'
    }
  }, result)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-md)',
      lineHeight: 1.4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      color: 'var(--accent)'
    }
  }, winnerName), twoPlayer ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-soft)'
    }
  }, " \xB7 ", otherNames[0]) : /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-soft)'
    }
  }, " gewinnt \u2014 ", result)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, format)), /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    style: {
      color: 'var(--text-muted)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M9 18l6-6-6-6"
  }))));
}
Object.assign(__ds_scope, { HistoryRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/history/HistoryRow.jsx", error: String((e && e.message) || e) }); }

// components/scoring/DartPill.jsx
try { (() => {
/** Format a dart as app notation: T20, D16, 20, Bull, Outer, ✕ (miss). */
function formatDart(dart) {
  if (dart.segment === 0) return '✕';
  if (dart.multiplier === 2 && dart.segment === 25) return 'Bull';
  if (dart.multiplier === 1 && dart.segment === 25) return 'Outer';
  const prefix = dart.multiplier === 3 ? 'T' : dart.multiplier === 2 ? 'D' : '';
  return prefix + dart.segment;
}

/** Rounded pill showing one dart. Triples/bull glow amber; doubles pale amber; misses dashed; bust struck through. */
function DartPill({
  dart,
  bust = false,
  size = 18
}) {
  const isTriple = dart.multiplier === 3 && dart.segment !== 25;
  const isDouble = dart.multiplier === 2 && dart.segment !== 25;
  const isBull = dart.segment === 25;
  const isMiss = dart.segment === 0;
  let color = 'var(--text-soft)',
    bg = 'rgba(255, 255, 255, 0.06)',
    border = '1px solid var(--line)';
  if (isTriple || isBull) {
    color = 'var(--accent)';
    bg = 'var(--accent-soft)';
    border = '1px solid var(--accent-line)';
  } else if (isDouble) {
    color = 'var(--accent-double)';
    bg = 'color-mix(in oklab, var(--accent) 7%, transparent)';
    border = '1px solid color-mix(in oklab, var(--accent) 30%, transparent)';
  } else if (isMiss) {
    color = 'var(--text-faint)';
    border = '1px dashed var(--line-strong)';
  }
  if (bust) {
    color = 'color-mix(in oklab, var(--destructive) 75%, white)';
    bg = 'var(--destructive-soft)';
    border = '1px solid var(--destructive-line)';
  }
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-ui)',
      fontSize: size,
      fontWeight: 600,
      lineHeight: 1.1,
      letterSpacing: '0.01em',
      padding: '0.12em 0.55em',
      borderRadius: 'var(--radius-pill)',
      whiteSpace: 'nowrap',
      color,
      background: bg,
      border,
      textDecoration: bust ? 'line-through' : 'none',
      fontVariantNumeric: 'tabular-nums'
    }
  }, formatDart(dart));
}
Object.assign(__ds_scope, { formatDart, DartPill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/scoring/DartPill.jsx", error: String((e && e.message) || e) }); }

// components/display/PlayerPanel.jsx
try { (() => {
/**
 * One spectator player column: giant name/score, leg/set chips, recessed visit
 * history (newest amber-edged), checkout route pill, Ø footer.
 * All type uses the --display-* scale (readable on 27" at 3 m).
 * visits: [{darts:[DartScore], total, scoreAfter, bust?, live?}] oldest→newest.
 */
function PlayerPanel({
  name,
  remaining,
  legs,
  sets,
  active = false,
  visits = [],
  checkout,
  legAvg = '—',
  matchAvg = '—',
  bustFlash = false
}) {
  const chip = {
    display: 'inline-flex',
    alignItems: 'baseline',
    fontSize: 'var(--display-body)',
    fontWeight: 600,
    lineHeight: 1.15,
    whiteSpace: 'nowrap',
    color: 'var(--text)',
    background: active ? 'var(--accent-soft)' : 'rgba(255,255,255,0.05)',
    border: '1px solid ' + (active ? 'var(--accent-line)' : 'var(--line)'),
    borderRadius: 'var(--radius-sm)',
    padding: '0.06em 0.45em',
    fontVariantNumeric: 'tabular-nums'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      padding: 'clamp(10px, 2cqw, 28px) clamp(10px, 2cqw, 22px)',
      background: active ? 'linear-gradient(165deg, #272d3c 0%, #191d28 100%)' : 'linear-gradient(165deg, #1a1e29 0%, #12151d 100%)',
      borderTop: '5px solid ' + (active ? 'var(--accent)' : 'transparent'),
      boxShadow: active ? 'inset 0 0 80px color-mix(in oklab, var(--accent) 7%, transparent), inset 0 5px 0 color-mix(in oklab, var(--accent) 22%, transparent)' : 'none',
      opacity: active ? 1 : 0.55,
      height: '100%',
      overflow: 'hidden',
      boxSizing: 'border-box',
      gap: 'clamp(4px, 1.2cqw, 14px)',
      fontVariantNumeric: 'tabular-nums',
      containerType: 'inline-size',
      transition: 'opacity var(--dur-slow) var(--ease)'
    }
  }, bustFlash && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      backgroundColor: 'color-mix(in oklab, var(--destructive) 16%, transparent)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 5,
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-score)',
      fontSize: 'clamp(3rem, 14cqw, 12rem)',
      fontWeight: 800,
      color: 'var(--destructive)',
      letterSpacing: 'var(--tracking-caps)',
      textShadow: '0 4px 24px rgba(0,0,0,0.5)'
    }
  }, "BUST")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'clamp(4px, 0.8cqw, 10px)',
      paddingBottom: 'clamp(8px, 1.4cqw, 18px)',
      borderBottom: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: '0.4em',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '0 1 auto',
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      fontSize: 'var(--display-name)',
      fontWeight: 700,
      lineHeight: 1.1,
      letterSpacing: '-0.01em',
      color: 'var(--text)'
    }
  }, name), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '0 0 auto',
      fontFamily: 'var(--font-score)',
      fontSize: 'var(--display-score)',
      fontWeight: 800,
      lineHeight: 0.95,
      letterSpacing: 'var(--tracking-tight)',
      textAlign: 'right',
      color: active ? '#ffffff' : 'var(--text)',
      textShadow: active ? '0 0 70px color-mix(in oklab, var(--accent) 40%, transparent), 0 2px 12px rgba(0,0,0,0.5)' : 'none'
    }
  }, remaining)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'clamp(6px, 1cqw, 14px)'
    }
  }, sets != null && /*#__PURE__*/React.createElement("span", {
    style: chip
  }, "Sets: ", sets), /*#__PURE__*/React.createElement("span", {
    style: chip
  }, "Legs: ", legs))), checkout && /*#__PURE__*/React.createElement("div", {
    style: {
      alignSelf: 'flex-start',
      fontFamily: 'var(--font-score)',
      fontSize: 'var(--display-emph)',
      fontWeight: 700,
      letterSpacing: '0.02em',
      color: 'var(--accent)',
      background: 'var(--accent-soft)',
      border: '1px solid var(--accent-line)',
      borderRadius: 'var(--radius-pill)',
      padding: '0.08em 0.7em',
      boxShadow: 'var(--glow-accent)',
      lineHeight: 1.2
    }
  }, checkout), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '1 1 auto',
      minHeight: 0,
      display: 'flex',
      background: 'rgba(0,0,0,0.22)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--radius-md)',
      padding: 'clamp(5px, 1cqw, 12px)',
      boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.25)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '1 1 auto',
      display: 'grid',
      gridTemplateColumns: '1fr auto auto',
      alignContent: 'end',
      rowGap: 'clamp(4px, 0.8cqw, 10px)',
      overflow: 'hidden'
    }
  }, visits.map((v, i) => {
    const last = i === visits.length - 1;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'grid',
        gridColumn: '1 / -1',
        gridTemplateColumns: 'subgrid',
        alignItems: 'center',
        columnGap: 'clamp(0.4em, 1.5cqw, 1em)',
        padding: 'clamp(4px, 0.9cqw, 10px) clamp(8px, 1.6cqw, 16px)',
        borderRadius: 'var(--radius-sm)',
        background: v.live ? 'color-mix(in oklab, var(--accent) 17%, transparent)' : last ? 'var(--accent-soft)' : 'rgba(255,255,255,0.03)',
        opacity: last ? 1 : 0.62,
        boxShadow: last ? 'inset 4px 0 0 var(--accent)' : 'none'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'clamp(0.15em, 0.6cqw, 0.4em)',
        minWidth: 0,
        fontSize: 'var(--display-body)'
      }
    }, v.darts.map((d, j) => /*#__PURE__*/React.createElement(__ds_scope.DartPill, {
      key: j,
      dart: d,
      bust: v.bust,
      size: "0.82em"
    }))), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-score)',
        fontSize: v.bust ? 'var(--display-body)' : 'var(--display-emph)',
        fontWeight: 700,
        lineHeight: 1,
        textAlign: 'right',
        color: v.bust ? 'var(--destructive)' : 'var(--text)',
        whiteSpace: 'nowrap'
      }
    }, v.bust ? 'BUST' : v.total), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: '0.25em',
        fontFamily: 'var(--font-score)',
        fontSize: 'var(--display-body)',
        fontWeight: 600,
        color: last ? 'var(--text-soft)' : 'var(--text-muted)',
        whiteSpace: 'nowrap'
      }
    }, /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true",
      style: {
        opacity: 0.5,
        fontWeight: 400
      }
    }, "\u2192"), v.scoreAfter));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 'var(--space-xs) clamp(12px, 2cqw, 28px)',
      paddingTop: 'clamp(6px, 1cqw, 12px)',
      borderTop: '1px solid var(--line)',
      fontSize: 'var(--display-caption)',
      lineHeight: 1.2,
      color: 'var(--text)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'baseline',
      gap: '0.3em',
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)',
      fontWeight: 500
    }
  }, "\xD8 Leg"), " ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-score)',
      fontWeight: 700
    }
  }, legAvg)), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      alignSelf: 'stretch',
      width: 1,
      margin: '0.15em 0',
      background: 'var(--line-strong)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'baseline',
      gap: '0.3em',
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)',
      fontWeight: 500
    }
  }, "\xD8 Match"), " ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-score)',
      fontWeight: 700
    }
  }, matchAvg))));
}
Object.assign(__ds_scope, { PlayerPanel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/PlayerPanel.jsx", error: String((e && e.message) || e) }); }

// components/scoring/Dartboard.jsx
try { (() => {
const {
  useState,
  useRef
} = React; // Touch-optimized ring radii (double/triple/bull ~2x real proportions) — from Dartboard.svelte
const R_INNER_BULL = 30,
  R_OUTER_BULL = 74,
  R_INNER_SINGLE = 150,
  R_TRIPLE_END = 200,
  R_OUTER_SINGLE = 290,
  R_DOUBLE_END = 340,
  R_MISS_OUTER = 400,
  CX = 200,
  CY = 200;
const SEGMENT_ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
const startAngle = i => (261 + i * 18) % 360;
const xy = (r, a) => ({
  x: CX + r * Math.cos(a * Math.PI / 180),
  y: CY + r * Math.sin(a * Math.PI / 180)
});
function slice(r1, r2, a1, a2) {
  const s1 = xy(r1, a1),
    s2 = xy(r2, a1),
    e1 = xy(r1, a2),
    e2 = xy(r2, a2);
  return 'M ' + s1.x + ' ' + s1.y + ' A ' + r1 + ' ' + r1 + ' 0 0 1 ' + e1.x + ' ' + e1.y + ' L ' + e2.x + ' ' + e2.y + ' A ' + r2 + ' ' + r2 + ' 0 0 0 ' + s2.x + ' ' + s2.y + ' Z';
}
const circle = r => 'M ' + (CX + r) + ' ' + CY + ' A ' + r + ' ' + r + ' 0 1 1 ' + (CX - r) + ' ' + CY + ' A ' + r + ' ' + r + ' 0 1 1 ' + (CX + r) + ' ' + CY + ' Z';
function buildRegions() {
  const regions = [];
  for (let i = 0; i < 20; i++) {
    const seg = SEGMENT_ORDER[i],
      a1 = startAngle(i),
      a2 = a1 + 18,
      alt = i % 2 === 1;
    regions.push({
      key: 'is-' + seg,
      path: slice(R_OUTER_BULL, R_INNER_SINGLE, a1, a2),
      fill: 'var(--board-single)',
      segment: seg,
      multiplier: 1
    });
    regions.push({
      key: 'tr-' + seg,
      path: slice(R_INNER_SINGLE, R_TRIPLE_END, a1, a2),
      fill: alt ? 'var(--board-red)' : 'var(--board-green)',
      segment: seg,
      multiplier: 3
    });
    regions.push({
      key: 'os-' + seg,
      path: slice(R_TRIPLE_END, R_OUTER_SINGLE, a1, a2),
      fill: 'var(--board-single)',
      segment: seg,
      multiplier: 1
    });
    regions.push({
      key: 'db-' + seg,
      path: slice(R_OUTER_SINGLE, R_DOUBLE_END, a1, a2),
      fill: alt ? 'var(--board-green)' : 'var(--board-red)',
      segment: seg,
      multiplier: 2
    });
  }
  return regions;
}
const REGIONS = buildRegions();

/** Interactive SVG dartboard with polar hit detection; onDart({segment, multiplier}). Bull 50 = {25, mult 2}. */
function Dartboard({
  onDart,
  style
}) {
  const svgRef = useRef(null);
  const [flash, setFlash] = useState(null);
  const [floats, setFloats] = useState([]);
  const idRef = useRef(0);
  function classify(r, angleDeg) {
    if (r <= R_INNER_BULL) return {
      segment: 25,
      multiplier: 2
    };
    if (r <= R_OUTER_BULL) return {
      segment: 25,
      multiplier: 1
    };
    if (r > R_DOUBLE_END) return {
      segment: 0,
      multiplier: 1
    };
    const idx = Math.floor(((angleDeg - 261) % 360 + 360) % 360 / 18);
    const seg = SEGMENT_ORDER[idx];
    const mult = r <= R_TRIPLE_END && r > R_INNER_SINGLE ? 3 : r > R_OUTER_SINGLE ? 2 : 1;
    return {
      segment: seg,
      multiplier: mult
    };
  }
  function handlePointerDown(e) {
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    const dx = p.x - CX,
      dy = p.y - CY;
    const r = Math.sqrt(dx * dx + dy * dy);
    if (r > R_MISS_OUTER) return;
    const angleDeg = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
    const dart = classify(r, angleDeg);
    let label, color;
    if (dart.segment === 0) {
      label = '✕';
      color = '#7a8296';
    } else if (dart.segment === 25 && dart.multiplier === 2) {
      label = 'Bull (50)';
      color = '#ff7d75';
    } else if (dart.segment === 25) {
      label = 'Bull (25)';
      color = '#f0a424';
    } else if (dart.multiplier === 3) {
      label = 'T' + dart.segment + ' (' + dart.segment * 3 + ')';
      color = '#ff7d75';
    } else if (dart.multiplier === 2) {
      label = 'D' + dart.segment + ' (' + dart.segment * 2 + ')';
      color = '#f0a424';
    } else {
      label = String(dart.segment);
      color = '#ffffff';
    }
    const id = idRef.current++;
    setFloats(f => [...f, {
      id,
      x: p.x,
      y: p.y,
      label,
      color
    }]);
    setTimeout(() => setFloats(f => f.filter(fl => fl.id !== id)), 1600);
    let key;
    if (dart.segment === 0) key = 'miss';else if (dart.segment === 25) key = dart.multiplier === 2 ? 'inner-bull' : 'outer-bull';else key = (dart.multiplier === 3 ? 'tr' : dart.multiplier === 2 ? 'db' : r < R_INNER_SINGLE ? 'is' : 'os') + '-' + dart.segment;
    setFlash(key);
    setTimeout(() => setFlash(null), 300);
    onDart && onDart(dart);
  }
  return /*#__PURE__*/React.createElement("svg", {
    ref: svgRef,
    viewBox: "-200 -200 800 800",
    onPointerDown: handlePointerDown,
    role: "img",
    "aria-label": "Dartboard",
    style: {
      touchAction: 'none',
      width: '100%',
      height: '100%',
      display: 'block',
      ...style
    }
  }, /*#__PURE__*/React.createElement("style", null, '@keyframes db-float{0%{opacity:1;transform:translateY(0) scale(1.3)}15%{opacity:1;transform:translateY(-18px) scale(1)}100%{opacity:0;transform:translateY(-95px) scale(.85)}}'), /*#__PURE__*/React.createElement("circle", {
    cx: CX,
    cy: CY,
    r: R_MISS_OUTER,
    fill: "var(--board-bg)",
    pointerEvents: "none"
  }), REGIONS.map(reg => /*#__PURE__*/React.createElement("path", {
    key: reg.key,
    d: reg.path,
    fill: flash === reg.key ? 'rgba(255,255,255,0.35)' : reg.fill,
    stroke: "var(--board-stroke)",
    strokeWidth: "0.5",
    "data-segment": (reg.multiplier === 3 ? 'T' : reg.multiplier === 2 ? 'D' : 'S') + reg.segment
  })), /*#__PURE__*/React.createElement("circle", {
    cx: CX,
    cy: CY,
    r: R_OUTER_BULL,
    fill: flash === 'outer-bull' ? 'rgba(255,255,255,0.35)' : 'var(--board-green)',
    stroke: "var(--board-stroke)",
    strokeWidth: "0.5",
    pointerEvents: "none"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: CX,
    cy: CY,
    r: R_INNER_BULL,
    fill: flash === 'inner-bull' ? 'rgba(255,255,255,0.35)' : 'var(--board-red)',
    stroke: "var(--board-stroke)",
    strokeWidth: "0.5",
    pointerEvents: "none"
  }), /*#__PURE__*/React.createElement("path", {
    d: circle(R_MISS_OUTER) + ' ' + circle(R_DOUBLE_END),
    fill: flash === 'miss' ? 'rgba(255,255,255,0.15)' : 'var(--bg-deep)',
    fillRule: "evenodd"
  }), floats.map(f => /*#__PURE__*/React.createElement("text", {
    key: f.id,
    x: f.x,
    y: f.y,
    textAnchor: "middle",
    dominantBaseline: "central",
    fontSize: "56",
    fontWeight: "800",
    fill: f.color,
    stroke: "rgba(0,0,0,0.75)",
    strokeWidth: "4",
    paintOrder: "stroke",
    pointerEvents: "none",
    fontFamily: "var(--font-score)",
    style: {
      animation: 'db-float 1.6s cubic-bezier(0.25,0.46,0.45,0.94) forwards'
    }
  }, f.label)), SEGMENT_ORDER.map((seg, i) => {
    const pos = xy(368, startAngle(i) + 9);
    return /*#__PURE__*/React.createElement("text", {
      key: seg,
      x: pos.x,
      y: pos.y,
      textAnchor: "middle",
      dominantBaseline: "central",
      fontSize: "32",
      fontWeight: "600",
      fill: "#aab1c2",
      fontFamily: "var(--font-score)",
      pointerEvents: "none"
    }, seg);
  }));
}
Object.assign(__ds_scope, { Dartboard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/scoring/Dartboard.jsx", error: String((e && e.message) || e) }); }

// components/scoring/Numpad.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
/** 10-key visit-total entry with validation shake. onConfirm(total) receives the parsed score. */
function Numpad({
  onConfirm,
  validate
}) {
  const [value, setValue] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [shaking, setShaking] = useState(false);
  const press = d => {
    if (value.length < 3) {
      setValue(value + d);
      setInvalid(false);
    }
  };
  const confirm = () => {
    const total = parseInt(value, 10);
    const ok = !isNaN(total) && total <= 180 && (!validate || validate(total));
    if (!ok) {
      setInvalid(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
      return;
    }
    onConfirm && onConfirm(total);
    setValue('');
    setInvalid(false);
  };
  const key = {
    height: 'var(--key-h)',
    minWidth: 64,
    background: 'var(--surface)',
    border: '1px solid var(--line-strong)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text)',
    fontSize: 'var(--text-2xl)',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-ui)',
    boxShadow: 'var(--edge-highlight)',
    transition: 'transform var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease)',
    fontVariantNumeric: 'tabular-nums',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation'
  };
  const pressFx = {
    onPointerDown: e => {
      e.currentTarget.style.transform = 'scale(var(--press-scale))';
      e.currentTarget.style.background = 'var(--surface-3)';
    },
    onPointerUp: e => {
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.background = 'var(--surface)';
    },
    onPointerLeave: e => {
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.background = 'var(--surface)';
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-sm)',
      padding: 'var(--space-md)',
      background: 'var(--bg)',
      width: '100%',
      maxWidth: 380,
      margin: '0 auto',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("style", null, '@keyframes np-shake{0%{transform:translateX(0)}15%{transform:translateX(-6px)}30%{transform:translateX(6px)}45%{transform:translateX(-6px)}60%{transform:translateX(6px)}75%{transform:translateX(-4px)}90%{transform:translateX(4px)}100%{transform:translateX(0)}}'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 'var(--key-h)',
      background: 'var(--bg-deep)',
      borderRadius: 'var(--radius-sm)',
      color: invalid ? 'var(--destructive)' : 'var(--text)',
      border: '2px solid ' + (invalid ? 'var(--destructive)' : 'var(--line-strong)'),
      fontFamily: 'var(--font-score)',
      fontSize: 'var(--text-3xl)',
      fontWeight: 700,
      letterSpacing: 'var(--tracking-tight)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'border-color var(--dur-base) var(--ease), color var(--dur-base) var(--ease)',
      animation: shaking ? 'np-shake 400ms ease-in-out' : 'none',
      fontVariantNumeric: 'tabular-nums',
      boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.35)'
    }
  }, value || '—'), invalid && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-sm)',
      fontWeight: 500,
      color: 'var(--destructive)',
      textAlign: 'center'
    }
  }, "Ung\xFCltige Punktzahl")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 'var(--space-sm)'
    }
  }, [7, 8, 9, 4, 5, 6, 1, 2, 3].map(d => /*#__PURE__*/React.createElement("button", _extends({
    key: d
  }, pressFx, {
    style: key,
    onClick: () => press(String(d))
  }), d)), /*#__PURE__*/React.createElement("button", _extends({}, pressFx, {
    style: {
      ...key,
      color: 'var(--destructive)',
      fontSize: 'var(--text-xl)',
      fontWeight: 600
    },
    onClick: () => {
      setValue('');
      setInvalid(false);
    }
  }), "C"), /*#__PURE__*/React.createElement("button", _extends({}, pressFx, {
    style: key,
    onClick: () => press('0')
  }), "0"), /*#__PURE__*/React.createElement("button", _extends({}, pressFx, {
    style: {
      ...key,
      fontSize: 'var(--text-xl)'
    },
    onClick: () => {
      setValue(value.slice(0, -1));
      setInvalid(false);
    },
    "aria-label": "Letzte Ziffer l\xF6schen"
  }), "\u232B")), /*#__PURE__*/React.createElement("button", {
    onClick: confirm,
    style: {
      height: 'var(--key-h)',
      width: '100%',
      background: 'linear-gradient(180deg, var(--accent-bright) 0%, var(--accent) 45%, var(--accent-deep) 130%)',
      border: 'none',
      borderRadius: 'var(--radius-sm)',
      color: 'var(--on-accent)',
      fontSize: 'var(--text-lg)',
      fontWeight: 700,
      cursor: 'pointer',
      fontFamily: 'var(--font-ui)',
      boxShadow: 'var(--shadow-raise), inset 0 1px 0 rgba(255,255,255,0.25)',
      letterSpacing: '0.01em',
      transition: 'transform var(--dur-fast) var(--ease)',
      WebkitTapHighlightColor: 'transparent',
      touchAction: 'manipulation'
    },
    onPointerDown: e => {
      e.currentTarget.style.transform = 'scale(var(--press-scale))';
    },
    onPointerUp: e => {
      e.currentTarget.style.transform = 'none';
    },
    onPointerLeave: e => {
      e.currentTarget.style.transform = 'none';
    }
  }, "Best\xE4tigen"));
}
Object.assign(__ds_scope, { Numpad });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/scoring/Numpad.jsx", error: String((e && e.message) || e) }); }

// components/scoring/ScoreCard.jsx
try { (() => {
/** Per-player score card on the match screen. Active player: amber edge + glow, 96px condensed score, checkout route. */
function ScoreCard({
  name,
  remaining,
  legs,
  sets,
  active = false,
  checkout
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 150,
      display: 'flex',
      flexDirection: 'column',
      background: active ? 'linear-gradient(var(--accent-soft), var(--accent-soft)), var(--surface-2)' : 'var(--surface)',
      border: '1px solid ' + (active ? 'var(--accent-line)' : 'var(--line)'),
      boxShadow: active ? 'inset 4px 0 0 var(--accent), var(--glow-accent), var(--edge-highlight)' : 'var(--edge-highlight)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-md) var(--space-lg)',
      transition: 'background var(--dur-slow) var(--ease), box-shadow var(--dur-slow) var(--ease), border-color var(--dur-slow) var(--ease)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)',
      fontSize: 'var(--text-lg)',
      fontWeight: 600,
      marginBottom: 2,
      color: active ? 'var(--text)' : 'var(--text-soft)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 'var(--space-md)',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-score)',
      fontWeight: active ? 800 : 700,
      lineHeight: 1,
      color: 'var(--text)',
      letterSpacing: 'var(--tracking-tight)',
      fontSize: active ? 'var(--text-score-active)' : 'var(--text-score-inactive)',
      fontVariantNumeric: 'tabular-nums',
      textShadow: active ? '0 0 40px color-mix(in oklab, var(--accent) 35%, transparent)' : 'none',
      transition: 'font-size var(--dur-med) var(--ease)'
    }
  }, remaining), active && checkout && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-base)',
      fontWeight: 700,
      color: 'var(--accent)',
      background: 'var(--accent-soft)',
      border: '1px solid var(--accent-line)',
      borderRadius: 'var(--radius-pill)',
      padding: '4px 14px',
      lineHeight: 1.4,
      whiteSpace: 'nowrap',
      letterSpacing: '0.02em',
      fontVariantNumeric: 'tabular-nums'
    }
  }, checkout)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-base)',
      fontWeight: 500,
      color: 'var(--text-muted)',
      marginTop: 'var(--space-xs)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, sets != null && /*#__PURE__*/React.createElement("span", null, "Sets: ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text)',
      fontWeight: 700
    }
  }, sets), "\xA0\xA0"), /*#__PURE__*/React.createElement("span", null, "Legs: ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text)',
      fontWeight: 700
    }
  }, legs))));
}
Object.assign(__ds_scope, { ScoreCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/scoring/ScoreCard.jsx", error: String((e && e.message) || e) }); }

// components/scoring/VisitStrip.jsx
try { (() => {
function slotLabel(dart) {
  if (!dart) return '—';
  if (dart.segment === 0) return '0 (Daneben)';
  if (dart.multiplier === 2 && dart.segment === 25) return 'Bull';
  if (dart.multiplier === 1 && dart.segment === 25) return 'Outer Bull';
  return __ds_scope.formatDart(dart);
}

/** Three 56px dart slots for the current visit. Tapping a filled slot = UNDO. Bust tints the strip red. */
function VisitStrip({
  darts = [],
  bust = false,
  onUndo
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-sm)',
      alignItems: 'center',
      padding: 'var(--space-xs) var(--space-md)',
      borderRadius: 'var(--radius-md)',
      transition: 'background-color var(--dur-slow) var(--ease)',
      backgroundColor: bust ? 'var(--destructive-soft)' : 'transparent',
      boxShadow: bust ? 'inset 0 0 0 1px var(--destructive-line)' : 'none'
    }
  }, [0, 1, 2].map(i => {
    const filled = !!darts[i];
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      disabled: darts.length === 0,
      onClick: onUndo,
      style: {
        height: 'var(--control-h)',
        flex: 1,
        minWidth: 80,
        background: filled ? 'var(--surface-2)' : 'var(--surface)',
        border: filled ? '1px solid var(--line-strong)' : '1px dashed var(--line-strong)',
        borderRadius: 'var(--radius-sm)',
        color: filled ? 'var(--text)' : 'var(--text-faint)',
        fontSize: 'var(--text-md)',
        fontWeight: filled ? 600 : 400,
        cursor: darts.length === 0 ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-ui)',
        fontVariantNumeric: 'tabular-nums',
        boxShadow: filled ? 'var(--edge-highlight)' : 'none',
        transition: 'background var(--dur-base) var(--ease), border-color var(--dur-base) var(--ease)',
        WebkitTapHighlightColor: 'transparent'
      }
    }, slotLabel(darts[i]));
  }));
}
Object.assign(__ds_scope, { VisitStrip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/scoring/VisitStrip.jsx", error: String((e && e.message) || e) }); }

// ui_kits/darts-app/screens.jsx
try { (() => {
const {
  Button,
  Chip,
  SegmentedControl,
  Stepper,
  ToggleRow,
  ConfirmDialog,
  Dartboard,
  Numpad,
  VisitStrip,
  ScoreCard,
  MatchHeader,
  PlayerPanel,
  StatCard
} = window.NevermanDartsDesignSystem_61370c;
function BackBtn({
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      background: 'none',
      border: 'none',
      color: 'var(--text-muted)',
      fontSize: 'var(--text-base)',
      fontWeight: 500,
      cursor: 'pointer',
      padding: '8px 0',
      fontFamily: 'var(--font-ui)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "22",
    height: "22",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M15 18l-6-6 6-6"
  })), "Zur\xFCck");
}
function Avatar({
  name,
  size = 40
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'var(--surface-3)',
      border: '1px solid var(--line-strong)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 600,
      fontSize: size * 0.42,
      flexShrink: 0,
      color: 'var(--text-soft)'
    }
  }, name[0]);
}

// ── Start hub ──────────────────────────────────────────────────────────────
function StartScreen({
  go
}) {
  const [profilesOpen, setProfilesOpen] = React.useState(false);
  return /*#__PURE__*/React.createElement("main", {
    "data-screen-label": "Start",
    style: {
      maxWidth: 520,
      margin: '0 auto',
      padding: 'var(--space-3xl) var(--space-lg)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-xl)'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'var(--text-xl)',
      fontWeight: 600,
      margin: 0,
      letterSpacing: '-0.01em'
    }
  }, "Neverman Darts"), /*#__PURE__*/React.createElement("nav", {
    "aria-label": "Hauptmen\xFC",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    chevron: true,
    onClick: () => go('setup')
  }, "Neues Spiel"), /*#__PURE__*/React.createElement(Button, {
    variant: "menu",
    onClick: () => setProfilesOpen(o => !o),
    style: {
      justifyContent: 'space-between'
    }
  }, "Spieler verwalten"), profilesOpen && /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-md)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)'
    }
  }, ['Micha', 'Sarah'].map(n => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: n,
    size: 40
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-md)'
    }
  }, n)))), /*#__PURE__*/React.createElement(Button, {
    variant: "menu",
    chevron: true,
    onClick: () => go('history')
  }, "Match-Verlauf"), /*#__PURE__*/React.createElement(Button, {
    variant: "menu",
    chevron: true,
    onClick: () => go('stats')
  }, "Statistik"), /*#__PURE__*/React.createElement(Button, {
    variant: "menu",
    chevron: true
  }, "Daten / Backup")));
}

// ── Setup ──────────────────────────────────────────────────────────────────
function SetupScreen({
  go
}) {
  const [players, setPlayers] = React.useState([{
    id: '1',
    name: 'Micha',
    guest: false
  }]);
  const [score, setScore] = React.useState(301);
  const [rule, setRule] = React.useState('Single Out');
  const [legs, setLegs] = React.useState(2);
  const [sets, setSets] = React.useState(true);
  const [setsToWin, setSetsToWin] = React.useState(3);
  const [picker, setPicker] = React.useState(false);
  const canStart = players.length >= 1;
  const addGuest = () => {
    setPlayers(p => [...p, {
      id: 'g' + (p.length + 1),
      name: 'Gast ' + (p.filter(x => x.guest).length + 1),
      guest: true
    }]);
    setPicker(false);
  };
  const sec = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-md)'
  };
  const h2 = {
    fontSize: 'var(--text-lg)',
    fontWeight: 600,
    margin: 0
  };
  return /*#__PURE__*/React.createElement("main", {
    "data-screen-label": "Setup",
    style: {
      maxWidth: 520,
      margin: '0 auto',
      padding: 'var(--space-lg)',
      paddingBottom: 'var(--space-3xl)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-xl)'
    }
  }, /*#__PURE__*/React.createElement(BackBtn, {
    onClick: () => go('start')
  }), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'var(--text-xl)',
      fontWeight: 600,
      margin: 0,
      letterSpacing: '-0.01em'
    }
  }, "Neues Spiel"), /*#__PURE__*/React.createElement("section", {
    style: sec
  }, /*#__PURE__*/React.createElement("h2", {
    style: h2
  }, "Spieler"), /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-sm)'
    }
  }, players.map(p => /*#__PURE__*/React.createElement("li", {
    key: p.id,
    style: {
      listStyle: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)',
      background: 'var(--surface)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--radius-sm)',
      padding: 'var(--space-sm) var(--space-md)',
      minHeight: 'var(--row-h)',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: p.name,
    size: 40
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-md)',
      flex: 1
    }
  }, p.name), p.guest && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      fontWeight: 500,
      color: 'var(--text-muted)',
      border: '1px solid var(--border-input)',
      borderRadius: 'var(--radius-pill)',
      padding: '2px 10px'
    }
  }, "Gast"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setPlayers(ps => ps.filter(x => x.id !== p.id)),
    "aria-label": "Spieler entfernen",
    style: {
      background: 'none',
      border: 'none',
      color: 'var(--text-muted)',
      fontSize: 24,
      cursor: 'pointer',
      padding: '0 8px',
      minWidth: 44,
      minHeight: 44,
      fontFamily: 'var(--font-ui)'
    }
  }, "\xD7")))), players.length < 4 && /*#__PURE__*/React.createElement(Button, {
    variant: "menu",
    onClick: () => setPicker(o => !o),
    style: {
      height: 'var(--control-h)',
      justifyContent: 'center',
      border: '1px dashed var(--border-input)',
      background: 'transparent',
      boxShadow: 'none',
      color: 'var(--text-soft)'
    }
  }, "+ Spieler hinzuf\xFCgen"), picker && /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--radius-sm)',
      padding: 'var(--space-sm)',
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--text-xs)',
      fontWeight: 600,
      letterSpacing: 'var(--tracking-caps)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      margin: '6px 10px'
    }
  }, "Profile"), ['Micha', 'Sarah'].filter(n => !players.some(p => p.name === n)).map(n => /*#__PURE__*/React.createElement("button", {
    key: n,
    onClick: () => {
      setPlayers(p => [...p, {
        id: n,
        name: n,
        guest: false
      }]);
      setPicker(false);
    },
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: 'none',
      border: 'none',
      borderRadius: 'var(--radius-xs)',
      color: 'var(--text)',
      fontSize: 'var(--text-md)',
      cursor: 'pointer',
      padding: '10px',
      textAlign: 'left',
      fontFamily: 'var(--font-ui)',
      minHeight: 48
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: n,
    size: 32
  }), n)), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--text-xs)',
      fontWeight: 600,
      letterSpacing: 'var(--tracking-caps)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      margin: '6px 10px'
    }
  }, "Gast"), /*#__PURE__*/React.createElement("button", {
    onClick: addGuest,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: 'none',
      border: 'none',
      borderRadius: 'var(--radius-xs)',
      color: 'var(--text)',
      fontSize: 'var(--text-md)',
      cursor: 'pointer',
      padding: '10px',
      textAlign: 'left',
      fontFamily: 'var(--font-ui)',
      minHeight: 48
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: 'G',
    size: 32
  }), "Gast hinzuf\xFCgen"))), /*#__PURE__*/React.createElement("section", {
    style: sec
  }, /*#__PURE__*/React.createElement("h2", {
    style: h2
  }, "Spielmodus"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-sm)'
    }
  }, [301, 401, 501].map(s => /*#__PURE__*/React.createElement(Chip, {
    key: s,
    active: score === s,
    onClick: () => setScore(s)
  }, s)))), /*#__PURE__*/React.createElement("section", {
    style: sec
  }, /*#__PURE__*/React.createElement("h2", {
    style: h2
  }, "Abwurfregel"), /*#__PURE__*/React.createElement(SegmentedControl, {
    options: ['Single Out', 'Double Out'],
    value: rule,
    onChange: setRule
  })), /*#__PURE__*/React.createElement("section", {
    style: sec
  }, /*#__PURE__*/React.createElement("h2", {
    style: h2
  }, "Format"), /*#__PURE__*/React.createElement(Stepper, {
    label: "Legs - First to",
    value: legs,
    min: 1,
    max: 9,
    onChange: setLegs
  }), /*#__PURE__*/React.createElement(ToggleRow, {
    label: "Sets",
    checked: sets,
    onChange: setSets
  }), sets && /*#__PURE__*/React.createElement(Stepper, {
    label: "Sets - First to",
    value: setsToWin,
    min: 1,
    max: 9,
    onChange: setSetsToWin
  })), /*#__PURE__*/React.createElement("section", {
    style: sec
  }, !canStart && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)',
      margin: 0,
      textAlign: 'center'
    }
  }, "Mindestens 1 Spieler erforderlich"), /*#__PURE__*/React.createElement(Button, {
    variant: "cta",
    disabled: !canStart,
    onClick: () => go('match', {
      players: players.map(p => p.name),
      score,
      rule,
      sets,
      setsToWin,
      legs
    })
  }, "Spiel starten")));
}

// ── Match (scoring) ────────────────────────────────────────────────────────
const CHECKOUTS = {
  170: 'T20 T20 Bull',
  167: 'T20 T19 Bull',
  164: 'T20 T18 Bull',
  161: 'T20 T17 Bull',
  160: 'T20 T20 D20',
  120: 'T20 20 D20',
  100: 'T20 D20',
  80: 'T20 D10',
  60: '20 D20',
  40: 'D20',
  36: 'D18',
  32: 'D16',
  24: 'D12',
  16: 'D8',
  8: 'D4',
  4: 'D2',
  2: 'D1'
};
function MatchScreen({
  go,
  config
}) {
  const names = config && config.players && config.players.length ? config.players : ['Micha', 'Gast 1'];
  const start = config && config.score || 301;
  const [state, setState] = React.useState(() => ({
    players: names.map(n => ({
      name: n,
      remaining: start,
      legs: 0,
      sets: 0
    })),
    active: 0,
    visit: [],
    input: 'board',
    bust: false
  }));
  const applyDart = dart => setState(s => {
    if (s.visit.length >= 3) return s;
    const players = s.players.map(p => ({
      ...p
    }));
    const p = players[s.active];
    const visit = [...s.visit, dart];
    const visitTotal = visit.reduce((t, d) => t + d.segment * d.multiplier, 0);
    const newRem = p.remaining - visitTotal;
    if (newRem < 0 || newRem === 1) {
      // bust — score unchanged, pass turn
      return {
        ...s,
        players,
        active: (s.active + 1) % players.length,
        visit: [],
        bust: true
      };
    }
    if (newRem === 0) {
      p.legs += 1;
      players.forEach(pl => pl.remaining = start);
      return {
        ...s,
        players,
        active: (s.active + 1) % players.length,
        visit: [],
        bust: false
      };
    }
    if (visit.length === 3) {
      p.remaining = newRem;
      return {
        ...s,
        players,
        active: (s.active + 1) % players.length,
        visit: [],
        bust: false
      };
    }
    return {
      ...s,
      players,
      visit,
      bust: false
    };
  });
  const applyTotal = total => setState(s => {
    const players = s.players.map(p => ({
      ...p
    }));
    const p = players[s.active];
    if (total > p.remaining || p.remaining - total === 1) {
      return {
        ...s,
        players,
        active: (s.active + 1) % players.length,
        visit: [],
        bust: true
      };
    }
    p.remaining -= total;
    if (p.remaining === 0) {
      p.legs += 1;
      players.forEach(pl => pl.remaining = start);
    }
    return {
      ...s,
      players,
      active: (s.active + 1) % players.length,
      visit: [],
      bust: false
    };
  });
  const undo = () => setState(s => {
    if (!s.visit.length) return s;
    return {
      ...s,
      visit: s.visit.slice(0, -1)
    };
  });
  return /*#__PURE__*/React.createElement("main", {
    "data-screen-label": "Match",
    style: {
      maxWidth: 1080,
      margin: '0 auto',
      padding: 'var(--space-md) var(--space-lg)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)',
      height: '100%',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(BackBtn, {
    onClick: () => go('start')
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => go('display', {
      state: {
        ...state,
        start
      }
    }),
    style: {
      background: 'var(--surface)',
      border: '1px solid var(--border-input)',
      borderRadius: 'var(--radius-sm)',
      color: 'var(--text-soft)',
      fontSize: 'var(--text-sm)',
      fontWeight: 500,
      padding: '10px 18px',
      cursor: 'pointer',
      fontFamily: 'var(--font-ui)',
      whiteSpace: 'nowrap',
      flexShrink: 0,
      minHeight: 44
    }
  }, "Display \xF6ffnen \u203A")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-md)',
      flexWrap: 'wrap'
    }
  }, state.players.map((p, i) => /*#__PURE__*/React.createElement(ScoreCard, {
    key: p.name,
    name: p.name,
    remaining: p.remaining - (i === state.active ? state.visit.reduce((t, d) => t + d.segment * d.multiplier, 0) : 0),
    legs: p.legs,
    sets: config && config.sets ? p.sets : undefined,
    active: i === state.active,
    checkout: i === state.active ? CHECKOUTS[p.remaining - state.visit.reduce((t, d) => t + d.segment * d.multiplier, 0)] : undefined
  }))), /*#__PURE__*/React.createElement(VisitStrip, {
    darts: state.visit,
    bust: state.bust,
    onUndo: undo
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 360,
      margin: '0 auto',
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement(SegmentedControl, {
    options: ['Dartboard', 'Numpad'],
    value: state.input === 'board' ? 'Dartboard' : 'Numpad',
    onChange: v => setState(s => ({
      ...s,
      input: v === 'Dartboard' ? 'board' : 'numpad'
    }))
  })), state.input === 'board' ? /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 'min(90vw, 56vh)',
      height: 'min(90vw, 56vh)'
    }
  }, /*#__PURE__*/React.createElement(Dartboard, {
    onDart: applyDart
  }))) : /*#__PURE__*/React.createElement(Numpad, {
    onConfirm: applyTotal,
    validate: t => ![163, 166, 169, 172, 173, 175, 176, 178, 179].includes(t) && t <= 180
  }));
}

// ── Spectator display ──────────────────────────────────────────────────────
function DisplayScreen({
  go,
  config
}) {
  const st = config && config.state || null;
  const players = st ? st.players : [{
    name: 'Micha',
    remaining: 120,
    legs: 1,
    sets: 0
  }, {
    name: 'Gast 1',
    remaining: 248,
    legs: 0,
    sets: 0
  }];
  const active = st ? st.active : 0;
  const demoVisits = i => i === 0 ? [{
    darts: [{
      segment: 20,
      multiplier: 1
    }, {
      segment: 1,
      multiplier: 1
    }, {
      segment: 5,
      multiplier: 1
    }],
    total: 26,
    scoreAfter: 266
  }, {
    darts: [{
      segment: 19,
      multiplier: 3
    }, {
      segment: 19,
      multiplier: 1
    }, {
      segment: 3,
      multiplier: 1
    }],
    total: 79,
    scoreAfter: 187
  }, {
    darts: [{
      segment: 20,
      multiplier: 3
    }, {
      segment: 5,
      multiplier: 1
    }, {
      segment: 2,
      multiplier: 1
    }],
    total: 67,
    scoreAfter: 120,
    live: true
  }] : [{
    darts: [{
      segment: 20,
      multiplier: 1
    }, {
      segment: 20,
      multiplier: 1
    }, {
      segment: 13,
      multiplier: 1
    }],
    total: 53,
    scoreAfter: 301
  }, {
    darts: [{
      segment: 19,
      multiplier: 3
    }, {
      segment: 20,
      multiplier: 2
    }, {
      segment: 0,
      multiplier: 1
    }],
    total: 0,
    scoreAfter: 301,
    bust: true
  }, {
    darts: [{
      segment: 20,
      multiplier: 1
    }, {
      segment: 20,
      multiplier: 1
    }, {
      segment: 13,
      multiplier: 1
    }],
    total: 53,
    scoreAfter: 248
  }];
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "Display",
    style: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 12,
      left: 12,
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => go('match'),
    style: {
      background: 'rgba(5,7,12,.6)',
      backdropFilter: 'blur(8px)',
      border: '1px solid var(--line-strong)',
      borderRadius: 'var(--radius-sm)',
      color: 'var(--text-soft)',
      fontSize: 'var(--text-sm)',
      padding: '8px 14px',
      cursor: 'pointer',
      fontFamily: 'var(--font-ui)',
      whiteSpace: 'nowrap'
    }
  }, "\u2039 Zur\xFCck")), /*#__PURE__*/React.createElement(MatchHeader, {
    startScore: st && st.start || 501,
    outRule: "double",
    setsEnabled: true,
    setsToWin: 3,
    currentLeg: players[0].legs + players[1] && players.reduce((t, p) => t + p.legs, 0) + 1 || 1
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(' + players.length + ', 1fr)',
      flex: 1,
      minHeight: 0
    }
  }, players.map((p, i) => /*#__PURE__*/React.createElement(PlayerPanel, {
    key: p.name,
    name: p.name,
    remaining: p.remaining,
    legs: p.legs,
    sets: p.sets,
    active: i === active,
    checkout: i === active ? CHECKOUTS[p.remaining] : undefined,
    legAvg: i === active ? '52.4' : '41.2',
    matchAvg: i === active ? '48.1' : '43.7',
    visits: demoVisits(i)
  }))));
}

// ── History ────────────────────────────────────────────────────────────────
function HistoryScreen({
  go
}) {
  const {
    HistoryRow
  } = window.NevermanDartsDesignSystem_61370c;
  return /*#__PURE__*/React.createElement("main", {
    "data-screen-label": "Match-Verlauf",
    style: {
      maxWidth: 520,
      margin: '0 auto',
      padding: 'var(--space-lg)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-lg)'
    }
  }, /*#__PURE__*/React.createElement(BackBtn, {
    onClick: () => go('start')
  }), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'var(--text-xl)',
      fontWeight: 600,
      margin: 0,
      letterSpacing: '-0.01em'
    }
  }, "Match-Verlauf"), /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: 0,
      padding: 0,
      border: '1px solid var(--line)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      boxShadow: 'var(--edge-highlight)'
    }
  }, /*#__PURE__*/React.createElement(HistoryRow, {
    date: "12.07.2026",
    winnerName: "Micha",
    otherNames: ['Gast 1'],
    result: "3:1",
    format: "501 Double Out \xB7 First to 3 Sets"
  }), /*#__PURE__*/React.createElement(HistoryRow, {
    date: "10.07.2026",
    winnerName: "Sarah",
    otherNames: ['Micha', 'Gast 1'],
    result: "4 Legs",
    format: "301 Single Out \xB7 First to 4 Legs"
  }), /*#__PURE__*/React.createElement(HistoryRow, {
    date: "08.07.2026",
    winnerName: "Micha",
    otherNames: ['Sarah'],
    result: "2:0",
    format: "501 Double Out \xB7 First to 2 Legs"
  })));
}

// ── Stats ──────────────────────────────────────────────────────────────────
function StatsScreen({
  go
}) {
  return /*#__PURE__*/React.createElement("main", {
    "data-screen-label": "Statistik",
    style: {
      maxWidth: 520,
      margin: '0 auto',
      padding: 'var(--space-lg)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-lg)'
    }
  }, /*#__PURE__*/React.createElement(BackBtn, {
    onClick: () => go('start')
  }), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'var(--text-xl)',
      fontWeight: 600,
      margin: 0,
      letterSpacing: '-0.01em'
    }
  }, "Statistik"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'var(--space-sm)'
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    value: "42.3",
    label: "\xD8 3 Darts"
  }), /*#__PURE__*/React.createElement(StatCard, {
    value: "67%",
    label: "Checkout-Quote"
  }), /*#__PURE__*/React.createElement(StatCard, {
    value: "180",
    label: "H\xF6chster Wurf"
  }), /*#__PURE__*/React.createElement(StatCard, {
    value: "14",
    label: "Beste Darts/Leg"
  })));
}
Object.assign(window, {
  StartScreen,
  SetupScreen,
  MatchScreen,
  DisplayScreen,
  HistoryScreen,
  StatsScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/darts-app/screens.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.ConfirmDialog = __ds_scope.ConfirmDialog;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.Stepper = __ds_scope.Stepper;

__ds_ns.ToggleRow = __ds_scope.ToggleRow;

__ds_ns.MatchHeader = __ds_scope.MatchHeader;

__ds_ns.PlayerPanel = __ds_scope.PlayerPanel;

__ds_ns.HistoryRow = __ds_scope.HistoryRow;

__ds_ns.DartPill = __ds_scope.DartPill;

__ds_ns.Dartboard = __ds_scope.Dartboard;

__ds_ns.Numpad = __ds_scope.Numpad;

__ds_ns.ScoreCard = __ds_scope.ScoreCard;

__ds_ns.VisitStrip = __ds_scope.VisitStrip;

})();
