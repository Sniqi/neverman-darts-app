/** Modal confirmation dialog with stacked full-width actions; cancel is always "Abbrechen". */
export interface ConfirmDialogProps {
  /** Plain-statement heading, e.g. "Es läuft noch ein Spiel" */
  heading: string;
  /** One consequence sentence */
  body: string;
  /** Explicit CTA, e.g. "Verwerfen und neu starten" */
  ctaLabel: string;
  ctaStyle?: 'destructive' | 'accent';
  backdropDismiss?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}
export declare function ConfirmDialog(props: ConfirmDialogProps): JSX.Element;
