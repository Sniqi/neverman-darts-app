Giant spectator column for the TV display. One per player in a full-bleed grid; inactive panels dim to 55%. All type uses the --display-* scale (cqw container queries) — readable on 27" at 3 m.

```jsx
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',height:'100vh'}}>
  <PlayerPanel name="Micha" remaining={120} legs={1} sets={0} active
    checkout="T20 20 D20" legAvg="52.4" matchAvg="48.1"
    visits={[{darts:[{segment:20,multiplier:3},{segment:20,multiplier:1},{segment:5,multiplier:1}],total:85,scoreAfter:120}]} />
  <PlayerPanel name="Gast 1" remaining={248} legs={0} sets={0} visits={[...]} />
</div>
```
