import { DartScore } from '../scoring/DartPill';
export interface PanelVisit {
  darts: DartScore[];
  total: number;
  /** Remaining after this visit */
  scoreAfter: number;
  bust?: boolean;
  /** In-progress visit (stronger amber tint) */
  live?: boolean;
}
/**
 * Spectator display player column — readable on 27" at 3 m.
 */
export interface PlayerPanelProps {
  name: string;
  remaining: number;
  legs: number;
  /** Omit when sets disabled */
  sets?: number;
  active?: boolean;
  /** Oldest → newest; last row gets the amber edge */
  visits?: PanelVisit[];
  /** Checkout route, e.g. "T20 T20 D20" (active player only) */
  checkout?: string;
  legAvg?: string;
  matchAvg?: string;
  /** Show the red BUST overlay */
  bustFlash?: boolean;
}
export declare function PlayerPanel(props: PlayerPanelProps): JSX.Element;
