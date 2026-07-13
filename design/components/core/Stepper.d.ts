/** Numeric stepper row (Legs/Sets/Pause settings). */
export interface StepperProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  /** Trailing unit label, e.g. "Sets", "Minuten" */
  unit?: string;
  onChange?: (value: number) => void;
}
export declare function Stepper(props: StepperProps): JSX.Element;
