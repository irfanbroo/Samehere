'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import Avatar from '@/components/Avatar';

const MOOD_COLORS = {
  'grinding': '#f59e0b',
  'frustrated': '#ef4444',
  'chill': '#22d3ee',
  'focused': '#a78bfa',
  'tired': '#6b7280',
  'motivated': '#22c55e',
  'productive': '#3b82f6',
};

function MoodBar({ label, count, max, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{ fontSize: 13, color: '#888', width: 70, textAlign: 'right' }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: '#1a1a1a', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          width: max > 0 ? `${(count / max) * 100}%` : '0%',
          height: '100%', borderRadius: 3,
          background: color,
          transition: 'width 0.6s ease-out',
        }} />
      </div>
      <span style={{ fontSize: 12, color: 'var(--secondary-text-color, #9CA3AF)', width: 18 }}>{count}</span>
    </div>
  );
}

export default function RightPanel() {
  const [similar, setSimilar] = useState([]);
  const [moods, setMoods] = useState({});
  const [me, setMe] = useState(null);
  const [activity, setActivity] = useState({});
  const [streak, setStreak] = useState(0);
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    setMe(getUser());
    api.get('/entries/activity').then(r => {
      const map = {};
      r.data.forEach(d => { map[d.date.split('T')[0]] = parseInt(d.count); });
      setActivity(map);
      // Calculate streak
      let s = 0;
      const today = new Date();
      for (let i = 0; i < 84; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        if (map[key]) s++;
        else if (i > 0) break;
      }
      setStreak(s);
    }).catch(() => {});
    api.get('/users/discover/similar').then(r => setSimilar(r.data.slice(0, 2))).catch(() => {});
    api.get('/todos').then(r => setTodos(r.data)).catch(() => {});
    api.get('/entries/my-moods').then(r => {
      const moodMap = {};
      r.data.forEach(m => {
        const key = m.mood.replace(/[^a-zA-Z]/g, '').toLowerCase();
        moodMap[key] = parseInt(m.count);
      });
      setMoods(moodMap);
    }).catch(() => {});
  }, []);

  const maxMood = useMemo(() => Math.max(...Object.values(moods), 1), [moods]);

  const heatmapWeeks = useMemo(() => Array.from({ length: 12 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => {
      const d = new Date();
      d.setDate(d.getDate() - (11 - week) * 7 - (6 - day));
      const key = d.toISOString().split('T')[0];
      return { key, count: activity[key] || 0 };
    })
  ), [activity]);

  return (
    <div style={{ width: 320, padding: '24px 24px 24px 28px', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>

      {/* Daily Prompt — FIRST */}
      {(() => {
        const prompts = [
          "Walk me through your morning. What set the tone for today?",
          "What conversation stayed with you today — and why?",
          "Where were you at 3pm today and what were you thinking?",
          "What's something you did today on autopilot?",
          "Write about the last time you felt truly in flow.",
          "What's a decision you made today, big or small?",
          "What tab in your brain won't close today?",
        ];
        const prompt = prompts[new Date().getDay()];
        return (
          <div style={{ marginBottom: 20, border: '1px solid #1a1a1a', borderRadius: 16, padding: 16, background: '#0a0a0a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>✍️</span>
              <span style={{ color: '#ccc', fontSize: 14, fontWeight: 700 }}>Today's prompt</span>
            </div>
            <p style={{ color: '#888', fontSize: 13, lineHeight: 1.6, margin: '0 0 12px', fontStyle: 'italic' }}>"{prompt}"</p>
            <a href="/new-entry" style={{
              display: 'inline-block', background: '#fff', color: '#000',
              borderRadius: 20, padding: '6px 16px', fontSize: 12,
              fontWeight: 700, textDecoration: 'none',
            }}>Write now →</a>
          </div>
        );
      })()}

      {/* Streak + Heatmap */}
      <div style={{ marginBottom: 20, border: '1px solid #1a1a1a', borderRadius: 16, padding: 16, background: '#0d0d0d' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <p style={{ color: '#fff', fontSize: 15, fontWeight: 700, margin: 0 }}>Your activity</p>
            <p style={{ color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 11, margin: '2px 0 0' }}>{Object.keys(activity).length} days logged</p>
          </div>
          <div style={{
            background: '#111', border: '1px solid #2a2a2a',
            borderRadius: 12, padding: '8px 16px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: -1 }}>{streak}</p>
            <p style={{ fontSize: 10, color: 'var(--secondary-text-color, #9CA3AF)', margin: '2px 0 0', letterSpacing: 1 }}>STREAK</p>
          </div>
        </div>

        {/* Day labels */}
        <div style={{ display: 'flex', gap: 3, marginBottom: 3, paddingLeft: 18 }}>
          {Array.from({ length: 12 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (11 - i) * 7);
            return i % 3 === 0 ? (
              <div key={i} style={{ width: 14, fontSize: 9, color: 'var(--secondary-text-color, #9CA3AF)', textAlign: 'center' }}>
                {d.toLocaleString('default', { month: 'short' })}
              </div>
            ) : <div key={i} style={{ width: 14 }} />;
          })}
        </div>

        {/* Grid with day labels */}
        <div style={{ display: 'flex', gap: 4 }}>
          {/* Day of week labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 1 }}>
            {['M','','W','','F','',''].map((d, i) => (
              <div key={i} style={{ width: 12, height: 14, fontSize: 9, color: '#333', display: 'flex', alignItems: 'center' }}>{d}</div>
            ))}
          </div>

          {/* Heatmap grid — 12 weeks × 7 days */}
          <div style={{ display: 'flex', gap: 3 }}>
            {heatmapWeeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {week.map(({ key, count }, day) => {
                  const bg = count === 0 ? '#1a1a1a' : count === 1 ? '#555' : count === 2 ? '#aaa' : '#fff';
                  return (
                    <div key={day}
                      title={`${key}${count > 0 ? `: ${count} post${count > 1 ? 's' : ''}` : ''}`}
                      style={{ width: 14, height: 14, borderRadius: 4, background: bg, transition: 'all 0.15s', cursor: count > 0 ? 'pointer' : 'default' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.4)'; e.currentTarget.style.zIndex = '10'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.zIndex = '1'; }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 10, color: '#333' }}>Less</span>
          {['#1a1a1a', '#555', '#aaa', '#fff'].map((c, i) => (
            <div key={i} style={{ width: 11, height: 11, borderRadius: 3, background: c }} />
          ))}
          <span style={{ fontSize: 10, color: '#333' }}>More</span>
        </div>
      </div>

      {/* Similar people — THIRD */}
      <div style={{ marginBottom: 20, border: '1px solid #1a1a1a', borderRadius: 16, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ color: '#ccc', fontSize: 15, fontWeight: 700 }}>People like you</span>
          <Link href="/discover" style={{ color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 13, textDecoration: 'none' }}>See all</Link>
        </div>
        {similar.length === 0 && (
          <p style={{ color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 13, fontStyle: 'italic' }}>Add tags to find similar people</p>
        )}
        {similar.map(u => (
          <Link key={u.id} href={`/profile/${u.id}`} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
              transition: 'all 0.15s',
            }}>
              <Avatar username={u.username} profilePic={u.profile_pic} size={36} radius={12} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#ccc', fontWeight: 600, fontSize: 14, margin: 0 }}>{u.username}</p>
                {u.shared_tags > 0 && (
                  <p style={{ color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 11, margin: 0 }}>{u.shared_tags} tags in common</p>
                )}
              </div>
              <span style={{
                fontSize: 11, color: 'var(--secondary-text-color, #9CA3AF)', border: '1px solid #222',
                borderRadius: 8, padding: '3px 10px', fontWeight: 500,
              }}>Follow</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Todo widget */}
      {(() => {
        const todayStr = new Date().toLocaleDateString('en-CA');
        const allTodayTodos = todos.filter(t => t.due_date?.slice(0, 10) === todayStr);
        const pending = allTodayTodos.filter(t => !t.completed);
        const allDone = allTodayTodos.length > 0 && pending.length === 0;
        const nothingAdded = allTodayTodos.length === 0;
        return (
          <Link href="/todos" style={{ textDecoration: 'none', display: 'block', marginBottom: 20 }}>
            <div style={{ border: '1px solid #1a1a1a', borderRadius: 16, padding: 16, transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#2a2a2a'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#1a1a1a'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ color: '#ccc', fontSize: 15, fontWeight: 700 }}>Today's tasks</span>
                {allDone && <span style={{ color: '#22c55e', fontSize: 12 }}>✓ all done</span>}
                {!allDone && !nothingAdded && <span style={{ color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 12 }}>{pending.length} left</span>}
              </div>
              {nothingAdded ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {['Morning task', 'Afternoon goal', 'Evening wrap'].map((hint, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.2 + i * 0.1 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#333' }} />
                      <span style={{ color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 12, fontStyle: 'italic' }}>{hint}...</span>
                    </div>
                  ))}
                  <p style={{ color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 11, margin: '4px 0 0', textAlign: 'right' }}>Plan your day →</p>
                </div>
              ) : allDone ? (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <p style={{ fontSize: 22, margin: '0 0 4px' }}>🎉</p>
                  <p style={{ color: '#22c55e', fontSize: 13, margin: 0, fontWeight: 600 }}>All done for today!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pending.slice(0, 4).map(t => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: t.priority === 'high' ? '#ef4444' : t.priority === 'low' ? '#22c55e' : '#f59e0b' }} />
                      <span style={{ color: '#888', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.content}</span>
                    </div>
                  ))}
                  {pending.length > 4 && <p style={{ color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 11, margin: 0, textAlign: 'right' }}>+{pending.length - 4} more</p>}
                </div>
              )}
            </div>
          </Link>
        );
      })()}

      {/* Mood this week — LAST */}
      <div style={{ marginBottom: 20, border: '1px solid #1a1a1a', borderRadius: 16, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ color: '#ccc', fontSize: 15, fontWeight: 700 }}>Mood this week</span>
        </div>
        {Object.keys(moods).length > 0 ? (
          Object.entries(moods).map(([mood, count]) => (
            <MoodBar key={mood} label={mood} count={count} max={maxMood} color={MOOD_COLORS[mood] || '#888'} />
          ))
        ) : (
          <p style={{ color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 13, fontStyle: 'italic' }}>Post with a mood to see your week</p>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 8, color: '#222', fontSize: 10 }}>
        Same Here &copy; 2026
      </div>
    </div>
  );
}
