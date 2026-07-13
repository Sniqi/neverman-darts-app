/** Match-history list row. Wrap several in a <ul> with margin/padding 0. */
export interface HistoryRowProps {
  /** e.g. "12.07.2026" */
  date: string;
  winnerName: string;
  /** 1 name → "Winner · Loser" + result top-right; 2–3 names → "Winner gewinnt — result" */
  otherNames?: string[];
  /** e.g. "3:1" or "4 Legs" */
  result?: string;
  /** e.g. "501 Double Out · First to 3 Sets" */
  format?: string;
  onClick?: () => void;
}
export declare function HistoryRow(props: HistoryRowProps): JSX.Element;
