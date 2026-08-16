import { Lightbulb, ArrowRight, UserPlus, Check, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useApp } from '@/store/AppContext';
import { showToast } from './Toast';
import TrendingTags from './TrendingTags';

interface RightSidebarProps {
  onNavigate: (tab: string) => void;
  onTagSelect: (tag: string) => void;
}

const PROMPTS = [
  "What is one thing you're letting go of today to make room for something better?",
  'Describe the smallest win from this week that you almost missed.',
  'Whose voice do you most need to ignore right now? Why?',
  'What would today look like if you trusted yourself more?',
];

const SUGGESTED = [
  {
    id: 'sasha',
    name: 'Sasha C.',
    role: 'Artist',
    match: '90%',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA96iY41HP79Mh7mRB7pQejdHoIKfhhVK2mTyvRpfyGpbm6Sjy7XJZoXum22BATG0NMfQlcwZZRSMoyb2ulMglSy2GOvXw_fCnpDexkG6AUuqMFLJ9sf8wRp_KZtLNIxcux8Pucm11xOdZXZk5rH10ViD8j0fZrdBE3MW157Ms-zbrXXdrXjhD302PG7EoYSjDE-73VBNLIjU7fe8WSAg7znKLRxJlhB834DauwuLch2-ez_PhH-K1G7l9YYbEkt4380N1oEf61wOMY',
  },
  {
    id: 'marcusk',
    name: 'Marcus K.',
    role: 'Builder',
    match: '88%',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAHRQq6Av4Shcwrz6-5VQzBZK-h_Fq4pWPgQf28lQ_07goSnXdDvBu_fm2HA-Pbe-DMPPo_Hf57qBZj6XCjwkb1Wgs0qn7mBN50v9HmbOLJMA1pcSqZx6RAKZgTh4Jeezr8Rh7Og70wG2t8zwGAPdWtABUl15LJliS0GJoF6LzksJNkK2AE4ZYzhH5Anuowkgfm8R_jTEN6aAXcHg9sFA4ORwVbAvyKLrTNWQ0rrxnM6LnxXv-kkV7qmOAIB5apBPl_spEhjH8n-Phc',
  },
];

export default function RightSidebar({ onNavigate, onTagSelect }: RightSidebarProps) {
  const { state, dispatch } = useApp();
  const [prompt, setPrompt] = useState(PROMPTS[0]);
  const [addingIntention, setAddingIntention] = useState(false);
  const [newIntention, setNewIntention] = useState('');

  const completeIntentions = state.intentions.filter((i) => i.done).length;
  const consistency = Math.round((completeIntentions / Math.max(1, state.intentions.length)) * 100);

  return (
    <aside className="space-y-6 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar pr-1">
      <section className="glass-card p-6 rounded-2xl border-l-4 border-primary">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-primary">
            <Lightbulb size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Today's Prompt</span>
          </div>
          <button
            onClick={() => setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)])}
            className="text-[10px] text-slate-500 hover:text-primary font-bold uppercase tracking-wider"
          >
            Shuffle
          </button>
        </div>
        <p className="font-bold text-lg text-white leading-snug">{prompt}</p>
        <button
          onClick={() => onNavigate('post')}
          className="mt-4 text-primary font-bold uppercase text-[11px] hover:underline flex items-center gap-1 group"
        >
          Respond Now <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </section>

      <TrendingTags onSelect={onTagSelect} />

      <section className="glass-card p-6 rounded-2xl">
        <h3 className="font-bold text-sm text-white mb-4">Your Activity</h3>
        <div className="grid grid-cols-10 gap-1.5 mb-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-full aspect-square rounded-[2px]',
                i % 3 === 0 ? 'bg-primary/20' : i % 5 === 0 ? 'bg-primary/60' : i % 7 === 0 ? 'bg-primary' : 'bg-white/5'
              )}
            />
          ))}
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          {[
            { value: state.streak, label: 'Streak' },
            { value: `${consistency}%`, label: 'Today' },
            { value: state.entries, label: 'Entries' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-xl font-black text-white">{stat.value}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-sm text-white">People Like You</h3>
          <button
            onClick={() => onNavigate('discover')}
            className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
          >
            See all
          </button>
        </div>
        <div className="space-y-4">
          {SUGGESTED.map((person) => {
            const connected = state.connections.includes(person.id);
            return (
              <div key={person.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={person.avatar} alt={person.name} className="w-8 h-8 rounded-full border border-white/10" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{person.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {person.role} • {person.match} Match
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    dispatch({ type: 'TOGGLE_CONNECT', userId: person.id });
                    showToast(connected ? `Removed ${person.name}` : `Connected with ${person.name}`);
                  }}
                  className={cn(
                    'p-1.5 rounded-full transition-all duration-200 shrink-0',
                    connected
                      ? 'bg-primary text-[#002b73]'
                      : 'bg-white/5 hover:bg-primary hover:text-[#002b73] text-slate-300'
                  )}
                >
                  {connected ? <Check size={14} /> : <UserPlus size={14} />}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm text-white">Today's Intentions</h3>
          <button
            onClick={() => setAddingIntention((v) => !v)}
            className="text-slate-400 hover:text-primary"
          >
            <Plus size={16} />
          </button>
        </div>
        <ul className="space-y-3">
          <AnimatePresence>
            {state.intentions.map((item) => (
              <motion.li
                layout
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                onClick={() => dispatch({ type: 'TOGGLE_INTENTION', id: item.id })}
                className="flex items-center gap-3 group cursor-pointer"
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0',
                    item.done ? 'bg-primary/20 border-primary' : 'border-primary/40 group-hover:border-primary'
                  )}
                >
                  <Check
                    size={12}
                    className={cn('text-primary transition-opacity', item.done ? 'opacity-100' : 'opacity-0 group-hover:opacity-50')}
                  />
                </div>
                <span
                  className={cn(
                    'text-sm transition-colors',
                    item.done ? 'text-slate-500 line-through' : 'text-on-surface-variant group-hover:text-white'
                  )}
                >
                  {item.text}
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        <AnimatePresence>
          {addingIntention && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden"
            >
              <input
                value={newIntention}
                onChange={(e) => setNewIntention(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newIntention.trim()) {
                    dispatch({ type: 'ADD_INTENTION', text: newIntention.trim() });
                    setNewIntention('');
                    setAddingIntention(false);
                  }
                  if (e.key === 'Escape') setAddingIntention(false);
                }}
                autoFocus
                placeholder="Add an intention…"
                className="w-full bg-[#0b0e11] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-primary/40 outline-none"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </aside>
  );
}
