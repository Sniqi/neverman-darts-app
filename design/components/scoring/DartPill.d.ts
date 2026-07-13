/** One thrown dart. segment 1–20, 25 = bull, 0 = miss; multiplier 1/2/3 (bull 50 = {segment:25, multiplier:2}). */
export interface DartScore { segment: number; multiplier: 1 | 2 | 3; }
/** Pill rendering a dart in app notation with value-based coloring. */
export interface DartPillProps {
  dart: DartScore;
  /** Render in bust styling (red, struck through) */
  bust?: boolean;
  /** Font size — px number or any CSS size string, e.g. "0.9em" (default 18) */
  size?: number | string;
}
export declare function DartPill(props: DartPillProps): JSX.Element;
export declare function formatDart(dart: DartScore): string;
