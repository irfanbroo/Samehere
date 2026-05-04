'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import AppShell from '@/components/AppShell';
import Avatar from '@/components/Avatar';

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function EntryPage() {
  const { id } = useParams();
  const router = useRouter();
  const [entry, setEntry] = useState(null);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [me, setMe] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [draftTags, setDraftTags] = useState([]);
  const [saving, setSaving] = useState(false);
  const ALL_TAGS = ['#study', '#gym', '#coding', '#work', '#art', '#music', '#gaming', '#nocturnal', '#grind', '#reading', '#cooking', '#fitness', '#sleep', '#earlybird', '#introverted', '#extroverted', '#traveler', '#selfcare', '#sports', '#content', '#poetry', '#drawing', '#photography', '#writing', '#anime', '#foodie', '#linux', '#student', '#college', '#highschool', '#parenting', '#nightowl'];
  function toggleTag(tag) {
    setDraftTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  useEffect(() => {
    setMe(getUser());
    api.get(`/entries/${id}`).then(r => { setEntry(r.data); setDraft(r.data.content); setDraftTags(r.data.tags || []); });
  }, [id]);

  async function handleLike() {
    setEntry(prev => ({ ...prev, liked: !prev.liked, likes_count: parseInt(prev.likes_count) + (!prev.liked ? 1 : -1) }));
    try { await api.post(`/entries/${id}/like`); } catch {
      setEntry(prev => ({ ...prev, liked: !prev.liked, likes_count: parseInt(prev.likes_count) + (!prev.liked ? 1 : -1) }));
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this post?')) return;
    router.push('/feed');
    api.delete(`/entries/${id}`).catch(() => {});
  }

  async function handleDeleteComment(commentId) {
    const prev = entry.comments;
    setEntry(p => ({ ...p, comments: p.comments.filter(c => c.id !== commentId) }));
    try { await api.delete(`/entries/comments/${commentId}`); } catch {
      setEntry(p => ({ ...p, comments: prev }));
    }
  }

  async function handleSave() {
    if (!draft.trim()) return;
    setSaving(true);
    setEntry(prev => ({ ...prev, content: draft, tags: draftTags }));
    setEditing(false);
    try {
      const res = await api.put(`/entries/${id}`, { content: draft, tags: draftTags });
      setEntry(prev => ({ ...prev, content: res.data.content, tags: res.data.tags }));
    } catch { setEditing(true); }
    finally { setSaving(false); }
  }

  async function handleComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    const optimistic = { id: `temp-${Date.now()}`, content: comment, user_id: me?.id, username: me?.username, profile_pic: me?.profile_pic, created_at: new Date().toISOString() };
    setEntry(prev => ({ ...prev, comments: [...prev.comments, optimistic] }));
    setComment('');
    setPosting(true);
    try {
      const res = await api.post(`/entries/${id}/comment`, { content: optimistic.content });
      setEntry(prev => ({ ...prev, comments: prev.comments.map(c => c.id === optimistic.id ? res.data : c) }));
    } catch {
      setEntry(prev => ({ ...prev, comments: prev.comments.filter(c => c.id !== optimistic.id) }));
    } finally { setPosting(false); }
  }

  if (!entry) return <AppShell><p style={{ textAlign: 'center', marginTop: 60, color: '#555' }}>Loading...</p></AppShell>;

  const isOwn = String(entry.user_id) === String(me?.id);


  return (
    <AppShell>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 16px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Link href={`/profile/${entry.user_id}`}>
            <Avatar username={entry.username} profilePic={entry.profile_pic} size={38} />
          </Link>
          <Link href={`/profile/${entry.user_id}`} style={{ color: '#fff', fontWeight: 600, textDecoration: 'none' }}>
            {entry.username}
          </Link>
          {entry.mood && <span style={{ marginLeft: 'auto', background: '#1e1e1e', borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#aaa' }}>{entry.mood}</span>}
        </div>

        {editing ? (
          <>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              autoFocus
              style={{
                width: '100%', minHeight: 140, background: '#0a0a0a', color: '#fff',
                border: '1px solid #444', borderRadius: 10, padding: 12,
                fontSize: 15, lineHeight: 1.6, resize: 'vertical',
                fontFamily: 'inherit', marginBottom: 12,
              }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {ALL_TAGS.map(tag => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)} style={{
                  border: `1px solid ${draftTags.includes(tag) ? '#fff' : '#2a2a2a'}`,
                  background: draftTags.includes(tag) ? '#fff' : 'transparent',
                  color: draftTags.includes(tag) ? '#000' : '#555',
                  borderRadius: 20, padding: '4px 12px', fontSize: 12, cursor: 'pointer',
                  fontWeight: draftTags.includes(tag) ? 600 : 400,
                }}>{tag}</button>
              ))}
            </div>
          </>
        ) : (
          <p style={{ color: '#ccc', fontSize: 16, lineHeight: 1.7, marginBottom: 16 }}>{entry.content}</p>
        )}

        {entry.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
            {entry.tags.map(t => <span key={t} style={{ background: '#1a1a1a', color: '#555', borderRadius: 20, padding: '3px 10px', fontSize: 12 }}>{t}</span>)}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 24, borderBottom: '1px solid #1e1e1e', marginBottom: 24 }}>
          {!editing ? (
            <>
              <button onClick={handleLike} style={{ background: 'none', border: 'none', cursor: 'pointer', color: entry.liked ? '#ff4d4d' : '#555', fontSize: 15, padding: 0 }}>
                {entry.liked ? '♥' : '♡'} {entry.likes_count} likes
              </button>
              {isOwn && (
                <button onClick={() => setEditing(true)} style={{
                  marginLeft: 'auto', background: '#1a1a1a', border: '1px solid #2a2a2a',
                  cursor: 'pointer', color: '#888', borderRadius: 8,
                  padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 11, fontWeight: 500,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#fff'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#888'; }}
                title="Edit">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit
                </button>
              )}
            </>
          ) : (
            <>
              <button onClick={handleDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4d', fontSize: 13, padding: 0 }}>Delete</button>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button onClick={() => setEditing(false)} style={{ background: 'none', border: '1px solid #333', color: '#888', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{ background: '#fff', border: 'none', color: '#000', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </>
          )}
        </div>

        <h3 style={{ fontSize: 14, color: '#555', fontWeight: 600, marginBottom: 16, letterSpacing: 0.5 }}>COMMENTS</h3>

        {entry.comments?.length === 0 && <p style={{ color: '#444', fontStyle: 'italic', marginBottom: 20 }}>No comments yet. Be first.</p>}

        {entry.comments?.map(c => (
          <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <Link href={`/profile/${c.user_id}`}>
              <Avatar username={c.username} profilePic={c.profile_pic} size={30} fontSize={12} />
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link href={`/profile/${c.user_id}`} style={{ color: '#fff', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>{c.username}</Link>
                <span style={{ color: '#444', fontSize: 11 }}>{timeAgo(c.created_at)}</span>
                {String(c.user_id) === String(me?.id) && (
                  <button onClick={() => handleDeleteComment(c.id)} style={{
                    background: 'none', border: 'none', color: '#333', cursor: 'pointer',
                    fontSize: 13, padding: 0, marginLeft: 'auto', transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ff4d4d'}
                  onMouseLeave={e => e.currentTarget.style.color = '#333'}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                )}
              </div>
              <p style={{ color: '#aaa', fontSize: 14, margin: '4px 0 0', lineHeight: 1.5 }}>{c.content}</p>
            </div>
          </div>
        ))}

        <form onSubmit={handleComment} style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <input
            style={{ flex: 1, background: '#111', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 14px', fontSize: 14 }}
            placeholder="Add a comment..."
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
          <button type="submit" disabled={posting} style={{ background: '#fff', color: '#000', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
            {posting ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </AppShell>
  );
}

const avatarStyle = {
  width: 38, height: 38, borderRadius: '50%', background: '#222',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: '#fff', fontWeight: 700, fontSize: 15,
};
