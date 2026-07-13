Numeric stepper row used in match setup (legs, sets, pause length). − / + are 48px touch targets, disabled at bounds via opacity .3.

```jsx
<Stepper label="Legs - First to" value={legs} min={1} max={9} onChange={setLegs} />
<Stepper label="Pausendauer" value={min} max={30} unit="Minuten" onChange={setMin} />
```
