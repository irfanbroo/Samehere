import { Sparkles, Book, CheckSquare, Brain, Heart, Plus, Calendar, Flame, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useApp } from '@/store/AppContext';
import { showToast } from './Toast';

interface Props {
  onOpenDiary: () => void;
}

export default function Improve({ onOpenDiary }: Props) {
  const { state, dispatch } = useApp();
  const [adding, setAdding] = useState(false);
  const [newTodo, setNewTodo] = useState('');
  const [newMeta, setNewMeta] = useState('');

  const completed = state.todos.filter((t) => t.done).length;

  const addTodo = () => {
    if (!newTodo.trim()) return;
    dispatch({ type: 'ADD_TODO', text: newTodo.trim(), meta: newMeta.trim() || 'TODAY' });
    setNewTodo('');
    setNewMeta('');
    setAdding(false);
    showToast('Task added');
  };

  const today = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short' }).toUpperCase();

  return (
    <div className="space-y-10 pb-20">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold text-white flex items-center gap-3 tracking-tight">
          <Sparkles size={32} className="text-primary" />
          Improve
        </h1>
        <p className="text-slate-400">No audience. No likes. Just you.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <motion.div
          whileHover={{ y: -5 }}
          onClick={onOpenDiary}
          className="md:col-span-8 glass-card rounded-2xl p-8 relative overflow-hidden group cursor-pointer h-[350px] flex flex-col justify-between"
        >
          <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-20 transition-opacity">
            <img
              src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800"
              className="w-full h-full object-cover grayscale"
              alt="Journal background"
            />
          </div>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black text-white mb-2">Diary</h2>
              <p className="text-slate-400 max-w-sm">Capture your internal monologue in a distraction-free environment.</p>
            </div>
            <div className="bg-primary/10 border border-primary/20 flex items-center gap-2 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Live Now</span>
            </div>
          </div>
          <div className="relative z-10 flex items-end justify-between">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
              <Calendar size={16} className="text-primary" />
              <span className="text-xs font-black text-white uppercase tracking-wider">{today}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDiary();
              }}
              className="bg-primary hover:bg-white text-[#002b73] px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-primary/20 transition-all active:scale-95"
            >
              <Book size={18} />
              Open Journal
            </button>
          </div>
        </motion.div>

        <div className="md:col-span-4 glass-card rounded-2xl p-8 border border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-white">
              Todos <span className="text-slate-600 text-sm font-bold">{completed}/{state.todos.length}</span>
            </h2>
            <CheckSquare size={20} className="text-slate-600" />
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar max-h-[260px] pr-1">
            {state.todos.map((todo) => (
              <motion.div
                key={todo.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  'p-3 rounded-xl border border-white/5 transition-all flex items-center gap-3 group',
                  todo.done ? 'bg-white/2 opacity-60' : 'bg-white/5 hover:bg-white/8'
                )}
              >
                <button
                  onClick={() => dispatch({ type: 'TOGGLE_TODO', id: todo.id })}
                  className={cn(
                    'w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0',
                    todo.done ? 'bg-primary border-primary' : 'border-slate-700 hover:border-primary'
                  )}
                >
                  {todo.done && <Plus size={12} className="text-[#002b73] rotate-45" strokeWidth={3} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-bold truncate', todo.done ? 'text-slate-500 line-through' : 'text-white')}>
                    {todo.text}
                  </p>
                  {todo.meta && (
                    <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider mt-0.5">{todo.meta}</p>
                  )}
                </div>
                <button
                  onClick={() => dispatch({ type: 'DELETE_TODO', id: todo.id })}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </div>
          <AnimatePresence>
            {adding && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-2 overflow-hidden"
              >
                <input
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                  autoFocus
                  placeholder="What needs doing?"
                  className="w-full bg-[#0b0e11] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-primary/40 outline-none"
                />
                <input
                  value={newMeta}
                  onChange={(e) => setNewMeta(e.target.value)}
                  placeholder="When? (optional)"
                  className="w-full bg-[#0b0e11] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:border-primary/40 outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={addTodo}
                    className="flex-1 bg-primary text-[#002b73] py-2 rounded-lg text-[10px] font-black uppercase tracking-widest"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setAdding(false)}
                    className="bg-white/5 text-slate-400 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              className="mt-6 w-full border border-white/5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Add Task
            </button>
          )}
        </div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          className="md:col-span-7 glass-card rounded-2xl p-8 border border-white/5 flex flex-col md:flex-row gap-8 items-center"
        >
          <div className="flex-1 space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white mb-2">The Reckoning</h2>
              <p className="text-slate-400 text-sm leading-relaxed">Review, dissect, and outgrow your mistakes from this week.</p>
            </div>
            <div className="flex items-center gap-12">
              <div>
                <p className="text-3xl font-black text-secondary">03</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mistakes</p>
              </div>
              <div className="w-px h-10 bg-white/5" />
              <div>
                <p className="text-3xl font-black text-tertiary">02</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Lessons</p>
              </div>
            </div>
            <button
              onClick={() => showToast('Reckoning workflow coming soon')}
              className="bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all flex items-center gap-2"
            >
              <Brain size={16} className="text-slate-400" />
              Review Mistakes
            </button>
          </div>
          <div className="w-full md:w-48 aspect-video md:aspect-square bg-[#272a2e] rounded-2xl border border-white/5 flex items-center justify-center">
            <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
              <Brain size={48} className="text-slate-800" />
            </motion.div>
          </div>
        </motion.div>

        <div className="md:col-span-5 glass-card rounded-2xl p-8 border border-white/5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              Gratitude <Heart size={20} className="text-primary fill-primary" />
            </h2>
            <span className="bg-primary/10 border border-primary/30 px-2.5 py-1 rounded-lg text-[9px] font-black text-primary uppercase tracking-widest">
              {state.intentions.filter((i) => i.done).length}/{state.intentions.length}
            </span>
          </div>
          <p className="text-slate-500 text-sm">A shared space for what matters.</p>
          <div className="space-y-2 mt-4">
            {state.intentions.slice(0, 3).map((i) => (
              <div key={i.id} className="flex items-center gap-3 text-sm">
                <div
                  className={cn(
                    'w-4 h-4 rounded-sm border flex items-center justify-center',
                    i.done ? 'bg-primary border-primary' : 'border-slate-700'
                  )}
                />
                <span className={cn(i.done ? 'text-slate-500 line-through' : 'text-slate-200')}>{i.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="glass-card rounded-2xl p-6 md:p-10 border border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-10">
          <div>
            <h2 className="text-2xl font-black text-white mb-2">Improvement Pulse</h2>
            <p className="text-slate-400 text-sm">Your momentum over the last 30 days.</p>
          </div>
          <div className="flex gap-12">
            <div className="text-center">
              <p className="text-4xl font-black text-white tracking-tighter">
                {Math.round((completed / Math.max(1, state.todos.length)) * 100)}%
              </p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Today</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2">
                <p className="text-4xl font-black text-white tracking-tighter">{state.streak}</p>
                <Flame size={24} className="text-primary fill-primary" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Day Streak</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 md:grid-cols-21 gap-1.5 h-12">
          {Array.from({ length: 21 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: i * 0.02 }}
              className={cn(
                'rounded-sm transition-all duration-500 h-full origin-bottom',
                i === 19
                  ? 'bg-primary animate-pulse'
                  : i > 15
                  ? 'bg-primary shadow-[0_0_10px_rgba(178,197,255,0.4)]'
                  : i % 3 === 0
                  ? 'bg-primary/40'
                  : i % 2 === 0
                  ? 'bg-primary/20'
                  : 'bg-white/5'
              )}
            />
          ))}
        </div>
      </section>

      <AnimatePresence>
        {!adding && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={() => setAdding(true)}
            className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-[#002b73] rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 pulse-glow"
            title="Quick add task"
          >
            <Plus size={28} strokeWidth={3} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
