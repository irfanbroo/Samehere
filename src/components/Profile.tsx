import { Calendar, MapPin, Edit2, Check, X, Flame, Heart, MessageCircle, Bookmark } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { useApp } from '@/store/AppContext';
import FeedItem from './FeedItem';
import { showToast } from './Toast';
import { cn } from '@/lib/utils';

type ProfileTab = 'entries' | 'liked' | 'bookmarks';

interface Props {
  onTagFilter?: (tag: string) => void;
}

export default function Profile({ onTagFilter }: Props) {
  const { state, dispatch, me } = useApp();
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<ProfileTab>('entries');
  const [draftName, setDraftName] = useState(me.name);
  const [draftBio, setDraftBio] = useState(me.bio ?? '');
  const [draftRole, setDraftRole] = useState(me.role ?? '');
  const [draftLocation, setDraftLocation] = useState(me.location ?? '');

  const myPosts = useMemo(() => state.posts.filter((p) => p.authorId === state.currentUserId), [state.posts, state.currentUserId]);
  const liked = useMemo(() => state.posts.filter((p) => p.likedBy.includes(state.currentUserId)), [state.posts, state.currentUserId]);
  const bookmarked = useMemo(() => state.posts.filter((p) => p.bookmarked), [state.posts]);

  const totalLikes = myPosts.reduce((sum, p) => sum + p.likedBy.length, 0);
  const totalComments = myPosts.reduce((sum, p) => sum + p.comments.length, 0);

  const save = () => {
    dispatch({
      type: 'UPDATE_PROFILE',
      patch: { name: draftName.trim() || me.name, bio: draftBio.trim(), role: draftRole.trim(), location: draftLocation.trim() },
    });
    setEditing(false);
    showToast('Profile updated');
  };

  const cancel = () => {
    setDraftName(me.name);
    setDraftBio(me.bio ?? '');
    setDraftRole(me.role ?? '');
    setDraftLocation(me.location ?? '');
    setEditing(false);
  };

  const list = tab === 'entries' ? myPosts : tab === 'liked' ? liked : bookmarked;

  return (
    <div className="space-y-8 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl overflow-hidden border border-white/5"
      >
        <div className="h-40 bg-gradient-to-br from-primary/30 via-accent-blue/20 to-secondary/20 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(178,197,255,0.2),transparent_60%)]" />
        </div>
        <div className="p-6 md:p-8 -mt-16">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end justify-between">
            <div className="flex flex-col md:flex-row gap-4 items-center md:items-end">
              <img
                src={me.avatar}
                alt={me.name}
                className="w-28 h-28 rounded-2xl border-4 border-[#111417] shadow-2xl object-cover"
              />
              <div className="text-center md:text-left mb-2">
                {editing ? (
                  <input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className="text-3xl font-black text-white bg-transparent border-b border-white/20 outline-none focus:border-primary"
                  />
                ) : (
                  <h1 className="text-3xl font-black text-white tracking-tight">{me.name}</h1>
                )}
                <p className="text-sm text-slate-500">{me.handle}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button
                    onClick={save}
                    className="bg-primary text-[#002b73] px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2"
                  >
                    <Check size={14} /> Save
                  </button>
                  <button
                    onClick={cancel}
                    className="bg-white/5 text-slate-300 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2"
                  >
                    <X size={14} /> Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 border border-white/10"
                >
                  <Edit2 size={14} /> Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {editing ? (
              <>
                <textarea
                  value={draftBio}
                  onChange={(e) => setDraftBio(e.target.value)}
                  placeholder="Bio"
                  rows={2}
                  className="w-full bg-[#0b0e11] border border-white/10 rounded-xl px-4 py-2 text-slate-200 text-sm outline-none focus:border-primary/40"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={draftRole}
                    onChange={(e) => setDraftRole(e.target.value)}
                    placeholder="Role"
                    className="bg-[#0b0e11] border border-white/10 rounded-xl px-4 py-2 text-slate-200 text-sm outline-none focus:border-primary/40"
                  />
                  <input
                    value={draftLocation}
                    onChange={(e) => setDraftLocation(e.target.value)}
                    placeholder="Location"
                    className="bg-[#0b0e11] border border-white/10 rounded-xl px-4 py-2 text-slate-200 text-sm outline-none focus:border-primary/40"
                  />
                </div>
              </>
            ) : (
              <>
                {me.bio && <p className="text-slate-300 text-[15px] leading-relaxed">{me.bio}</p>}
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                  {me.role && (
                    <span className="flex items-center gap-1.5">
                      <span className="font-bold uppercase tracking-wider">Role</span>
                      <span className="text-slate-300">{me.role}</span>
                    </span>
                  )}
                  {me.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={12} />
                      <span>{me.location}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    Joined Jan 2026
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/5">
            <Stat label="Entries" value={myPosts.length} />
            <Stat label="Connections" value={state.connections.length} />
            <Stat
              label="Streak"
              value={
                <span className="flex items-center justify-center gap-1">
                  {state.streak} <Flame size={16} className="text-primary fill-primary" />
                </span>
              }
            />
            <Stat label="Reactions" value={totalLikes} />
          </div>
        </div>
      </motion.div>

      <div className="flex items-center gap-2 border-b border-white/5">
        {(
          [
            { id: 'entries', label: `Entries · ${myPosts.length}`, Icon: MessageCircle },
            { id: 'liked', label: `Liked · ${liked.length}`, Icon: Heart },
            { id: 'bookmarks', label: `Bookmarks · ${bookmarked.length}`, Icon: Bookmark },
          ] as { id: ProfileTab; label: string; Icon: any }[]
        ).map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 -mb-px',
              tab === id ? 'text-primary border-primary' : 'text-slate-500 hover:text-white border-transparent'
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {list.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <p className="text-slate-500 text-sm">Nothing here yet.</p>
          </div>
        ) : (
          list.map((p) => <FeedItem key={p.id} post={p} onTagClick={onTagFilter} />)
        )}
      </div>

      {tab === 'entries' && myPosts.length > 0 && (
        <div className="glass-card rounded-2xl p-6 border border-white/5 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-black text-white">{totalLikes}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total likes</p>
          </div>
          <div>
            <p className="text-2xl font-black text-white">{totalComments}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Comments</p>
          </div>
          <div>
            <p className="text-2xl font-black text-white">
              {myPosts.length > 0 ? Math.round((totalLikes / myPosts.length) * 10) / 10 : 0}
            </p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg per entry</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">{label}</p>
    </div>
  );
}
