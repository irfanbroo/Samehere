import { Flame, X, Hash } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import PostComposer from './PostComposer';
import FeedItem from './FeedItem';
import { useApp, extractHashtags } from '@/store/AppContext';
import { cn } from '@/lib/utils';

function StreakRing({ days, target = 30 }: { days: number; target?: number }) {
  const pct = Math.min(1, days / target);
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  return (
    <div className="relative shrink-0 flex flex-col items-center gap-1.5">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
          <defs>
            <linearGradient id="streakGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#b2c5ff" />
              <stop offset="100%" stopColor="#3E7BFF" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="4" fill="none" />
          <motion.circle
            cx="32"
            cy="32"
            r={r}
            stroke="url(#streakGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: 'drop-shadow(0 0 6px rgba(178,197,255,0.4))' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
          >
            <Flame size={14} className="text-primary fill-primary" />
          </motion.div>
          <span className="text-xl font-black text-white leading-none mt-0.5 tabular-nums">{days}</span>
        </div>
      </div>
      <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Day Streak</span>
    </div>
  );
}

interface FeedProps {
  search: string;
  tagFilter: string | null;
  onTagFilter: (tag: string | null) => void;
}

type Filter = 'all' | 'connections' | 'liked' | 'mine';

export default function Feed({ search, tagFilter, onTagFilter }: FeedProps) {
  const { state } = useApp();
  const [filter, setFilter] = useState<Filter>('all');

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const visiblePosts = useMemo(() => {
    let posts = state.posts;
    if (filter === 'connections') {
      posts = posts.filter((p) => state.connections.includes(p.authorId) || p.authorId === state.currentUserId);
    } else if (filter === 'liked') {
      posts = posts.filter((p) => p.likedBy.includes(state.currentUserId));
    } else if (filter === 'mine') {
      posts = posts.filter((p) => p.authorId === state.currentUserId);
    }
    if (tagFilter) {
      posts = posts.filter((p) => extractHashtags(p.content).includes(tagFilter.toLowerCase()));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      posts = posts.filter((p) => {
        const author = state.users[p.authorId];
        return (
          p.content.toLowerCase().includes(q) ||
          (p.title?.toLowerCase().includes(q) ?? false) ||
          (p.tag?.toLowerCase().includes(q) ?? false) ||
          author?.name.toLowerCase().includes(q)
        );
      });
    }
    return posts;
  }, [state.posts, state.connections, state.currentUserId, state.users, filter, search, tagFilter]);

  // Scroll to top on filter changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filter, tagFilter]);

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-[#272a2e] to-[#1d2023] p-6 rounded-2xl border border-white/5 shadow-xl overflow-hidden"
      >
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
        <div className="relative">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            {greeting}, {state.users[state.currentUserId].name}
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <p className="text-sm text-slate-400 italic">
              {state.streak}-day streak. {state.entries} entries. Keep the spark alive.
            </p>
          </div>
        </div>
        <StreakRing days={state.streak} />
      </motion.section>

      <PostComposer />

      <AnimatePresence>
        {tagFilter && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 bg-primary/10 border border-primary/30 px-4 py-3 rounded-xl"
          >
            <Hash size={16} className="text-primary" />
            <p className="text-sm text-white">
              Showing entries tagged{' '}
              <span className="font-bold text-primary">{tagFilter}</span>
            </p>
            <button
              onClick={() => onTagFilter(null)}
              className="ml-auto text-slate-400 hover:text-white p-1 rounded hover:bg-white/5"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'connections', 'liked', 'mine'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-all',
              filter === f
                ? 'bg-primary text-[#002b73] border-primary scale-105'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:border-white/20'
            )}
          >
            {f === 'all' ? 'For you' : f === 'connections' ? 'Following' : f === 'liked' ? 'Liked' : 'Your posts'}
          </button>
        ))}
        {search.trim() && (
          <span className="ml-auto text-[11px] text-slate-500 font-bold uppercase tracking-wider">
            {visiblePosts.length} result{visiblePosts.length === 1 ? '' : 's'} for "{search}"
          </span>
        )}
      </div>

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {visiblePosts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-card rounded-2xl p-12 text-center"
            >
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Nothing here yet</p>
              <p className="text-slate-500 text-sm">Try a different filter, or share an entry of your own.</p>
            </motion.div>
          ) : (
            visiblePosts.map((post) => (
              <FeedItem key={post.id} post={post} onTagClick={onTagFilter} />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
