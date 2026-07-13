/** Per-player score card for the match (input) screen. */
export interface ScoreCardProps {
  name: string;
  remaining: number;
  legs: number;
  /** Omit when sets are disabled */
  sets?: number;
  active?: boolean;
  /** Checkout route beside the score, e.g. "T20 T20 D20" (active player only) */
  checkout?: string;
}
export declare function ScoreCard(props: ScoreCardProps): JSX.Element;
