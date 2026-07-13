import { DartScore } from './DartPill';
/** Current-visit strip: three 56px slots; tapping undoes the last dart. */
export interface VisitStripProps {
  darts?: DartScore[];
  /** Tint the strip destructive red after a bust */
  bust?: boolean;
  onUndo?: () => void;
}
export declare function VisitStrip(props: VisitStripProps): JSX.Element;
