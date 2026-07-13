const { Button, Chip, SegmentedControl, Stepper, ToggleRow, ConfirmDialog,
  Dartboard, Numpad, VisitStrip, ScoreCard, MatchHeader, PlayerPanel, StatCard } = window.NevermanDartsDesignSystem_61370c;

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'none',color:'var(--text-muted)',fontSize:'var(--text-base)',fontWeight:500,cursor:'pointer',padding:'8px 0',fontFamily:'var(--font-ui)'}}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>
      Zurück
    </button>
  );
}

function Avatar({ name, size = 40 }) {
  return (
    <span style={{width:size,height:size,borderRadius:'50%',background:'var(--surface-3)',border:'1px solid var(--line-strong)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:600,fontSize:size*0.42,flexShrink:0,color:'var(--text-soft)'}}>{name[0]}</span>
  );
}

// ── Start hub ──────────────────────────────────────────────────────────────
function StartScreen({ go }) {
  const [profilesOpen, setProfilesOpen] = React.useState(false);
  return (
    <main data-screen-label="Start" style={{maxWidth:520,margin:'0 auto',padding:'var(--space-3xl) var(--space-lg)',display:'flex',flexDirection:'column',gap:'var(--space-xl)'}}>
      <h1 style={{fontSize:'var(--text-xl)',fontWeight:600,margin:0,letterSpacing:'-0.01em'}}>Neverman Darts</h1>
      <nav aria-label="Hauptmenü" style={{display:'flex',flexDirection:'column',gap:'var(--space-md)'}}>
        <Button variant="accent" chevron onClick={() => go('setup')}>Neues Spiel</Button>
        <Button variant="menu" onClick={() => setProfilesOpen(o=>!o)} style={{justifyContent:'space-between'}}>
          Spieler verwalten
        </Button>
        {profilesOpen && (
          <div style={{background:'var(--surface)',border:'1px solid var(--line)',borderRadius:'var(--radius-md)',padding:'var(--space-md)',display:'flex',flexDirection:'column',gap:'var(--space-md)'}}>
            {['Micha','Sarah'].map(n => (
              <div key={n} style={{display:'flex',alignItems:'center',gap:'var(--space-md)'}}>
                <Avatar name={n} size={40} />
                <span style={{fontSize:'var(--text-md)'}}>{n}</span>
              </div>
            ))}
          </div>
        )}
        <Button variant="menu" chevron onClick={() => go('history')}>Match-Verlauf</Button>
        <Button variant="menu" chevron onClick={() => go('stats')}>Statistik</Button>
        <Button variant="menu" chevron>Daten / Backup</Button>
      </nav>
    </main>
  );
}

// ── Setup ──────────────────────────────────────────────────────────────────
function SetupScreen({ go }) {
  const [players, setPlayers] = React.useState([{id:'1',name:'Micha',guest:false}]);
  const [score, setScore] = React.useState(301);
  const [rule, setRule] = React.useState('Single Out');
  const [legs, setLegs] = React.useState(2);
  const [sets, setSets] = React.useState(true);
  const [setsToWin, setSetsToWin] = React.useState(3);
  const [picker, setPicker] = React.useState(false);
  const canStart = players.length >= 1;
  const addGuest = () => { setPlayers(p => [...p, {id:'g'+(p.length+1), name:'Gast '+(p.filter(x=>x.guest).length+1), guest:true}]); setPicker(false); };
  const sec = {display:'flex',flexDirection:'column',gap:'var(--space-md)'};
  const h2 = {fontSize:'var(--text-lg)',fontWeight:600,margin:0};
  return (
    <main data-screen-label="Setup" style={{maxWidth:520,margin:'0 auto',padding:'var(--space-lg)',paddingBottom:'var(--space-3xl)',display:'flex',flexDirection:'column',gap:'var(--space-xl)'}}>
      <BackBtn onClick={() => go('start')} />
      <h1 style={{fontSize:'var(--text-xl)',fontWeight:600,margin:0,letterSpacing:'-0.01em'}}>Neues Spiel</h1>
      <section style={sec}>
        <h2 style={h2}>Spieler</h2>
        <ul style={{margin:0,padding:0,display:'flex',flexDirection:'column',gap:'var(--space-sm)'}}>
          {players.map(p => (
            <li key={p.id} style={{listStyle:'none',display:'flex',alignItems:'center',gap:'var(--space-md)',background:'var(--surface)',border:'1px solid var(--line)',borderRadius:'var(--radius-sm)',padding:'var(--space-sm) var(--space-md)',minHeight:'var(--row-h)',boxSizing:'border-box'}}>
              <Avatar name={p.name} size={40} />
              <span style={{fontSize:'var(--text-md)',flex:1}}>{p.name}</span>
              {p.guest && <span style={{fontSize:'var(--text-xs)',fontWeight:500,color:'var(--text-muted)',border:'1px solid var(--border-input)',borderRadius:'var(--radius-pill)',padding:'2px 10px'}}>Gast</span>}
              <button onClick={()=>setPlayers(ps=>ps.filter(x=>x.id!==p.id))} aria-label="Spieler entfernen" style={{background:'none',border:'none',color:'var(--text-muted)',fontSize:24,cursor:'pointer',padding:'0 8px',minWidth:44,minHeight:44,fontFamily:'var(--font-ui)'}}>×</button>
            </li>
          ))}
        </ul>
        {players.length < 4 && <Button variant="menu" onClick={()=>setPicker(o=>!o)} style={{height:'var(--control-h)',justifyContent:'center',border:'1px dashed var(--border-input)',background:'transparent',boxShadow:'none',color:'var(--text-soft)'}}>+ Spieler hinzufügen</Button>}
        {picker && (
          <div style={{background:'var(--surface)',border:'1px solid var(--line)',borderRadius:'var(--radius-sm)',padding:'var(--space-sm)',display:'flex',flexDirection:'column',gap:4}}>
            <p style={{fontSize:'var(--text-xs)',fontWeight:600,letterSpacing:'var(--tracking-caps)',textTransform:'uppercase',color:'var(--text-muted)',margin:'6px 10px'}}>Profile</p>
            {['Micha','Sarah'].filter(n=>!players.some(p=>p.name===n)).map(n=>(
              <button key={n} onClick={()=>{setPlayers(p=>[...p,{id:n,name:n,guest:false}]);setPicker(false);}} style={{display:'flex',alignItems:'center',gap:12,background:'none',border:'none',borderRadius:'var(--radius-xs)',color:'var(--text)',fontSize:'var(--text-md)',cursor:'pointer',padding:'10px',textAlign:'left',fontFamily:'var(--font-ui)',minHeight:48}}>
                <Avatar name={n} size={32} />{n}
              </button>
            ))}
            <p style={{fontSize:'var(--text-xs)',fontWeight:600,letterSpacing:'var(--tracking-caps)',textTransform:'uppercase',color:'var(--text-muted)',margin:'6px 10px'}}>Gast</p>
            <button onClick={addGuest} style={{display:'flex',alignItems:'center',gap:12,background:'none',border:'none',borderRadius:'var(--radius-xs)',color:'var(--text)',fontSize:'var(--text-md)',cursor:'pointer',padding:'10px',textAlign:'left',fontFamily:'var(--font-ui)',minHeight:48}}>
              <Avatar name={'G'} size={32} />Gast hinzufügen
            </button>
          </div>
        )}
      </section>
      <section style={sec}>
        <h2 style={h2}>Spielmodus</h2>
        <div style={{display:'flex',gap:'var(--space-sm)'}}>
          {[301,401,501].map(s => <Chip key={s} active={score===s} onClick={()=>setScore(s)}>{s}</Chip>)}
        </div>
      </section>
      <section style={sec}>
        <h2 style={h2}>Abwurfregel</h2>
        <SegmentedControl options={['Single Out','Double Out']} value={rule} onChange={setRule} />
      </section>
      <section style={sec}>
        <h2 style={h2}>Format</h2>
        <Stepper label="Legs - First to" value={legs} min={1} max={9} onChange={setLegs} />
        <ToggleRow label="Sets" checked={sets} onChange={setSets} />
        {sets && <Stepper label="Sets - First to" value={setsToWin} min={1} max={9} onChange={setSetsToWin} />}
      </section>
      <section style={sec}>
        {!canStart && <p style={{fontSize:'var(--text-sm)',color:'var(--text-muted)',margin:0,textAlign:'center'}}>Mindestens 1 Spieler erforderlich</p>}
        <Button variant="cta" disabled={!canStart} onClick={() => go('match', { players: players.map(p=>p.name), score, rule, sets, setsToWin, legs })}>Spiel starten</Button>
      </section>
    </main>
  );
}

// ── Match (scoring) ────────────────────────────────────────────────────────
const CHECKOUTS = {170:'T20 T20 Bull',167:'T20 T19 Bull',164:'T20 T18 Bull',161:'T20 T17 Bull',160:'T20 T20 D20',
  120:'T20 20 D20',100:'T20 D20',80:'T20 D10',60:'20 D20',40:'D20',36:'D18',32:'D16',24:'D12',16:'D8',8:'D4',4:'D2',2:'D1'};

function MatchScreen({ go, config }) {
  const names = (config && config.players && config.players.length ? config.players : ['Micha','Gast 1']);
  const start = (config && config.score) || 301;
  const [state, setState] = React.useState(() => ({
    players: names.map(n => ({ name: n, remaining: start, legs: 0, sets: 0 })),
    active: 0, visit: [], input: 'board', bust: false,
  }));

  const applyDart = (dart) => setState(s => {
    if (s.visit.length >= 3) return s;
    const players = s.players.map(p => ({...p}));
    const p = players[s.active];
    const visit = [...s.visit, dart];
    const visitTotal = visit.reduce((t,d)=>t+d.segment*d.multiplier,0);
    const newRem = p.remaining - visitTotal;
    if (newRem < 0 || newRem === 1) {
      // bust — score unchanged, pass turn
      return { ...s, players, active: (s.active+1)%players.length, visit: [], bust: true };
    }
    if (newRem === 0) {
      p.legs += 1; players.forEach(pl => pl.remaining = start);
      return { ...s, players, active: (s.active+1)%players.length, visit: [], bust: false };
    }
    if (visit.length === 3) {
      p.remaining = newRem;
      return { ...s, players, active: (s.active+1)%players.length, visit: [], bust: false };
    }
    return { ...s, players, visit, bust: false };
  });

  const applyTotal = (total) => setState(s => {
    const players = s.players.map(p => ({...p}));
    const p = players[s.active];
    if (total > p.remaining || p.remaining - total === 1) {
      return { ...s, players, active:(s.active+1)%players.length, visit:[], bust:true };
    }
    p.remaining -= total;
    if (p.remaining === 0) { p.legs += 1; players.forEach(pl => pl.remaining = start); }
    return { ...s, players, active:(s.active+1)%players.length, visit:[], bust:false };
  });

  const undo = () => setState(s => {
    if (!s.visit.length) return s;
    return { ...s, visit: s.visit.slice(0,-1) };
  });

  return (
    <main data-screen-label="Match" style={{maxWidth:1080,margin:'0 auto',padding:'var(--space-md) var(--space-lg)',display:'flex',flexDirection:'column',gap:'var(--space-md)',height:'100%',boxSizing:'border-box'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <BackBtn onClick={() => go('start')} />
        <button onClick={() => go('display', { state: { ...state, start } })} style={{background:'var(--surface)',border:'1px solid var(--border-input)',borderRadius:'var(--radius-sm)',color:'var(--text-soft)',fontSize:'var(--text-sm)',fontWeight:500,padding:'10px 18px',cursor:'pointer',fontFamily:'var(--font-ui)',whiteSpace:'nowrap',flexShrink:0,minHeight:44}}>Display öffnen ›</button>
      </div>
      <div style={{display:'flex',gap:'var(--space-md)',flexWrap:'wrap'}}>
        {state.players.map((p, i) => (
          <ScoreCard key={p.name} name={p.name} remaining={p.remaining - (i===state.active ? state.visit.reduce((t,d)=>t+d.segment*d.multiplier,0) : 0)}
            legs={p.legs} sets={config && config.sets ? p.sets : undefined} active={i===state.active}
            checkout={i===state.active ? CHECKOUTS[p.remaining - state.visit.reduce((t,d)=>t+d.segment*d.multiplier,0)] : undefined} />
        ))}
      </div>
      <VisitStrip darts={state.visit} bust={state.bust} onUndo={undo} />
      <div style={{maxWidth:360,margin:'0 auto',width:'100%'}}>
        <SegmentedControl options={['Dartboard','Numpad']} value={state.input==='board'?'Dartboard':'Numpad'} onChange={(v)=>setState(s=>({...s,input:v==='Dartboard'?'board':'numpad'}))} />
      </div>
      {state.input === 'board'
        ? <div style={{flex:1,minHeight:0,display:'flex',justifyContent:'center'}}><div style={{width:'min(90vw, 56vh)',height:'min(90vw, 56vh)'}}><Dartboard onDart={applyDart} /></div></div>
        : <Numpad onConfirm={applyTotal} validate={(t)=>![163,166,169,172,173,175,176,178,179].includes(t) && t<=180} />}
    </main>
  );
}

// ── Spectator display ──────────────────────────────────────────────────────
function DisplayScreen({ go, config }) {
  const st = (config && config.state) || null;
  const players = st ? st.players : [
    { name:'Micha', remaining:120, legs:1, sets:0 },
    { name:'Gast 1', remaining:248, legs:0, sets:0 },
  ];
  const active = st ? st.active : 0;
  const demoVisits = (i) => i === 0 ? [
    { darts:[{segment:20,multiplier:1},{segment:1,multiplier:1},{segment:5,multiplier:1}], total:26, scoreAfter:266 },
    { darts:[{segment:19,multiplier:3},{segment:19,multiplier:1},{segment:3,multiplier:1}], total:79, scoreAfter:187 },
    { darts:[{segment:20,multiplier:3},{segment:5,multiplier:1},{segment:2,multiplier:1}], total:67, scoreAfter:120, live:true },
  ] : [
    { darts:[{segment:20,multiplier:1},{segment:20,multiplier:1},{segment:13,multiplier:1}], total:53, scoreAfter:301 },
    { darts:[{segment:19,multiplier:3},{segment:20,multiplier:2},{segment:0,multiplier:1}], total:0, scoreAfter:301, bust:true },
    { darts:[{segment:20,multiplier:1},{segment:20,multiplier:1},{segment:13,multiplier:1}], total:53, scoreAfter:248 },
  ];
  return (
    <div data-screen-label="Display" style={{display:'flex',flexDirection:'column',height:'100%',background:'var(--bg)'}}>
      <div style={{position:'absolute',bottom:12,left:12,zIndex:10}}>
        <button onClick={() => go('match')} style={{background:'rgba(5,7,12,.6)',backdropFilter:'blur(8px)',border:'1px solid var(--line-strong)',borderRadius:'var(--radius-sm)',color:'var(--text-soft)',fontSize:'var(--text-sm)',padding:'8px 14px',cursor:'pointer',fontFamily:'var(--font-ui)',whiteSpace:'nowrap'}}>‹ Zurück</button>
      </div>
      <MatchHeader startScore={(st && st.start) || 501} outRule="double" setsEnabled setsToWin={3} currentLeg={(players[0].legs + players[1] && players.reduce((t,p)=>t+p.legs,0) + 1) || 1} />
      <div style={{display:'grid',gridTemplateColumns:'repeat('+players.length+', 1fr)',flex:1,minHeight:0}}>
        {players.map((p, i) => (
          <PlayerPanel key={p.name} name={p.name} remaining={p.remaining} legs={p.legs} sets={p.sets}
            active={i===active} checkout={i===active ? CHECKOUTS[p.remaining] : undefined}
            legAvg={i===active?'52.4':'41.2'} matchAvg={i===active?'48.1':'43.7'} visits={demoVisits(i)} />
        ))}
      </div>
    </div>
  );
}

// ── History ────────────────────────────────────────────────────────────────
function HistoryScreen({ go }) {
  const { HistoryRow } = window.NevermanDartsDesignSystem_61370c;
  return (
    <main data-screen-label="Match-Verlauf" style={{maxWidth:520,margin:'0 auto',padding:'var(--space-lg)',display:'flex',flexDirection:'column',gap:'var(--space-lg)'}}>
      <BackBtn onClick={() => go('start')} />
      <h1 style={{fontSize:'var(--text-xl)',fontWeight:600,margin:0,letterSpacing:'-0.01em'}}>Match-Verlauf</h1>
      <ul style={{margin:0,padding:0,border:'1px solid var(--line)',borderRadius:'var(--radius-md)',overflow:'hidden',boxShadow:'var(--edge-highlight)'}}>
        <HistoryRow date="12.07.2026" winnerName="Micha" otherNames={['Gast 1']} result="3:1" format="501 Double Out · First to 3 Sets" />
        <HistoryRow date="10.07.2026" winnerName="Sarah" otherNames={['Micha','Gast 1']} result="4 Legs" format="301 Single Out · First to 4 Legs" />
        <HistoryRow date="08.07.2026" winnerName="Micha" otherNames={['Sarah']} result="2:0" format="501 Double Out · First to 2 Legs" />
      </ul>
    </main>
  );
}

// ── Stats ──────────────────────────────────────────────────────────────────
function StatsScreen({ go }) {
  return (
    <main data-screen-label="Statistik" style={{maxWidth:520,margin:'0 auto',padding:'var(--space-lg)',display:'flex',flexDirection:'column',gap:'var(--space-lg)'}}>
      <BackBtn onClick={() => go('start')} />
      <h1 style={{fontSize:'var(--text-xl)',fontWeight:600,margin:0,letterSpacing:'-0.01em'}}>Statistik</h1>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'var(--space-sm)'}}>
        <StatCard value="42.3" label="Ø 3 Darts" />
        <StatCard value="67%" label="Checkout-Quote" />
        <StatCard value="180" label="Höchster Wurf" />
        <StatCard value="14" label="Beste Darts/Leg" />
      </div>
    </main>
  );
}

Object.assign(window, { StartScreen, SetupScreen, MatchScreen, DisplayScreen, HistoryScreen, StatsScreen });
