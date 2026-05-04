'use client';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import AppShell from '@/components/AppShell';
import RightPanel from '@/components/RightPanel';
import Avatar from '@/components/Avatar';
import LikeButton from '@/components/LikeButton';
import { useIsMobile } from '@/lib/useIsMobile';

const MOOD_COLORS = {
  'grinding': '#f59e0b', 'frustrated': '#ef4444', 'chill': '#22d3ee',
  'focused': '#a78bfa', 'tired': '#6b7280', 'motivated': '#22c55e', 'productive': '#3b82f6',
};

const PROMPTS = [
  "Walk me through your morning. What set the tone for today?",
  "What conversation stayed with you today — and why?",
  "Where were you at 3pm today and what were you thinking?",
  "What's something you did today on autopilot?",
  "Write about the last time you felt truly in flow.",
  "What's a decision you made today, big or small?",
  "What tab in your brain won't close today?",
];

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function EntryCard({ entry, onLike, onDelete, onEdit, currentUserId }) {
  const isOwn = String(entry.user_id) === String(currentUserId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.content);
  const [draftTags, setDraftTags] = useState(entry.tags || []);
  const [saving, setSaving] = useState(false);
  const ALL_TAGS = ['#study', '#gym', '#coding', '#work', '#art', '#music', '#gaming', '#nocturnal', '#grind', '#reading', '#cooking', '#fitness', '#sleep', '#earlybird', '#introverted', '#extroverted', '#traveler', '#selfcare', '#sports', '#content', '#poetry', '#drawing', '#photography', '#writing', '#anime', '#foodie', '#linux', '#student', '#college', '#highschool', '#parenting', '#nightowl'];

  function toggleTag(tag) { setDraftTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]); }

  async function handleSave() {
    if (!draft.trim()) return;
    setSaving(true);
    await onEdit(entry.id, draft, draftTags);
    setSaving(false);
    setEditing(false);
  }

  return (
    <div style={{
      background: 'var(--bg-card, #0f0f0f)', borderRadius: 16,
      border: '1px solid #1a1a1a',
      marginBottom: 16, overflow: 'hidden',
      transition: 'border-color 0.2s',
      cursor: 'pointer',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = '#2a2a2a'}
    onMouseLeave={e => e.currentTarget.style.borderColor = '#1a1a1a'}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 0' }}>
        <Link href={`/profile/${entry.user_id}`} style={{ textDecoration: 'none' }}>
          <Avatar username={entry.username} profilePic={entry.profile_pic} size={36} radius={12} />
        </Link>
        <div style={{ flex: 1 }}>
          <Link href={`/profile/${entry.user_id}`} style={{ color: '#fff', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
            {entry.username}
          </Link>
          <p style={{ color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 12, margin: 0 }}>{timeAgo(entry.created_at)}</p>
        </div>
        {entry.mood && (
          <span style={{
            background: '#161616', borderRadius: 20, padding: '3px 10px',
            fontSize: 11, color: '#888', border: '1px solid #1e1e1e',
          }}>{entry.mood}</span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '12px 16px' }}>
        {editing ? (
          <>
            <textarea value={draft} onChange={e => setDraft(e.target.value)} autoFocus
              style={{ width: '100%', minHeight: 100, background: '#0a0a0a', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 12, padding: 12, fontSize: 14, lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit' }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '10px 0' }}>
              {ALL_TAGS.map(tag => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)} style={{
                  border: `1px solid ${draftTags.includes(tag) ? '#fff' : '#2a2a2a'}`,
                  background: draftTags.includes(tag) ? '#fff' : 'transparent',
                  color: draftTags.includes(tag) ? '#000' : '#555',
                  borderRadius: 20, padding: '3px 10px', fontSize: 11, cursor: 'pointer',
                  fontWeight: draftTags.includes(tag) ? 600 : 400,
                }}>{tag}</button>
              ))}
            </div>
          </>
        ) : (
          <Link href={`/entry/${entry.id}`} style={{ textDecoration: 'none' }}>
            <p style={{ color: '#bbb', fontSize: 15, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{entry.content}</p>
          </Link>
        )}
      </div>

      {/* Tags */}
      {!editing && entry.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: '0 16px 10px' }}>
          {entry.tags.map(t => (
            <span key={t} style={{ background: '#141414', color: 'var(--secondary-text-color, #9CA3AF)', borderRadius: 20, padding: '2px 9px', fontSize: 11, border: '1px solid #1a1a1a' }}>{t}</span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderTop: '1px solid #141414' }}>
        {!editing ? (
          <>
            <LikeButton liked={entry.liked} count={entry.likes_count} onLike={() => onLike(entry.id)} />
            <Link href={`/entry/${entry.id}`} style={{ color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 14, textDecoration: 'none', marginLeft: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {entry.comments_count}
            </Link>
            {isOwn && (
              <button onClick={() => { setDraft(entry.content); setDraftTags(entry.tags || []); setEditing(true); }} style={{
                marginLeft: 'auto', background: '#111', border: '1px solid #1e1e1e',
                cursor: 'pointer', color: 'var(--secondary-text-color, #9CA3AF)', borderRadius: 8,
                padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 11, fontWeight: 500,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#aaa'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#555'; }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit
              </button>
            )}
          </>
        ) : (
          <>
            <button onClick={() => onDelete(entry.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4d', fontSize: 12, padding: 0 }}>Delete</button>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button onClick={() => setEditing(false)} style={{ background: 'none', border: '1px solid #222', color: '#666', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ background: '#fff', border: 'none', color: '#000', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
                {saving ? '...' : 'Save'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function FeedPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [entries, setEntries] = useState([]);
  const [exploreEntries, setExploreEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [similar, setSimilar] = useState([]);
  const FEED_LINES = [
    "The clock doesn't care.",
    "24 hours. Same as everyone else.",
    "The record doesn't lie.",
    "You can't edit yesterday.",
    "The version of you from last year is watching.",
    "You are what you repeatedly do.",
    "The gap doesn't close itself.",
    "Same 24 hours. Different choices.",
    "Nobody's coming to save you.",
    "The day happened. Did you?",
    "You know what you didn't do today.",
    "Progress is just honesty over time.",
    "The person you want to be is taking notes.",
    "Accountability is a mirror. Look at it.",
    "You've been here before. Do better.",
    "Tomorrow doesn't fix today.",
    "The work is the reward.",
    "You either did it or you didn't.",
    "Stop explaining. Start doing.",
    "Your habits are your autobiography.",
    "One honest day at a time.",
    "The gap between thinking and doing is where most people live.",
    "No audience. No excuses.",
    "You can feel it or you can fix it.",
    "The truth doesn't need your permission.",
    "Another day in the books.",
    "What you track, you control.",
    "Discipline is just a decision you made yesterday.",
    "Small moves. Compounding.",
    "Don't lie to the log.",
    "The data doesn't care how you feel.",
    "You showed up. That's the baseline.",
    "One more day of not quitting.",
    "Everything is information.",
    "The best time was yesterday. Second best is now.",
    "Run the process. Trust the record.",
    "You are the only variable.",
    "What gets measured gets real.",
  ];
  const [feedLine, setFeedLine] = useState('');
  const [jarvisLine, setJarvisLine] = useState('');
  const [subTextLine, setSubTextLine] = useState('');
  const [showDailyGreet, setShowDailyGreet] = useState(false);
  const [moods, setMoods] = useState({});
  const [streak, setStreak] = useState(0);
  const [todos, setTodos] = useState([]);
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [truths, setTruths] = useState([]);
  const [onboarded, setOnboarded] = useState(() => typeof window !== 'undefined' && !!localStorage.getItem('samehere_onboarded'));
  const cardsRef = useRef(null);
  const dragState = useRef({ down: false, startX: 0, scrollLeft: 0 });
  useEffect(() => { setFeedLine(FEED_LINES[Math.floor(Math.random() * FEED_LINES.length)]); }, []);

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA');
    if (localStorage.getItem('samehere_greeted') !== today) {
      setShowDailyGreet(true);
      const t = setTimeout(() => {
        setShowDailyGreet(false);
        localStorage.setItem('samehere_greeted', today);
      }, 4000);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    const p = arr => arr[Math.floor(Math.random() * arr.length)];
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA');
    const hr = now.getHours();
    const dayOfWeek = now.getDay(); // 0=Sun,1=Mon,...,6=Sat
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - dayOfMonth;
    const isMonday = dayOfWeek === 1;
    const isFriday = dayOfWeek === 5;
    const isSunday = dayOfWeek === 0;
    const isMonthStart = dayOfMonth <= 2;
    const isMonthEnd = daysLeft <= 2;
    const isLate = hr >= 22 || hr < 4;
    const isMidnight = hr >= 0 && hr < 4;
    const isEvening = hr >= 18 && hr < 22;

    const wroteToday = diaryEntries.some(e => new Date(e.created_at).toLocaleDateString('en-CA') === todayStr);
    const todayTodos = todos.filter(t => t.due_date?.slice(0,10) === todayStr);
    const incompleteTodos = todayTodos.filter(t => !t.completed);
    const todayDoneCount = todayTodos.filter(t => t.completed).length;
    const todayPct = todayTodos.length > 0 ? Math.round((todayDoneCount / todayTodos.length) * 100) : 0;
    const attentionCount = (!wroteToday ? 1 : 0) + (incompleteTodos.length > 0 ? 1 : 0);
    const lastDiaryEntry = diaryEntries[0];
    const daysSinceWrite = lastDiaryEntry ? Math.floor((Date.now() - new Date(lastDiaryEntry.created_at)) / 86400000) : null;
    const isLongAbsence = daysSinceWrite !== null && daysSinceWrite >= 2;

    // Consistency score this month
    const daysThisMonth = Array.from({ length: dayOfMonth }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
      return d.toLocaleDateString('en-CA');
    });
    const daysWritten = daysThisMonth.filter(ds => diaryEntries.some(e => new Date(e.created_at).toLocaleDateString('en-CA') === ds)).length;
    const consistencyPct = Math.round((daysWritten / dayOfMonth) * 100);

    // Streak milestones - override everything
    const isMilestone = [7,14,21,30,60,100].includes(streak);

    // Check if special one-time day message shown today
    const specialShownKey = `samehere_special_${todayStr}`;
    const specialShown = !!localStorage.getItem(specialShownKey);

    let jl;

    // Priority 1: Streak milestone
    if (isMilestone && wroteToday) {
      jl = streak === 7  ? `Seven days, sir. Most people quit by day three.`
         : streak === 14 ? `Fourteen days, sir. You're in the top 5% now.`
         : streak === 21 ? `Twenty-one days, sir. They say that's how habits form. You're proof.`
         : streak === 30 ? `Thirty days, sir. I've been keeping count. So have you.`
         : streak === 60 ? `Sixty days, sir. This is no longer a streak. It's a lifestyle.`
         : `One hundred days, sir. I don't have a speech for this. Well done.`;

    // Priority 2: Special day messages (once per day)
    } else if (!specialShown && (isMonday || isSunday || isFriday || isMonthStart || isMonthEnd || isLongAbsence)) {
      if (isLongAbsence) {
        jl = p([
          `You've been quiet, sir. ${daysSinceWrite} days. The log hasn't forgotten.`,
          `${daysSinceWrite} days, sir. I don't judge. But the record does.`,
          `Welcome back, sir. ${daysSinceWrite} days of silence. Let's change that.`,
        ]);
      } else if (isMonthEnd) {
        jl = p([
          daysLeft === 0 ? `Last day of the month, sir. Close it clean.` : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left in ${now.toLocaleString('en-US',{month:'long'})}, sir. Close it clean.`,
          `End of the month, sir. ${daysWritten} of ${dayOfMonth} days documented. Make the last ${daysLeft} count.`,
        ]);
      } else if (isMonthStart) {
        jl = p([
          `New month, sir. Clean slate. Same choices.`,
          `${now.toLocaleString('en-US',{month:'long'})} just started, sir. How you begin matters.`,
        ]);
      } else if (isMonday) {
        jl = p([
          `It's Monday, sir. Best day to reset — or best excuse not to.`,
          `Monday, sir. The week is watching how you start it.`,
        ]);
      } else if (isSunday) {
        jl = p([
          `Sunday, sir. Last chance to close the week clean.`,
          `End of the week, sir. ${daysWritten} days documented this month. How's that feel?`,
        ]);
      } else if (isFriday) {
        jl = p([
          `Friday, sir. The weekend doesn't care about your streak.`,
          `Friday evening, sir. Most people check out. You know better.`,
        ]);
      }
      localStorage.setItem(specialShownKey, '1');

    // Priority 3: Long absence
    } else if (isLongAbsence && !wroteToday) {
      jl = p([
        `${daysSinceWrite} days, sir. The gap is growing.`,
        `You've been quiet, sir. The log hasn't forgotten.`,
        `Welcome back, sir. The record missed you.`,
      ]);

    // Priority 4: Consistency insight
    } else if (wroteToday && attentionCount === 0 && daysWritten > 3) {
      jl = p([
        `${daysWritten} of ${dayOfMonth} days documented this month, sir. ${consistencyPct}% consistency.`,
        consistencyPct >= 70 ? `${consistencyPct}% this month, sir. That's the top tier.` : `${daysWritten} days this month, sir. ${daysLeft} left to improve that number.`,
        `Everything's in order, sir. Rare, but appreciated.`,
        `Clean record. I'd enjoy the moment — they don't last.`,
        streak > 2 ? `${streak} day streak, sir. I don't say this often — well done.` : `All clear. Don't waste it.`,
        `Everything's in order. I had a speech prepared for the alternative.`,
      ]);

    // Priority 5: Regular conditions
    } else if (attentionCount === 0) {
      jl = p([
        `Everything's in order, sir. Rare, but appreciated.`,
        `Clean record. I'd enjoy the moment — they don't last.`,
        `Diary written. Tasks cleared. Even I'm impressed, sir.`,
        `Everything's in order. I had a speech prepared for the alternative.`,
        `All clear. Don't waste it.`,
      ]);
    } else if (!wroteToday && streak > 0) {
      jl = p([
        `${streak} days, sir. You'd hate yourself if tonight was the one that broke it.`,
        `Still unwritten, sir. The streak doesn't know you're tired.`,
        `${streak} days of discipline. One lazy evening undoes all of it.`,
        isLate ? `It's late, sir. The streak expires at midnight.` : `You've written every day this week except today, sir. Fix that.`,
        `You could close the app and ignore me. You won't though, sir.`,
      ]);
    } else if (!wroteToday) {
      jl = p([
        `The log is empty, sir. The day happened whether you write it or not.`,
        `Blank page, sir. It won't fill itself.`,
        `Nothing documented yet. Your future self reads these, you know.`,
        `You already know what needs to happen. You've known for hours, sir.`,
        isMidnight ? `It's past midnight, sir. Don't lose today's entry too.` : `The gap between knowing and doing — that's where most people live. Don't be most people, sir.`,
      ]);
    } else if (incompleteTodos.length > 0) {
      jl = p([
        `You set these yourself, sir. Just a reminder.`,
        `The tasks didn't get harder. You just got more comfortable.`,
        `Still pending, sir. At some point 'later' becomes 'not today.'`,
        isLate ? `It's late, sir. ${incompleteTodos.length} task${incompleteTodos.length !== 1 ? 's' : ''} and counting down.` : `${incompleteTodos.length} task${incompleteTodos.length !== 1 ? 's' : ''} haven't moved, sir.`,
        `Today still counts if you act now, sir. I've run the numbers.`,
        `I'm contractually obligated to remind you about the tasks, sir.`,
      ]);
    } else {
      jl = p([
        `Everything's in order, sir. Rare, but appreciated.`,
        `All clear. Don't waste it.`,
        `Nothing outstanding, sir. You might actually be ahead today.`,
      ]);
    }
    setJarvisLine(jl);

    // SubText
    let st;
    if (!wroteToday && daysSinceWrite !== null && daysSinceWrite > 0) {
      st = streak > 0 ? p([
        `One entry. That's the whole ask tonight, sir.`,
        `${streak} days of not quitting. Don't make tonight different.`,
        isEvening || isLate ? `The streak expires at midnight, sir.` : `${streak} days in. One entry keeps it alive, sir.`,
      ]) : p([
        diaryEntries.length > 0 ? `${diaryEntries.length} entries on record, sir. Don't let today be a gap.` : `Nothing documented yet. Your future self reads these, you know.`,
        `The gap between knowing and doing — that's where most people live. Don't be most people, sir.`,
        `Blank page, sir. It won't fill itself.`,
      ]);
    } else if (!wroteToday) {
      st = p([
        `The log is empty, sir. The day happened whether you write it or not.`,
        `You already know what needs to happen. You've known for hours, sir.`,
        `Nothing documented yet. Your future self reads these, you know.`,
      ]);
    } else if (incompleteTodos.length > 0) {
      st = p([
        `You wrote them down for a reason, sir.`,
        `The clock is indifferent to your plans.`,
        `${incompleteTodos.length} left. You know what needs to happen, sir.`,
        isLate ? `It's late, sir. Now or never.` : `Today still counts if you act now, sir.`,
      ]);
    } else {
      st = p([
        `This is what a good day looks like, sir.`,
        `Noted. Same time tomorrow.`,
        `I'll be here when you need me, sir.`,
        streak > 0 ? `${streak} days and counting, sir.` : `Clean record. Keep building it.`,
        isMilestone ? `${streak} days, sir. I don't say this often — well done.` : `Diary written. Tasks cleared. Even I'm impressed, sir.`,
      ]);
    }
    setSubTextLine(st);
  }, [loading, diaryEntries, todos, truths, streak]);

  useEffect(() => {
    const user = getUser();
    if (!user) return router.push('/login');
    setCurrentUser(user);
    Promise.all([
      api.get('/entries/feed'),
      api.get('/entries/explore'),
    ]).then(([feedRes, exploreRes]) => {
      const feedIds = new Set(feedRes.data.map(e => e.id));
      setEntries(feedRes.data);
      setExploreEntries(exploreRes.data.filter(e => !feedIds.has(e.id)));
    }).finally(() => setLoading(false));

    // Streak — counts any day with a public post OR a diary entry
    Promise.all([
      api.get('/entries/activity'),
      api.get('/diary'),
    ]).then(([actRes, diaryRes]) => {
      const map = {};
      // Public posts
      actRes.data.forEach(d => { map[d.date.split('T')[0]] = true; });
      // Diary entries
      diaryRes.data.forEach(e => { map[new Date(e.created_at).toLocaleDateString('en-CA')] = true; });
      let s = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        const ds = d.toLocaleDateString('en-CA');
        if (map[ds]) s++; else if (i > 0) break;
      }
      setStreak(s);
    }).catch(() => {});
    api.get('/users/discover/similar').then(r => setSimilar(r.data.slice(0, 3))).catch(() => {});
    api.get('/todos').then(r => setTodos(r.data)).catch(() => {});
    api.get('/diary').then(r => setDiaryEntries(r.data)).catch(() => {});
    api.get('/truths').then(r => setTruths(r.data)).catch(() => {});

    // Auto-complete onboarding once both diary + todos exist
    Promise.all([api.get('/diary'), api.get('/todos')]).then(([d, t]) => {
      if (d.data.length > 0 && t.data.length > 0) {
        localStorage.setItem('samehere_onboarded', '1');
        setOnboarded(true);
      }
    }).catch(() => {});
    api.get('/entries/my-moods').then(r => {
      const m = {};
      r.data.forEach(d => { m[d.mood.replace(/[^a-zA-Z]/g, '').toLowerCase()] = parseInt(d.count); });
      setMoods(m);
    }).catch(() => {});
  }, [router]);

  async function handleLike(id) {
    const updater = prev => prev.map(e => e.id === id
      ? { ...e, liked: !e.liked, likes_count: parseInt(e.likes_count) + (!e.liked ? 1 : -1) }
      : e
    );
    setEntries(updater);
    setExploreEntries(updater);
    try { await api.post(`/entries/${id}/like`); } catch {
      const revert = prev => prev.map(e => e.id === id
        ? { ...e, liked: !e.liked, likes_count: parseInt(e.likes_count) + (!e.liked ? 1 : -1) }
        : e
      );
      setEntries(revert); setExploreEntries(revert);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this post?')) return;
    const prev = entries;
    setEntries(e => e.filter(x => x.id !== id));
    try { await api.delete(`/entries/${id}`); } catch { setEntries(prev); }
  }

  async function handleEdit(id, content, tags) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, content, tags } : e));
    try {
      const res = await api.put(`/entries/${id}`, { content, tags });
      setEntries(prev => prev.map(e => e.id === id ? { ...e, content: res.data.content, tags: res.data.tags } : e));
    } catch {}
  }

  return (
    <AppShell rightPanel={<RightPanel />}>
        <style>{`
          @keyframes linePulse {
            0%, 100% { opacity: 0.4; box-shadow: 0 0 6px 1px rgba(255,255,255,0.04); }
            50% { opacity: 1; box-shadow: 0 0 14px 2px rgba(255,255,255,0.12); }
          }
          .mobile-cards::-webkit-scrollbar { display: none; }
        `}</style>
        <div style={{ width: '100%', maxWidth: 560, padding: '0 0 24px' }}>
          {/* ── JARVIS BRIEFING ── */}
          {(() => {
            const todayStr = new Date().toLocaleDateString('en-CA');
            const h = new Date().getHours();
            const greet = h < 12 ? 'Morning,' : h < 17 ? 'Afternoon,' : h < 21 ? 'Evening,' : 'Still up,';
            const wroteToday = diaryEntries.some(e => new Date(e.created_at).toLocaleDateString('en-CA') === todayStr);
            const isNewUser = !loading && !onboarded && (diaryEntries.length === 0 || todos.length === 0);
            const lastDiaryEntry = diaryEntries[0];
            const daysSinceWrite = lastDiaryEntry ? Math.floor((Date.now() - new Date(lastDiaryEntry.created_at)) / 86400000) : null;
            const todayTodos = todos.filter(t => t.due_date?.slice(0,10) === todayStr);
            const incompleteTodos = todayTodos.filter(t => !t.completed);
            const unresolvedTruths = truths.filter(t => !t.resolution);
            const attentionCount = (!wroteToday ? 1 : 0) + (incompleteTodos.length > 0 ? 1 : 0) + (unresolvedTruths.length > 0 ? 1 : 0);

            const todayDoneCount = todayTodos.filter(t => t.completed).length;
            const todayPct = todayTodos.length > 0 ? Math.round((todayDoneCount / todayTodos.length) * 100) : 0;

            let headline, headlineAccent;
            if (!wroteToday && daysSinceWrite !== null && daysSinceWrite > 0) {
              headline = "You haven't written";
              headlineAccent = `in ${daysSinceWrite} day${daysSinceWrite !== 1 ? 's' : ''}.`;
            } else if (!wroteToday) {
              headline = "No diary entry";
              headlineAccent = "today yet.";
            } else if (incompleteTodos.length > 0) {
              headline = `${incompleteTodos.length} task${incompleteTodos.length !== 1 ? 's' : ''} still`;
              headlineAccent = "incomplete.";
            } else if (unresolvedTruths.length > 0) {
              headline = `${unresolvedTruths.length} truth${unresolvedTruths.length !== 1 ? 's' : ''} still`;
              headlineAccent = "unresolved.";
            } else {
              headline = "You're on track";
              headlineAccent = "today.";
            }

            const accentColor = attentionCount === 0 ? '#22c55e' : (!wroteToday ? '#f87171' : '#facc15');

            const subLine = feedLine;

            // Item rows
            const items = [
              !wroteToday && {
                icon: '📖', color: 'rgba(248,113,113,0.1)', borderColor: 'rgba(248,113,113,0.18)',
                main: lastDiaryEntry ? <>No diary entry today — <b>last written {daysSinceWrite === 1 ? 'yesterday' : `${daysSinceWrite} days ago`}</b></> : <><b>No diary entries yet</b></>,
                href: '/diary',
              },
              incompleteTodos.length > 0 && {
                icon: '✅', color: 'rgba(250,204,21,0.08)', borderColor: 'rgba(250,204,21,0.15)',
                main: <><b>{incompleteTodos.length} of {todayTodos.length} tasks</b> still incomplete today</>,
                sub: incompleteTodos.slice(0,2).map(t => t.content).join(' · ') + (incompleteTodos.length > 2 ? ` +${incompleteTodos.length - 2} more` : ''),
                href: '/todos',
              },
              unresolvedTruths.length > 0 && {
                icon: '🛡️', color: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.15)',
                main: <><b>{unresolvedTruths.length} truth{unresolvedTruths.length !== 1 ? 's' : ''}</b> unresolved</>,
                href: '/reckoning',
              },
              {
                icon: '🔥', color: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.1)',
                main: streak > 0 ? <>Streak at <b>{streak} days</b>{!wroteToday ? ' — write tonight to protect it' : ' — keep it going'}</> : <><b>Start your streak today</b></>,
                dim: wroteToday,
                href: null,
              },
            ].filter(Boolean);

            // Stat cards
            const todayDone = todayTodos.filter(t => t.completed).length;
            const ringR = 20, ringCirc = 2 * Math.PI * ringR;
            const todoProgress = todayTodos.length > 0 ? Math.round((todayDone / todayTodos.length) * 100) : 0;
            const ringOffset = ringCirc - (todoProgress / 100) * ringCirc;

            // ── Day 1 card for new users ──
            if (isNewUser) return (
              <>
                <div style={{ padding: '28px 20px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--secondary-text-color, #9CA3AF)', opacity: 0.4, marginBottom: 5 }}>
                      {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
                    </div>
                    <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.03em', margin: 0, color: 'var(--main-text-color, #e0e0e0)' }}>
                      {greet} <span style={{ color: 'var(--accent, #ffffff)' }}>{currentUser?.username || 'there'}.</span>
                    </h1>
                  </div>
                  <button onClick={() => router.push('/discover')} style={{ background: 'var(--bg-elevated, #111111)', border: '1px solid var(--bg-border, #1a1a1a)', borderRadius: 11, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary-text-color, #9CA3AF)', cursor: 'pointer', flexShrink: 0, marginTop: 4 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </button>
                </div>

                {/* Day 1 card */}
                <div style={{ margin: '18px 16px 0', borderRadius: 22, overflow: 'hidden', background: 'var(--bg-card, #0c0c0c)', border: '1px solid var(--bg-border, #1a1a1a)', position: 'relative' }}>
                  <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />
                  {/* Ambient glow */}
                  <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 300, height: 200, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.02) 0%, transparent 70%)', pointerEvents: 'none' }} />

                  {/* Progress bar */}
                  {(() => {
                    const done = (diaryEntries.length > 0 ? 1 : 0) + (todos.length > 0 ? 1 : 0);
                    const pct = (done / 2) * 100;
                    return (
                      <div style={{ padding: '14px 20px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--secondary-text-color, #9CA3AF)', opacity: 0.4 }}>Getting started</span>
                          <span style={{ fontSize: 10, color: 'var(--secondary-text-color, #9CA3AF)', opacity: 0.4 }}>{done}/2</span>
                        </div>
                        <div style={{ height: 3, background: 'var(--bg-elevated, #111)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#22c55e' : 'var(--main-text-color, #e0e0e0)', borderRadius: 2, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    );
                  })()}

                  <div style={{ padding: '24px 26px 28px', position: 'relative', textAlign: 'center' }}>
                    <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--main-text-color, #e0e0e0)', lineHeight: 1.25, margin: '0 0 8px' }}>
                      Everyone starts somewhere.
                    </h2>
                    <p style={{ fontSize: 14, color: 'var(--secondary-text-color, #9CA3AF)', opacity: 0.5, lineHeight: 1.6, margin: '0 0 24px', maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>
                      Today is Day 1. No history, no streak, no pressure. Just start.
                    </p>

                    {/* Checklist */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, textAlign: 'left' }}>
                      {[
                        { label: 'Write your first diary entry', done: diaryEntries.length > 0, href: '/diary/new' },
                        { label: 'Add a task for today', done: todos.length > 0, href: '/todos' },
                      ].map((item, i) => (
                        <div key={i} onClick={() => !item.done && router.push(item.href)} style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                          background: 'var(--bg-elevated, #111)', borderRadius: 14,
                          border: `1px solid ${item.done ? 'rgba(34,197,94,0.2)' : 'var(--bg-border, #1a1a1a)'}`,
                          cursor: item.done ? 'default' : 'pointer', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { if (!item.done) e.currentTarget.style.borderColor = '#444'; }}
                        onMouseLeave={e => { if (!item.done) e.currentTarget.style.borderColor = 'var(--bg-border, #1a1a1a)'; }}>
                          {/* Checkbox */}
                          <div style={{
                            width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                            background: item.done ? '#22c55e' : 'transparent',
                            border: `2px solid ${item.done ? '#22c55e' : 'var(--secondary-text-color, #9CA3AF)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: item.done ? 1 : 0.3, transition: 'all 0.2s',
                          }}>
                            {item.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                          </div>
                          <span style={{
                            fontSize: 14, fontWeight: 600,
                            color: item.done ? '#22c55e' : 'var(--main-text-color, #e0e0e0)',
                            textDecoration: item.done ? 'line-through' : 'none',
                            opacity: item.done ? 0.5 : 1,
                            transition: 'all 0.2s',
                          }}>{item.label}</span>
                          {!item.done && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--secondary-text-color, #9CA3AF)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', opacity: 0.3 }}><polyline points="9 18 15 12 9 6"/></svg>}
                        </div>
                      ))}
                    </div>

                  </div>
                </div>

                {/* Feed divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '22px 20px 0', marginBottom: 16 }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--bg-border, #1a1a1a)' }} />
                  <span style={{ fontSize: 9, color: 'var(--secondary-text-color, #9CA3AF)', opacity: 0.3, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>From Same Here</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--bg-border, #1a1a1a)' }} />
                </div>
              </>
            );

            return (
              <>
                {/* Header */}
                <div style={{ padding: '28px 20px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--secondary-text-color, #9CA3AF)', opacity: 0.4, marginBottom: 5 }}>
                      {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
                    </div>
                    <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.03em', margin: 0, color: 'var(--main-text-color, #e0e0e0)' }}>
                      {greet} <span style={{ color: 'var(--accent, #ffffff)' }}>{currentUser?.username || 'there'}.</span>
                    </h1>
                  </div>
                  <button onClick={() => router.push('/discover')} style={{ background: 'var(--bg-elevated, #111111)', border: '1px solid var(--bg-border, #1a1a1a)', borderRadius: 11, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary-text-color, #9CA3AF)', cursor: 'pointer', flexShrink: 0, marginTop: 4 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </button>
                </div>

                {/* Jarvis scan line */}
                {jarvisLine ? (
                  <div style={{ padding: '4px 22px 0' }}>
                    <p style={{
                      fontSize: 19, fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.35, margin: 0,
                      background: 'linear-gradient(135deg, #fff 0%, #444 100%)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    }}>{jarvisLine}</p>
                  </div>
                ) : null}

                {/* Briefing */}
                {attentionCount > 0 ? (
                  <div style={{ margin: '18px 16px 0', padding: '20px 22px', background: 'var(--bg-card,#0c0c0c)', borderRadius: 20, border: `1px solid ${accentColor}18`, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${accentColor}99,${accentColor}20,transparent)` }} />
                    <div style={{ position:'absolute', top:-30, left:-30, width:160, height:160, borderRadius:'50%', background:`radial-gradient(circle,${accentColor}08,transparent 70%)`, pointerEvents:'none' }} />
                    {/* Headline */}
                    <div style={{ fontSize:26, fontWeight:900, letterSpacing:'-0.035em', color:'var(--main-text-color,#e0e0e0)', lineHeight:1.15, marginBottom:2 }}>{headline}</div>
                    <div style={{ fontSize:26, fontWeight:900, letterSpacing:'-0.035em', color:accentColor, lineHeight:1.15, marginBottom:14 }}>{headlineAccent}</div>
                    {/* CTA */}
                    {(() => {
                      const primaryItem = items.find(i => i.href);
                      if (!primaryItem) return null;
                      const ctaLabel = !wroteToday ? "Write today's entry" : 'Go to tasks';
                      return (
                        <div onClick={() => router.push(primaryItem.href)}
                          style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'9px 18px', background:`${accentColor}10`, border:`1px solid ${accentColor}30`, borderRadius:20, cursor:'pointer', transition:'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background=`${accentColor}20`; e.currentTarget.style.borderColor=`${accentColor}55`; }}
                          onMouseLeave={e => { e.currentTarget.style.background=`${accentColor}10`; e.currentTarget.style.borderColor=`${accentColor}30`; }}>
                          <span style={{ fontSize:13, fontWeight:800, color:accentColor }}>{ctaLabel}</span>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div style={{ padding: '14px 22px 0' }}>
                    <div style={{ fontSize:24, fontWeight:900, letterSpacing:'-0.035em', color:'var(--main-text-color,#e0e0e0)', lineHeight:1.15, marginBottom:2 }}>{headline}</div>
                    <div style={{ fontSize:24, fontWeight:900, letterSpacing:'-0.035em', color:accentColor, lineHeight:1.15 }}>{headlineAccent}</div>
                  </div>
                )}

                {/* Stat cards */}
                <div style={{ display: 'flex', gap: 10, padding: '12px 16px 0' }}>
                  {[
                    { val: wroteToday ? '✓' : '0', label: 'diary today', color: wroteToday ? '#22c55e' : '#f87171' },
                    { val: `${todayDone}/${todayTodos.length || 0}`, label: 'tasks done', color: todayDone === todayTodos.length && todayTodos.length > 0 ? '#22c55e' : '#facc15' },
                    { val: `🔥${streak}`, label: 'day streak', color: '#22c55e' },
                  ].map((s, i) => (
                    <div key={i} style={{ flex: 1, background: 'var(--bg-card, #0c0c0c)', border: '1px solid var(--bg-border, #1a1a1a)', borderRadius: 14, padding: '12px 10px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${s.color}80, transparent)` }} />
                      {/* Watermark icon */}
                      {s.icon && <div style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: s.color, opacity: 0.08, display: 'flex' }}>{s.icon}</div>}
                      <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', color: s.color, lineHeight: 1, marginBottom: 3 }}>{s.val}</div>
                      <div style={{ fontSize: 9, color: 'var(--secondary-text-color, #9CA3AF)', opacity: 0.4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Quote */}
                <div style={{ margin: '16px 16px 0', position: 'relative', padding: '28px 24px', textAlign: 'center', overflow: 'hidden' }}>
                  {/* Ambient blob */}
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 280, height: 100, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.03) 0%, transparent 70%)', pointerEvents: 'none' }} />
                  {/* Left accent line */}
                  <div style={{ position: 'absolute', left: 0, top: '10%', bottom: '10%', width: 2, borderRadius: 2, background: 'linear-gradient(180deg, transparent, var(--main-text-color,#e0e0e0), transparent)', opacity: 0.35 }} />
                  {/* Right accent line */}
                  <div style={{ position: 'absolute', right: 0, top: '10%', bottom: '10%', width: 2, borderRadius: 2, background: 'linear-gradient(180deg, transparent, var(--main-text-color,#e0e0e0), transparent)', opacity: 0.35 }} />
                  <p style={{
                    fontSize: 19, fontWeight: 900, margin: 0, lineHeight: 1.4,
                    letterSpacing: '-0.03em', position: 'relative',
                    background: 'linear-gradient(135deg, var(--main-text-color, #e0e0e0) 30%, var(--secondary-text-color, #9CA3AF) 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}>"{subLine}"</p>
                </div>

                {/* Feed divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '22px 20px 0', marginBottom: 16 }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--bg-border, #1a1a1a)' }} />
                  <span style={{ fontSize: 9, color: 'var(--secondary-text-color, #9CA3AF)', opacity: 0.3, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>From Same Here</span>
                  <div style={{ flex: 1, height: 1, background: '#0e0e0e' }} />
                </div>
              </>
            );
          })()}

          <div style={{ padding: '0 16px' }}>
          {loading ? (
            <p style={{ color: '#333', textAlign: 'center', marginTop: 40 }}>Loading...</p>
          ) : (
          <>
            {/* No following — prompt to follow people */}
            {entries.length === 0 && exploreEntries.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', marginBottom: 20,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14,
              }}>
                <div style={{ fontSize: 22 }}>👋</div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#e0e0e0' }}>Go find the person living your day.</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--secondary-text-color, #9CA3AF)' }}>You're seeing public posts for now</p>
                </div>
                <Link href="/discover" style={{
                  background: '#fff', color: '#000',
                  fontSize: 12, fontWeight: 700,
                  padding: '7px 14px', borderRadius: 20,
                  textDecoration: 'none', whiteSpace: 'nowrap',
                }}>Find people</Link>
              </div>
            )}

            {entries.length === 0 && exploreEntries.length === 0 && (
              <div style={{ textAlign: 'center', marginTop: 60 }}>
                <p style={{ fontSize: 16, fontWeight: 600 }}>Nothing here yet</p>
                <Link href="/new-entry" style={{ display: 'inline-block', marginTop: 16, background: '#fff', color: '#000', padding: '10px 24px', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>Post Your Day</Link>
              </div>
            )}

            {entries.map(e => (
              <EntryCard key={e.id} entry={e} onLike={handleLike} onDelete={handleDelete} onEdit={handleEdit} currentUserId={currentUser?.id} />
            ))}

            {exploreEntries.length > 0 && (
              <>
                <div style={{ margin: '32px 0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: '100%', height: 1,
                    background: 'linear-gradient(to right, transparent, #ffffff18, #ffffff35, #ffffff18, transparent)',
                    animation: 'linePulse 3s ease-in-out infinite',
                  }} />
                  <span style={{ color: '#333', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>More from Same Here</span>
                </div>
                {exploreEntries.map(e => (
                  <EntryCard key={e.id} entry={e} onLike={handleLike} onDelete={handleDelete} onEdit={handleEdit} currentUserId={currentUser?.id} />
                ))}
              </>
            )}
          </>
        )}
          </div>
        </div>


      {/* ── DAILY JARVIS GREETING ── */}
      {showDailyGreet && currentUser && (
        <div onClick={() => { setShowDailyGreet(false); localStorage.setItem('samehere_greeted', new Date().toLocaleDateString('en-CA')); }}
          style={{ position:'fixed', inset:0, background:'#060606', zIndex:999, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <style>{`
            @keyframes jg1 { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
            @keyframes jg2 { from{opacity:0;transform:translateY(8px)} to{opacity:0.55;transform:translateY(0)} }
            @keyframes jg3 { from{opacity:0;transform:translateY(8px)} to{opacity:0.3;transform:translateY(0)} }
            @keyframes jgfade { 0%,75%{opacity:1} 100%{opacity:0} }
            .jgl1 { animation: jg1 0.5s ease-out 0.2s both, jgfade 4s ease-out forwards; }
            .jgl2 { animation: jg2 0.5s ease-out 0.9s both, jgfade 4s ease-out forwards; }
            .jgl3 { animation: jg3 0.5s ease-out 1.6s both, jgfade 4s ease-out forwards; }
            .jg-cursor { animation: jgblink 1s step-end infinite; }
            @keyframes jgblink { 0%,100%{opacity:1} 50%{opacity:0} }
          `}</style>

          {/* Subtle scan line */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)', animation:'jg1 0.5s ease-out both' }} />

          {(() => {
            const h = new Date().getHours();
            const dow = new Date().getDay();
            const dom = new Date().getDate();
            const dLeft = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate() - dom;
            const greetLine = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Good night';
            const line2 = streak >= 30 ? `${streak} days straight, sir. Remarkable.`
              : streak >= 7 ? `${streak} day streak on the line, sir.`
              : streak > 0 ? `I've been keeping count, sir. ${streak} days.`
              : dom === 1 ? `New month, sir. How you start matters.`
              : dLeft === 0 ? `Last day of the month, sir. Close it clean.`
              : dow === 1 ? `It's Monday, sir. The week is watching.`
              : dow === 0 ? `Sunday, sir. Last chance to close the week right.`
              : `I've been expecting you.`;
            return (
              <div style={{ textAlign:'center', padding:'0 40px', fontFamily:"'SF Mono', Monaco, monospace" }}>
                <p className="jgl1" style={{ fontSize:13, color:'#555', fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', margin:'0 0 28px' }}>SYSTEM ONLINE</p>
                <p className="jgl1" style={{ fontSize:30, fontWeight:900, letterSpacing:'-0.02em', color:'#fff', margin:'0 0 14px', lineHeight:1.2, fontFamily:'inherit' }}>
                  {greetLine}, <span style={{ color:'#7c9cf8' }}>{currentUser.username}.</span>
                </p>
                <p className="jgl2" style={{ fontSize:15, fontWeight:600, color:'#fff', margin:'0 0 10px', letterSpacing:'0.02em', fontFamily:'inherit' }}>{line2}</p>
                <p className="jgl3" style={{ fontSize:12, color:'#fff', margin:0, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'inherit' }}>Initiating daily scan<span className="jg-cursor">_</span></p>
              </div>
            );
          })()}

          <p style={{ position:'absolute', bottom:40, fontSize:10, color:'#252525', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:"'SF Mono', Monaco, monospace" }}>TAP TO SKIP</p>
        </div>
      )}

    </AppShell>
  );
}
