import { Bookmark } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import FeedItem from './FeedItem';

interface Props {
  onTagFilter?: (tag: string) => void;
}

export default function Bookmarks({ onTagFilter }: Props) {
  const { state } = useApp();
  const bookmarked = state.posts.filter((p) => p.bookmarked);

  return (
    <div className="space-y-8 pb-12">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold text-white flex items-center gap-3 tracking-tight">
          <Bookmark size={32} className="text-primary fill-primary" />
          Bookmarks
        </h1>
        <p className="text-slate-400">Quiet shelf. Things worth re-reading.</p>
      </header>

      <div className="space-y-6">
        {bookmarked.length === 0 ? (
          <div className="glass-card rounded-2xl p-16 text-center">
            <Bookmark size={48} className="text-white/5 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Nothing saved yet</p>
            <p className="text-slate-500 text-sm">Tap the bookmark icon on any entry to keep it here.</p>
          </div>
        ) : (
          bookmarked.map((p) => <FeedItem key={p.id} post={p} onTagClick={onTagFilter} />)
        )}
      </div>
    </div>
  );
}
