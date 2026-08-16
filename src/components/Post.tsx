import {
  X,
  Type,
  Quote,
  List as ListIcon,
  Bold,
  Italic,
  Link as LinkIcon,
  Globe,
  Lightbulb,
  Sparkles,
  Smile,
  Leaf,
  Moon,
  Zap,
  Flame,
  Users,
  Lock,
  Hash,
  AtSign,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useApp, type Mood } from '@/store/AppContext';
import { showToast } from './Toast';
import { fireConfetti } from './Confetti';
import Dropdown from './Dropdown';
import { cn } from '@/lib/utils';

interface PostProps {
  onClose?: () => void;
}

const MOODS: { label: Mood; icon: any }[] = [
  { label: 'Inspired', icon: Smile },
  { label: 'Peaceful', icon: Leaf },
  { label: 'Reflective', icon: Moon },
  { label: 'Creative', icon: Zap },
  { label: 'Productive', icon: Flame },
];

const PROMPTS = [
  'Describe a moment today that felt small but significant. Why did it stick with you?',
  'What is one belief you had a year ago that no longer fits?',
  'Where did you find unexpected beauty this week?',
  'What boundary did you hold today, and how did it feel?',
  'Name a fear you faced this week, however small.',
];

type Visibility = 'everyone' | 'connections' | 'private';

export default function Post({ onClose }: PostProps) {
  const { state, dispatch } = useApp();
  const [title, setTitle] = useState(state.drafts?.title ?? '');
  const [content, setContent] = useState(state.drafts?.content ?? '');
  const [mood, setMood] = useState<Mood>(state.drafts?.mood ?? 'Inspired');
  const [visibility, setVisibility] = useState<Visibility>(state.settings.visibility);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [prompt, setPrompt] = useState(PROMPTS[0]);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  // Auto-save draft
  useEffect(() => {
    const t = setTimeout(() => {
      if (title || content) {
        dispatch({ type: 'SAVE_DRAFT', draft: { title, content, mood } });
        setSavedAt(Date.now());
      }
    }, 800);
    return () => clearTimeout(t);
  }, [title, content, mood, dispatch]);

  // Auto-grow textarea
  useEffect(() => {
    if (taRef.current) {
      taRef.current.style.height = 'auto';
      taRef.current.style.height = taRef.current.scrollHeight + 'px';
    }
  }, [content]);

  const insertFormat = (kind: 'bold' | 'italic' | 'quote' | 'list' | 'heading' | 'link' | 'tag' | 'mention') => {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = content.slice(start, end);
    let inserted = '';
    if (kind === 'bold') inserted = `**${sel || 'bold text'}**`;
    else if (kind === 'italic') inserted = `_${sel || 'italic'}_`;
    else if (kind === 'quote') inserted = `\n> ${sel || 'quote'}\n`;
    else if (kind === 'list') inserted = `\n- ${sel || 'item'}\n`;
    else if (kind === 'heading') inserted = `\n## ${sel || 'heading'}\n`;
    else if (kind === 'tag') inserted = `#${sel || 'tag'}`;
    else if (kind === 'mention') inserted = `@${sel || 'someone'}`;
    else if (kind === 'link') {
      const url = window.prompt('URL?');
      if (!url) return;
      inserted = `[${sel || 'link'}](${url})`;
    }
    setContent(content.slice(0, start) + inserted + content.slice(end));
    setTimeout(() => {
      ta.focus();
      ta.selectionEnd = start + inserted.length;
    }, 0);
  };

  const publish = () => {
    if (!content.trim()) {
      showToast('Write something first');
      return;
    }
    dispatch({
      type: 'ADD_POST',
      post: {
        id: 'p_' + Math.random().toString(36).slice(2, 9),
        authorId: state.currentUserId,
        title: title.trim() || undefined,
        content: content.trim(),
        mood,
        createdAt: Date.now(),
        likedBy: [],
        reactions: {},
        comments: [],
      },
    });
    dispatch({ type: 'CLEAR_DRAFT' });
    fireConfetti();
    showToast('Entry published');
    onClose?.();
  };

  const tone =
    /sad|hard|tired|broken|lost/i.test(content)
      ? 'tender'
      : /grateful|joy|love|excited/i.test(content)
      ? 'warm'
      : /focus|build|ship|done/i.test(content)
      ? 'driven'
      : 'contemplative';

  const visibilityInfo: Record<Visibility, { icon: any; label: string }> = {
    everyone: { icon: Globe, label: 'Visible to everyone' },
    connections: { icon: Users, label: 'Connections only' },
    private: { icon: Lock, label: 'Private — just you' },
  };
  const VisIcon = visibilityInfo[visibility].icon;

  return (
    <div className="space-y-8 pb-20 max-w-4xl mx-auto">
      <div className="flex justify-between items-center bg-[#0B0E11]/40 backdrop-blur-xl p-4 rounded-2xl border border-white/5 shadow-2xl mb-8 sticky top-16 z-30">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
          <span className="text-xl font-black text-white tracking-tighter">New Entry</span>
        </div>
        <div className="flex items-center gap-3 md:gap-6">
          <Dropdown
            value={visibility}
            onChange={(v) => setVisibility(v as Visibility)}
            size="sm"
            align="right"
            options={[
              { value: 'everyone', label: 'Public', icon: Globe, hint: 'Visible to everyone' },
              { value: 'connections', label: 'Connections', icon: Users, hint: 'Just your circle' },
              { value: 'private', label: 'Private', icon: Lock, hint: 'Only you' },
            ]}
          />
          <button
            onClick={() => {
              setTitle('');
              setContent('');
              dispatch({ type: 'CLEAR_DRAFT' });
              showToast('Draft cleared');
            }}
            className="hidden md:block text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
          >
            Clear
          </button>
          <button
            onClick={publish}
            className="bg-primary hover:bg-white text-[#002b73] px-6 md:px-8 py-2 rounded-full text-xs font-black uppercase tracking-[0.1em] transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50"
            disabled={!content.trim()}
          >
            Publish
          </button>
        </div>
      </div>

      <section>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 ml-2">How are you feeling?</p>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => {
            const Icon = m.icon;
            const active = mood === m.label;
            return (
              <button
                key={m.label}
                onClick={() => setMood(m.label)}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-300 font-bold text-sm',
                  active
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-[#15191C]/60 border-white/5 text-slate-400 hover:text-white hover:border-white/20'
                )}
              >
                <Icon size={14} className={active ? 'text-primary' : 'text-slate-500'} />
                <span className="text-xs">{m.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="glass-card rounded-2xl overflow-hidden shadow-2xl border border-white/5">
        <div className="flex items-center gap-2 p-3 border-b border-white/5 bg-white/3 overflow-x-auto custom-scrollbar">
          {[
            { Icon: Type, kind: 'heading' as const, title: 'Heading' },
            { Icon: Quote, kind: 'quote' as const, title: 'Quote' },
            { Icon: ListIcon, kind: 'list' as const, title: 'List' },
            { Icon: Bold, kind: 'bold' as const, title: 'Bold' },
            { Icon: Italic, kind: 'italic' as const, title: 'Italic' },
            { Icon: LinkIcon, kind: 'link' as const, title: 'Link' },
          ].map(({ Icon, kind, title }) => (
            <button
              key={kind}
              onClick={() => insertFormat(kind)}
              className="p-2.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              title={title}
            >
              <Icon size={18} />
            </button>
          ))}
          <div className="w-px h-6 bg-white/10 mx-1" />
          <button
            onClick={() => insertFormat('tag')}
            className="p-2.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-primary transition-all"
            title="Hashtag"
          >
            <Hash size={18} />
          </button>
          <button
            onClick={() => insertFormat('mention')}
            className="p-2.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-accent-blue transition-all"
            title="Mention"
          >
            <AtSign size={18} />
          </button>
        </div>

        <div className="p-6 md:p-12 min-h-[450px] bg-gradient-to-b from-transparent to-[#111417]/40">
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            type="text"
            placeholder="Title for your thoughts..."
            className="w-full bg-transparent border-none focus:ring-0 text-3xl md:text-4xl font-black text-white placeholder:text-slate-700 p-0 mb-8 outline-none"
          />
          <textarea
            ref={taRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full bg-transparent border-none focus:ring-0 text-lg text-slate-300 placeholder:text-slate-700 min-h-[300px] resize-none p-0 leading-relaxed custom-scrollbar outline-none"
          />
        </div>

        <div className="px-6 md:px-8 py-4 border-t border-white/5 bg-[#0B0E11]/40 flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-600">
            <span>{wordCount} words</span>
            <span className="hidden md:inline">{charCount} chars</span>
            <span className="flex items-center gap-1.5">
              <span className={cn('w-1 h-1 rounded-full', savedAt ? 'bg-emerald-500' : 'bg-slate-600')} />
              {savedAt ? `Auto-saved ${Math.max(1, Math.round((Date.now() - savedAt) / 1000))}s ago` : 'Unsaved'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-primary">
            <VisIcon size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">{visibilityInfo[visibility].label}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-12">
        <button
          onClick={() => setContent((c) => (c ? c + '\n\n' + prompt : prompt))}
          className="md:col-span-8 glass-card p-8 rounded-2xl border-l-4 border-primary hover:translate-y-[-4px] transition-transform cursor-pointer group text-left"
        >
          <div className="flex items-center justify-between mb-6">
            <Lightbulb size={24} className="text-primary" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
              }}
              className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary"
            >
              Shuffle
            </button>
          </div>
          <h4 className="text-xl font-black text-white mb-2">Writing Prompt</h4>
          <p className="text-slate-400 leading-relaxed">{prompt}</p>
          <div className="mt-6 text-[10px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
            Use Prompt <span className="text-lg">→</span>
          </div>
        </button>

        <motion.div
          animate={{ opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="md:col-span-4 glass-card p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-white/5"
        >
          <Sparkles size={24} className="text-secondary mb-6" />
          <h4 className="text-xl font-black text-white mb-2">Tone Analysis</h4>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your current writing feels <b className="text-primary">{tone}</b>
            {mood && (
              <>
                {' '}and <b className="text-primary">{mood.toLowerCase()}</b>
              </>
            )}
            . {wordCount > 100 ? 'A substantial entry.' : wordCount > 0 ? 'Keep going — a few more thoughts.' : 'Empty page. Lean in.'}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
