Selectable chip for mutually-exclusive short options (301/401/501); place several in a flex row with 8px gap.

```jsx
<div style={{display:'flex',gap:'var(--space-sm)'}}>
  {[301,401,501].map(s => <Chip key={s} active={s===score} onClick={()=>set(s)}>{s}</Chip>)}
</div>
```

Active = amber gradient fill + 700 weight; inactive = surface + 16% hairline border. 56px min height, radius 12.
