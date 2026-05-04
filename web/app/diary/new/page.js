'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';

const MOODS = [
  { value: 'great',      label: 'Great',      emoji: '😄', color: '#22c55e' },
  { value: 'good',       label: 'Good',        emoji: '🙂', color: '#86efac' },
  { value: 'okay',       label: 'Okay',        emoji: '😐', color: '#facc15' },
  { value: 'reflective', label: 'Reflective',  emoji: '🤔', color: '#a78bfa' },
  { value: 'tired',      label: 'Tired',       emoji: '😴', color: '#94a3b8' },
  { value: 'rough',      label: 'Rough',       emoji: '😔', color: '#f87171' },
];
const MOOD_MAP = Object.fromEntries(MOODS.map(m => [m.value, m]));

function fmtDate() {
  const d = new Date();
  const day = d.getDate();
  const mon = d.toLocaleString('en-US', { month: 'short' });
  const year = d.getFullYear();
  return { day, mon, year };
}

export default function NewDiaryPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [saving, setSaving] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const { day, mon, year } = fmtDate();
  const mobj = mood ? MOOD_MAP[mood] : null;

  async function handleSave() {
    if (!content.trim()) return;
    const user = getUser();
    if (!user) return router.push('/login');
    setSaving(true);
    try {
      const res = await api.post('/diary', {
        title: title.trim() || null,
        mood: mood || null,
        content: content.trim(),
      });
      router.push(`/diary/${res.data.id}`);
    } catch {
      setSaving(false);
    }
  }

  return (
    <div style={{ background:'var(--bg-base,#080808)', minHeight:'100vh', display:'flex', flexDirection:'column', maxWidth:560, margin:'0 auto' }}>
      <style>{`
        * { box-sizing: border-box; }
        .title-input::placeholder { color: #252525; }
        .content-area::placeholder { color: #1e1e1e; }
        .title-input { caret-color: #7c9cf8; }
        .content-area { caret-color: #7c9cf8; }
        @keyframes mood-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .mood-row { animation: mood-in 0.2s ease-out both; }
      `}</style>

      {/* ── TOP BAR ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'52px 20px 0', flexShrink:0 }}>
        <button onClick={() => router.push('/diary')} style={{ background:'none', border:'none', color:'#555', cursor:'pointer', padding:4, display:'flex', transition:'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color='#ccc'} onMouseLeave={e => e.currentTarget.style.color='#555'}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* Mood toggle */}
          <button onClick={() => setShowMoodPicker(p => !p)} style={{
            background: mobj ? `${mobj.color}15` : '#111',
            border: `1px solid ${mobj ? mobj.color + '30' : '#1e1e1e'}`,
            borderRadius:10, padding:'6px 12px', cursor:'pointer',
            fontSize:13, display:'flex', alignItems:'center', gap:6,
            color: mobj ? mobj.color : '#555', fontWeight:600, transition:'all 0.15s',
          }}>
            <span style={{ fontSize:18 }}>{mobj ? mobj.emoji : '🙂'}</span>
            <span style={{ fontSize:11 }}>{mobj ? mobj.label : 'Mood'}</span>
          </button>

          {/* Save */}
          <button onClick={handleSave} disabled={!content.trim() || saving} style={{
            padding:'9px 22px', borderRadius:12, fontSize:13, fontWeight:800,
            background: content.trim() ? '#fff' : '#111',
            border: `1px solid ${content.trim() ? 'transparent' : '#1e1e1e'}`,
            color: content.trim() ? '#000' : '#333',
            cursor: content.trim() ? 'pointer' : 'default',
            transition:'all 0.15s', letterSpacing:'0.02em',
          }}>
            {saving ? '...' : 'SAVE'}
          </button>
        </div>
      </div>

      {/* ── DATE ROW ── */}
      <div style={{ padding:'24px 22px 0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
          <span style={{ fontSize:42, fontWeight:900, letterSpacing:'-0.04em', color:'#fff', lineHeight:1, fontStyle:'italic' }}>{day}</span>
          <span style={{ fontSize:16, fontWeight:600, color:'#444' }}>{mon}</span>
          <span style={{ fontSize:13, color:'#2e2e2e' }}>{year}</span>
        </div>
        {mobj && <span style={{ fontSize:36 }}>{mobj.emoji}</span>}
      </div>

      {/* ── MOOD PICKER (dropdown) ── */}
      {showMoodPicker && (
        <div className="mood-row" style={{ display:'flex', gap:8, padding:'14px 22px 0', flexWrap:'wrap' }}>
          {MOODS.map(m => (
            <button key={m.value} onClick={() => { setMood(mood === m.value ? '' : m.value); setShowMoodPicker(false); }} style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'7px 14px', borderRadius:20, cursor:'pointer', transition:'all 0.15s',
              border: `1px solid ${mood === m.value ? m.color + '50' : '#1e1e1e'}`,
              background: mood === m.value ? `${m.color}12` : 'transparent',
              color: mood === m.value ? m.color : '#444',
              fontSize:12, fontWeight:700,
            }}>
              <span style={{ fontSize:16 }}>{m.emoji}</span>
              {m.label}
            </button>
          ))}
        </div>
      )}

      {/* ── WRITING AREA ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'20px 22px 0', minHeight:0 }}>
        <input
          className="title-input"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title"
          autoFocus
          style={{
            background:'transparent', border:'none', outline:'none',
            fontSize:26, fontWeight:800, color:'#e0e0e0',
            fontFamily:'inherit', width:'100%', marginBottom:16,
            letterSpacing:'-0.02em',
          }}
        />
        <textarea
          className="content-area"
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave(); }}
          placeholder="Write more here..."
          style={{
            background:'transparent', border:'none', outline:'none',
            fontSize:16, color:'#888', lineHeight:1.85,
            fontFamily:'inherit', width:'100%', resize:'none',
            flex:1, minHeight:300,
          }}
        />
      </div>

      {/* ── WORD COUNT ── */}
      <div style={{ padding:'12px 22px 32px', flexShrink:0 }}>
        <span style={{ fontSize:11, color:'#222', fontWeight:600 }}>
          {content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0} words
        </span>
      </div>
    </div>
  );
}
