/** 10-key numeric visit entry (7-8-9 / 4-5-6 / 1-2-3 / C-0-⌫ + amber "Bestätigen"). */
export interface NumpadProps {
  onConfirm?: (total: number) => void;
  /** Extra validity check (e.g. impossible totals like 179); invalid input shakes + shows "Ungültige Punktzahl" */
  validate?: (total: number) => boolean;
}
export declare function Numpad(props: NumpadProps): JSX.Element;
