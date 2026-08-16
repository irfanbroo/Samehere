import { TrendingUp, Hash } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp, trendingTags } from '@/store/AppContext';

interface Props {
  onSelect: (tag: string) => void;
}

export default function TrendingTags({ onSelect }: Props) {
  const { state } = useApp();
  const tags = trendingTags(state.posts, 6);

  if (tags.length === 0) return null;

  return (
    <section className="glass-card p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <TrendingUp size={14} className="text-primary" /> Trending
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">in your circle</span>
      </div>
      <ul className="space-y-2">
        {tags.map((t, i) => (
          <motion.li
            key={t.tag}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <button
              onClick={() => onSelect(t.tag)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 group text-left transition-colors"
            >
              <span className="flex items-center gap-2 min-w-0">
                <Hash size={12} className="text-primary shrink-0" />
                <span className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">
                  {t.tag.slice(1)}
                </span>
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {t.count} entr{t.count === 1 ? 'y' : 'ies'}
              </span>
            </button>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
