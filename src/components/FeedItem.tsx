import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, Trash2, Send, Repeat2, BarChart3, Plus, Smile } from 'lucide-react';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useApp, timeAgo, REACTIONS, type Post, type ReactionEmoji } from '@/store/AppContext';
import { showToast } from './Toast';
import RichText from './RichText';

interface FeedItemProps {
  post: Post;
  onTagClick?: (tag: string) => void;
  embedded?: boolean;
}

export default function FeedItem({ post, onTagClick, embedded }: FeedItemProps) {
  const { state, dispatch, user } = useApp();
  const author = user(post.authorId);
  const me = state.currentUserId;
  const isLiked = post.likedBy.includes(me);
  const isMine = post.authorId === me;

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteText, setQuoteText] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const reactionRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const inView = useInView(articleRef, { once: true, margin: '0px 0px -50px 0px' });

  const quotedPost = post.quotedPostId ? state.posts.find((p) => p.id === post.quotedPostId) : null;

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (reactionRef.current && !reactionRef.current.contains(e.target as Node)) setReactionPickerOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Same Here', text: post.content, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(post.content);
        showToast('Copied to clipboard');
      }
    } catch {}
  };

  const submitComment = () => {
    if (!commentText.trim()) return;
    dispatch({ type: 'ADD_COMMENT', postId: post.id, text: commentText.trim() });
    setCommentText('');
  };

  const submitQuote = () => {
    dispatch({
      type: 'ADD_POST',
      post: {
        id: 'p_' + Math.random().toString(36).slice(2, 9),
        authorId: me,
        content: quoteText.trim(),
        createdAt: Date.now(),
        likedBy: [],
        reactions: {},
        comments: [],
        quotedPostId: post.id,
      },
    });
    setQuoteText('');
    setQuoteOpen(false);
    showToast('Quoted');
  };

  const totalReactions = useMemo(
    () => Object.values(post.reactions).reduce((sum, list) => sum + (list?.length ?? 0), 0),
    [post.reactions]
  );

  const topReactions = useMemo(
    () =>
      (Object.entries(post.reactions) as [ReactionEmoji, string[]][])
        .filter(([, v]) => v && v.length > 0)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 3),
    [post.reactions]
  );

  const totalVotes = post.poll?.options.reduce((s, o) => s + o.votes.length, 0) ?? 0;
  const userVotedOption = post.poll?.options.find((o) => o.votes.includes(me))?.id;

  return (
    <motion.article
      ref={articleRef}
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'glass-card rounded-2xl overflow-hidden group transition-all duration-300',
        embedded && 'border border-white/10 bg-white/3'
      )}
    >
      <div className={embedded ? 'p-4' : 'p-6'}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={author.avatar}
              alt={author.name}
              className={cn('rounded-full border border-white/10 object-cover', embedded ? 'w-8 h-8' : 'w-10 h-10')}
            />
            <div className="min-w-0">
              <h4 className={cn('font-semibold text-white truncate', embedded ? 'text-xs' : 'text-sm')}>
                {author.name}
              </h4>
              <span className="text-xs text-slate-500">{timeAgo(post.createdAt)}</span>
            </div>
          </div>
          {!embedded && (
            <div className="flex items-center gap-3">
              {post.tag && (
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                    post.tagColor || 'bg-secondary/10 text-secondary border-secondary/20'
                  )}
                >
                  {post.tag}
                </span>
              )}
              {post.mood && !post.tag && (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-primary/10 text-primary border-primary/30">
                  {post.mood}
                </span>
              )}
              <div ref={menuRef} className="relative">
                <button onClick={() => setMenuOpen((v) => !v)} className="text-slate-500 hover:text-white p-1">
                  <MoreHorizontal size={18} />
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      className="absolute right-0 top-7 w-48 glass-card rounded-xl border border-white/10 shadow-2xl z-20 overflow-hidden"
                    >
                      <button
                        onClick={() => {
                          dispatch({ type: 'TOGGLE_BOOKMARK', id: post.id });
                          setMenuOpen(false);
                          showToast(post.bookmarked ? 'Removed bookmark' : 'Bookmarked');
                        }}
                        className="w-full px-4 py-2.5 flex items-center gap-2 text-sm text-slate-300 hover:bg-white/5"
                      >
                        <Bookmark size={14} fill={post.bookmarked ? 'currentColor' : 'none'} />
                        {post.bookmarked ? 'Remove bookmark' : 'Bookmark'}
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(post.content);
                          showToast('Copied to clipboard');
                          setMenuOpen(false);
                        }}
                        className="w-full px-4 py-2.5 flex items-center gap-2 text-sm text-slate-300 hover:bg-white/5"
                      >
                        <Share2 size={14} /> Copy text
                      </button>
                      {isMine && (
                        <button
                          onClick={() => {
                            if (confirm('Delete this entry?')) {
                              dispatch({ type: 'DELETE_POST', id: post.id });
                              showToast('Entry deleted');
                            }
                            setMenuOpen(false);
                          }}
                          className="w-full px-4 py-2.5 flex items-center gap-2 text-sm text-rose-400 hover:bg-rose-500/10 border-t border-white/5"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {post.title && !embedded && (
          <h3 className="text-2xl font-black text-white mb-3 tracking-tight">{post.title}</h3>
        )}

        {post.content && (
          <p
            className={cn(
              'text-on-surface-variant leading-relaxed mb-4 whitespace-pre-wrap break-words',
              embedded ? 'text-[13px]' : 'text-[15px]'
            )}
          >
            <RichText text={post.content} onTagClick={onTagClick} />
          </p>
        )}

        {/* Quoted post embed */}
        {quotedPost && !embedded && (
          <div className="mb-4 -mx-1">
            <FeedItem post={quotedPost} embedded onTagClick={onTagClick} />
          </div>
        )}

        {/* Poll */}
        {post.poll && !embedded && (
          <div className="mb-4 space-y-2">
            <p className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <BarChart3 size={14} className="text-primary" />
              {post.poll.question}
            </p>
            {post.poll.options.map((opt) => {
              const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
              const voted = userVotedOption === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => dispatch({ type: 'VOTE_POLL', postId: post.id, optionId: opt.id })}
                  className={cn(
                    'w-full relative overflow-hidden border rounded-xl px-4 py-2.5 text-left transition-all group',
                    voted
                      ? 'border-primary bg-primary/10 text-white'
                      : 'border-white/10 bg-white/5 hover:border-primary/40 text-slate-200'
                  )}
                >
                  <motion.div
                    layout
                    initial={false}
                    animate={{ width: `${pct}%` }}
                    transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    className={cn(
                      'absolute inset-y-0 left-0',
                      voted ? 'bg-primary/20' : 'bg-white/5'
                    )}
                  />
                  <div className="relative flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold truncate">{opt.text}</span>
                    <span className="text-xs font-bold text-slate-400 tabular-nums shrink-0">
                      {pct}% · {opt.votes.length}
                    </span>
                  </div>
                </button>
              );
            })}
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {totalVotes} vote{totalVotes === 1 ? '' : 's'}
            </p>
          </div>
        )}

        {/* Reaction stack */}
        {!embedded && totalReactions > 0 && (
          <div className="flex items-center gap-1 mb-3">
            {topReactions.map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => dispatch({ type: 'TOGGLE_REACTION', id: post.id, emoji })}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs transition-all hover:scale-105',
                  users.includes(me)
                    ? 'border-primary/40 bg-primary/10 text-white'
                    : 'border-white/5 bg-white/5 text-slate-300 hover:border-white/20'
                )}
              >
                <span className="text-sm">{emoji}</span>
                <span className="font-bold tabular-nums">{users.length}</span>
              </button>
            ))}
          </div>
        )}

        {!embedded && (
          <div className="flex items-center gap-1 md:gap-4 pt-4 border-t border-white/5 flex-wrap">
            <div ref={reactionRef} className="relative">
              <button
                onClick={() => dispatch({ type: 'TOGGLE_LIKE', id: post.id })}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setReactionPickerOpen(true);
                }}
                onMouseEnter={() => {
                  // Long-press style: open picker after small delay; simple here on hover
                }}
                className={cn(
                  'flex items-center gap-2 px-2 py-1 rounded-lg transition-all group',
                  isLiked ? 'text-primary font-bold' : 'text-slate-400 hover:text-primary hover:bg-white/5'
                )}
              >
                <motion.div
                  key={String(isLiked)}
                  animate={isLiked ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                </motion.div>
                <span className="text-[11px] font-bold">
                  {isLiked ? `Same Here · ${post.likedBy.length}` : post.likedBy.length}
                </span>
              </button>
              <button
                onClick={() => setReactionPickerOpen((v) => !v)}
                className="absolute -right-1 -top-1 w-4 h-4 bg-white/10 hover:bg-primary text-slate-400 hover:text-[#002b73] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="More reactions"
              >
                <Plus size={10} strokeWidth={3} />
              </button>
              <AnimatePresence>
                {reactionPickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.9 }}
                    className="absolute bottom-10 left-0 glass-card rounded-full border border-white/10 shadow-2xl px-2 py-1.5 flex gap-1 z-20"
                  >
                    {REACTIONS.map((emoji) => {
                      const has = post.reactions[emoji]?.includes(me);
                      return (
                        <motion.button
                          key={emoji}
                          whileHover={{ scale: 1.3, y: -3 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            dispatch({ type: 'TOGGLE_REACTION', id: post.id, emoji });
                            setReactionPickerOpen(false);
                          }}
                          className={cn(
                            'w-9 h-9 rounded-full flex items-center justify-center text-lg transition-colors',
                            has ? 'bg-primary/20' : 'hover:bg-white/10'
                          )}
                        >
                          {emoji}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setReactionPickerOpen((v) => !v)}
              className="hidden md:flex items-center gap-2 px-2 py-1 rounded-lg text-slate-400 hover:text-primary hover:bg-white/5 transition-all"
              title="Add reaction"
            >
              <Smile size={20} />
            </button>

            <button
              onClick={() => setShowComments((v) => !v)}
              className={cn(
                'flex items-center gap-2 px-2 py-1 rounded-lg transition-colors',
                showComments ? 'text-white bg-white/5' : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <MessageCircle size={20} />
              <span className="text-[11px] font-bold uppercase tracking-wider">{post.comments.length}</span>
            </button>

            <button
              onClick={() => setQuoteOpen((v) => !v)}
              className={cn(
                'flex items-center gap-2 px-2 py-1 rounded-lg transition-colors',
                quoteOpen ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-primary hover:bg-white/5'
              )}
              title="Quote"
            >
              <Repeat2 size={20} />
            </button>

            <button
              onClick={() => {
                dispatch({ type: 'TOGGLE_BOOKMARK', id: post.id });
                showToast(post.bookmarked ? 'Removed bookmark' : 'Bookmarked');
              }}
              className={cn(
                'flex items-center gap-2 px-2 py-1 rounded-lg transition-colors',
                post.bookmarked ? 'text-primary' : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Bookmark size={20} fill={post.bookmarked ? 'currentColor' : 'none'} />
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-2 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors ml-auto"
            >
              <Share2 size={20} />
            </button>
          </div>
        )}

        <AnimatePresence initial={false}>
          {quoteOpen && !embedded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-5 mt-2 border-t border-white/5 space-y-3">
                <textarea
                  value={quoteText}
                  onChange={(e) => setQuoteText(e.target.value)}
                  placeholder="Add a thought before quoting…"
                  rows={2}
                  className="w-full bg-[#0b0e11] border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-slate-600 focus:border-primary/40 outline-none resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setQuoteOpen(false);
                      setQuoteText('');
                    }}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white px-3 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitQuote}
                    className="bg-primary text-[#002b73] px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                  >
                    Quote
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {showComments && !embedded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-5 mt-2 border-t border-white/5 space-y-4">
                {post.comments.map((c) => {
                  const cAuthor = user(c.authorId);
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-3"
                    >
                      <img src={cAuthor.avatar} className="w-8 h-8 rounded-full" alt="" />
                      <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl px-4 py-2.5">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-xs font-bold text-white">{cAuthor.name}</span>
                          <span className="text-[10px] text-slate-500">{timeAgo(c.time)}</span>
                        </div>
                        <p className="text-sm text-slate-300 break-words">
                          <RichText text={c.text} onTagClick={onTagClick} />
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
                <div className="flex gap-3 items-start">
                  <img src={state.users[me].avatar} className="w-8 h-8 rounded-full" alt="" />
                  <div className="flex-1 flex gap-2">
                    <input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          submitComment();
                        }
                      }}
                      placeholder="Add a thoughtful reply..."
                      className="flex-1 bg-[#0b0e11] border border-white/5 rounded-full px-4 py-2 text-sm text-white placeholder:text-slate-600 focus:border-primary/40 outline-none"
                    />
                    <button
                      onClick={submitComment}
                      disabled={!commentText.trim()}
                      className={cn(
                        'p-2 rounded-full transition-all',
                        commentText.trim()
                          ? 'bg-accent-blue text-white hover:scale-105'
                          : 'bg-white/5 text-slate-600 cursor-not-allowed'
                      )}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}
