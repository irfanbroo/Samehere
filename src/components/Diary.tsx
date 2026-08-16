import {
  Book,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Smile,
  Leaf,
  Moon,
  Zap,
  Flame,
  Trash2,
  Plus,
  ArrowLeft,
  Cloud,
  Sun,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp, type Mood, type DiaryEntry, readingTime } from '@/store/AppContext';
import { showToast } from './Toast';
import { cn } from '@/lib/utils';

interface Props {
  onClose?: () => void;
}

const MOODS: { label: Mood; icon: any; color: string }[] = [
  { label: 'Inspired', icon: Smile, color: 'text-amber-300' },
  { label: 'Peaceful', icon: Leaf, color: 'text-emerald-300' },
  { label: 'Reflective', icon: Moon, color: 'text-indigo-300' },
  { label: 'Creative', icon: Zap, color: 'text-fuchsia-300' },
  { label: 'Productive', icon: Flame, color: 'text-primary' },
];

const PROMPTS = [
  'What did today actually feel like, beneath the surface?',
  'Who or what required courage from you this week?',
  'Where did you compromise — and was it worth it?',
  'List three things that softened your day.',
  'What story are you telling yourself that may not be true?',
  'If today had a soundtrack, what would it sound like?',
];

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function pretty(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function Diary({ onClose }: Props) {
  const { state, dispatch } = useApp();
  const [date, setDate] = useState(new Date());
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<Mood | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [prompt, setPrompt] = useState(PROMPTS[0]);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const dateKey = ymd(date);
  const today = ymd(new Date());

  const sorted = useMemo(
    () => [...state.diary].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [state.diary]
  );

  const current = useMemo(() => state.diary.find((d) => d.date === dateKey), [state.diary, dateKey]);

  // Load entry when date changes
  useEffect(() => {
    setContent(current?.content ?? '');
    setMood(current?.mood ?? null);
    setSavedAt(null);
  }, [dateKey, current?.content, current?.mood]);

  // Autosave debounced
  useEffect(() => {
    if (!content.trim() && !mood) return;
    const t = setTimeout(() => {
      const id = current?.id ?? `dy_${dateKey}`;
      dispatch({
        type: 'SAVE_DIARY',
        entry: { id, date: dateKey, content, mood: mood ?? undefined, updatedAt: Date.now() },
      });
      setSavedAt(Date.now());
    }, 700);
    return () => clearTimeout(t);
  }, [content, mood, dateKey, dispatch, current?.id]);

  // Auto-grow
  useEffect(() => {
    if (taRef.current) {
      taRef.current.style.height = 'auto';
      taRef.current.style.height = Math.max(420, taRef.current.scrollHeight) + 'px';
    }
  }, [content]);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  const shift = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d);
  };

  const goToday = () => setDate(new Date());

  const deleteEntry = () => {
    if (!current) return;
    if (!confirm('Delete this entry?')) return;
    dispatch({ type: 'DELETE_DIARY', id: current.id });
    setContent('');
    setMood(null);
    showToast('Entry deleted');
  };

  const totalWords = state.diary.reduce(
    (sum, d) => sum + (d.content ? d.content.trim().split(/\s+/).length : 0),
    0
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-br from-[#1d2023] to-[#15191c] p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden"
      >
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-colors"
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center shadow-inner">
            <Book size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Diary</h1>
            <p className="text-xs text-slate-500">No audience. No likes. Just you.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10 flex-wrap">
          <button
            onClick={() => shift(-1)}
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 transition-colors"
            title="Previous day"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl">
            <Calendar size={14} className="text-primary" />
            <span className="text-xs font-black uppercase tracking-widest text-white">{pretty(date)}</span>
          </div>
          <button
            onClick={() => shift(1)}
            disabled={dateKey >= today}
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next day"
          >
            <ChevronRight size={16} />
          </button>
          {dateKey !== today && (
            <button
              onClick={goToday}
              className="bg-primary text-[#002b73] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
            >
              Today
            </button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Past entries */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="glass-card rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Past Entries · {state.diary.length}
              </h3>
              <button
                onClick={() => goToday()}
                className="text-slate-500 hover:text-primary transition-colors"
                title="New entry today"
              >
                <Plus size={14} />
              </button>
            </div>
            {sorted.length === 0 ? (
              <p className="text-xs text-slate-600 leading-relaxed">No entries yet. Start with today.</p>
            ) : (
              <ul className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                {sorted.map((d) => {
                  const active = d.date === dateKey;
                  const dayDate = new Date(d.date + 'T00:00:00');
                  const moodIcon = MOODS.find((m) => m.label === d.mood);
                  const Icon = moodIcon?.icon;
                  return (
                    <li key={d.id}>
                      <button
                        onClick={() => setDate(dayDate)}
                        className={cn(
                          'w-full text-left p-3 rounded-xl border transition-all',
                          active
                            ? 'bg-primary/10 border-primary/30'
                            : 'bg-white/3 border-white/5 hover:bg-white/8'
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={cn('text-[10px] font-black uppercase tracking-widest', active ? 'text-primary' : 'text-slate-400')}>
                            {dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          {Icon && <Icon size={12} className={moodIcon?.color} />}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {d.content.slice(0, 80) || <span className="italic text-slate-600">empty</span>}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Lifetime</h3>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Entries</span>
              <span className="text-sm font-black text-white">{state.diary.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Words</span>
              <span className="text-sm font-black text-white">{totalWords.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Streak</span>
              <span className="text-sm font-black text-primary flex items-center gap-1">
                {state.streak} <Flame size={12} className="fill-primary" />
              </span>
            </div>
          </div>
        </aside>

        {/* Editor */}
        <main className="lg:col-span-6 space-y-5">
          <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mood</span>
                {MOODS.map((m) => {
                  const Icon = m.icon;
                  const active = mood === m.label;
                  return (
                    <button
                      key={m.label}
                      onClick={() => setMood(active ? null : m.label)}
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                        active
                          ? 'bg-primary/20 ring-2 ring-primary/40 scale-110'
                          : 'bg-white/5 hover:bg-white/10 hover:scale-110'
                      )}
                      title={m.label}
                    >
                      <Icon size={14} className={active ? m.color : 'text-slate-400'} />
                    </button>
                  );
                })}
              </div>
              {current && (
                <button
                  onClick={deleteEntry}
                  className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                  title="Delete entry"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div className="p-8 md:p-12 bg-gradient-to-b from-transparent to-[#0b0e11]/30">
              <textarea
                ref={taRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Begin… ${pretty(date)}`}
                className="w-full bg-transparent border-none outline-none text-lg leading-[1.85] text-slate-200 placeholder:text-slate-700 resize-none custom-scrollbar font-serif"
                style={{ minHeight: '420px', fontFamily: 'Georgia, "Times New Roman", serif' }}
              />
            </div>

            <div className="px-6 py-3 border-t border-white/5 bg-[#0B0E11]/40 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-5 text-[10px] font-black uppercase tracking-widest text-slate-600">
                <span>{wordCount} words</span>
                <span>{readingTime(content)}</span>
                <span className="flex items-center gap-1.5">
                  <span className={cn('w-1.5 h-1.5 rounded-full', savedAt ? 'bg-emerald-500' : 'bg-slate-700')} />
                  {savedAt ? 'Saved' : content.trim() ? 'Saving…' : 'Empty'}
                </span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Stays on this device</span>
            </div>
          </div>
        </main>

        {/* Right rail */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="glass-card rounded-2xl p-5 border-l-4 border-primary">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Today's prompt</p>
            <p className="text-sm text-white leading-relaxed mb-4">{prompt}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setContent((c) => (c ? c + '\n\n' + prompt : prompt))}
                className="flex-1 bg-primary text-[#002b73] py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-transform"
              >
                Use prompt
              </button>
              <button
                onClick={() => setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)])}
                className="bg-white/5 text-slate-400 hover:text-white px-3 rounded-lg text-[10px] font-black uppercase tracking-widest"
              >
                Shuffle
              </button>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Day at a glance</h3>
            <Glance icon={Sun} label="Date" value={pretty(date)} />
            <Glance icon={Cloud} label="Mood" value={mood ?? 'Unset'} />
            <Glance icon={Book} label="Read time" value={readingTime(content)} />
          </div>

          <div className="glass-card rounded-2xl p-5 border border-white/5 bg-gradient-to-br from-primary/10 to-transparent">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Why this matters</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Daily reflection clears the inner mirror. Even three sentences a day, kept honestly, become a record of who you became.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Glance({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
        <Icon size={14} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</p>
        <p className="text-sm font-bold text-white truncate">{value}</p>
      </div>
    </div>
  );
}
