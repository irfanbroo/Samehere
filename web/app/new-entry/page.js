'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import AppShell from '@/components/AppShell';

const MOODS = ['🔥 grinding', '😤 frustrated', '😌 chill', '🧠 focused', '😴 tired', '💪 motivated', '🎯 productive'];
const TAGS = ['#study', '#gym', '#coding', '#work', '#art', '#music', '#gaming', '#nocturnal', '#grind', '#reading', '#cooking', '#fitness', '#sleep', '#earlybird', '#introverted', '#extroverted', '#traveler', '#selfcare', '#sports', '#content', '#poetry', '#drawing', '#photography', '#writing', '#anime', '#foodie', '#linux', '#student', '#college', '#highschool', '#parenting', '#nightowl'];

function NewEntryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [tags, setTags] = useState([]);
  const [fromTasks, setFromTasks] = useState(false);

  useEffect(() => {
    const tasks = searchParams.get('tasks');
    if (tasks) {
      setContent(decodeURIComponent(tasks));
      setFromTasks(true);
    }
  }, [searchParams]);
  const [loading, setLoading] = useState(false);

  function toggleTag(tag) {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
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

  return (
    <AppShell>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 16px', width: '100%' }}>
        {fromTasks && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', marginBottom: 20,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
          }}>
            <span>🎉</span>
            <span style={{ color: '#aaa', fontSize: 13, fontWeight: 600 }}>All tasks done! Reflect on your day below.</span>
          </div>
        )}
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>How was your day?</h2>

        <form onSubmit={handleSubmit}>
          <textarea
            style={{
              width: '100%', minHeight: 200, background: '#111', color: '#fff',
              border: '1px solid #2a2a2a', borderRadius: 12, padding: 16,
              fontSize: 15, lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit',
            }}
            placeholder="Write about your day — what you did, how it went, what you're thinking..."
            value={content}
            onChange={e => setContent(e.target.value)}
            required
          />

          <p style={{ color: '#666', fontSize: 12, margin: '20px 0 10px', fontWeight: 600 }}>MOOD</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {MOODS.map(m => (
              <button key={m} type="button" onClick={() => setMood(mood === m ? '' : m)}
                style={{
                  border: `1px solid ${mood === m ? '#fff' : '#2a2a2a'}`,
                  background: mood === m ? '#fff' : 'transparent',
                  color: mood === m ? '#000' : '#555',
                  borderRadius: 20, padding: '7px 16px', fontSize: 13, cursor: 'pointer',
                  fontWeight: mood === m ? 600 : 400,
                }}>{m}</button>
            ))}
          </div>

          <p style={{ color: '#666', fontSize: 12, margin: '0 0 10px', fontWeight: 600 }}>TAGS</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
            {TAGS.map(tag => (
              <button key={tag} type="button" onClick={() => toggleTag(tag)}
                style={{
                  border: `1px solid ${tags.includes(tag) ? '#fff' : '#2a2a2a'}`,
                  background: tags.includes(tag) ? '#fff' : 'transparent',
                  color: tags.includes(tag) ? '#000' : '#555',
                  borderRadius: 20, padding: '7px 16px', fontSize: 13, cursor: 'pointer',
                  fontWeight: tags.includes(tag) ? 600 : 400,
                }}>{tag}</button>
            ))}
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', background: '#fff', color: '#000', border: 'none',
            borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}>
            {loading ? 'Posting...' : 'Post Your Day'}
          </button>
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
