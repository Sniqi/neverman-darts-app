/** Spectator display header bar with match format and current leg. */
export interface MatchHeaderProps {
  startScore: 301 | 401 | 501;
  outRule?: 'single' | 'double';
  setsEnabled?: boolean;
  legsToWin?: number;
  setsToWin?: number;
  currentLeg?: number;
}
export declare function MatchHeader(props: MatchHeaderProps): JSX.Element;
