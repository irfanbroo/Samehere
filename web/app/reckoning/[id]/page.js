'use client';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import AppShell from '@/components/AppShell';

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) +
    ' · ' + new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function daysOpen(createdAt) {
  const created = new Date(createdAt);
  const now = new Date();
  return Math.max(0, Math.floor((now - created) / (1000 * 60 * 60 * 24)));
}

const PROMPTS = [
  { key: 'caused',    icon: '⚡', label: 'What caused this?',           placeholder: 'Root cause...' },
  { key: 'did',       icon: '↗',  label: 'What did I do?',              placeholder: 'Action taken...' },
  { key: 'different', icon: '◎',  label: 'What changes next time?',     placeholder: 'Your commitment...' },
];

const SEAL_QUOTES = [
  '"Sit with it. Learn from it. Rise."',
  '"Catch it. Crack it. Close it."',
  '"He who conquers himself is the mightiest warrior." — Confucius',
  '"Admitting a fault is the first step to correcting it."',
  '"Growth begins where comfort ends."',
  '"You faced it. Most people never do."',
  '"The truth will set you free, but first it will make you uncomfortable."',
  '"Strength isn\'t avoiding the fall — it\'s getting back up."',
  '"You cannot change what you refuse to confront."',
  '"Owning your mistakes is not weakness. It\'s the beginning of strength."',
  '"Accountability is the highest form of self-respect."',
  '"Face it. Fix it. Forward."',
  '"Excuses explain. Reflection improves."',
  '"You already knew. Now you\'ve written it."',
  '"Every master was once a disaster."',
  '"Fall seven times. Get up eight." — Japanese proverb',
  '"Pain is temporary. What you learn from it is permanent."',
  '"Scars are proof you survived."',
  '"You lied to yourself today. This is where you stop."',
  '"Most people replay the mistake. You just wrote the lesson."',
  '"It happened. It hurt. It\'s handled."',
  '"Done. Filed. Never forgotten."',
  '"You looked it in the eye. Most never do."',
  '"The darkest ink makes the clearest lesson."',
  '"It happened. Now grow."',
];

function parseResolution(text) {
  try { const p = JSON.parse(text); if (p.caused !== undefined) return p; } catch {}
  return { caused: text || '', did: '', different: '' };
}

export default function TruthDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [truth, setTruth] = useState(null);
  const [allTruths, setAllTruths] = useState([]);
  const [answers, setAnswers] = useState({ caused: '', did: '', different: '' });
  const [editingRes, setEditingRes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSealed, setJustSealed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [sealStats, setSealStats] = useState(null); // { sealed, quote }
  const [sealPhase, setSealPhase] = useState(0); // 0=none, 1=flash, 2=stamp, 3=stats
  const [activePrompt, setActivePrompt] = useState(0); // progressive reveal index

  useEffect(() => {
    const user = getUser();
    if (!user) return router.push('/login');
    api.get('/truths').then(r => {
      const found = r.data.find(t => String(t.id) === String(id));
      if (!found) return router.push('/reckoning');
      setTruth(found);
      setAllTruths(r.data);
      if (found.resolution) setAnswers(parseResolution(found.resolution));
    });
  }, [id, router]);

  // Compute which prompts are revealed (progressive)
  // Manual progression — user clicks "Next →" to advance
  const [promptStep, setPromptStep] = useState(1); // 1, 2, or 3
  const revealedCount = useMemo(() => {
    if (!editingRes) return 3; // show all when viewing sealed
    return promptStep;
  }, [editingRes, promptStep]);

  // Progress ring value (0-3)
  const filledCount = useMemo(() => {
    let c = 0;
    if (answers.caused.trim()) c++;
    if (answers.did.trim()) c++;
    if (answers.different.trim()) c++;
    return c;
  }, [answers]);

  const days = truth ? daysOpen(truth.created_at) : 0;
  const isResolved = truth ? !!truth.resolution : false;

  // Pulse speed based on days open (faster = more urgent)
  const pulseSpeed = isResolved ? 0 : Math.max(0.8, 2.5 - (days * 0.3));

  function handleDelete() {
    router.replace('/reckoning');
    api.delete(`/truths/${id}`).catch(() => {});
  }

  async function unseal() {
    setSaving(true);
    try {
      await api.put(`/truths/${id}`, { resolution: null });
      setTruth(p => ({ ...p, resolution: null }));
      setAnswers({ caused: '', did: '', different: '' });
      setPromptStep(1);
    } catch {}
    finally { setSaving(false); }
  }

  async function saveResolution() {
    const hasAny = answers.caused.trim() || answers.did.trim() || answers.different.trim();
    if (!hasAny) return;
    setSaving(true);
    try {
      await api.put(`/truths/${id}`, { resolution: JSON.stringify(answers) });
      setTruth(p => ({ ...p, resolution: JSON.stringify(answers) }));
      setEditingRes(false);

      // Calculate seal stats
      const sealedCount = allTruths.filter(t => !!t.resolution).length + 1;
      const quote = SEAL_QUOTES[Math.floor(Math.random() * SEAL_QUOTES.length)];

      // Phase 1: Dim (0ms)
      setSealPhase(1);
      setJustSealed(true);

      // Phase 2: Checkmark + SEALED (300ms)
      setTimeout(() => setSealPhase(2), 300);

      // Phase 3: Stats (1800ms)
      setTimeout(() => {
        setSealPhase(3);
        setSealStats({ sealed: sealedCount, quote });
      }, 1800);

      // Done (4800ms)
      setTimeout(() => {
        setJustSealed(false);
        setSealPhase(0);
        setSealStats(null);
      }, 4800);
    } catch {}
    finally { setSaving(false); }
  }

  if (!truth) return <AppShell><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><p style={{ color: '#333' }}>Loading...</p></div></AppShell>;

  const hasAny = answers.caused.trim() || answers.did.trim() || answers.different.trim();

  // Day label
  const dayLabel = isResolved
    ? null
    : days === 0 ? 'Logged today' : days === 1 ? 'Open for 1 day' : `Open for ${days} days`;

  // Day urgency color (gets more intense over time)
  const dayColor = days <= 1 ? '#555' : days <= 3 ? '#8B1E1E' : days <= 7 ? '#c45a5a' : '#ef4444';

  return (
    <AppShell>
      <style>{`
        @keyframes seal { 0%{transform:scale(0.7);opacity:0} 70%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
        .seal-anim { animation: seal 0.4s cubic-bezier(.34,1.56,.64,1) forwards; }
        @keyframes pulse-red { 0%,100%{box-shadow:0 0 0 0 rgba(139,30,30,0)} 50%{box-shadow:0 0 0 4px rgba(139,30,30,0.15)} }
        @keyframes prompt-reveal { 0%{opacity:0;transform:translateY(12px);max-height:0} 100%{opacity:1;transform:translateY(0);max-height:200px} }
        .prompt-reveal { animation: prompt-reveal 0.35s ease-out forwards; }
        @keyframes vignette-pulse { 0%,100%{opacity:0.4} 50%{opacity:0.7} }

        /* ── Seal ceremony ── */
        @keyframes seal-dim { 0%{opacity:0} 100%{opacity:1} }
        @keyframes fade-up { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes fade-out { 0%{opacity:1} 100%{opacity:0} }
        @keyframes f-drop { 0%{transform:translateY(-60px);opacity:0} 70%{transform:translateY(4px)} 100%{transform:translateY(0);opacity:1} }
        @keyframes f-line { 0%{width:0} 100%{width:40px} }

        textarea::placeholder { color: #333; }
        textarea { caret-color: #888; }
      `}</style>

      {/* Red vignette for open truths */}
      {!isResolved && !justSealed && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: `radial-gradient(ellipse at center, transparent 50%, rgba(139,30,30,${Math.min(0.08 + days * 0.01, 0.18)}) 100%)`,
          animation: days > 2 ? `vignette-pulse ${Math.max(2, 5 - days * 0.5)}s ease-in-out infinite` : 'none',
        }} />
      )}

      {/* Green warmth for sealed truths */}
      {isResolved && !justSealed && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(ellipse at center, transparent 60%, rgba(34,197,94,0.03) 100%)',
        }} />
      )}

      {/* ── SEAL CEREMONY ── */}
      {sealPhase >= 1 && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, pointerEvents: 'none' }}>

          {/* Dim */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', animation: 'seal-dim 0.5s ease-out forwards' }} />

          {/* Phase 2: Gravity drop */}
          {sealPhase === 2 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'f-drop 0.5s cubic-bezier(.22,.68,.36,1) forwards' }}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16 }}>
                <div style={{ height: 1, background: 'linear-gradient(to right, transparent, #22c55e)', animation: 'f-line 0.4s ease-out 0.3s forwards', width: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#22c55e', letterSpacing: '0.25em', animation: 'fade-up 0.3s ease-out 0.3s forwards', opacity: 0, whiteSpace: 'nowrap' }}>SEALED</span>
                <div style={{ height: 1, background: 'linear-gradient(to left, transparent, #22c55e)', animation: 'f-line 0.4s ease-out 0.3s forwards', width: 0 }} />
              </div>
            </div>
          )}

          {/* Phase 3: Stats */}
          {sealPhase === 3 && sealStats && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'fade-out 0.6s ease-out 2.5s forwards' }}>
              <p style={{ fontSize: 48, margin: 0, fontWeight: 800, color: '#fff', lineHeight: 1, animation: 'fade-up 0.5s ease-out forwards' }}>{sealStats.sealed}</p>
              <p style={{ fontSize: 11, color: 'var(--secondary-text-color, #9CA3AF)', margin: '10px 0 0', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', animation: 'fade-up 0.5s ease-out 0.15s forwards', opacity: 0 }}>
                truth{sealStats.sealed !== 1 ? 's' : ''} sealed
              </p>
              <div style={{ width: 1, height: 28, background: '#333', margin: '24px 0', animation: 'fade-up 0.4s ease-out 0.35s forwards', opacity: 0 }} />
              <p style={{ fontSize: 16, color: '#999', margin: 0, fontStyle: 'italic', lineHeight: 1.8, textAlign: 'center', maxWidth: 300, padding: '0 20px', fontWeight: 400, animation: 'fade-up 0.5s ease-out 0.5s forwards', opacity: 0 }}>
                {sealStats.quote}
              </p>
            </div>
          )}
        </div>
      )}

      <div style={{ width: '100%', maxWidth: 560, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', position: 'sticky', top: 0, background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)', zIndex: 10, borderBottom: '1px solid #111' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--secondary-text-color, #9CA3AF)', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          {isResolved && (
            <div className={justSealed ? 'seal-anim' : ''} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 20, padding: '4px 12px' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>Sealed</span>
            </div>
          )}
          {!isResolved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 10, color: '#8B1E1E', fontWeight: 600, opacity: 0.7 }}>Open</div>
              {dayLabel && (
                <div style={{ fontSize: 10, color: dayColor, fontWeight: 600, opacity: 0.9 }}>
                  · {dayLabel}
                </div>
              )}
            </div>
          )}
          {confirmDelete ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setConfirmDelete(false)} style={{ background: 'none', border: 'none', color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 12, cursor: 'pointer', padding: '4px 8px' }}>Cancel</button>
              <button onClick={handleDelete} style={{ background: 'rgba(139,30,30,0.15)', border: '1px solid rgba(139,30,30,0.3)', borderRadius: 8, color: '#c45a5a', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '4px 10px' }}>Delete</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} style={{ background: 'none', border: 'none', color: '#2a2a2a', cursor: 'pointer', padding: 4, display: 'flex' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          )}
        </div>

        {/* Main content — Timeline layout */}
        <div style={{ padding: '24px 16px 80px', display: 'flex' }}>

          {/* Timeline rail */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 18, flexShrink: 0, width: 14 }}>
            {/* Red dot — pulses faster based on days open */}
            <div style={{
              width: 14, height: 14, borderRadius: '50%', background: 'var(--bg-base, #0a0a0a)',
              border: `2px solid ${isResolved ? '#444' : '#8B1E1E'}`,
              flexShrink: 0, transition: 'border-color 0.6s',
              ...(!isResolved ? {
                animation: `pulse-red ${pulseSpeed}s ease-in-out infinite`,
              } : {}),
            }} />
            {/* Line */}
            <div style={{ flex: 1, width: 2, borderRadius: 1, background: isResolved ? 'linear-gradient(to bottom, #44444488, #22c55e44)' : 'linear-gradient(to bottom, #8B1E1E44, #1a1a1a)', minHeight: 50, transition: 'background 0.6s' }} />
            {/* Green dot — only when resolved or editing */}
            {(isResolved || editingRes) && (
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--bg-base, #0a0a0a)', border: `2px solid ${isResolved ? '#22c55e' : '#333'}`, flexShrink: 0, transition: 'border-color 0.6s' }} />
            )}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Truth section */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, color: 'var(--secondary-text-color, #9CA3AF)' }}>{formatDate(truth.created_at)}</p>
              {/* Day counter badge for open truths */}
              {!isResolved && days > 0 && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: `rgba(139,30,30,${Math.min(0.06 + days * 0.02, 0.15)})`,
                  border: `1px solid rgba(139,30,30,${Math.min(0.1 + days * 0.03, 0.3)})`,
                  borderRadius: 20, padding: '3px 12px', marginBottom: 10,
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%', background: dayColor,
                    animation: days > 3 ? `pulse-red ${pulseSpeed}s ease-in-out infinite` : 'none',
                  }} />
                  <span style={{ fontSize: 11, color: dayColor, fontWeight: 600 }}>
                    {days === 1 ? '1 day unresolved' : `${days} days unresolved`}
                  </span>
                </div>
              )}
              <p style={{ margin: 0, fontSize: 18, color: '#fff', lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word', fontWeight: 400 }}>
                {truth.content}
              </p>
            </div>

            {/* Reflection section */}
            {isResolved && !editingRes ? (
              <div style={{ background: 'rgba(34,197,94,0.03)', border: '1px solid rgba(34,197,94,0.08)', borderRadius: 16, padding: '18px 20px' }}>
                {PROMPTS.map(p => {
                  const val = answers[p.key];
                  if (!val) return null;
                  return (
                    <div key={p.key} style={{ marginBottom: 18 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 13, opacity: 0.5 }}>{p.icon}</span>
                        <span style={{ fontSize: 12, color: '#4a7a4a', fontWeight: 700 }}>{p.label}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 15, color: '#8ab88a', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{val}</p>
                    </div>
                  );
                })}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  {!showActions ? (
                    <button onClick={() => setShowActions(true)} style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', padding: 6, display: 'flex' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => { setEditingRes(true); setPromptStep(3); setShowActions(false); }} style={{
                        padding: '8px 14px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)',
                        borderRadius: 10, color: '#4a7a4a', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}>Edit</button>
                      <button onClick={() => { unseal(); setShowActions(false); }} disabled={saving} style={{
                        padding: '8px 14px', background: 'rgba(139,30,30,0.06)', border: '1px solid rgba(139,30,30,0.12)',
                        borderRadius: 10, color: '#8B1E1E', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}>{saving ? '...' : 'Unseal'}</button>
                      <button onClick={() => setShowActions(false)} style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', padding: 4, fontSize: 14 }}>×</button>
                    </div>
                  )}
                </div>
              </div>
            ) : !editingRes ? (
              <button onClick={() => { setEditingRes(true); setPromptStep(1); }} style={{
                width: '100%', padding: '20px', background: 'var(--bg-card, #0c0c0c)',
                border: '1px solid #1e1e1e', borderRadius: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s',
                boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.2)'; }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#111', border: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18, color: '#666' }}>↳</div>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, color: '#ddd', fontWeight: 700 }}>Close this chapter</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>What caused it · What you did · What changes</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            ) : (
              <div style={{ background: 'var(--bg-card, #0c0c0c)', border: '1px solid #1e1e1e', borderRadius: 16, overflow: 'hidden' }}>

                {/* Progress ring header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px 10px' }}>
                  {/* Mini progress ring */}
                  <svg width="28" height="28" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#1a1a1a" strokeWidth="3" />
                    <circle cx="18" cy="18" r="14" fill="none"
                      stroke={filledCount === 3 ? '#22c55e' : '#555'}
                      strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={`${(filledCount / 3) * 88} 88`}
                      transform="rotate(-90 18 18)"
                      style={{ transition: 'stroke-dasharray 0.4s ease, stroke 0.4s ease' }}
                    />
                    <text x="18" y="18" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 11, fontWeight: 700, fill: filledCount === 3 ? '#22c55e' : '#666' }}>
                      {filledCount}/3
                    </text>
                  </svg>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, color: '#fff', fontWeight: 700 }}>Reflect & close</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#777' }}>
                      {promptStep === 1 ? 'Start with what caused it' : promptStep === 2 ? 'Good — now what did you do?' : filledCount === 3 ? 'Ready to seal' : 'Last one — what changes?'}
                    </p>
                  </div>
                </div>

                {/* Progressive prompts */}
                {PROMPTS.map((p, i) => {
                  if (i >= revealedCount) return null;
                  const isNew = i === revealedCount - 1 && i > 0 && !answers[PROMPTS[i].key].trim();
                  return (
                    <div key={p.key} className={isNew ? 'prompt-reveal' : ''} style={{ borderTop: '1px solid #141414' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px 6px' }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: 8,
                          background: answers[p.key].trim() ? 'rgba(34,197,94,0.08)' : '#111',
                          border: `1px solid ${answers[p.key].trim() ? 'rgba(34,197,94,0.2)' : '#1e1e1e'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0,
                          transition: 'all 0.3s',
                        }}>
                          {answers[p.key].trim() ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          ) : p.icon}
                        </div>
                        <span style={{ fontSize: 12, color: answers[p.key].trim() ? '#4a7a4a' : '#777', fontWeight: 700, transition: 'color 0.3s' }}>{p.label}</span>
                        {/* Step indicator */}
                        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#333', fontWeight: 600 }}>{i + 1}/3</span>
                      </div>
                      <textarea value={answers[p.key]} onChange={e => setAnswers(prev => ({ ...prev, [p.key]: e.target.value }))}
                        placeholder={p.placeholder} rows={2} autoFocus={i === 0 || isNew}
                        style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#ddd', padding: '6px 18px 14px', fontSize: 15, fontFamily: 'inherit', resize: 'none', lineHeight: 1.7 }} />
                    </div>
                  );
                })}

                {/* Locked prompts preview (greyed out) */}
                {revealedCount < 3 && (
                  <div style={{ borderTop: '1px solid #111', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, opacity: 0.25 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--bg-base, #0a0a0a)', border: '1px solid #151515', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#333' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <span style={{ fontSize: 11, color: '#333', fontWeight: 600 }}>
                      {revealedCount === 1 ? '2 more steps' : '1 more step'}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, padding: '14px 16px', borderTop: '1px solid #141414' }}>
                  {revealedCount < 3 ? (
                    /* "Next" button — advances to next prompt */
                    <button onClick={() => {
                      const currentKey = PROMPTS[revealedCount - 1].key;
                      if (!answers[currentKey].trim()) return; // must write something first
                      setPromptStep(prev => Math.min(prev + 1, 3));
                    }} disabled={!answers[PROMPTS[revealedCount - 1].key].trim()} style={{
                      flex: 1, padding: '12px', borderRadius: 12, border: 'none',
                      background: answers[PROMPTS[revealedCount - 1].key].trim() ? '#fff' : '#111',
                      color: answers[PROMPTS[revealedCount - 1].key].trim() ? '#000' : '#333',
                      fontSize: 13, fontWeight: 700, cursor: answers[PROMPTS[revealedCount - 1].key].trim() ? 'pointer' : 'default', transition: 'all 0.2s',
                    }}>Next →</button>
                  ) : (
                    /* "Seal" button — only when all 3 prompts are visible */
                    <button onClick={saveResolution} disabled={saving || !hasAny} style={{
                      flex: 1, padding: '12px', borderRadius: 12, border: 'none',
                      background: hasAny ? '#fff' : '#111', color: hasAny ? '#000' : '#333',
                      fontSize: 13, fontWeight: 700, cursor: hasAny ? 'pointer' : 'default', transition: 'all 0.2s',
                    }}>{saving ? '...' : 'Seal & close'}</button>
                  )}
                  <button onClick={() => { setEditingRes(false); setPromptStep(1); if (truth.resolution) setAnswers(parseResolution(truth.resolution)); }} style={{
                    padding: '12px 18px', background: 'none', border: '1px solid #1e1e1e', borderRadius: 12, color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 13, cursor: 'pointer',
                  }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
