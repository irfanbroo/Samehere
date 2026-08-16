import { Home, Compass, MessageSquare, PlusSquare, Sparkles, User, Settings, HelpCircle, Bookmark, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useApp } from '@/store/AppContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenSettings: () => void;
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { icon: Home, label: 'Feed', id: 'feed' },
  { icon: Compass, label: 'Discover', id: 'discover' },
  { icon: MessageSquare, label: 'Chat', id: 'chat' },
  { icon: PlusSquare, label: 'Post', id: 'post' },
  { icon: Sparkles, label: 'Improve', id: 'improve' },
  { icon: Bookmark, label: 'Bookmarks', id: 'bookmarks' },
  { icon: User, label: 'Profile', id: 'profile' },
];

export default function Sidebar({ activeTab, onTabChange, onOpenSettings, open, onClose }: SidebarProps) {
  const { state, me } = useApp();
  const unreadMessages = state.messages.filter(
    (m) => m.senderId !== state.currentUserId && m.status !== 'read'
  ).length;
  const unreadNotifs = state.notifications.filter((n) => !n.read).length;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <nav
        className={cn(
          'h-full w-64 border-r border-white/10 fixed left-0 top-0 bg-[#15191C]/90 backdrop-blur-lg flex flex-col py-8 z-50 transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="px-8 mb-12 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter">Same Here</h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">
              Sophisticated Connection
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 lg:hidden">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const badge =
              item.id === 'chat' && unreadMessages > 0
                ? unreadMessages
                : null;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'w-full px-6 py-3 flex items-center gap-4 transition-all duration-200 border-r-2 text-left relative',
                  isActive
                    ? 'text-accent-blue font-bold border-accent-blue bg-gradient-to-r from-accent-blue/10 to-transparent'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                )}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-sm flex-1">{item.label}</span>
                {badge !== null && (
                  <span className="bg-accent-blue text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-auto px-4 space-y-1">
          <button
            onClick={() => onTabChange('profile')}
            className="w-full text-slate-300 hover:text-white hover:bg-white/5 px-3 py-3 flex items-center gap-3 transition-colors rounded-lg"
          >
            <img src={me.avatar} alt={me.name} className="w-8 h-8 rounded-full border border-white/10" />
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-bold truncate">{me.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{me.handle}</p>
            </div>
            {unreadNotifs > 0 && (
              <span className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
            )}
          </button>
          <button
            onClick={onOpenSettings}
            className="w-full text-slate-400 hover:text-white hover:bg-white/5 px-4 py-3 flex items-center gap-4 transition-colors rounded-lg text-sm"
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>
          <a
            href="https://github.com/anthropics/claude-code/issues"
            target="_blank"
            rel="noreferrer"
            className="text-slate-400 hover:text-white hover:bg-white/5 px-4 py-3 flex items-center gap-4 transition-colors rounded-lg text-sm"
          >
            <HelpCircle size={20} />
            <span>Help</span>
          </a>
        </div>
      </nav>
    </>
  );
}
