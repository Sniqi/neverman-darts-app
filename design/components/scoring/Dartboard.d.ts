import { DartScore } from './DartPill';
/**
 * Touch-optimized SVG dartboard: enlarged double/triple/bull rings, tap flash,
 * floating score labels, polar-math hit detection.
 */
export interface DartboardProps {
  /** Called per tap with the classified dart; miss = {segment:0, multiplier:1} */
  onDart?: (dart: DartScore) => void;
  style?: React.CSSProperties;
}
export declare function Dartboard(props: DartboardProps): JSX.Element;
