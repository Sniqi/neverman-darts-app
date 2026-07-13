/** Settings toggle row with native switch (the app styles the native checkbox). */
export interface ToggleRowProps {
  label: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
}
export declare function ToggleRow(props: ToggleRowProps): JSX.Element;
