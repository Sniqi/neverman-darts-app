Touch-first full-width button used across the darts app; use for nav rows ("menu" + chevron), amber CTAs, and dialog actions.

```jsx
<Button variant="menu" chevron onClick={go}>Match-Verlauf</Button>
<Button variant="cta">Spiel starten</Button>
<Button variant="destructive">Verwerfen und neu starten</Button>
<Button variant="cancel">Abbrechen</Button>
```

Variants: menu (64px surface row), accent (64px amber gradient), cta (start button, radius 12, 22px/700), destructive (red), cancel (bordered surface). Press = scale .97 + brightness. Disabled = opacity .4.
