import { Smile, MapPin, X, BarChart3, Hash, AtSign, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRef, useState } from 'react';
import { useApp, type Mood, type PollOption } from '@/store/AppContext';
import { showToast } from './Toast';
import { fireConfetti } from './Confetti';
import { cn } from '@/lib/utils';

const MOODS: { label: Mood; emoji: string }[] = [
  { label: 'Inspired', emoji: '✨' },
  { label: 'Peaceful', emoji: '🌿' },
  { label: 'Reflective', emoji: '🌙' },
  { label: 'Creative', emoji: '⚡' },
  { label: 'Productive', emoji: '🔥' },
  { label: 'Grinding', emoji: '💪' },
];

const MAX_LEN = 500;

export default function PostComposer() {
  const { state, dispatch, me } = useApp();
  const [text, setText] = useState('');
  const [mood, setMood] = useState<Mood | null>(null);
  const [showMoods, setShowMoods] = useState(false);
  const [location, setLocation] = useState('');
  const [poll, setPoll] = useState<{ question: string; options: string[] } | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const remaining = MAX_LEN - text.length;
  const validPoll = !poll || (poll.question.trim() && poll.options.filter((o) => o.trim()).length >= 2);
  const canPost = (text.trim().length > 0 || (poll && validPoll)) && remaining >= 0;

  const insertAt = (token: string) => {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const next = text.slice(0, s) + token + text.slice(e);
    setText(next);
    setTimeout(() => {
      ta.focus();
      ta.selectionEnd = s + token.length;
    }, 0);
  };

  const handlePost = () => {
    if (!canPost) return;
    const finalPoll =
      poll && validPoll
        ? {
            question: poll.question.trim(),
            options: poll.options
              .filter((o) => o.trim())
              .map((o, i): PollOption => ({ id: `o_${i}_${Math.random().toString(36).slice(2, 6)}`, text: o.trim(), votes: [] })),
          }
        : undefined;

    dispatch({
      type: 'ADD_POST',
      post: {
        id: 'p_' + Math.random().toString(36).slice(2, 9),
        authorId: state.currentUserId,
        content: text.trim() + (location ? `\n\n📍 ${location}` : ''),
        mood: mood || undefined,
        createdAt: Date.now(),
        likedBy: [],
        reactions: {},
        comments: [],
        poll: finalPoll,
      },
    });
    setText('');
    setMood(null);
    setLocation('');
    setPoll(null);
    setShowMoods(false);
    fireConfetti();
    showToast('Entry posted');
  };

  return (
    <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:shadow-2xl hover:shadow-primary/5 transition-all">
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="relative flex gap-4">
        <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 shrink-0">
          <img src={me.avatar} alt={me.name} />
        </div>
        <div className="flex-1 min-w-0">
          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handlePost();
            }}
            className="w-full bg-transparent border-none text-xl font-semibold placeholder:text-slate-600 focus:ring-0 resize-none min-h-[80px] text-white outline-none"
            placeholder="Write today's entry... use #tags and @mentions"
          />

          {location && (
            <div className="flex items-center gap-2 text-xs text-primary mb-3">
              <MapPin size={12} />
              <span>{location}</span>
              <button onClick={() => setLocation('')} className="text-slate-500 hover:text-white">
                <X size={12} />
              </button>
            </div>
          )}

          {mood && (
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 px-3 py-1 rounded-full text-xs font-bold text-primary mb-3">
              <span>{MOODS.find((m) => m.label === mood)?.emoji}</span>
              {mood}
              <button onClick={() => setMood(null)} className="text-slate-400 hover:text-white">
                <X size={10} />
              </button>
            </div>
          )}

          <AnimatePresence>
            {showMoods && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2 mb-3 overflow-hidden"
              >
                {MOODS.map((m) => (
                  <button
                    key={m.label}
                    onClick={() => {
                      setMood(m.label);
                      setShowMoods(false);
                    }}
                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-primary/40 text-xs font-bold text-slate-300 hover:text-white transition-all hover:scale-105"
                  >
                    <span className="mr-1">{m.emoji}</span>
                    {m.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {poll && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="border border-primary/20 bg-primary/5 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Poll</p>
                    <button
                      onClick={() => setPoll(null)}
                      className="text-slate-500 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <input
                    value={poll.question}
                    onChange={(e) => setPoll({ ...poll, question: e.target.value })}
                    placeholder="Ask a question…"
                    className="w-full bg-[#0b0e11] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-primary/40 outline-none"
                  />
                  {poll.options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={opt}
                        onChange={(e) => {
                          const next = [...poll.options];
                          next[i] = e.target.value;
                          setPoll({ ...poll, options: next });
                        }}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 bg-[#0b0e11] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-primary/40 outline-none"
                      />
                      {poll.options.length > 2 && (
                        <button
                          onClick={() =>
                            setPoll({ ...poll, options: poll.options.filter((_, j) => j !== i) })
                          }
                          className="text-slate-500 hover:text-rose-400 px-2"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  {poll.options.length < 4 && (
                    <button
                      onClick={() => setPoll({ ...poll, options: [...poll.options, ''] })}
                      className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Add option
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mt-4 border-t border-white/5 pt-4 flex-wrap gap-3">
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => insertAt('#')}
                className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-primary transition-colors"
                title="Add hashtag"
              >
                <Hash size={20} />
              </button>
              <button
                onClick={() => insertAt('@')}
                className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-accent-blue transition-colors"
                title="Mention someone"
              >
                <AtSign size={20} />
              </button>
              <button
                onClick={() => setShowMoods((v) => !v)}
                className={cn(
                  'p-2 hover:bg-white/5 rounded-lg transition-colors',
                  showMoods ? 'text-primary' : 'text-slate-400 hover:text-primary'
                )}
                title="Pick a mood"
              >
                <Smile size={20} />
              </button>
              <button
                onClick={() => {
                  const v = prompt('Add a location');
                  if (v) setLocation(v);
                }}
                className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-primary transition-colors"
                title="Add location"
              >
                <MapPin size={20} />
              </button>
              <button
                onClick={() => setPoll(poll ? null : { question: '', options: ['', ''] })}
                className={cn(
                  'p-2 hover:bg-white/5 rounded-lg transition-colors',
                  poll ? 'text-primary' : 'text-slate-400 hover:text-primary'
                )}
                title="Add poll"
              >
                <BarChart3 size={20} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'text-[11px] font-bold tabular-nums',
                  remaining < 0 ? 'text-rose-400' : remaining < 50 ? 'text-amber-400' : 'text-slate-500'
                )}
              >
                {remaining}
              </span>
              <motion.button
                onClick={handlePost}
                disabled={!canPost}
                whileHover={canPost ? { scale: 1.05 } : {}}
                whileTap={canPost ? { scale: 0.95 } : {}}
                className={cn(
                  'px-6 py-2 rounded-full font-bold transition-all',
                  canPost
                    ? 'bg-primary text-[#002b73] pulse-glow'
                    : 'bg-white/5 text-slate-600 cursor-not-allowed'
                )}
              >
                Post Entry
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
