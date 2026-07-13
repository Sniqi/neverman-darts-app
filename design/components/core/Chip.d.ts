/** Selectable mode chip (e.g. 301 / 401 / 501), used in equal-width groups. */
export interface ChipProps {
  active?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export declare function Chip(props: ChipProps): JSX.Element;
