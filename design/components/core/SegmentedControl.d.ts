/** Joined segmented control, e.g. "Single Out" / "Double Out". */
export interface SegmentedControlProps {
  options: string[];
  value: string;
  onChange?: (value: string) => void;
}
export declare function SegmentedControl(props: SegmentedControlProps): JSX.Element;
