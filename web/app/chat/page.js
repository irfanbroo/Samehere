'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import AppShell from '@/components/AppShell';
import Avatar from '@/components/Avatar';

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function ChatInboxPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getUser()) return router.push('/login');
    Promise.all([
      api.get('/chat/conversations'),
      api.get('/users/discover/similar'),
    ]).then(([convRes, simRes]) => {
      setConversations(convRes.data);
      setFollowing(simRes.data);
    }).finally(() => setLoading(false));
  }, [router]);

  const conversationUserIds = useMemo(() => new Set(conversations.map(c => c.other_id)), [conversations]);
  const suggestedUsers = useMemo(() => following.filter(u => !conversationUserIds.has(u.id)).slice(0, 5), [following, conversationUserIds]);

  return (
    <AppShell>
      <div style={{ width: '100%', maxWidth: 600, padding: '24px 20px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>Messages</h2>

          {loading && <p style={{ color: '#333' }}>Loading...</p>}

          {/* Conversations */}
          {conversations.map(c => (
            <Link key={c.other_id} href={`/chat/${c.other_id}`} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', borderRadius: 14,
                transition: 'background 0.15s', cursor: 'pointer',
                marginBottom: 4,
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#111'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Avatar username={c.username} profilePic={c.profile_pic} size={48} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#fff', fontWeight: c.unread > 0 ? 700 : 500, fontSize: 15 }}>{c.username}</span>
                    <span style={{ color: '#444', fontSize: 12 }}>{timeAgo(c.last_message_at)}</span>
                  </div>
                  <p style={{
                    color: c.unread > 0 ? '#ccc' : '#555', fontSize: 13, margin: '2px 0 0',
                    fontWeight: c.unread > 0 ? 600 : 400,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {c.last_message.length > 50 ? c.last_message.slice(0, 50) + '...' : c.last_message}
                  </p>
                </div>
                {c.unread > 0 && (
                  <div style={{
                    background: '#fff', color: '#000', fontSize: 11, fontWeight: 800,
                    minWidth: 20, height: 20, borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 6px',
                  }}>{c.unread}</div>
                )}
              </div>
            </Link>
          ))}

          {/* No conversations yet */}
          {!loading && conversations.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No messages yet</p>
              <p style={{ color: '#444', fontSize: 14 }}>Start a conversation with someone</p>
            </div>
          )}

          {/* Start new chat — show people to message */}
          {!loading && (
            <div style={{ marginTop: 24 }}>
              <p style={{ color: '#555', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>START A CONVERSATION</p>
              {following.filter(u => !conversationUserIds.has(u.id)).slice(0, 5).map(u => (
                <Link key={u.id} href={`/chat/${u.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 16px', borderRadius: 14,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#111'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Avatar username={u.username} profilePic={u.profile_pic} size={40} />
                    <span style={{ color: '#ccc', fontSize: 14, fontWeight: 500 }}>{u.username}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
    </AppShell>
  );
}
