import { createContext, useContext, useEffect, useMemo, useReducer, ReactNode } from 'react';

export type Mood = 'Inspired' | 'Peaceful' | 'Reflective' | 'Creative' | 'Productive' | 'Grinding';

export interface Author {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio?: string;
  role?: string;
  location?: string;
}

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  time: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // user ids
}

export interface Poll {
  question: string;
  options: PollOption[];
  closesAt?: number;
}

export type ReactionEmoji = '❤️' | '🔥' | '💯' | '✨' | '🙌' | '🌙';
export const REACTIONS: ReactionEmoji[] = ['❤️', '🔥', '💯', '✨', '🙌', '🌙'];

export interface Post {
  id: string;
  authorId: string;
  content: string;
  title?: string;
  mood?: Mood;
  tag?: string;
  tagColor?: string;
  createdAt: number;
  likedBy: string[];
  reactions: Partial<Record<ReactionEmoji, string[]>>;
  comments: Comment[];
  bookmarked?: boolean;
  poll?: Poll;
  quotedPostId?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  image?: string;
  time: number;
  status?: 'sent' | 'read';
}

export interface Conversation {
  id: string;
  participantId: string;
  online?: boolean;
}

export interface Todo {
  id: string;
  text: string;
  meta?: string;
  done: boolean;
}

export interface Intention {
  id: string;
  text: string;
  done: boolean;
}

export interface DiaryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  content: string;
  mood?: Mood;
  updatedAt: number;
}

export interface Notification {
  id: string;
  kind: 'like' | 'comment' | 'connect' | 'message' | 'system';
  fromId?: string;
  text: string;
  time: number;
  read: boolean;
}

export interface Settings {
  theme: 'dark' | 'darker';
  notifications: boolean;
  sound: boolean;
  visibility: 'everyone' | 'connections' | 'private';
  language: string;
}

interface State {
  currentUserId: string;
  users: Record<string, Author>;
  posts: Post[];
  conversations: Conversation[];
  messages: Message[];
  connections: string[]; // user ids the current user is connected with
  pending: string[]; // user ids with pending request
  todos: Todo[];
  intentions: Intention[];
  notifications: Notification[];
  diary: DiaryEntry[];
  settings: Settings;
  drafts: { title: string; content: string; mood: Mood } | null;
  streak: number;
  entries: number;
}

type Action =
  | { type: 'ADD_POST'; post: Post }
  | { type: 'DELETE_POST'; id: string }
  | { type: 'TOGGLE_LIKE'; id: string }
  | { type: 'TOGGLE_REACTION'; id: string; emoji: ReactionEmoji }
  | { type: 'VOTE_POLL'; postId: string; optionId: string }
  | { type: 'TOGGLE_BOOKMARK'; id: string }
  | { type: 'ADD_COMMENT'; postId: string; text: string }
  | { type: 'SEND_MESSAGE'; conversationId: string; text?: string; image?: string }
  | { type: 'MARK_READ'; conversationId: string }
  | { type: 'TOGGLE_CONNECT'; userId: string }
  | { type: 'ADD_TODO'; text: string; meta?: string }
  | { type: 'TOGGLE_TODO'; id: string }
  | { type: 'DELETE_TODO'; id: string }
  | { type: 'TOGGLE_INTENTION'; id: string }
  | { type: 'ADD_INTENTION'; text: string }
  | { type: 'MARK_NOTIF_READ'; id?: string }
  | { type: 'SAVE_DIARY'; entry: DiaryEntry }
  | { type: 'DELETE_DIARY'; id: string }
  | { type: 'SAVE_DRAFT'; draft: State['drafts'] }
  | { type: 'CLEAR_DRAFT' }
  | { type: 'UPDATE_SETTINGS'; patch: Partial<Settings> }
  | { type: 'UPDATE_PROFILE'; patch: Partial<Author> }
  | { type: 'HYDRATE'; state: State };

const ME: Author = {
  id: 'me',
  name: 'soulsearcher75',
  handle: '@soulsearcher75',
  avatar:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBX0CywWXq-eVeeQ0hxdjroXs0pq18zy5nC1NOLV9Lu5pdr4NAZb1jC99OCqRCKbpFW7ytkVgZOSbSoCyoDJrL58uP2qndvb6G9_avlzbqdvbRk1uc_FOb3QQDVwihRgY1Rw7d9uS360o4ipIZ_vxn99XDMNZ4ewgx38NqrHUL-gXtb7BwLPiqB8tOJ5BoB7_1HtvXYVQ_DL8C_yJp8FCdXm5Vi7wcoBr20Y-TyvNFRIXQc2BHZXrI6FSWLhSBja_lSR6awFgetDSK9',
  bio: 'Daily reflections on craft, focus, and quiet rebellion.',
  role: 'Designer',
  location: 'Lahore',
};

const SEED_USERS: Author[] = [
  ME,
  {
    id: 'julian',
    name: 'Julian D.',
    handle: '@juliand',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB7yPPToEY0hzpthctXMPtFptGCuWrGAbeMdIh5bN-qE3fWmfFyjbihVZDkXRfgfclUkQwPQkNh6dzpWe0OOwfP798qhhgzvT2pO-pfaxVdSfF5xV94sey3Ivf9FaHbspG3_ElvYAZBD38yN7szmEUYl0MZqi8su0hf6cAnB5lnVSTxQ3pDq-_GavjwM5mQM_nmEYwcuBlbfhhY93WPmBAw21nJE7mlVvx5JSSP1Z1towNhB3KHajlgAgNAcko1fapHCiJe8NEsbYmZ',
    bio: 'Prototyper. Long-walk thinker.',
    role: 'Product Designer',
    location: 'Berlin',
  },
  {
    id: 'anya',
    name: 'Anya M.',
    handle: '@anyam',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAcDyXn6W-Mnqxznwej-XJ1PjDtPzaWWnliujXfdtzcUJn4JI2DvOG1SVjUxBP_gcS0uBaVoCatDTlTdyOH5JwGc_zb7SX3vbG4yHPGm0o2DiZORZWM482LONTTKOS43YKcy7iggHVN9G0ckllkp2S3bsoMzjMTRRjPHvWjaojcMJhdlnG740428d1Uwjs6lhAvQeeg-VuuiLovx5kxs6hJbn8TvyiduMdACm-siBONmMYxNLJZYh3GZTbj7SdwKqYjUHBQshhK2Pxd',
    role: 'Founder',
    location: 'Karachi',
  },
  {
    id: 'elena',
    name: 'Elena Rodriguez',
    handle: '@elenar',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAuezFxzpl2NNQMWcuwiy57uajF-JRLjdmkgYyArcARGFqILPQ52y9c1_telOkE6NtCVDBGAI8bz911RbBAFnXmfaaimVCJWBYf-NgwLaGP_up2zaM0qDSvd5Fkml58EdR2yorh2eFhG8MSG-B-lMmp4GbV_3-0iBPPVdvkYaFeJlG1L638geeXJWbS0Un3nBc6RPU5jVTFYX-nXkxH7kITDIewdizFLB_YuxgY6zH7Zgq8gpTrPS8G39JE4HDnJZm4dXQIwCyhc9Mv',
    role: 'Researcher',
    location: 'Madrid',
  },
  {
    id: 'sarah',
    name: 'Sarah Jenkins',
    handle: '@sarahj',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA8OtyhLNssC-kRvZ7yZO4HBEd4ilmWqUHS8Pd62R4GAcjhS0FC8-tDqEyZuRir_S5qUz4wN7oihVXsH8TYLBTggUMArS5PwH1S7qTEtr8ShUtLe30eu_WNnOW4mwL4IvAstXKRachIVgRF693qcXS4rOqT8niQCasxwKZ241MoU6RivgZLi4mrWscCqGuBd9Yq2hmSQgu9-GUzBSYg_pnxiwSu-_LthG7qvyfdBRQAXi3_anawd99Ip_B4q5F65qcjt8NHeypTQlxO',
    role: 'Engineer',
    location: 'Berlin',
  },
  {
    id: 'marcus',
    name: 'Marcus Chen',
    handle: '@marcusc',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAIxuYJH_TyZ3wTuHXUFHvgxGFjmMAlVovn767J8oWW3pXhquCeagBn7vy80aESVezLlwygXdlkhe6KvcMDhi_rTVKOe6pcKFVMyEInKi82VRKVnOPwiEBynuH3TuTiMTo9XmFyM72v5bjjDhfKNhHviUrwigGRl4NCR5rGrsdQxAEwqNxv-Za2E-ay9CUaZ-YN1eaARd65aNVb1UZG-Oe6rvHMg6mgLnA7g097cfeYKdiUnOKVShdknXthWEblJxqvz9YQ1K4FKuWt',
    role: 'Writer',
    location: 'Tokyo',
  },
];

const SEED_POSTS: Post[] = [
  {
    id: 'p1',
    authorId: 'julian',
    content:
      'Just finished a 4-hour deep work session on the new prototype. The flow state is real today. Feeling immensely grateful for this clarity. #flow #deepwork',
    tag: 'productive',
    tagColor: 'bg-[#901822]/20 text-[#ffb3b0] border-[#901822]',
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    likedBy: [],
    reactions: { '🔥': ['anya'], '✨': ['anya', 'sarah'] },
    comments: [],
  },
  {
    id: 'p2',
    authorId: 'anya',
    content:
      "Sometimes the hardest part isn't the work itself, but starting. Today was one of those days. Pushed through and feeling better for it. Who's with me? #grinding #mindset",
    tag: 'grinding',
    tagColor: 'bg-[#e76e16]/20 text-[#ffb68e] border-[#e76e16]',
    createdAt: Date.now() - 1000 * 60 * 60 * 4,
    likedBy: ['me'],
    reactions: { '💯': ['julian'] },
    comments: [
      {
        id: 'c1',
        authorId: 'julian',
        text: 'Same here. Ship the bad first draft.',
        time: Date.now() - 1000 * 60 * 60 * 3,
      },
    ],
  },
  {
    id: 'p3',
    authorId: 'elena',
    content: 'A small poll for the makers — what kills your focus first? #focus',
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
    likedBy: [],
    reactions: {},
    comments: [],
    poll: {
      question: 'What kills your focus first?',
      options: [
        { id: 'o1', text: 'Notifications', votes: ['marcus'] },
        { id: 'o2', text: 'Open tabs', votes: [] },
        { id: 'o3', text: 'Inner restlessness', votes: ['julian', 'anya'] },
        { id: 'o4', text: 'Hunger', votes: [] },
      ],
    },
  },
];

const SEED_CONVOS: Conversation[] = [
  { id: 'cv1', participantId: 'elena', online: true },
  { id: 'cv2', participantId: 'sarah', online: true },
  { id: 'cv3', participantId: 'marcus', online: false },
];

const SEED_MESSAGES: Message[] = [
  {
    id: 'm1',
    conversationId: 'cv1',
    senderId: 'elena',
    text:
      'Hey! I was thinking about the concept we discussed for the new social experience. The "contained fluidity" idea is really sticking with me.',
    time: Date.now() - 1000 * 60 * 30,
  },
  {
    id: 'm2',
    conversationId: 'cv1',
    senderId: 'me',
    text:
      "I'm glad you liked it! I think the key is balancing that high-end feeling with something that feels intimate.",
    time: Date.now() - 1000 * 60 * 22,
    status: 'read',
  },
  {
    id: 'm3',
    conversationId: 'cv1',
    senderId: 'me',
    text: "Are we still good for the walkthrough tomorrow? I'd love to show you the glassmorphism prototypes.",
    time: Date.now() - 1000 * 60 * 20,
    status: 'read',
  },
  {
    id: 'm4',
    conversationId: 'cv1',
    senderId: 'elena',
    text:
      "Absolutely! Can't wait to see them. I've actually started sketching some ideas for the micro-interactions too.",
    time: Date.now() - 1000 * 60 * 18,
  },
  {
    id: 'm5',
    conversationId: 'cv2',
    senderId: 'sarah',
    text: "I've shared the design tokens with the team.",
    time: Date.now() - 1000 * 60 * 60 * 4,
  },
  {
    id: 'm6',
    conversationId: 'cv3',
    senderId: 'marcus',
    text: 'The meeting has been rescheduled to 4 PM.',
    time: Date.now() - 1000 * 60 * 60 * 26,
  },
];

const initialState: State = {
  currentUserId: 'me',
  users: Object.fromEntries(SEED_USERS.map((u) => [u.id, u])),
  posts: SEED_POSTS,
  conversations: SEED_CONVOS,
  messages: SEED_MESSAGES,
  connections: ['julian'],
  pending: [],
  todos: [
    { id: 't1', text: 'Deep work: Focus Block', meta: '9:00 AM — 11:00 AM', done: false },
    { id: 't2', text: 'Morning Reflection', meta: 'COMPLETED', done: true },
    { id: 't3', text: 'Physical training', meta: 'EVENING', done: false },
  ],
  intentions: [
    { id: 'i1', text: '15 min meditation', done: false },
    { id: 'i2', text: 'Post daily entry', done: true },
    { id: 'i3', text: 'Read 10 pages', done: false },
  ],
  notifications: [
    { id: 'n1', kind: 'like', fromId: 'julian', text: 'liked your reflection', time: Date.now() - 1000 * 60 * 12, read: false },
    { id: 'n2', kind: 'connect', fromId: 'sarah', text: 'wants to connect', time: Date.now() - 1000 * 60 * 60, read: false },
    { id: 'n3', kind: 'comment', fromId: 'marcus', text: 'commented on your entry', time: Date.now() - 1000 * 60 * 90, read: true },
  ],
  diary: [],
  settings: {
    theme: 'dark',
    notifications: true,
    sound: true,
    visibility: 'everyone',
    language: 'English',
  },
  drafts: null,
  streak: 12,
  entries: 312,
};

function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return action.state;
    case 'ADD_POST':
      return {
        ...state,
        posts: [action.post, ...state.posts],
        entries: state.entries + 1,
        notifications: [
          { id: uid('n'), kind: 'system', text: 'Your entry is live.', time: Date.now(), read: false },
          ...state.notifications,
        ],
      };
    case 'DELETE_POST':
      return { ...state, posts: state.posts.filter((p) => p.id !== action.id) };
    case 'TOGGLE_LIKE': {
      const me = state.currentUserId;
      return {
        ...state,
        posts: state.posts.map((p) =>
          p.id === action.id
            ? {
                ...p,
                likedBy: p.likedBy.includes(me)
                  ? p.likedBy.filter((u) => u !== me)
                  : [...p.likedBy, me],
              }
            : p
        ),
      };
    }
    case 'TOGGLE_REACTION': {
      const me = state.currentUserId;
      return {
        ...state,
        posts: state.posts.map((p) => {
          if (p.id !== action.id) return p;
          const cur = p.reactions[action.emoji] ?? [];
          const next = cur.includes(me) ? cur.filter((u) => u !== me) : [...cur, me];
          const reactions = { ...p.reactions, [action.emoji]: next };
          if (next.length === 0) delete reactions[action.emoji];
          return { ...p, reactions };
        }),
      };
    }
    case 'VOTE_POLL': {
      const me = state.currentUserId;
      return {
        ...state,
        posts: state.posts.map((p) => {
          if (p.id !== action.postId || !p.poll) return p;
          const options = p.poll.options.map((o) => {
            // remove user from any other option, then place on chosen option (or remove if same)
            const without = o.votes.filter((u) => u !== me);
            if (o.id === action.optionId) {
              const had = o.votes.includes(me);
              return { ...o, votes: had ? without : [...without, me] };
            }
            return { ...o, votes: without };
          });
          return { ...p, poll: { ...p.poll, options } };
        }),
      };
    }
    case 'TOGGLE_BOOKMARK':
      return {
        ...state,
        posts: state.posts.map((p) => (p.id === action.id ? { ...p, bookmarked: !p.bookmarked } : p)),
      };
    case 'ADD_COMMENT':
      return {
        ...state,
        posts: state.posts.map((p) =>
          p.id === action.postId
            ? {
                ...p,
                comments: [
                  ...p.comments,
                  { id: uid('c'), authorId: state.currentUserId, text: action.text, time: Date.now() },
                ],
              }
            : p
        ),
      };
    case 'SEND_MESSAGE':
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: uid('m'),
            conversationId: action.conversationId,
            senderId: state.currentUserId,
            text: action.text,
            image: action.image,
            time: Date.now(),
            status: 'sent',
          },
        ],
      };
    case 'MARK_READ':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.conversationId === action.conversationId && m.senderId === state.currentUserId
            ? { ...m, status: 'read' }
            : m
        ),
      };
    case 'TOGGLE_CONNECT': {
      const isConnected = state.connections.includes(action.userId);
      return {
        ...state,
        connections: isConnected
          ? state.connections.filter((u) => u !== action.userId)
          : [...state.connections, action.userId],
      };
    }
    case 'ADD_TODO':
      return {
        ...state,
        todos: [...state.todos, { id: uid('t'), text: action.text, meta: action.meta, done: false }],
      };
    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: state.todos.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t)),
      };
    case 'DELETE_TODO':
      return { ...state, todos: state.todos.filter((t) => t.id !== action.id) };
    case 'TOGGLE_INTENTION':
      return {
        ...state,
        intentions: state.intentions.map((i) => (i.id === action.id ? { ...i, done: !i.done } : i)),
      };
    case 'ADD_INTENTION':
      return {
        ...state,
        intentions: [...state.intentions, { id: uid('i'), text: action.text, done: false }],
      };
    case 'SAVE_DIARY': {
      const existing = state.diary.findIndex((d) => d.id === action.entry.id);
      const next = [...state.diary];
      if (existing >= 0) next[existing] = action.entry;
      else next.unshift(action.entry);
      return { ...state, diary: next };
    }
    case 'DELETE_DIARY':
      return { ...state, diary: state.diary.filter((d) => d.id !== action.id) };
    case 'MARK_NOTIF_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          !action.id || n.id === action.id ? { ...n, read: true } : n
        ),
      };
    case 'SAVE_DRAFT':
      return { ...state, drafts: action.draft };
    case 'CLEAR_DRAFT':
      return { ...state, drafts: null };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        users: { ...state.users, [state.currentUserId]: { ...state.users[state.currentUserId], ...action.patch } },
      };
    default:
      return state;
  }
}

const STORAGE_KEY = 'samehere_state_v2';

interface Ctx {
  state: State;
  dispatch: React.Dispatch<Action>;
  me: Author;
  user: (id: string) => Author;
}

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    if (typeof window === 'undefined') return init;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as State;
        // Backfill any missing fields on posts (e.g. reactions added in v2)
        const posts = parsed.posts.map((p) => ({
          ...p,
          reactions: p.reactions ?? {},
          likedBy: p.likedBy ?? [],
          comments: p.comments ?? [],
        }));
        return { ...parsed, posts, diary: parsed.diary ?? [], users: { ...init.users, ...parsed.users } };
      }
    } catch {}
    return init;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const value = useMemo<Ctx>(
    () => ({
      state,
      dispatch,
      me: state.users[state.currentUserId],
      user: (id: string) => state.users[id] ?? state.users[state.currentUserId],
    }),
    [state]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function shortTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\p{L}0-9_]+/gu) ?? [];
  return Array.from(new Set(matches.map((m) => m.toLowerCase())));
}

export function extractMentions(text: string): string[] {
  const matches = text.match(/@[\p{L}0-9_]+/gu) ?? [];
  return Array.from(new Set(matches.map((m) => m.toLowerCase())));
}

export function trendingTags(posts: Post[], limit = 5): { tag: string; count: number }[] {
  const map = new Map<string, number>();
  posts.forEach((p) => {
    extractHashtags(p.content).forEach((t) => map.set(t, (map.get(t) ?? 0) + 1));
  });
  return Array.from(map.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function readingTime(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 220));
  return `${mins} min read`;
}
