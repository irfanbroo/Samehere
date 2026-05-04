'use client';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import AppShell from '@/components/AppShell';

const MOODS = [
  { value: 'great',      label: 'Great',      emoji: '😄', color: '#22c55e', y: 8  },
  { value: 'good',       label: 'Good',        emoji: '🙂', color: '#86efac', y: 18 },
  { value: 'okay',       label: 'Okay',        emoji: '😐', color: '#facc15', y: 32 },
  { value: 'reflective', label: 'Reflective',  emoji: '🤔', color: '#a78bfa', y: 30 },
  { value: 'tired',      label: 'Tired',       emoji: '😴', color: '#94a3b8', y: 46 },
  { value: 'rough',      label: 'Rough',       emoji: '😔', color: '#f87171', y: 56 },
];
const MOOD_MAP = Object.fromEntries(MOODS.map(m => [m.value, m]));
const NO_ENTRY_Y = 52;
const VB_W = 360, VB_H = 64;
const DEMO_MOODS = [null,'okay',null,'tired','great','rough',null,'reflective','good','great','okay',null,'reflective','good'];

const DIARY_QUOTES = [
  'What you resist, persists.',
  'In the journal I am at ease.',
  'You have 60,000 thoughts a day. Most repeat. Write the important ones.',
  'Self-awareness is the beginning of all change.',
];

function toLocalDateStr(d) { return d.toLocaleDateString('en-CA'); }
function wordCount(text) { return text.trim().split(/\s+/).filter(Boolean).length; }
function wasEdited(e) { return Math.abs(new Date(e.updated_at) - new Date(e.created_at)) > 5000; }
function fmtTime(iso) { return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }); }
function fmtDayLabel(ds) {
  const today = toLocalDateStr(new Date());
  const yest = toLocalDateStr(new Date(Date.now() - 86400000));
  if (ds === today) return 'Today';
  if (ds === yest) return 'Yesterday';
  const [y, m, d] = ds.split('-');
  return new Date(+y, +m - 1, +d).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function smoothPath(pts) {
  if (!pts.length) return '';
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i];
    const mx = (p.x + c.x) / 2;
    d += ` C ${mx},${p.y} ${mx},${c.y} ${c.x},${c.y}`;
  }
  return d;
}

export default function DiaryPage() {
  const router = useRouter();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(toLocalDateStr(new Date()));
  const [deletingId, setDeletingId] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [tooltip, setTooltip] = useState(null);
  const [todos, setTodos] = useState([]);
  const [quote] = useState(() => DIARY_QUOTES[Math.floor(Math.random() * DIARY_QUOTES.length)]);
  const pathRef = useRef(null);
  const fillRef = useRef(null);
  const stripRef = useRef(null);
  const todayStr = toLocalDateStr(new Date());

  useEffect(() => {
    const user = getUser();
    if (!user) return router.push('/login');
    api.get('/diary').then(r => setEntries(r.data)).catch(() => {}).finally(() => setLoading(false));
    api.get('/todos').then(r => setTodos(r.data)).catch(() => {});
  }, [router]);

  // entries grouped by date
  const byDate = useMemo(() => {
    const map = {};
    entries.forEach(e => {
      const ds = toLocalDateStr(new Date(e.created_at));
      if (!map[ds]) map[ds] = [];
      map[ds].push(e);
    });
    return map;
  }, [entries]);

  // Today's todos
  const todayTodos = useMemo(() => todos.filter(t => t.due_date?.slice(0,10) === todayStr), [todos, todayStr]);
  const todayDone = useMemo(() => todayTodos.filter(t => t.completed).length, [todayTodos]);
  const todayTotal = todayTodos.length;
  const todoProgress = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;
  const ringR = 26, ringCirc = 2 * Math.PI * ringR;
  const ringOffset = ringCirc - (todoProgress / 100) * ringCirc;

  // Writing streak — must be after byDate
  const streak = useMemo(() => {
    let count = 0;
    const d = new Date();
    while (true) {
      const ds = toLocalDateStr(d);
      if (byDate[ds]?.length) { count++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return count;
  }, [byDate]);

  // 14-day graph data
  const graphDays = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (13 - i));
      const ds = toLocalDateStr(d);
      const dayEntries = byDate[ds] || [];
      const m = dayEntries[0]?.mood || null;
      const mobj = m ? MOOD_MAP[m] : null;
      return {
        ds, label: fmtDayLabel(ds),
        x: Math.round((i / 13) * VB_W),
        y: mobj ? mobj.y : NO_ENTRY_Y,
        mood: m, mobj, count: dayEntries.length,
        shortDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };
    });
  }, [byDate]);

  const demoGraphDays = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    const ds = toLocalDateStr(d);
    const m = DEMO_MOODS[i];
    const mobj = m ? MOOD_MAP[m] : null;
    return { ds, label: fmtDayLabel(ds), x: Math.round((i / 13) * VB_W), y: mobj ? mobj.y : NO_ENTRY_Y, mood: m, mobj, count: m ? 1 : 0, shortDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isDemo: true };
  }), []);

  const activeGraphDays = entries.length > 0 ? graphDays : demoGraphDays;
  const isDemo = entries.length === 0;

  const linePath = useMemo(() => smoothPath(activeGraphDays), [activeGraphDays]);
  const fillPath = useMemo(() => linePath ? `${linePath} L ${VB_W},${VB_H} L 0,${VB_H} Z` : '', [linePath]);

  // Animate line draw whenever graph data loads
  useEffect(() => {
    if (!pathRef.current || !linePath) return;
    const len = pathRef.current.getTotalLength();
    pathRef.current.style.transition = 'none';
    pathRef.current.style.strokeDasharray = len;
    pathRef.current.style.strokeDashoffset = len;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!pathRef.current) return;
      pathRef.current.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)';
      pathRef.current.style.strokeDashoffset = 0;
    }));
  }, [linePath]);

  // Scroll date strip to today on load
  useEffect(() => {
    if (stripRef.current) stripRef.current.scrollLeft = stripRef.current.scrollWidth;
  }, [loading]);

  const dayEntries = useMemo(() => byDate[selectedDate] || [], [byDate, selectedDate]);

  function selectDate(ds) {
    setSelectedDate(ds);
    setTooltip(null);
    // sync date strip
    const chips = stripRef.current?.querySelectorAll('[data-ds]');
    chips?.forEach(c => {
      c.dataset.ds === ds ? c.classList.add('dchip-active') : c.classList.remove('dchip-active');
    });
  }

  function handleDotClick(pt, e) {
    if (!pt.count) return;
    selectDate(pt.ds);
    // Tooltip
    const rect = e.currentTarget.closest('.graph-svg-wrap').getBoundingClientRect();
    const sx = (pt.x / VB_W) * rect.width;
    const sy = (pt.y / VB_H) * rect.height;
    setTooltip({ x: sx, y: sy, label: pt.shortDate, mood: pt.mobj, count: pt.count });
    setTimeout(() => setTooltip(null), 2400);
  }


  async function handleDelete(id) {
    setDeletingId(null);
    setEntries(prev => prev.filter(e => e.id !== id));
    try { await api.delete(`/diary/${id}`); } catch {
      api.get('/diary').then(r => setEntries(r.data)).catch(() => {});
    }
  }

  const toggleExpand = useCallback((id) => {
    setExpandedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }, []);

  return (
    <AppShell>
      <style>{`
        @keyframes fade-up { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dot-pop { 0%{r:3.5} 50%{r:6} 100%{r:4.5} }
        @keyframes ein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sheet-in { from{transform:translateY(110%)} to{transform:translateY(0)} }
        @keyframes tt-in { from{opacity:0;transform:translateX(-50%) translateY(4px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        .dchip { transition:all 0.15s; flex-shrink:0; }
        .dchip:hover:not(.dchip-today):not(.dchip-empty) { background:#111 !important; border-color:#1e1e1e !important; }
        .dchip-active:not(.dchip-today) { background:#111 !important; border-color:#222 !important; }
        .dchip-active:not(.dchip-today) .dchip-num { color:#fff !important; }
        .mood-btn { transition:all 0.15s; }
        .mood-btn:hover { opacity:1 !important; transform:scale(1.12) !important; }
        .ecard { transition:background 0.15s, box-shadow 0.15s, transform 0.15s; animation:ein 0.22s ease-out both; }
        .ecard:hover { background:#111 !important; }
        .graph-dot { cursor:pointer; transition:r 0.15s; }
        .graph-dot:hover { r:6; }
        textarea::placeholder { color:#252525; }
        textarea { caret-color:#7c9cf8; }
        input::placeholder { color:#252525; }
      `}</style>

      <div style={{ width:'100%', maxWidth:560, margin:'0 auto', padding:'0 0 100px' }}>

        {/* ── HEADER ── */}
        <div style={{ padding:'32px 20px 0', display:'flex', alignItems:'flex-start', justifyContent:'space-between', animation:'fade-up 0.3s ease-out both' }}>
          <div>
            <h1 style={{ fontSize:34, fontWeight:900, letterSpacing:'-0.04em', color:'#fff', margin:0 }}>Diary</h1>
            <p style={{ fontSize:12, color:'#333', margin:'6px 0 0', fontStyle:'italic', lineHeight:1.5, maxWidth:260 }}>
              "{quote}"
            </p>
          </div>
          <button onClick={() => router.push('/diary/new')} style={{
            width:42, height:42, borderRadius:13,
            background:'rgba(79,110,245,0.15)',
            border:'1px solid rgba(79,110,245,0.35)',
            color:'#7c9cf8', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            transition:'all 0.15s', flexShrink:0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(79,110,245,0.25)'; e.currentTarget.style.borderColor='rgba(79,110,245,0.6)'; }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(79,110,245,0.15)'; e.currentTarget.style.borderColor='rgba(79,110,245,0.35)'; }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>


        {/* ── MINI CARDS ROW ── */}
        {!loading && (
          <div style={{ padding:'18px 16px 0', display:'flex', gap:10, animation:'fade-up 0.3s ease-out 0.04s both' }}>

            {/* Streak card */}
            <div style={{
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8,
              background:'var(--bg-card,#0d0d0d)', border:'1px solid #1a1a1a',
              borderRadius:20, padding:'18px 16px', flex:1, minHeight:110,
            }}>
              <span style={{ fontSize:32 }}>🔥</span>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:20, fontWeight:900, color:'#fff', letterSpacing:'-0.03em', lineHeight:1 }}>{streak}</div>
                <div style={{ fontSize:10, color:'#333', marginTop:3 }}>day streak</div>
              </div>
            </div>

            {/* Todo ring card */}
            {todayTotal > 0 && (
              <div onClick={() => router.push('/todos')} style={{
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8,
                background:'var(--bg-card,#0d0d0d)', border:'1px solid #1a1a1a',
                borderRadius:20, padding:'18px 16px', flex:1, minHeight:110,
                cursor:'pointer', transition:'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background='#111'; e.currentTarget.style.borderColor='#222'; }}
              onMouseLeave={e => { e.currentTarget.style.background='var(--bg-card,#0d0d0d)'; e.currentTarget.style.borderColor='#1a1a1a'; }}>
                <div style={{ position:'relative', width:56, height:56 }}>
                  <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform:'rotate(-90deg)' }}>
                    <circle cx="28" cy="28" r={ringR} fill="none" stroke="#111" strokeWidth="4.5"/>
                    <circle cx="28" cy="28" r={ringR} fill="none"
                      stroke={todoProgress === 100 ? '#22c55e' : '#fff'}
                      strokeWidth="4.5" strokeDasharray={ringCirc} strokeDashoffset={ringOffset}
                      strokeLinecap="round" style={{ transition:'stroke-dashoffset 0.8s ease' }}/>
                  </svg>
                  <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontSize:12, fontWeight:900, color: todoProgress === 100 ? '#22c55e' : '#fff', lineHeight:1 }}>{todoProgress}%</span>
                    <span style={{ fontSize:6, color:'#555', fontWeight:700, letterSpacing:'0.08em', marginTop:1 }}>DONE</span>
                  </div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:13, fontWeight:800, color:'#fff', letterSpacing:'-0.01em', lineHeight:1 }}>{todayDone}/{todayTotal}</div>
                  <div style={{ fontSize:10, color:'#333', marginTop:3 }}>tasks today</div>
                </div>
              </div>
            )}

            {/* Days left in month card */}
            {(() => {
              const now = new Date();
              const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
              const daysLeft = daysInMonth - now.getDate();
              const monthName = now.toLocaleString('en-US', { month: 'short' });
              return (
                <div style={{
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8,
                  background:'var(--bg-card,#0d0d0d)', border:'1px solid #1a1a1a',
                  borderRadius:20, padding:'18px 16px', flex:1, minHeight:110,
                }}>
                  <span style={{ fontSize:32 }}>📅</span>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:20, fontWeight:900, color: daysLeft <= 5 ? '#f87171' : '#fff', letterSpacing:'-0.03em', lineHeight:1 }}>{daysLeft}</div>
                    <div style={{ fontSize:10, color:'#333', marginTop:3 }}>days left in {monthName}</div>
                  </div>
                </div>
              );
            })()}

          </div>
        )}

        {/* ── MOOD GRAPH ── */}
        {!loading && (
          <div style={{ margin:'22px 16px 0', background:'var(--bg-card,#0d0d0d)', border:`1px solid ${isDemo ? '#1a1a1a' : '#171717'}`, borderRadius:22, padding:'16px 16px 12px', animation:'fade-up 0.3s ease-out 0.06s both', position:'relative', overflow:'hidden' }}>
            {isDemo && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10, background:'rgba(79,110,245,0.06)', border:'1px solid rgba(79,110,245,0.12)', borderRadius:10, padding:'7px 12px' }}>
                <span style={{ fontSize:11, color:'#4f6ef5', fontWeight:600 }}>✦ Preview — write an entry to see your real mood graph</span>
                <button onClick={() => router.push('/diary/new')} style={{ fontSize:10, fontWeight:800, color:'#7c9cf8', background:'none', border:'none', cursor:'pointer', padding:0 }}>Start →</button>
              </div>
            )}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <span style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em', color:'#2a2a2a' }}>Mood · last 14 days</span>
              <div style={{ display:'flex', gap:10 }}>
                {[{c:'#22c55e',l:'Great'},{c:'#f87171',l:'Rough'},{c:'#a78bfa',l:'Reflective'}].map(x => (
                  <span key={x.l} style={{ fontSize:10, color:'#252525', fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
                    <span style={{ width:7, height:2, borderRadius:1, background:x.c, display:'inline-block' }}/>
                    {x.l}
                  </span>
                ))}
              </div>
            </div>

            {/* SVG graph */}
            <div className="graph-svg-wrap" style={{ position:'relative', height:64 }}>
              <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none" style={{ width:'100%', height:64, overflow:'visible', display:'block' }}>
                <defs>
                  <linearGradient id="gfill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f6ef5" stopOpacity="0.12"/>
                    <stop offset="100%" stopColor="#4f6ef5" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                {[16, 32, 48].map(y => <line key={y} x1="0" y1={y} x2={VB_W} y2={y} stroke="#141414" strokeWidth="1"/>)}
                {/* Fill */}
                {fillPath && <path d={fillPath} fill="url(#gfill)"/>}
                {/* Animated line */}
                {linePath && <path ref={pathRef} d={linePath} fill="none" stroke="#4f6ef5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>}
                {/* Dots */}
                {activeGraphDays.map((pt, i) => pt.count > 0 && (
                  <circle
                    key={pt.ds}
                    className="graph-dot"
                    cx={pt.x} cy={pt.y}
                    r={pt.ds === selectedDate ? 5.5 : 4}
                    fill={pt.ds === selectedDate ? '#fff' : (pt.mobj?.color || '#4f6ef5')}
                    stroke={pt.ds === selectedDate ? '#4f6ef5' : 'none'}
                    strokeWidth="2"
                    onClick={e => handleDotClick(pt, e)}
                    style={{ cursor:'pointer' }}
                  />
                ))}
                {/* Today dot (always visible) */}
                {(() => { const today = activeGraphDays[13]; return today && !today.count && <circle cx={today.x} cy={today.y} r="3.5" fill="#333"/>; })()}
              </svg>

              {/* Tooltip */}
              {tooltip && (
                <div style={{
                  position:'absolute',
                  left: tooltip.x,
                  top: tooltip.y - 14,
                  transform:'translateX(-50%) translateY(-100%)',
                  background:'#1a1a1a', border:'1px solid #2a2a2a',
                  borderRadius:10, padding:'6px 10px',
                  display:'flex', alignItems:'center', gap:6,
                  pointerEvents:'none', whiteSpace:'nowrap',
                  animation:'tt-in 0.18s ease-out both',
                  boxShadow:'0 4px 16px rgba(0,0,0,0.5)',
                  zIndex:10,
                }}>
                  <span style={{ fontSize:12, fontWeight:700, color:'#ccc' }}>{tooltip.label}</span>
                  {tooltip.mood && <span style={{ fontSize:14 }}>{tooltip.mood.emoji}</span>}
                  <span style={{ fontSize:10, color:'#555' }}>{tooltip.count} entr{tooltip.count !== 1 ? 'ies' : 'y'}</span>
                  {/* Arrow */}
                  <div style={{ position:'absolute', bottom:-5, left:'50%', transform:'translateX(-50%)', width:8, height:5, overflow:'hidden' }}>
                    <div style={{ width:8, height:8, background:'#2a2a2a', transform:'rotate(45deg)', marginTop:-4 }}/>
                  </div>
                </div>
              )}
            </div>

            {/* Day labels */}
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, padding:'0 1px' }}>
              {activeGraphDays.filter((_, i) => i % 2 === 0 || i === 13).map(pt => (
                <span key={pt.ds} style={{ fontSize:9, fontWeight:700, color: pt.ds === todayStr ? '#555' : '#252525', textAlign:'center', minWidth:20 }}>
                  {new Date(pt.ds + 'T12:00:00').getDate()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── DATE STRIP ── */}
        {!loading && (
          <div style={{ padding:'20px 16px 0', animation:'fade-up 0.3s ease-out 0.1s both' }}>
            <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', color:'#252525', marginBottom:10, padding:'0 2px' }}>April</div>
            <div ref={stripRef} style={{ display:'flex', gap:6, overflowX:'auto', scrollbarWidth:'none', paddingBottom:2 }}>
              {Array.from({ length: 14 }, (_, i) => {
                const d = new Date(); d.setDate(d.getDate() - (13 - i));
                const ds = toLocalDateStr(d);
                const isToday = ds === todayStr;
                const isSel = ds === selectedDate;
                const dayEntries = byDate[ds] || [];
                const mobj = dayEntries[0]?.mood ? MOOD_MAP[dayEntries[0].mood] : null;
                const dayLabel = ['Su','Mo','Tu','We','Th','Fr','Sa'][d.getDay()];
                return (
                  <div key={ds} data-ds={ds}
                    className={`dchip${isToday ? ' dchip-today' : ''}${isSel ? ' dchip-active' : ''}`}
                    onClick={() => selectDate(ds)}
                    style={{
                      width:46, height:62, borderRadius:14, flexShrink:0,
                      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4,
                      cursor:'pointer',
                      background: isToday ? '#fff' : isSel ? '#111' : 'transparent',
                      border: `1px solid ${isToday ? 'transparent' : isSel ? '#222' : 'transparent'}`,
                    }}>
                    <span style={{ fontSize:9, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em', color: isToday ? '#666' : '#2a2a2a' }}>{dayLabel}</span>
                    <span className="dchip-num" style={{ fontSize:17, fontWeight:800, lineHeight:1, color: isToday ? '#000' : isSel ? '#fff' : dayEntries.length ? '#888' : '#2a2a2a' }}>{d.getDate()}</span>
                    <div style={{ width:6, height:6, borderRadius:'50%', background: isToday ? '#000' : mobj ? mobj.color : 'transparent' }}/>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ENTRIES ── */}
        <div style={{ padding:'20px 22px 8px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h2 style={{ fontSize:14, fontWeight:800, color:'#fff', margin:0 }}>{fmtDayLabel(selectedDate)}</h2>
          <span style={{ fontSize:11, color:'#252525' }}>
            {dayEntries.length === 0 ? 'No entries' : `${dayEntries.length} entr${dayEntries.length !== 1 ? 'ies' : 'y'}`}
          </span>
        </div>

        {loading ? (
          <p style={{ color:'#252525', textAlign:'center', marginTop:40 }}>Loading...</p>
        ) : dayEntries.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 24px' }}>
            <p style={{ color:'#252525', fontSize:13, fontStyle:'italic', margin:0 }}>Nothing written this day.</p>
          </div>
        ) : (
          <div style={{ padding:'0 16px' }}>
            {dayEntries.map((e, i) => {
              const mobj = e.mood ? MOOD_MAP[e.mood] : null;
              const wc = wordCount(e.content);
              const isLong = wc > 40 || e.content.length > 200;
              const isExpanded = expandedIds.has(e.id);
              const edited = wasEdited(e);
              return (
                <div key={e.id} className="ecard" onClick={() => router.push(`/diary/${e.id}`)} style={{
                  marginBottom:10, borderRadius:18, padding:'16px 18px', cursor:'pointer',
                  background:'var(--bg-card,#0d0d0d)',
                  border:`1px solid ${mobj ? mobj.color + '18' : '#181818'}`,
                  boxShadow: mobj ? `inset 3px 0 0 ${mobj.color}` : 'inset 3px 0 0 #1e1e1e',
                  position:'relative', animationDelay:`${i * 0.05}s`,
                }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, marginBottom:8 }}>
                    <div style={{ flex:1, minWidth:0, overflow:'hidden' }}>
                      {e.title && <div style={{ fontSize:14, fontWeight:700, color:'#e8e8e8', marginBottom:5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.title}</div>}
                      <p style={{ margin:0, fontSize:13, color:'#4a4a4a', lineHeight:1.65, wordBreak:'break-word', overflowWrap:'break-word',
                        ...(!isExpanded && isLong ? { display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden' } : {})
                      }}>{e.content}</p>
                      {isLong && (
                        <button onClick={ev => { ev.stopPropagation(); toggleExpand(e.id); }} style={{ background:'none', border:'none', color:'#3a3a3a', fontSize:11, fontWeight:700, cursor:'pointer', padding:'4px 0 0', display:'block', transition:'color 0.15s' }}
                          onMouseEnter={ev => ev.currentTarget.style.color='#888'} onMouseLeave={ev => ev.currentTarget.style.color='#3a3a3a'}>
                          {isExpanded ? '↑ Show less' : '↓ Read more'}
                        </button>
                      )}
                    </div>
                    <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
                      <span style={{ fontSize:24 }}>{mobj?.emoji || '　'}</span>
                      <button onClick={ev => { ev.stopPropagation(); setDeletingId(e.id); }} style={{ width:26, height:26, borderRadius:7, border:'none', background:'#161616', color:'#3a3a3a', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
                        onMouseEnter={ev => { ev.currentTarget.style.background='#1a0000'; ev.currentTarget.style.color='#ff4d4d'; }} onMouseLeave={ev => { ev.currentTarget.style.background='#161616'; ev.currentTarget.style.color='#3a3a3a'; }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <span style={{ fontSize:10, color:'#252525', fontWeight:600 }}>{fmtTime(e.created_at)}</span>
                    <span style={{ fontSize:10, color:'#1e1e1e' }}>·</span>
                    <span style={{ fontSize:10, color:'#252525' }}>{wc} words</span>
                    {mobj && <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:`${mobj.color}10`, color:mobj.color, border:`1px solid ${mobj.color}20` }}>{mobj.label}</span>}
                    {edited && <span style={{ fontSize:10, color:'#2a2a2a', display:'flex', alignItems:'center', gap:3 }}><span style={{ width:4, height:4, borderRadius:'50%', background:'#2a2a2a', display:'inline-block' }}/>edited</span>}
                  </div>
                  {deletingId === e.id && (
                    <div onClick={ev => ev.stopPropagation()} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.92)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', gap:10, borderRadius:18, zIndex:10 }}>
                      <span style={{ fontSize:12, color:'#777' }}>Delete this entry?</span>
                      <button onClick={() => setDeletingId(null)} style={{ padding:'5px 14px', borderRadius:20, fontSize:11, fontWeight:700, background:'transparent', border:'1px solid #222', color:'#555', cursor:'pointer' }}>No</button>
                      <button onClick={() => handleDelete(e.id)} style={{ padding:'5px 14px', borderRadius:20, fontSize:11, fontWeight:700, background:'rgba(255,77,77,0.12)', border:'1px solid rgba(255,77,77,0.25)', color:'#ff4d4d', cursor:'pointer' }}>Delete</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
