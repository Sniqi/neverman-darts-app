Numpad for typing a visit total (max 180). Invalid totals shake the display and show "Ungültige Punktzahl". Layout: 7-8-9 / 4-5-6 / 1-2-3 / C-0-⌫, full-width amber "Bestätigen".

```jsx
<Numpad onConfirm={(total) => apply(total)} validate={(t) => ![163,166,169,172,173,175,176,178,179].includes(t)} />
```
