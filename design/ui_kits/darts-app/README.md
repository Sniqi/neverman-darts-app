# Neverman Darts — App UI Kit

Interactive click-through recreation of the scoring PWA (source: neverman-darts-app/src/routes + src/ui).

Screens:
- **StartScreen** — hub with "Neues Spiel", collapsible "Spieler verwalten", nav rows (src/routes/+page.svelte)
- **SetupScreen** — player picker, mode chips, out rule, format steppers (src/ui/setup/MatchSetup.svelte)
- **MatchScreen** — score cards + visit strip + dartboard/numpad input toggle (src/routes/match + src/ui/input)
- **DisplayScreen** — spectator view: MatchHeader + PlayerPanels (src/routes/display + src/ui/display)

Open index.html and click through: Start → Setup → Match (throw darts on the board) → Display.
All German copy verbatim from the app. State is faked; the scoring math is simplified.
