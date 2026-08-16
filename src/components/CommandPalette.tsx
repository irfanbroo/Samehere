import { Search, Home, Compass, MessageSquare, PlusSquare, Sparkles, User, Bookmark, Settings, ArrowRight, Hash, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp, trendingTags } from '@/store/AppContext';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onOpenSettings: () => void;
  onSelectTag: (tag: string) => void;
}

type Item =
  | { kind: 'nav'; id: string; label: string; icon: any; tab: string }
  | { kind: 'action'; id: string; label: string; icon: any; run: () => void }
  | { kind: 'person'; id: string; label: string; sublabel: string; avatar: string }
  | { kind: 'tag'; id: string; label: string; count: number };

export default function CommandPalette({ open, onClose, onNavigate, onOpenSettings, onSelectTag }: Props) {
  const { state } = useApp();
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (open) onClose();
        else onClose(); /* parent toggles via shortcut */
      }
      if (open && e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const items: Item[] = useMemo(() => {
    const navItems: Item[] = [
      { kind: 'nav', id: 'feed', label: 'Go to Feed', icon: Home, tab: 'feed' },
      { kind: 'nav', id: 'discover', label: 'Discover people', icon: Compass, tab: 'discover' },
      { kind: 'nav', id: 'chat', label: 'Open Chat', icon: MessageSquare, tab: 'chat' },
      { kind: 'nav', id: 'post', label: 'New Entry', icon: PlusSquare, tab: 'post' },
      { kind: 'nav', id: 'improve', label: 'Improve dashboard', icon: Sparkles, tab: 'improve' },
      { kind: 'nav', id: 'bookmarks', label: 'Bookmarks', icon: Bookmark, tab: 'bookmarks' },
      { kind: 'nav', id: 'profile', label: 'Profile', icon: User, tab: 'profile' },
    ];
    const actions: Item[] = [
      { kind: 'action', id: 'settings', label: 'Open settings', icon: Settings, run: onOpenSettings },
      {
        kind: 'action',
        id: 'reset',
        label: 'Reset local data',
        icon: Heart,
        run: () => {
          if (confirm('Reset all local data?')) {
            localStorage.removeItem('samehere_state_v2');
            location.reload();
          }
        },
      },
    ];

    const people: Item[] = Object.values(state.users)
      .filter((u) => u.id !== state.currentUserId)
      .map((u) => ({
        kind: 'person',
        id: 'p_' + u.id,
        label: u.name,
        sublabel: u.handle,
        avatar: u.avatar,
      }));

    const tags: Item[] = trendingTags(state.posts, 8).map((t) => ({
      kind: 'tag',
      id: 'tag_' + t.tag,
      label: t.tag,
      count: t.count,
    }));

    return [...navItems, ...actions, ...people, ...tags];
  }, [state, onOpenSettings]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter((it) => {
      if (it.kind === 'person') return it.label.toLowerCase().includes(query) || it.sublabel.toLowerCase().includes(query);
      if (it.kind === 'tag') return it.label.toLowerCase().includes(query);
      return it.label.toLowerCase().includes(query);
    });
  }, [q, items]);

  useEffect(() => {
    if (idx >= filtered.length) setIdx(0);
  }, [filtered.length, idx]);

  const select = (item: Item) => {
    if (item.kind === 'nav') onNavigate(item.tab);
    else if (item.kind === 'action') item.run();
    else if (item.kind === 'tag') onSelectTag(item.label);
    else if (item.kind === 'person') onNavigate('discover');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[80] flex items-start justify-center p-4 pt-[15vh]"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: -10 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-card rounded-2xl border border-white/10 shadow-2xl w-full max-w-xl overflow-hidden"
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
              <Search size={18} className="text-slate-500 shrink-0" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setIdx((i) => Math.min(i + 1, filtered.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setIdx((i) => Math.max(i - 1, 0));
                  } else if (e.key === 'Enter' && filtered[idx]) {
                    e.preventDefault();
                    select(filtered[idx]);
                  }
                }}
                placeholder="Type a command, search people, or jump to anything…"
                className="flex-1 bg-transparent text-white placeholder:text-slate-600 outline-none text-sm"
              />
              <kbd className="hidden md:block text-[10px] font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-400">
                ESC
              </kbd>
            </div>
            <div className="max-h-[55vh] overflow-y-auto custom-scrollbar py-2">
              {filtered.length === 0 && (
                <p className="px-5 py-6 text-center text-sm text-slate-500">No matches</p>
              )}
              {filtered.map((it, i) => (
                <button
                  key={it.id}
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => select(it)}
                  className={cn(
                    'w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors',
                    idx === i ? 'bg-primary/10 text-white' : 'text-slate-300 hover:bg-white/5'
                  )}
                >
                  {it.kind === 'person' ? (
                    <img src={it.avatar} className="w-7 h-7 rounded-full" alt="" />
                  ) : it.kind === 'tag' ? (
                    <Hash size={18} className="text-primary" />
                  ) : (
                    <it.icon size={18} className="text-primary" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{it.label}</p>
                    {it.kind === 'person' && (
                      <p className="text-[11px] text-slate-500 truncate">{it.sublabel}</p>
                    )}
                    {it.kind === 'tag' && (
                      <p className="text-[11px] text-slate-500">{it.count} entr{it.count === 1 ? 'y' : 'ies'}</p>
                    )}
                  </div>
                  {idx === i && <ArrowRight size={14} className="text-primary" />}
                </button>
              ))}
            </div>
            <div className="border-t border-white/5 px-4 py-2.5 flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <span>↑↓ navigate · ↵ select</span>
              <span>⌘K to toggle</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
