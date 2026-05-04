'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import AppShell from '@/components/AppShell';
import Avatar from '@/components/Avatar';

const ALL_TAGS = ['#study', '#gym', '#coding', '#work', '#art', '#music', '#gaming', '#nocturnal', '#grind', '#reading', '#cooking', '#fitness', '#sleep', '#earlybird', '#introverted', '#extroverted', '#traveler', '#selfcare', '#sports', '#content', '#poetry', '#drawing', '#photography', '#writing', '#anime', '#foodie', '#linux', '#student', '#college', '#highschool', '#parenting', '#nightowl'];

export default function DiscoverPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myTags, setMyTags] = useState([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    api.get('/users/discover/similar').then(r => setUsers(r.data)).finally(() => setLoading(false));
    const me = getUser();
    if (me) api.get(`/users/${me.id}`).then(r => setMyTags(r.data.tags || [])).catch(() => {});
  }, []);

  async function handleSearch(q) {
    setSearch(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const r = await api.get(`/users/search?q=${encodeURIComponent(q.trim())}`);
      setSearchResults(r.data);
    } catch {} finally { setSearching(false); }
  }

  async function toggleTag(tag) {
    const updated = myTags.includes(tag) ? myTags.filter(t => t !== tag) : [...myTags, tag];
    setMyTags(updated);
    setSaving(true);
    try {
      await api.put('/users/me', { tags: updated });
      const r = await api.get('/users/discover/similar');
      setUsers(r.data);
    } catch {} finally { setSaving(false); }
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 16px', width: '100%' }}>

        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Discover</h2>
        <p style={{ color: '#444', fontSize: 13, marginBottom: 20 }}>Find people by name, ID, or shared tags</p>

        {/* Search bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 12,
          padding: '10px 16px', marginBottom: 20,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => handleSearch(e.target.value)}
            placeholder="Search by username or #ID..."
            style={{ flex: 1, background: 'transparent', color: '#fff', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit' }} />
          {search && (
            <button onClick={() => { setSearch(''); setSearchResults([]); }} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 16, padding: 0 }}>×</button>
          )}
        </div>

        {/* Search results */}
        {search.trim() && (
          <div style={{ marginBottom: 28 }}>
            <span style={{ fontSize: 11, color: '#444', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {searching ? 'Searching...' : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              {searchResults.map(user => (
                <Link key={user.id} href={`/profile/${user.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: '#0f0f0f', border: '1px solid #1a1a1a',
                    borderRadius: 14, padding: '14px 16px', transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#2a2a2a'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#1a1a1a'}>
                    <Avatar username={user.username} profilePic={user.profile_pic} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <p style={{ color: '#fff', fontWeight: 700, fontSize: 15, margin: 0 }}>{user.username}</p>
                        {user.user_code && <span style={{ color: '#333', fontSize: 11 }}>#{user.user_code}</span>}
                      </div>
                      {user.bio && <p style={{ color: '#555', fontSize: 12, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.bio}</p>}
                    </div>
                  </div>
                </Link>
              ))}
              {!searching && searchResults.length === 0 && (
                <p style={{ color: '#333', fontSize: 13, textAlign: 'center', marginTop: 10 }}>No users found</p>
              )}
            </div>
          </div>
        )}

        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>People like you</h3>
        <p style={{ color: '#444', fontSize: 12, marginBottom: 20 }}>Based on your tags</p>

        {/* Tag picker */}
        <div style={{ marginBottom: 28, background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 16, padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: '#555', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Your tags</span>
            {saving && <span style={{ fontSize: 11, color: '#333' }}>Updating...</span>}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ALL_TAGS.map(tag => {
              const active = myTags.includes(tag);
              return (
                <button key={tag} onClick={() => toggleTag(tag)} style={{
                  padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                  border: `1px solid ${active ? '#fff' : '#222'}`,
                  background: active ? '#fff' : 'transparent',
                  color: active ? '#000' : '#444',
                }}>{tag}</button>
              );
            })}
          </div>
        </div>

        {loading && <p style={{ color: '#333', textAlign: 'center', marginTop: 40 }}>Loading...</p>}

        {!loading && users.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <p style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px' }}>No matches yet</p>
            <p style={{ color: '#444', fontSize: 13 }}>Select some tags above — people with the same ones will show up here.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {users.map(user => (
            <Link key={user.id} href={`/profile/${user.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: '#0f0f0f', border: '1px solid #1a1a1a',
                borderRadius: 14, padding: '14px 16px',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#2a2a2a'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#1a1a1a'}>
                <Avatar username={user.username} profilePic={user.profile_pic} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#fff', fontWeight: 700, fontSize: 15, margin: '0 0 3px' }}>{user.username}</p>
                  {user.bio && <p style={{ color: '#555', fontSize: 12, margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.bio}</p>}
                  {user.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {user.tags.slice(0, 5).map(t => (
                        <span key={t} style={{
                          borderRadius: 20, padding: '2px 8px', fontSize: 11,
                          background: myTags.includes(t) ? 'rgba(255,255,255,0.08)' : '#141414',
                          color: myTags.includes(t) ? '#ccc' : '#444',
                          fontWeight: myTags.includes(t) ? 600 : 400,
                        }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                {user.shared_tags > 0 && (
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff' }}>{user.shared_tags}</p>
                    <p style={{ margin: 0, fontSize: 10, color: '#444', fontWeight: 600 }}>IN COMMON</p>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
