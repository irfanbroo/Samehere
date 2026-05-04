'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import AppShell from '@/components/AppShell';

const POSITIVE_WORDS = ['great day','amazing','wonderful','perfect','awesome','fantastic','excellent','best day','loved today','happy day','felt good','had a great','so productive'];

function toLocalDateStr(d) { return d.toLocaleDateString('en-CA'); }

function formatDisplay(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return new Date(+y, +m - 1, +d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatShortDate(date) {
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/');
}

function isPositive(text) {
  return POSITIVE_WORDS.some(w => text.toLowerCase().includes(w));
}

export default function ReckoningPage() {
  const router = useRouter();
  const [truths, setTruths] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [nudge, setNudge] = useState(false);
  const [showInfo, setShowInfo] = useState(() => {
    if (typeof window !== 'undefined') return !localStorage.getItem('reckoning_intro_seen');
    return false;
  });
  const [showCalendar, setShowCalendar] = useState(true);
  const [posting, setPosting] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selectedDate, setSelectedDate] = useState(toLocalDateStr(new Date()));
  const [calMonth, setCalMonth] = useState(new Date());
  const [filter, setFilter] = useState('calendar'); // 'all' | 'today' | 'week'

  const todayStr = toLocalDateStr(new Date());

  useEffect(() => {
    const user = getUser();
    if (!user) return router.push('/login');
    api.get('/truths').then(r => setTruths(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  // Calendar
  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = calMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const truthDates = useMemo(() => new Set(truths.map(t => new Date(t.created_at).toLocaleDateString('en-CA'))), [truths]);
  // Per-date: all sealed = green, any open = red
  const sealedDates = useMemo(() => {
    const map = {};
    truths.forEach(t => {
      const d = new Date(t.created_at).toLocaleDateString('en-CA');
      if (!(d in map)) map[d] = true; // initialize only if not set yet
      if (!t.resolution) map[d] = false; // any open = red, never revert
    });
    return map;
  }, [truths]);

  // Filtered truths for list
  const sortByOpen = (arr) => [...arr].sort((a, b) => {
    if (!a.resolution && b.resolution) return -1;
    if (a.resolution && !b.resolution) return 1;
    return 0;
  });

  const filteredTruths = useMemo(() => {
    const now = new Date();
    if (filter === 'today') return sortByOpen(truths.filter(t => new Date(t.created_at).toLocaleDateString('en-CA') === todayStr));
    if (filter === 'week') {
      const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
      return sortByOpen(truths.filter(t => new Date(t.created_at) >= weekAgo));
    }
    return sortByOpen(truths);
  }, [truths, filter, todayStr]);

  // Entries for selected date (when calendar is open)
  const dayTruths = useMemo(() => sortByOpen(truths.filter(t => new Date(t.created_at).toLocaleDateString('en-CA') === selectedDate)), [truths, selectedDate]);

  const isToday = selectedDate === todayStr;
  const isPast = selectedDate < todayStr;
  const yesterdayStr = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return toLocalDateStr(d); })();
  const isYesterday = selectedDate === yesterdayStr;
  const isLocked = isPast && !isYesterday; // older than 1 day = locked

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!input.trim()) return;
    if (isPositive(input)) {
      setNudge(true);
      setTimeout(() => setNudge(false), 3000);
      return;
    }
    setPosting(true);
    const tempId = `temp-${Date.now()}`;
    const isSelectedToday = selectedDate === todayStr;
    const createdAt = isSelectedToday ? new Date().toISOString() : `${selectedDate}T12:00:00.000Z`;
    const optimistic = { id: tempId, content: input.trim(), created_at: createdAt };
    setTruths(prev => [optimistic, ...prev]);
    setInput('');
    try {
      const res = await api.post('/truths', { content: optimistic.content, debug_date: isSelectedToday ? null : selectedDate });
      setTruths(prev => prev.map(t => t.id === tempId ? res.data : t));
    } catch {
      setTruths(prev => prev.filter(t => t.id !== tempId));
      setInput(optimistic.content);
    } finally { setPosting(false); }
  }

  async function handleDelete(id) {
    setTruths(prev => prev.filter(t => t.id !== id));
    try { await api.delete(`/truths/${id}`); } catch {
      api.get('/truths').then(r => setTruths(r.data)).catch(() => {});
    }
  }

  function TruthCard({ t, onDelete }) {
    const isSealed = !!t.resolution;
    return (
      <div className="entry-in truth-card" onClick={() => router.push(`/reckoning/${t.id}`)} style={{
        marginBottom: 12, borderRadius: 16, overflow: 'hidden',
        background: 'var(--bg-card, #0c0c0c)',
        border: `1px solid ${isSealed ? 'rgba(34,197,94,0.1)' : '#1a1a1a'}`,
        cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = '#111'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = '#0c0c0c'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
        {/* Left accent */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: isSealed ? 'rgba(34,197,94,0.4)' : 'rgba(139,30,30,0.4)' }} />

        <div style={{ padding: '16px 18px 14px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Content */}
              <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 500, color: '#e0e0e0', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {t.content}
              </p>
              {/* Meta row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <span style={{ fontSize: 11, color: '#333' }}>{formatShortDate(t.created_at)}</span>
                {isSealed && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)', borderRadius: 20, padding: '2px 10px' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
                    <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>Sealed</span>
                  </div>
                )}
                {!isSealed && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(139,30,30,0.06)', border: '1px solid rgba(139,30,30,0.12)', borderRadius: 20, padding: '2px 10px' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#8B1E1E' }} />
                    <span style={{ fontSize: 10, color: '#8B1E1E', fontWeight: 600 }}>Open</span>
                  </div>
                )}
              </div>
            </div>
            {/* Arrow */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 4 }}><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <style>{`
        @keyframes nudge { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
        .nudge { animation: nudge 0.3s ease; }
        @keyframes entry-in { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .entry-in { animation: entry-in 0.25s ease-out; }
        .truth-card:hover { background: #111 !important; }
        textarea::placeholder { color: #2a2a2a; }
        textarea { caret-color: #8B1E1E; }
        .filter-chip:hover { border-color: #333 !important; color: #aaa !important; }
      `}</style>

      <div style={{ width: '100%', maxWidth: 560, margin: '0 auto', padding: '0 0 100px' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 20px 0' }}>
          <button onClick={() => router.push('/feed')} style={{ background: 'none', border: 'none', color: 'var(--secondary-text-color, #9CA3AF)', cursor: 'pointer', padding: 0, display: 'flex' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setShowCalendar(p => { if (!p) setFilter('calendar'); return !p; }); }} style={{
              background: 'none', border: 'none', color: showCalendar ? '#8B1E1E' : '#555', cursor: 'pointer', padding: 4, display: 'flex',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </button>
            <button onClick={() => setShowInfo(true)} style={{ background: 'none', border: 'none', color: 'var(--secondary-text-color, #9CA3AF)', cursor: 'pointer', padding: 4, display: 'flex' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Big title */}
        <div style={{ padding: '16px 20px 20px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>The Reckoning</h1>
          <p style={{ color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 13, margin: '4px 0 0' }}>{truths.length} entr{truths.length !== 1 ? 'ies' : 'y'}</p>
        </div>

        {/* Calendar (toggleable) */}
        {showCalendar && (
          <div style={{ margin: '0 16px 16px', background: 'var(--bg-card, #0f0f0f)', border: '1px solid #1a1a1a', borderRadius: 16, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <button onClick={() => setCalMonth(new Date(year, month - 1, 1))} style={{ background: 'none', border: 'none', color: 'var(--secondary-text-color, #9CA3AF)', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>‹</button>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#ccc' }}>{monthName}</span>
              <button onClick={() => setCalMonth(new Date(year, month + 1, 1))} style={{ background: 'none', border: 'none', color: 'var(--secondary-text-color, #9CA3AF)', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>›</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 10, color: '#888', fontWeight: 600, paddingBottom: 6 }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const dayNum = i + 1;
                const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`;
                const isSelected = dateStr === selectedDate;
                const isDayToday = dateStr === todayStr;
                const hasEntry = truthDates.has(dateStr);
                const isFuture = dateStr > todayStr;
                const isDateLocked = dateStr < todayStr && dateStr !== yesterdayStr;
                return (
                  <div key={dayNum} onClick={() => { if (!isFuture) { setSelectedDate(dateStr); setFilter('calendar'); }}} style={{
                    textAlign: 'center', padding: '6px 0', borderRadius: 8,
                    cursor: isFuture ? 'default' : 'pointer',
                    background: isSelected ? '#8B1E1E' : isDayToday ? 'rgba(255,255,255,0.06)' : 'transparent',
                    color: isSelected ? '#fff' : isFuture ? '#333' : isDateLocked ? '#666' : '#fff',
                    fontWeight: isSelected || isDayToday ? 700 : 400,
                    fontSize: 13, position: 'relative', transition: 'background 0.1s',
                    opacity: isFuture ? 0.3 : 1,
                  }}
                  onMouseEnter={e => { if (!isSelected && !isFuture) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isDayToday ? 'rgba(255,255,255,0.06)' : 'transparent'; }}>
                    {dayNum}
                    {hasEntry && <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: isSelected ? '#fff' : sealedDates[dateStr] ? '#22c55e' : '#8B1E1E' }} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, padding: '0 16px 20px', overflowX: 'auto' }}>
          {[['all', 'All'], ['today', 'Today'], ['week', 'This week']].map(([val, label]) => (
            <button key={val} className="filter-chip" onClick={() => { setFilter(val); if (val !== 'calendar') setShowCalendar(false); }} style={{
              padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
              border: `1px solid ${filter === val ? '#fff' : '#1e1e1e'}`,
              background: filter === val ? '#fff' : 'transparent',
              color: filter === val ? '#000' : '#555',
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', flexShrink: 0,
            }}>{label}</button>
          ))}
        </div>

        {/* Selected date header when using calendar */}
        {filter === 'calendar' && (
          <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{isToday ? 'Today' : formatDisplay(selectedDate)}</span>
          </div>
        )}


        {/* Write input */}
        <div style={{ padding: '0 16px 8px', display: isLocked ? 'none' : 'block' }}>
          <div className={nudge ? 'nudge' : ''} style={{
            background: 'var(--bg-base, #0a0a0a)', border: `1px solid ${focused ? '#2a2a2a' : '#1a1a1a'}`,
            borderRadius: 14, overflow: 'hidden', marginBottom: 16, transition: 'border-color 0.2s',
          }}>
            <textarea
              value={input}
              onChange={e => { setInput(e.target.value); if (nudge) setNudge(false); }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
              placeholder=""
              rows={3}
              style={{
                width: '100%', background: 'transparent', border: 'none', outline: 'none',
                padding: '16px 18px 10px', color: '#e0e0e0',
                fontSize: 15, lineHeight: 1.7, resize: 'none', fontFamily: 'inherit',
              }}
            />
            {nudge && <p style={{ margin: '0 18px 10px', fontSize: 12, color: '#8B1E1E', fontStyle: 'italic' }}>This space is for what went wrong. Be honest.</p>}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 12px 10px' }}>
              <button onClick={handleSubmit} disabled={!input.trim() || posting} style={{
                padding: '6px 18px', borderRadius: 20,
                border: `1px solid ${input.trim() ? 'rgba(139,30,30,0.4)' : '#1a1a1a'}`,
                background: input.trim() ? 'rgba(139,30,30,0.12)' : 'transparent',
                color: input.trim() ? '#c45a5a' : '#2a2a2a',
                fontSize: 12, fontWeight: 700, cursor: input.trim() ? 'pointer' : 'default',
                transition: 'all 0.15s',
              }}>{posting ? '...' : 'Log it'}</button>
            </div>
          </div>
        </div>

        {/* Notes list — Samsung Notes style */}
        {loading ? (
          <p style={{ color: '#333', textAlign: 'center', marginTop: 40 }}>Loading...</p>
        ) : (filter === 'calendar' ? dayTruths : filteredTruths).length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 60, padding: '0 24px' }}>
            <p style={{ color: '#2a2a2a', fontSize: 14, fontStyle: 'italic', margin: 0 }}>"You can't fix what you can't face."</p>
            {filter === 'calendar' && isPast && (
              <p style={{ color: '#1a1a1a', fontSize: 11, margin: '12px 0 0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Nothing written on this day</p>
            )}
          </div>
        ) : (
          <div style={{ padding: '0 16px' }}>
            {(filter === 'calendar' ? dayTruths : filteredTruths).map(t => (
              <TruthCard key={t.id} t={t} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Info Modal */}
      {showInfo && (
        <>
          <style>{`
            @keyframes modal-in { 0%{opacity:0;transform:translate(-50%,-50%) scale(0.92)} 100%{opacity:1;transform:translate(-50%,-50%) scale(1)} }
            @keyframes modal-bg { 0%{opacity:0} 100%{opacity:1} }
            @keyframes line-draw { 0%{width:0} 100%{width:100%} }
            @keyframes word-fade { 0%{opacity:0;transform:translateY(6px)} 100%{opacity:1;transform:translateY(0)} }
            .modal-word-1 { animation: word-fade 0.4s ease-out 0.2s forwards; opacity: 0; }
            .modal-word-2 { animation: word-fade 0.4s ease-out 0.35s forwards; opacity: 0; }
            .modal-word-3 { animation: word-fade 0.4s ease-out 0.5s forwards; opacity: 0; }
            .modal-word-4 { animation: word-fade 0.4s ease-out 0.65s forwards; opacity: 0; }
            .modal-word-5 { animation: word-fade 0.4s ease-out 0.8s forwards; opacity: 0; }
          `}</style>
          <div onClick={() => { setShowInfo(false); localStorage.setItem('reckoning_intro_seen', '1'); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 200, backdropFilter: 'blur(8px)', animation: 'modal-bg 0.3s ease-out' }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            zIndex: 201, background: 'var(--bg-base, #0a0a0a)', border: '1px solid #1a1a1a',
            borderRadius: 24, padding: '0', width: '90%', maxWidth: 400, overflow: 'hidden',
            animation: 'modal-in 0.35s cubic-bezier(.34,1.56,.64,1)',
            boxShadow: '0 0 80px rgba(139,30,30,0.08), 0 0 0 1px rgba(139,30,30,0.1)',
          }}>
            {/* Red accent line at top */}
            <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #8B1E1E, transparent)', animation: 'line-draw 0.6s ease-out forwards' }} />

            {/* Icon */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 32 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, background: 'rgba(139,30,30,0.08)',
                border: '1px solid rgba(139,30,30,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B1E1E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
            </div>

            {/* Title */}
            <h3 style={{ fontSize: 22, fontWeight: 800, margin: '20px 0 0', letterSpacing: '-0.03em', textAlign: 'center', color: '#fff' }}>The Reckoning</h3>

            {/* Staggered word reveal */}
            <div style={{ padding: '24px 32px 0', textAlign: 'center' }}>
              <span className="modal-word-1" style={{ display: 'inline', fontSize: 14, color: '#888', lineHeight: 2 }}>No likes. </span>
              <span className="modal-word-2" style={{ display: 'inline', fontSize: 14, color: '#888', lineHeight: 2 }}>No audience. </span>
              <span className="modal-word-3" style={{ display: 'inline', fontSize: 14, color: '#888', lineHeight: 2 }}>No performance. </span>
              <span className="modal-word-4" style={{ display: 'inline', fontSize: 14, color: '#aaa', lineHeight: 2, fontWeight: 600 }}>Just you, being honest about your day. </span>
              <span className="modal-word-5" style={{ display: 'inline', fontSize: 14, color: '#666', lineHeight: 2 }}>The failures. The avoidance. The wasted hours. Write it down. Face it. Move forward.</span>
            </div>

            {/* Divider + quote */}
            <div style={{ margin: '28px 32px 0', borderTop: '1px solid #151515', paddingTop: 24, textAlign: 'center' }}>
              <p style={{ fontSize: 15, color: '#8B1E1E', margin: 0, fontStyle: 'italic', fontWeight: 500 }}>"You can't fix what you can't face."</p>
            </div>

            {/* Rules */}
            <div style={{ padding: '24px 32px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { icon: '🔒', text: 'Private — only you can see this' },
                { icon: '∞', text: 'Permanent — stays here forever' },
                { icon: '◎', text: 'Seal it — reflect and close the chapter' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--bg-card, #0f0f0f)', border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{r.icon}</div>
                  <span style={{ fontSize: 13, color: '#666' }}>{r.text}</span>
                </div>
              ))}
            </div>

            {/* Button */}
            <div style={{ padding: '28px 32px 32px' }}>
              <button onClick={() => { setShowInfo(false); localStorage.setItem('reckoning_intro_seen', '1'); }} style={{
                width: '100%', padding: '13px', background: '#111',
                border: '1px solid #222', borderRadius: 14, color: '#aaa',
                fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.borderColor = '#333'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#111'; e.currentTarget.style.borderColor = '#222'; }}>
                I understand
              </button>
            </div>
          </div>
        </>
      )}

    </AppShell>
  );
}
