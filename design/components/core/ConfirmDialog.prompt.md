Confirmation dialog over a blurred dark scrim; heading states the situation, body states the consequence, CTA is explicit, cancel is always "Abbrechen".

```jsx
<ConfirmDialog heading="Es läuft noch ein Spiel"
  body="Wenn du ein neues Spiel startest, geht der aktuelle Spielstand verloren."
  ctaLabel="Verwerfen und neu starten" ctaStyle="destructive"
  onConfirm={reset} onCancel={close} />
```
