Interactive SVG dartboard for dart-by-dart score entry — rings are ~2× real proportions so doubles/triples are finger-hittable. Taps flash the region and float the score label.

```jsx
<div style={{width:400,height:400}}>
  <Dartboard onDart={(d) => addDart(d)} />
</div>
```

Bull 50 = {segment:25, multiplier:2}; outer bull = {segment:25, multiplier:1}; miss = {segment:0}.
