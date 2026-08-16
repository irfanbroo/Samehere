import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Feed from './components/Feed';
import Discover from './components/Discover';
import Chat from './components/Chat';
import Post from './components/Post';
import Improve from './components/Improve';
import Profile from './components/Profile';
import Bookmarks from './components/Bookmarks';
import Diary from './components/Diary';
import RightSidebar from './components/RightSidebar';
import SettingsModal from './components/SettingsModal';
import Toast from './components/Toast';
import Confetti from './components/Confetti';
import CommandPalette from './components/CommandPalette';
import MeshBackground from './components/MeshBackground';
import { AppProvider } from './store/AppContext';
import { cn } from '@/lib/utils';

export type Tab = 'feed' | 'discover' | 'chat' | 'post' | 'improve' | 'profile' | 'bookmarks' | 'diary';

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}

function Shell() {
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (activeTab !== 'feed' && activeTab !== 'discover') setSearch('');
    if (activeTab !== 'feed') setTagFilter(null);
  }, [activeTab]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Search bar only on Feed (and Discover has its own internal one)
  const showTopSearch = activeTab === 'feed';
  // Right sidebar only on Feed
  const showRightSidebar = activeTab === 'feed';

  return (
    <div className="min-h-screen bg-[#111417] relative">
      <MeshBackground />

      <Sidebar
        activeTab={activeTab}
        onTabChange={(t) => {
          setActiveTab(t as Tab);
          setSidebarOpen(false);
        }}
        onOpenSettings={() => setSettingsOpen(true)}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:ml-64 transition-all duration-300 relative">
        <TopBar
          hideSearch={!showTopSearch}
          search={search}
          onSearch={setSearch}
          onMenu={() => setSidebarOpen((v) => !v)}
          onProfile={() => setActiveTab('profile')}
          onSettings={() => setSettingsOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
        />

        <main className="p-4 md:p-8 max-w-[1400px] mx-auto">
          <div className="grid grid-cols-12 gap-4 lg:gap-8">
            <div className={cn('col-span-12', showRightSidebar ? 'lg:col-span-8' : 'lg:col-span-12')}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  {activeTab === 'feed' && (
                    <Feed search={search} tagFilter={tagFilter} onTagFilter={setTagFilter} />
                  )}
                  {activeTab === 'discover' && <Discover />}
                  {activeTab === 'chat' && <Chat />}
                  {activeTab === 'post' && <Post onClose={() => setActiveTab('feed')} />}
                  {activeTab === 'improve' && <Improve onOpenDiary={() => setActiveTab('diary')} />}
                  {activeTab === 'diary' && <Diary onClose={() => setActiveTab('improve')} />}
                  {activeTab === 'profile' && (
                    <Profile
                      onTagFilter={(t) => {
                        setTagFilter(t);
                        setActiveTab('feed');
                      }}
                    />
                  )}
                  {activeTab === 'bookmarks' && (
                    <Bookmarks
                      onTagFilter={(t) => {
                        setTagFilter(t);
                        setActiveTab('feed');
                      }}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {showRightSidebar && (
              <div className="hidden lg:block lg:col-span-4">
                <RightSidebar
                  onNavigate={(t) => setActiveTab(t as Tab)}
                  onTagSelect={(t) => {
                    setTagFilter(t);
                    setActiveTab('feed');
                  }}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={(t) => setActiveTab(t as Tab)}
        onOpenSettings={() => setSettingsOpen(true)}
        onSelectTag={(tag) => {
          setTagFilter(tag);
          setActiveTab('feed');
        }}
      />
      <Toast />
      <Confetti />
    </div>
  );
}
