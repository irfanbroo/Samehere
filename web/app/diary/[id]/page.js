'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import AppShell from '@/components/AppShell';

const MOODS = [
  { value: 'great',      label: 'Great',      emoji: '😄', color: '#22c55e' },
  { value: 'good',       label: 'Good',        emoji: '🙂', color: '#86efac' },
  { value: 'okay',       label: 'Okay',        emoji: '😐', color: '#facc15' },
  { value: 'reflective', label: 'Reflective',  emoji: '🤔', color: '#a78bfa' },
  { value: 'tired',      label: 'Tired',       emoji: '😴', color: '#94a3b8' },
  { value: 'rough',      label: 'Rough',       emoji: '😔', color: '#f87171' },
];
const MOOD_MAP = Object.fromEntries(MOODS.map(m => [m.value, m]));

function wordCount(text) { return text.trim().split(/\s+/).filter(Boolean).length; }
function wasEdited(e) { return Math.abs(new Date(e.updated_at) - new Date(e.created_at)) > 5000; }

export default function DiaryEntryPage() {
  const router = useRouter();
  const { id } = useParams();
  const [entry, setEntry] = useState(null);
  const [allEntries, setAllEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editMood, setEditMood] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (!user) return router.push('/login');
    Promise.all([
      api.get(`/diary/${id}`),
      api.get('/diary'),
    ]).then(([entryRes, allRes]) => {
      setEntry(entryRes.data);
      setAllEntries(allRes.data);
    }).catch(() => router.push('/diary')).finally(() => setLoading(false));
  }, [id, router]);

  function startEdit() {
    setEditTitle(entry.title || '');
    setEditMood(entry.mood || '');
    setEditContent(entry.content);
    setEditing(true);
  }

  async function saveEdit() {
    if (!editContent.trim()) return;
    setSaving(true);
    try {
      const res = await api.put(`/diary/${id}`, {
        title: editTitle.trim() || null,
        mood: editMood || null,
        content: editContent.trim(),
      });
      setEntry(res.data);
      setEditing(false);
    } catch {} finally { setSaving(false); }
  }

  async function handleDelete() {
    try {
      await api.delete(`/diary/${id}`);
      router.push('/diary');
    } catch {}
  }

  // Prev / Next in sorted list
  const sortedIds = allEntries.map(e => String(e.id));
  const idx = sortedIds.indexOf(String(id));
  const prevId = idx < sortedIds.length - 1 ? sortedIds[idx + 1] : null;
  const nextId = idx > 0 ? sortedIds[idx - 1] : null;

  if (loading) return (
    <AppShell>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
        <p style={{ color:'#333', fontSize:13 }}>Loading...</p>
      </div>
    </AppShell>
  );

  if (!entry) return null;

  const mobj = entry.mood ? MOOD_MAP[entry.mood] : null;
  const d = new Date(entry.created_at);
  const day = d.getDate();
  const mon = d.toLocaleString('en-US', { month: 'short' });
  const year = d.getFullYear();
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const wc = wordCount(entry.content);
  const edited = wasEdited(entry);

  return (
    <AppShell>
      <style>{`
        @keyframes fade-up { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .mood-sel { transition:all 0.15s; }
        .mood-sel:hover { opacity:1 !important; transform:scale(1.1) !important; }
        textarea::placeholder { color:#252525; }
        textarea { caret-color:#7c9cf8; }
      `}</style>

      <div style={{ width:'100%', maxWidth:560, margin:'0 auto', paddingBottom:100 }}>

        {/* ── TOP BAR ── */}
        <div style={{ padding:'52px 20px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <button onClick={() => router.push('/diary')} style={{ background:'none', border:'none', color:'var(--secondary-text-color,#9CA3AF)', cursor:'pointer', padding:0, display:'flex' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>

          <div style={{ display:'flex', gap:10 }}>
            {!editing && (
              <button onClick={startEdit} style={{ background:'none', border:'none', color:'#555', cursor:'pointer', padding:4, display:'flex', transition:'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color='#ccc'} onMouseLeave={e => e.currentTarget.style.color='#555'}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            )}
            <button onClick={() => setShowDelete(true)} style={{ background:'none', border:'none', color:'#555', cursor:'pointer', padding:4, display:'flex', transition:'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color='#ff4d4d'} onMouseLeave={e => e.currentTarget.style.color='#555'}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── DATE + MOOD ROW ── */}
        <div style={{ padding:'28px 22px 0', display:'flex', alignItems:'flex-end', justifyContent:'space-between', animation:'fade-up 0.3s ease-out both' }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
            <span style={{ fontSize:52, fontWeight:900, letterSpacing:'-0.04em', color:'#fff', lineHeight:1 }}>{day}</span>
            <div>
              <span style={{ fontSize:18, fontWeight:700, color:'#555' }}>{mon}</span>
              <span style={{ fontSize:14, color:'#333', marginLeft:6 }}>{year}</span>
            </div>
          </div>
          {mobj && <span style={{ fontSize:38 }}>{mobj.emoji}</span>}
        </div>

        {/* ── CONTENT ── */}
        {!editing ? (
          <div style={{ padding:'24px 22px 0', animation:'fade-up 0.3s ease-out 0.05s both' }}>
            {entry.title && (
              <h2 style={{ fontSize:22, fontWeight:800, color:'#fff', margin:'0 0 14px', letterSpacing:'-0.02em', lineHeight:1.2 }}>{entry.title}</h2>
            )}
            <p style={{ fontSize:15, color:'#888', lineHeight:1.8, margin:0, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{entry.content}</p>

            {/* Meta row */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:24, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, color:'#2a2a2a' }}>{time}</span>
              <span style={{ fontSize:11, color:'#1e1e1e' }}>·</span>
              <span style={{ fontSize:11, color:'#2a2a2a' }}>{wc} words</span>
              {mobj && (
                <span style={{ fontSize:10, fontWeight:700, padding:'2px 9px', borderRadius:20, background:`${mobj.color}10`, color:mobj.color, border:`1px solid ${mobj.color}20` }}>{mobj.label}</span>
              )}
              {edited && (
                <span style={{ fontSize:10, color:'#252525', display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ width:4, height:4, borderRadius:'50%', background:'#252525', display:'inline-block' }}/>
                  edited
                </span>
              )}
            </div>
          </div>
        ) : (
          /* ── EDIT MODE ── */
          <div style={{ padding:'24px 22px 0', animation:'fade-up 0.2s ease-out both' }}>
            <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title (optional)"
              style={{ width:'100%', background:'transparent', border:'none', borderBottom:'1px solid #222', outline:'none', padding:'0 0 12px', color:'#fff', fontSize:20, fontWeight:800, fontFamily:'inherit', marginBottom:20, boxSizing:'border-box' }} />
            <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={10}
              style={{ width:'100%', background:'transparent', border:'none', outline:'none', color:'#aaa', fontSize:15, lineHeight:1.8, resize:'none', fontFamily:'inherit', boxSizing:'border-box', display:'block', whiteSpace:'pre-wrap', wordBreak:'break-word' }} />

            {/* Mood picker */}
            <div style={{ display:'flex', gap:6, marginTop:16 }}>
              {MOODS.map(m => (
                <button key={m.value} className="mood-sel" onClick={() => setEditMood(editMood === m.value ? '' : m.value)} style={{
                  width:36, height:36, borderRadius:10, border:`1px solid ${editMood === m.value ? '#333' : '#1a1a1a'}`,
                  background: editMood === m.value ? '#1e1e1e' : 'transparent',
                  cursor:'pointer', fontSize:18, opacity: editMood && editMood !== m.value ? 0.25 : 1,
                  transform: editMood === m.value ? 'scale(1.12)' : 'scale(1)',
                }} title={m.label}>{m.emoji}</button>
              ))}
            </div>

            {/* Save / Cancel */}
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button onClick={() => setEditing(false)} style={{ flex:1, padding:'12px', borderRadius:14, background:'transparent', border:'1px solid #222', color:'#555', fontSize:13, fontWeight:700, cursor:'pointer' }}>Cancel</button>
              <button onClick={saveEdit} disabled={!editContent.trim() || saving} style={{ flex:2, padding:'12px', borderRadius:14, background:'rgba(79,110,245,0.12)', border:'1px solid rgba(79,110,245,0.3)', color:'#7c9cf8', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── PREV / NEXT BAR ── */}
      <div style={{
        position:'fixed', bottom:0, left:0, right:0, maxWidth:560, margin:'0 auto',
        height:60, background:'var(--bg-base,#0a0a0a)', borderTop:'1px solid #141414',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 16px', zIndex:90,
      }}>
        <button onClick={() => prevId && router.push(`/diary/${prevId}`)} disabled={!prevId} style={{
          display:'flex', alignItems:'center', gap:6, background:'none', border:'none',
          color: prevId ? '#555' : '#222', cursor: prevId ? 'pointer' : 'default',
          fontSize:13, fontWeight:600, transition:'color 0.15s', padding:'8px 12px', borderRadius:10,
        }}
        onMouseEnter={e => { if (prevId) e.currentTarget.style.color='#ccc'; }}
        onMouseLeave={e => { if (prevId) e.currentTarget.style.color='#555'; }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Previous
        </button>

        <button onClick={() => router.push('/diary')} style={{ background:'none', border:'none', color:'#333', cursor:'pointer', fontSize:11, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase' }}>
          All entries
        </button>

        <button onClick={() => nextId && router.push(`/diary/${nextId}`)} disabled={!nextId} style={{
          display:'flex', alignItems:'center', gap:6, background:'none', border:'none',
          color: nextId ? '#555' : '#222', cursor: nextId ? 'pointer' : 'default',
          fontSize:13, fontWeight:600, transition:'color 0.15s', padding:'8px 12px', borderRadius:10,
        }}
        onMouseEnter={e => { if (nextId) e.currentTarget.style.color='#ccc'; }}
        onMouseLeave={e => { if (nextId) e.currentTarget.style.color='#555'; }}>
          Next
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      {/* ── DELETE CONFIRM ── */}
      {showDelete && (
        <>
          <div onClick={() => setShowDelete(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(8px)', zIndex:200 }}/>
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:201, background:'#0e0e0e', border:'1px solid #222', borderRadius:20, padding:'28px 24px', width:'88%', maxWidth:340 }}>
            <h3 style={{ fontSize:17, fontWeight:800, margin:'0 0 8px', color:'#fff' }}>Delete entry?</h3>
            <p style={{ fontSize:13, color:'#555', margin:'0 0 24px', lineHeight:1.5 }}>This entry will be permanently removed.</p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setShowDelete(false)} style={{ flex:1, padding:'11px', borderRadius:12, background:'transparent', border:'1px solid #222', color:'#555', fontSize:13, fontWeight:700, cursor:'pointer' }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex:1, padding:'11px', borderRadius:12, background:'rgba(255,77,77,0.12)', border:'1px solid rgba(255,77,77,0.25)', color:'#ff4d4d', fontSize:13, fontWeight:700, cursor:'pointer' }}>Delete</button>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
