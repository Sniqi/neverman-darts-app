/** KPI tile for the stats dashboard. */
export interface StatCardProps {
  /** Muted caption below the value, e.g. "Ø 3 Darts" */
  label: string;
  /** Pre-formatted value, e.g. "42.3", "67%", "—" */
  value: string;
}
export declare function StatCard(props: StatCardProps): JSX.Element;
