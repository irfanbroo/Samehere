import { Search, Bell, Command, Menu, LogOut, Settings as SettingsIcon, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useApp, timeAgo } from '@/store/AppContext';
import { cn } from '@/lib/utils';

interface TopBarProps {
  hideSearch?: boolean;
  search: string;
  onSearch: (v: string) => void;
  onMenu: () => void;
  onProfile: () => void;
  onSettings: () => void;
  onOpenPalette: () => void;
}

export default function TopBar({ hideSearch, search, onSearch, onMenu, onProfile, onSettings, onOpenPalette }: TopBarProps) {
  const { state, dispatch, me } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = state.notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <header className="sticky top-0 h-16 bg-[#0B0E11]/70 backdrop-blur-md border-b border-white/5 z-40 flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={onMenu}
          className="lg:hidden text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5"
        >
          <Menu size={20} />
        </button>
        {!hideSearch && (
          <div className="relative w-full max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              type="text"
              placeholder="Search posts, people, tags..."
              className="w-full bg-[#0b0e11] border border-white/5 rounded-full py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary text-white outline-none transition-all"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="hover:text-white hover:bg-white/5 p-2 rounded-full transition-all text-slate-400 relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                className="absolute right-0 top-12 w-80 max-h-[28rem] overflow-y-auto custom-scrollbar glass-card rounded-2xl border border-white/10 shadow-2xl z-50"
              >
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                  <h3 className="text-sm font-bold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => dispatch({ type: 'MARK_NOTIF_READ' })}
                      className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                {state.notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">No notifications yet.</div>
                ) : (
                  <ul>
                    {state.notifications.map((n) => {
                      const fromUser = n.fromId ? state.users[n.fromId] : null;
                      return (
                        <li
                          key={n.id}
                          onClick={() => dispatch({ type: 'MARK_NOTIF_READ', id: n.id })}
                          className={cn(
                            'p-4 flex gap-3 items-start border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors',
                            !n.read && 'bg-primary/5'
                          )}
                        >
                          {fromUser ? (
                            <img src={fromUser.avatar} className="w-9 h-9 rounded-full" alt="" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                              <Bell size={16} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white">
                              {fromUser && <span className="font-bold">{fromUser.name} </span>}
                              <span className="text-slate-300">{n.text}</span>
                            </p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                              {timeAgo(n.time)}
                            </p>
                          </div>
                          {!n.read && <span className="w-2 h-2 rounded-full bg-accent-blue mt-2" />}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={onOpenPalette}
          className="hidden md:flex items-center gap-2 hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-full transition-all text-slate-400 border border-white/10"
          title="Command palette (⌘K)"
        >
          <Command size={14} />
          <kbd className="text-[10px] font-bold tracking-widest">⌘K</kbd>
        </button>

        <button className="hidden sm:block bg-primary hover:bg-[#9bb3ff] text-[#002b73] px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95">
          Upgrade
        </button>

        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="w-8 h-8 rounded-full overflow-hidden border border-white/10 hover:border-primary transition-colors"
          >
            <img src={me.avatar} alt={me.name} className="w-full h-full object-cover" />
          </button>
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                className="absolute right-0 top-12 w-56 glass-card rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden"
              >
                <div className="p-4 border-b border-white/5">
                  <p className="text-sm font-bold text-white truncate">{me.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{me.handle}</p>
                </div>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    onProfile();
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 text-sm text-slate-300 hover:text-white hover:bg-white/5"
                >
                  <User size={16} />
                  <span>View profile</span>
                </button>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    onSettings();
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 text-sm text-slate-300 hover:text-white hover:bg-white/5"
                >
                  <SettingsIcon size={16} />
                  <span>Settings</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm('Clear local data and reset?')) {
                      localStorage.removeItem('samehere_state_v2');
                      location.reload();
                    }
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 text-sm text-rose-400 hover:bg-rose-500/10 border-t border-white/5"
                >
                  <LogOut size={16} />
                  <span>Reset session</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
