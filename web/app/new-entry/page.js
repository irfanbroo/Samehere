'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import AppShell from '@/components/AppShell';

const MOODS = [
  { label: 'grinding',   emoji: '🔥', color: '#f59e0b' },
  { label: 'frustrated', emoji: '😤', color: '#ef4444' },
  { label: 'chill',      emoji: '😌', color: '#22d3ee' },
  { label: 'focused',    emoji: '🧠', color: '#a78bfa' },
  { label: 'tired',      emoji: '😴', color: '#6b7280' },
  { label: 'motivated',  emoji: '💪', color: '#22c55e' },
  { label: 'productive', emoji: '🎯', color: '#3b82f6' },
];

const TAGS = ['#study', '#gym', '#coding', '#work', '#art', '#music', '#gaming', '#nocturnal', '#grind', '#reading', '#cooking', '#fitness', '#sleep', '#earlybird', '#introverted', '#extroverted', '#traveler', '#selfcare', '#sports', '#content', '#poetry', '#drawing', '#photography', '#writing', '#anime', '#foodie', '#linux', '#student', '#college', '#highschool', '#parenting', '#nightowl'];

const cardVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] } }),
};

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v2M12 19v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M3 12h2M19 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
  );
}

function NewEntryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [tags, setTags] = useState([]);
  const [fromTasks, setFromTasks] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null); // { mood, tags, summary }
  const [aiApplied, setAiApplied] = useState(false);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    const tasks = searchParams.get('tasks');
    if (tasks) {
      setContent(decodeURIComponent(tasks));
      setFromTasks(true);
    }
  }, [searchParams]);

  useEffect(() => { setCharCount(content.length); }, [content]);

  function toggleTag(tag) {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  async function handleAISuggest() {
    if (content.trim().length < 20) return;
    setAiLoading(true);
    setAiSuggestion(null);
    setAiApplied(false);
    try {
      const res = await fetch('/api/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.mood || data.tags?.length) {
        setAiSuggestion(data);
      }
    } catch {}
    finally { setAiLoading(false); }
  }

  function applyAiSuggestion() {
    if (!aiSuggestion) return;
    if (aiSuggestion.mood) setMood(aiSuggestion.mood);
    if (aiSuggestion.tags?.length) setTags(aiSuggestion.tags);
    setAiApplied(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      await api.post('/entries', { content, mood, tags });
      router.push('/feed');
    } catch {
      alert('Failed to post');
    } finally {
      setLoading(false);
    }
  }

  const selectedMoodObj = MOODS.find(m => m.label === mood);

  return (
    <AppShell>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .ai-shimmer {
          background: linear-gradient(90deg, #7c3aed, #a78bfa, #c4b5fd, #a78bfa, #7c3aed);
          background-size: 200% auto;
          animation: shimmer 2s linear infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .ne-textarea:focus {
          border-color: rgba(124,58,237,0.5) !important;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.08) !important;
        }
        .ne-textarea::placeholder { color: #334155; }
      `}</style>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '28px 16px 48px', width: '100%' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          style={{ marginBottom: 28 }}>
          {fromTasks && (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', marginBottom: 18, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 12 }}>
              <span>🎉</span>
              <span style={{ color: '#22c55e', fontSize: 13, fontWeight: 600 }}>All tasks done! Reflect on your day.</span>
            </motion.div>
          )}
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#334155', marginBottom: 6 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', margin: 0, color: '#e2e8f0', lineHeight: 1.15 }}>
            How was your day?
          </h1>
        </motion.div>

        <form onSubmit={handleSubmit}>

          {/* Textarea */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.4 }}
            style={{ marginBottom: 12, position: 'relative' }}>
            <textarea
              className="ne-textarea"
              style={{
                width: '100%', minHeight: 200, background: '#0d0d14', color: '#e2e8f0',
                border: `1px solid ${mood ? `${selectedMoodObj?.color || 'rgba(124,58,237,0.2)'}30` : 'rgba(124,58,237,0.15)'}`,
                borderRadius: 16, padding: '16px 16px 40px', boxSizing: 'border-box',
                fontSize: 15, lineHeight: 1.75, resize: 'vertical', fontFamily: 'inherit',
                outline: 'none', transition: 'border-color 0.25s, box-shadow 0.25s',
              }}
              placeholder="Write about your day — what you did, how it went, what you're thinking..."
              value={content}
              onChange={e => setContent(e.target.value)}
              required
            />
            {/* char count */}
            <span style={{ position: 'absolute', bottom: 12, right: 14, fontSize: 11, color: '#334155', fontVariantNumeric: 'tabular-nums' }}>
              {charCount}
            </span>
          </motion.div>

          {/* AI Suggest button */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.4 }}
            style={{ marginBottom: 24 }}>
            <motion.button
              type="button"
              onClick={handleAISuggest}
              disabled={aiLoading || content.trim().length < 20}
              whileHover={{ scale: content.trim().length >= 20 ? 1.02 : 1 }}
              whileTap={{ scale: content.trim().length >= 20 ? 0.97 : 1 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 18px',
                background: 'rgba(124,58,237,0.08)',
                border: '1px solid rgba(124,58,237,0.25)',
                borderRadius: 24, cursor: content.trim().length >= 20 ? 'pointer' : 'not-allowed',
                opacity: content.trim().length >= 20 ? 1 : 0.4,
                transition: 'all 0.2s', fontFamily: 'inherit',
              }}
            >
              {aiLoading ? (
                <>
                  <div style={{ width: 14, height: 14, border: '2px solid rgba(167,139,250,0.3)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                  <span className="ai-shimmer" style={{ fontSize: 13, fontWeight: 600 }}>Analysing your day…</span>
                </>
              ) : (
                <>
                  <span style={{ color: '#a78bfa', display: 'flex' }}><SparkleIcon /></span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>AI Suggest mood & tags</span>
                  <span style={{ fontSize: 11, color: '#4b3a6e', marginLeft: 2 }}>via Groq</span>
                </>
              )}
            </motion.button>

            {/* AI suggestion result card */}
            <AnimatePresence>
              {aiSuggestion && !aiApplied && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                  style={{
                    marginTop: 12, padding: '14px 16px',
                    background: '#0d0d14',
                    border: '1px solid rgba(124,58,237,0.25)',
                    borderRadius: 14, position: 'relative', overflow: 'hidden',
                  }}
                >
                  {/* top accent */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.6), transparent)' }} />

                  {aiSuggestion.summary && (
                    <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 10px', lineHeight: 1.5, fontStyle: 'italic' }}>
                      "{aiSuggestion.summary}"
                    </p>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {aiSuggestion.mood && (() => {
                      const m = MOODS.find(x => x.label === aiSuggestion.mood);
                      return (
                        <span style={{ background: `${m?.color || '#7c3aed'}15`, color: m?.color || '#a78bfa', border: `1px solid ${m?.color || '#7c3aed'}30`, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                          {m?.emoji} {aiSuggestion.mood}
                        </span>
                      );
                    })()}
                    {aiSuggestion.tags?.map(t => (
                      <span key={t} style={{ background: 'rgba(124,58,237,0.08)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 20, padding: '3px 9px', fontSize: 12, fontWeight: 500 }}>{t}</span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <motion.button type="button" onClick={applyAiSuggestion} whileTap={{ scale: 0.96 }}
                      style={{ padding: '7px 16px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'none', borderRadius: 20, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 12px rgba(109,40,217,0.3)' }}>
                      Apply suggestions
                    </motion.button>
                    <motion.button type="button" onClick={() => setAiSuggestion(null)} whileTap={{ scale: 0.96 }}
                      style={{ padding: '7px 14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, color: '#475569', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                      Dismiss
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {aiApplied && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ color: '#22c55e', fontSize: 12 }}>✓</span>
                  <span style={{ color: '#22c55e', fontSize: 12, fontWeight: 600 }}>AI suggestions applied</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Mood selector */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.4 }}>
            <p style={{ color: '#475569', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px' }}>Mood</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 24 }}>
              {MOODS.map((m, i) => (
                <motion.button
                  key={m.label}
                  type="button"
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  onClick={() => setMood(mood === m.label ? '' : m.label)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.94 }}
                  style={{
                    border: `1px solid ${mood === m.label ? m.color : 'rgba(255,255,255,0.06)'}`,
                    background: mood === m.label ? `${m.color}18` : 'rgba(13,13,20,0.8)',
                    color: mood === m.label ? m.color : '#475569',
                    borderRadius: 24, padding: '7px 14px', fontSize: 13, cursor: 'pointer',
                    fontWeight: mood === m.label ? 700 : 400,
                    transition: 'all 0.2s', fontFamily: 'inherit',
                    boxShadow: mood === m.label ? `0 2px 16px ${m.color}22` : 'none',
                  }}
                >{m.emoji} {m.label}</motion.button>
              ))}
            </div>
          </motion.div>

          {/* Tags selector */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.4 }}>
            <p style={{ color: '#475569', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px' }}>Tags</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 32 }}>
              {TAGS.map((tag, i) => (
                <motion.button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.93 }}
                  style={{
                    border: `1px solid ${tags.includes(tag) ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.05)'}`,
                    background: tags.includes(tag) ? 'rgba(124,58,237,0.18)' : 'rgba(13,13,20,0.8)',
                    color: tags.includes(tag) ? '#a78bfa' : '#334155',
                    borderRadius: 20, padding: '6px 12px', fontSize: 12, cursor: 'pointer',
                    fontWeight: tags.includes(tag) ? 600 : 400,
                    transition: 'all 0.18s', fontFamily: 'inherit',
                  }}
                >{tag}</motion.button>
              ))}
            </div>
          </motion.div>

          {/* Submit */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
            <motion.button
              type="submit"
              disabled={loading || !content.trim()}
              whileHover={{ scale: content.trim() ? 1.02 : 1 }}
              whileTap={{ scale: content.trim() ? 0.97 : 1 }}
              style={{
                width: '100%',
                background: content.trim()
                  ? 'linear-gradient(135deg, #7c3aed, #6d28d9)'
                  : 'rgba(124,58,237,0.15)',
                color: content.trim() ? '#fff' : '#4b3a6e',
                border: 'none', borderRadius: 14, padding: '15px',
                fontSize: 15, fontWeight: 700, cursor: content.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.25s', fontFamily: 'inherit',
                boxShadow: content.trim() ? '0 4px 24px rgba(109,40,217,0.35)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Posting…
                </>
              ) : 'Post Your Day →'}
            </motion.button>
          </motion.div>

        </form>
      </div>
    </AppShell>
  );
}

export default function NewEntryPage() {
  return (
    <Suspense>
      <NewEntryContent />
    </Suspense>
  );
}
