'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import AppShell from '@/components/AppShell';
import RightPanel from '@/components/RightPanel';
import Avatar from '@/components/Avatar';
import LikeButton from '@/components/LikeButton';
import { useIsMobile } from '@/lib/useIsMobile';

// ── animation variants ──────────────────────────────────────
const cardVariants = {
  hidden:  { opacity: 0, y: 24, scale: 0.98 },
  visible: { opacity: 1, y: 0,  scale: 1,    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -12, scale: 0.97, transition: { duration: 0.2 } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
};

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
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ALL_TAGS = ['#study', '#gym', '#coding', '#work', '#art', '#music', '#gaming', '#nocturnal', '#grind', '#reading', '#cooking', '#fitness', '#sleep', '#earlybird', '#introverted', '#extroverted', '#traveler', '#selfcare', '#sports', '#content', '#poetry', '#drawing', '#photography', '#writing', '#anime', '#foodie', '#linux', '#student', '#college', '#highschool', '#parenting', '#nightowl'];
  const CONTENT_LIMIT = 220;
  const isLong = entry.content.length > CONTENT_LIMIT;
  const moodColor = entry.mood ? MOOD_COLORS[entry.mood] : null;

  function toggleTag(tag) { setDraftTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]); }

  async function handleSave() {
    if (!draft.trim()) return;
    setSaving(true);
    await onEdit(entry.id, draft, draftTags);
    setSaving(false);
    setEditing(false);
  }

  return (
    <motion.div
      layout
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={{ y: -3, transition: { type: 'spring', stiffness: 400, damping: 28 } }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        background: '#0d0d14',
        borderRadius: 20,
        border: `1px solid ${hovered
          ? (moodColor ? `${moodColor}40` : 'rgba(124,58,237,0.3)')
          : (moodColor ? `${moodColor}18` : 'rgba(124,58,237,0.1)')}`,
        marginBottom: 10,
        overflow: 'hidden',
        willChange: 'transform',
        position: 'relative',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        boxShadow: hovered
          ? (moodColor ? `0 8px 40px ${moodColor}14, 0 2px 12px rgba(0,0,0,0.4)` : '0 8px 40px rgba(124,58,237,0.12), 0 2px 12px rgba(0,0,0,0.4)')
          : '0 1px 4px rgba(0,0,0,0.3)',
      }}
    >
      {/* mood accent left bar */}
      {moodColor && (
        <motion.div
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
            background: `linear-gradient(180deg, ${moodColor}ee 0%, ${moodColor}33 100%)`,
            borderRadius: '20px 0 0 20px',
            transformOrigin: 'top',
          }}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 10px', paddingLeft: moodColor ? 20 : 16 }}>
        <Link href={`/profile/${entry.user_id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
            <Avatar username={entry.username} profilePic={entry.profile_pic} size={36} radius={12} />
          </motion.div>
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link href={`/profile/${entry.user_id}`} style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'block', lineHeight: 1.3 }}>
            {entry.username}
          </Link>
          <span style={{ color: '#334155', fontSize: 11, letterSpacing: '0.01em' }}>{timeAgo(entry.created_at)}</span>
        </div>
        {moodColor && (
          <motion.span
            initial={{ opacity: 0, scale: 0.75, x: 8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.12, type: 'spring', stiffness: 300, damping: 22 }}
            style={{
              background: `${moodColor}12`, color: moodColor,
              border: `1px solid ${moodColor}28`,
              borderRadius: 20, padding: '3px 10px',
              fontSize: 11, fontWeight: 600, letterSpacing: '0.02em', textTransform: 'capitalize',
            }}
          >{entry.mood}</motion.span>
        )}
      </div>

      {/* Content */}
      <motion.div layout style={{ padding: '0 16px 12px', paddingLeft: moodColor ? 20 : 16 }}>
        {editing ? (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <textarea value={draft} onChange={e => setDraft(e.target.value)} autoFocus
              style={{ width: '100%', minHeight: 100, background: 'rgba(124,58,237,0.05)', color: '#e2e8f0', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 12, padding: 12, fontSize: 14, lineHeight: 1.75, resize: 'vertical', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(124,58,237,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(124,58,237,0.25)'; e.target.style.boxShadow = 'none'; }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, margin: '10px 0' }}>
              {ALL_TAGS.map(tag => (
                <motion.button key={tag} type="button" onClick={() => toggleTag(tag)}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    border: `1px solid ${draftTags.includes(tag) ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.06)'}`,
                    background: draftTags.includes(tag) ? 'rgba(124,58,237,0.2)' : 'transparent',
                    color: draftTags.includes(tag) ? '#a78bfa' : '#475569',
                    borderRadius: 20, padding: '3px 10px', fontSize: 11, cursor: 'pointer',
                    fontWeight: draftTags.includes(tag) ? 600 : 400, transition: 'all 0.15s',
                  }}>{tag}</motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <Link href={`/entry/${entry.id}`} style={{ textDecoration: 'none' }}>
            <motion.p layout style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>
              {isLong && !expanded ? entry.content.slice(0, CONTENT_LIMIT) + '…' : entry.content}
            </motion.p>
            {isLong && (
              <motion.button
                onClick={e => { e.preventDefault(); e.stopPropagation(); setExpanded(p => !p); }}
                whileTap={{ scale: 0.95 }}
                style={{ background: 'none', border: 'none', color: '#6d28d9', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '5px 0 0', letterSpacing: '0.01em', display: 'flex', alignItems: 'center', gap: 4, transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
                onMouseLeave={e => e.currentTarget.style.color = '#6d28d9'}
              >
                <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3, ease: [0.22,1,0.36,1] }} style={{ display: 'inline-block', lineHeight: 1 }}>↓</motion.span>
                {expanded ? 'Show less' : 'Read more'}
              </motion.button>
            )}
          </Link>
        )}
      </motion.div>

      {/* Tags */}
      <AnimatePresence>
        {!editing && entry.tags?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: '0 16px 12px', paddingLeft: moodColor ? 20 : 16 }}
          >
            {entry.tags.map((t, i) => (
              <motion.span
                key={t}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 22 }}
                whileHover={{ scale: 1.08, color: '#a78bfa' }}
                style={{
                  background: 'rgba(124,58,237,0.06)', color: '#334155',
                  borderRadius: 20, padding: '2px 9px', fontSize: 11,
                  border: '1px solid rgba(124,58,237,0.1)',
                  fontWeight: 500, letterSpacing: '0.01em', cursor: 'default', display: 'inline-block',
                  transition: 'color 0.15s, border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#a78bfa'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; e.currentTarget.style.background = 'rgba(124,58,237,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#334155'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.1)'; e.currentTarget.style.background = 'rgba(124,58,237,0.06)'; }}
              >{t}</motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px 12px', paddingLeft: moodColor ? 20 : 16, borderTop: '1px solid rgba(255,255,255,0.03)', gap: 2 }}>
        {!editing ? (
          <>
            <LikeButton liked={entry.liked} count={entry.likes_count} onLike={() => onLike(entry.id)} />
            <Link href={`/entry/${entry.id}`} style={{
              color: '#334155', fontSize: 13, textDecoration: 'none', marginLeft: 10,
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 9px', borderRadius: 9,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#a78bfa'; e.currentTarget.style.background = 'rgba(124,58,237,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#334155'; e.currentTarget.style.background = 'transparent'; }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span style={{ fontWeight: 500 }}>{entry.comments_count}</span>
            </Link>
            {isOwn && (
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}
                onClick={() => { setDraft(entry.content); setDraftTags(entry.tags || []); setEditing(true); }}
                style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', color: '#334155', borderRadius: 9, padding: '5px 11px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.35)'; e.currentTarget.style.color = '#a78bfa'; e.currentTarget.style.background = 'rgba(124,58,237,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#334155'; e.currentTarget.style.background = 'transparent'; }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit
              </motion.button>
            )}
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => onDelete(entry.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f43f5e', fontSize: 12, padding: 0, fontWeight: 600 }}>Delete</motion.button>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => setEditing(false)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', color: '#475569', borderRadius: 9, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>Cancel</motion.button>
              <motion.button whileTap={{ scale: 0.96 }} onClick={handleSave} disabled={saving} style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'none', color: '#fff', borderRadius: 9, padding: '5px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 12, boxShadow: '0 2px 12px rgba(109,40,217,0.3)' }}>
                {saving ? '…' : 'Save'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
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
            0%, 100% { opacity: 0.25; }
            50% { opacity: 0.7; }
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
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
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#334155', marginBottom: 5 }}>
                      {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
                    </div>
                    <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', margin: 0, color: '#e2e8f0' }}>
                      {greet} <span style={{ background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{currentUser?.username || 'there'}.</span>
                    </h1>
                  </div>
                  <button onClick={() => router.push('/discover')} style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 12, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', cursor: 'pointer', flexShrink: 0, marginTop: 4, transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.15)'; e.currentTarget.style.color = '#a78bfa'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.08)'; e.currentTarget.style.color = '#475569'; }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </button>
                </div>

                {/* Day 1 card */}
                <div style={{ margin: '18px 16px 0', borderRadius: 20, overflow: 'hidden', background: '#0d0d14', border: '1px solid rgba(124,58,237,0.15)', position: 'relative' }}>
                  <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.5), rgba(167,139,250,0.3), transparent)' }} />
                  <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 300, height: 200, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(124,58,237,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

                  {/* Progress bar */}
                  {(() => {
                    const done = (diaryEntries.length > 0 ? 1 : 0) + (todos.length > 0 ? 1 : 0);
                    const pct = (done / 2) * 100;
                    return (
                      <div style={{ padding: '14px 20px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155' }}>Getting started</span>
                          <span style={{ fontSize: 10, color: '#334155' }}>{done}/2</span>
                        </div>
                        <div style={{ height: 3, background: 'rgba(124,58,237,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#22c55e' : 'linear-gradient(90deg,#7c3aed,#a78bfa)', borderRadius: 2, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    );
                  })()}

                  <div style={{ padding: '24px 26px 28px', position: 'relative', textAlign: 'center' }}>
                    <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: '#e2e8f0', lineHeight: 1.25, margin: '0 0 8px' }}>
                      Everyone starts somewhere.
                    </h2>
                    <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, margin: '0 0 24px', maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>
                      Today is Day 1. No history, no streak, no pressure. Just start.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, textAlign: 'left' }}>
                      {[
                        { label: 'Write your first diary entry', done: diaryEntries.length > 0, href: '/diary/new' },
                        { label: 'Add a task for today', done: todos.length > 0, href: '/todos' },
                      ].map((item, i) => (
                        <div key={i} onClick={() => !item.done && router.push(item.href)} style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                          background: 'rgba(124,58,237,0.05)', borderRadius: 14,
                          border: `1px solid ${item.done ? 'rgba(34,197,94,0.2)' : 'rgba(124,58,237,0.12)'}`,
                          cursor: item.done ? 'default' : 'pointer', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { if (!item.done) { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.35)'; e.currentTarget.style.background = 'rgba(124,58,237,0.1)'; }}}
                        onMouseLeave={e => { if (!item.done) { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.12)'; e.currentTarget.style.background = 'rgba(124,58,237,0.05)'; }}}>
                          <div style={{
                            width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                            background: item.done ? '#22c55e' : 'transparent',
                            border: `2px solid ${item.done ? '#22c55e' : 'rgba(124,58,237,0.3)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s',
                          }}>
                            {item.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                          </div>
                          <span style={{
                            fontSize: 14, fontWeight: 600,
                            color: item.done ? '#22c55e' : '#94a3b8',
                            textDecoration: item.done ? 'line-through' : 'none',
                            opacity: item.done ? 0.6 : 1, transition: 'all 0.2s',
                          }}>{item.label}</span>
                          {!item.done && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto' }}><polyline points="9 18 15 12 9 6"/></svg>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Feed divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 20px 0', marginBottom: 14 }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(124,58,237,0.1)' }} />
                  <span style={{ fontSize: 9, color: '#334155', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>From Same Here</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(124,58,237,0.1)' }} />
                </div>
              </>
            );

            return (
              <>
                {/* Header */}
                <motion.div
                  variants={staggerContainer} initial="hidden" animate="visible"
                  style={{ padding: '28px 20px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}
                >
                  <motion.div variants={fadeUp}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#334155', marginBottom: 5 }}>
                      {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
                    </div>
                    <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', margin: 0, color: '#e2e8f0' }}>
                      {greet} <span style={{ background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{currentUser?.username || 'there'}.</span>
                    </h1>
                  </motion.div>
                  <motion.button variants={fadeUp} whileHover={{ scale: 1.1, rotate: 8 }} whileTap={{ scale: 0.92 }} onClick={() => router.push('/discover')}
                    style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 12, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', cursor: 'pointer', flexShrink: 0, marginTop: 4, transition: 'color 0.2s, background 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#a78bfa'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#475569'; }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </motion.button>
                </motion.div>

                {/* Jarvis scan line */}
                {jarvisLine ? (
                  <motion.div
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25, duration: 0.5, ease: [0.22,1,0.36,1] }}
                    style={{ padding: '8px 22px 0' }}
                  >
                    <p style={{
                      fontSize: 18, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.35, margin: 0,
                      background: 'linear-gradient(135deg, #e2e8f0 0%, #475569 100%)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    }}>{jarvisLine}</p>
                  </motion.div>
                ) : null}

                {/* Briefing */}
                {attentionCount > 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.45, ease: [0.22,1,0.36,1] }}
                    style={{ margin: '16px 16px 0', padding: '18px 20px', background: 'rgba(13,13,20,0.95)', borderRadius: 18, border: `1px solid ${accentColor}22`, position: 'relative', overflow: 'hidden' }}
                  >
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${accentColor}88,${accentColor}22,transparent)`, borderRadius: '18px 18px 0 0' }} />
                    <div style={{ position:'absolute', top:-40, left:-40, width:160, height:160, borderRadius:'50%', background:`radial-gradient(circle,${accentColor}07,transparent 70%)`, pointerEvents:'none' }} />
                    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4, duration:0.4 }}>
                      <div style={{ fontSize:24, fontWeight:800, letterSpacing:'-0.03em', color:'#e2e8f0', lineHeight:1.2, marginBottom:2 }}>{headline}</div>
                      <div style={{ fontSize:24, fontWeight:800, letterSpacing:'-0.03em', color:accentColor, lineHeight:1.2, marginBottom:14 }}>{headlineAccent}</div>
                    </motion.div>
                    {(() => {
                      const primaryItem = items.find(i => i.href);
                      if (!primaryItem) return null;
                      const ctaLabel = !wroteToday ? "Write today's entry" : 'Go to tasks';
                      return (
                        <motion.div
                          initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.5, duration:0.35 }}
                          onClick={() => router.push(primaryItem.href)}
                          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'8px 16px', background:`${accentColor}0e`, border:`1px solid ${accentColor}28`, borderRadius:20, cursor:'pointer', transition:'background 0.15s, border-color 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background=`${accentColor}1c`; e.currentTarget.style.borderColor=`${accentColor}50`; }}
                          onMouseLeave={e => { e.currentTarget.style.background=`${accentColor}0e`; e.currentTarget.style.borderColor=`${accentColor}28`; }}
                        >
                          <span style={{ fontSize:12, fontWeight:700, color:accentColor }}>{ctaLabel}</span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </motion.div>
                      );
                    })()}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    style={{ padding: '12px 22px 0' }}
                  >
                    <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.03em', color:'#e2e8f0', lineHeight:1.2, marginBottom:2 }}>{headline}</div>
                    <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.03em', color:accentColor, lineHeight:1.2 }}>{headlineAccent}</div>
                  </motion.div>
                )}

                {/* Stat cards */}
                <motion.div
                  variants={staggerContainer} initial="hidden" animate="visible"
                  style={{ display: 'flex', gap: 8, padding: '12px 16px 0' }}
                >
                  {[
                    { val: wroteToday ? '✓' : '—', label: 'diary today', color: wroteToday ? '#22c55e' : '#f43f5e' },
                    { val: `${todayDone}/${todayTodos.length || 0}`, label: 'tasks done', color: todayDone === todayTodos.length && todayTodos.length > 0 ? '#22c55e' : '#f59e0b' },
                    { val: streak > 0 ? `${streak}` : '0', label: `day streak${streak > 0 ? ' 🔥' : ''}`, color: streak > 0 ? '#a78bfa' : '#334155' },
                  ].map((s, i) => (
                    <motion.div key={i} variants={fadeUp}
                      whileHover={{ y: -2, scale: 1.03 }} transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                      style={{ flex: 1, background: 'rgba(13,13,20,0.9)', border: '1px solid rgba(124,58,237,0.1)', borderRadius: 14, padding: '12px 10px', position: 'relative', overflow: 'hidden', cursor: 'default' }}
                    >
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${s.color}55, transparent)` }} />
                      <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.val}</div>
                      <div style={{ fontSize: 9, color: '#334155', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Quote */}
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }}
                  style={{ margin: '14px 16px 0', position: 'relative', padding: '20px 20px', textAlign: 'center', overflow: 'hidden', background: 'rgba(124,58,237,0.04)', borderRadius: 16, border: '1px solid rgba(124,58,237,0.08)' }}
                >
                  <motion.div
                    style={{ position: 'absolute', left: 0, top: '15%', bottom: '15%', width: 2, background: 'linear-gradient(180deg,transparent,rgba(124,58,237,0.5),transparent)', borderRadius: 2 }}
                    animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <p style={{
                    fontSize: 15, fontWeight: 700, margin: 0, lineHeight: 1.55,
                    letterSpacing: '-0.015em', position: 'relative',
                    background: 'linear-gradient(135deg, #94a3b8 30%, #475569 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}>"{subLine}"</p>
                </motion.div>

                {/* Feed divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 20px 0', marginBottom: 14 }}>
                  <motion.div animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, rgba(124,58,237,0.4))' }} />
                  <span style={{ fontSize: 9, color: '#334155', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>From Same Here</span>
                  <motion.div animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, rgba(124,58,237,0.4))' }} />
                </div>
              </>
            );
          })()}

          <div style={{ padding: '0 16px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
              <div style={{ width: 28, height: 28, border: '2px solid rgba(124,58,237,0.15)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : (
          <>
            {/* No following — prompt to follow people */}
            {entries.length === 0 && exploreEntries.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', marginBottom: 16,
                background: 'rgba(124,58,237,0.06)',
                border: '1px solid rgba(124,58,237,0.15)',
                borderRadius: 16,
              }}>
                <div style={{ fontSize: 20 }}>👋</div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#e2e8f0' }}>Find the person living your day.</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#475569' }}>Showing public posts for now</p>
                </div>
                <Link href="/discover" style={{
                  background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
                  color: '#fff', fontSize: 12, fontWeight: 700,
                  padding: '7px 14px', borderRadius: 20,
                  textDecoration: 'none', whiteSpace: 'nowrap',
                  boxShadow: '0 2px 12px rgba(109,40,217,0.3)',
                }}>Find people</Link>
              </div>
            )}

            {entries.length === 0 && exploreEntries.length === 0 && (
              <div style={{ textAlign: 'center', marginTop: 60 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#475569' }}>Nothing here yet</p>
                <Link href="/new-entry" style={{ display: 'inline-block', marginTop: 16, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', padding: '10px 24px', borderRadius: 12, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(109,40,217,0.3)' }}>Post Your Day</Link>
              </div>
            )}

            <AnimatePresence>
              <motion.div variants={staggerContainer} initial="hidden" animate="visible">
                {entries.map((e) => (
                  <EntryCard key={e.id} entry={e} onLike={handleLike} onDelete={handleDelete} onEdit={handleEdit} currentUserId={currentUser?.id} />
                ))}
              </motion.div>
            </AnimatePresence>

            {exploreEntries.length > 0 && (
              <>
                <div style={{ margin: '28px 0 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, rgba(124,58,237,0.3))', animation: 'linePulse 3s ease-in-out infinite' }} />
                  <span style={{ color: '#4b3a6e', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>More from Same Here</span>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, rgba(124,58,237,0.3))', animation: 'linePulse 3s ease-in-out infinite' }} />
                </div>
                <AnimatePresence>
                  <motion.div variants={staggerContainer} initial="hidden" animate="visible">
                    {exploreEntries.map((e) => (
                      <EntryCard key={e.id} entry={e} onLike={handleLike} onDelete={handleDelete} onEdit={handleEdit} currentUserId={currentUser?.id} />
                    ))}
                  </motion.div>
                </AnimatePresence>
              </>
            )}
          </>
        )}
          </div>
        </div>


      {/* ── DAILY JARVIS GREETING ── */}
      {showDailyGreet && currentUser && (
        <div onClick={() => { setShowDailyGreet(false); localStorage.setItem('samehere_greeted', new Date().toLocaleDateString('en-CA')); }}
          style={{ position:'fixed', inset:0, background:'#07070b', zIndex:999, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <style>{`
            @keyframes jg1 { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
            @keyframes jg2 { from{opacity:0;transform:translateY(10px)} to{opacity:0.6;transform:translateY(0)} }
            @keyframes jg3 { from{opacity:0;transform:translateY(10px)} to{opacity:0.35;transform:translateY(0)} }
            @keyframes jgfade { 0%,70%{opacity:1} 100%{opacity:0} }
            .jgl1 { animation: jg1 0.55s ease-out 0.2s both, jgfade 4s ease-out forwards; }
            .jgl2 { animation: jg2 0.55s ease-out 0.85s both, jgfade 4s ease-out forwards; }
            .jgl3 { animation: jg3 0.55s ease-out 1.5s both, jgfade 4s ease-out forwards; }
            .jg-cursor { animation: jgblink 1s step-end infinite; }
            @keyframes jgblink { 0%,100%{opacity:1} 50%{opacity:0} }
          `}</style>

          {/* violet top scan line */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(124,58,237,0.5),rgba(167,139,250,0.3),transparent)', animation:'jg1 0.5s ease-out both' }} />
          {/* ambient glow */}
          <div style={{ position:'absolute', top:'30%', left:'50%', transform:'translateX(-50%)', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(109,40,217,0.08) 0%, transparent 70%)', pointerEvents:'none' }} />

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
                <p className="jgl1" style={{ fontSize:11, color:'#4b3a6e', fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', margin:'0 0 32px' }}>SYSTEM ONLINE</p>
                <p className="jgl1" style={{ fontSize:30, fontWeight:800, letterSpacing:'-0.025em', color:'#e2e8f0', margin:'0 0 14px', lineHeight:1.2, fontFamily:'inherit' }}>
                  {greetLine}, <span style={{ background:'linear-gradient(135deg,#a78bfa,#7c3aed)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{currentUser.username}.</span>
                </p>
                <p className="jgl2" style={{ fontSize:15, fontWeight:600, color:'#94a3b8', margin:'0 0 10px', letterSpacing:'0.01em', fontFamily:'inherit' }}>{line2}</p>
                <p className="jgl3" style={{ fontSize:11, color:'#94a3b8', margin:0, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'inherit' }}>Initiating daily scan<span className="jg-cursor" style={{ color:'#7c3aed' }}>_</span></p>
              </div>
            );
          })()}

          <p style={{ position:'absolute', bottom:40, fontSize:10, color:'#1e1b2e', letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:"'SF Mono', Monaco, monospace" }}>TAP TO SKIP</p>
        </div>
      )}

    </AppShell>
  );
}
