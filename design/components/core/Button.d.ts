/**
 * Touch-first button, 56–64px tall, full width.
 */
export interface ButtonProps {
  /** Visual variant */
  variant?: 'menu' | 'accent' | 'cta' | 'destructive' | 'cancel';
  /** Label (German, sentence case) */
  children?: React.ReactNode;
  /** Show trailing chevron-right (menu rows) */
  chevron?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export declare function Button(props: ButtonProps): JSX.Element;
