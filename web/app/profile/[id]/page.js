'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { getUser, clearAuth } from '@/lib/auth';
import { TEXT_COLORS, BG_THEMES, OVERALL_THEMES, getTheme, saveTheme } from '@/lib/theme';
import { useIsMobile } from '@/lib/useIsMobile';
import AppShell from '@/components/AppShell';
import Avatar from '@/components/Avatar';
import Cropper from 'react-easy-crop';

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function ProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [me, setMe] = useState(null);
  const [profile, setProfile] = useState(null);
  const [following, setFollowing] = useState(false);
  const [tab, setTab] = useState('entries');
  const [comments, setComments] = useState([]);
  const [liked, setLiked] = useState([]);
  const [followModal, setFollowModal] = useState(null); // 'followers' | 'following' | null
  const [followList, setFollowList] = useState([]);
  const [editing, setEditing] = useState(false);
  const [notifs, setNotifs] = useState({ likes: 0, comments: 0 });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [themeColor, setThemeColor] = useState('#e0e0e0');
  const [themeBg, setThemeBg] = useState('#050505');
  const [overallTheme, setOverallTheme] = useState(null);
  const [customColor, setCustomColor] = useState('#e0e0e0');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [hslH, setHslH] = useState(0);
  const [hslL, setHslL] = useState(70);

  function hslToHexColor(h, l) {
    const s = 80;
    const sl = s / 100, ll = l / 100;
    const a = sl * Math.min(ll, 1 - ll);
    const f = n => {
      const k = (n + h / 30) % 12;
      return ll - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    };
    return '#' + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
  }

  function applyHsl(h, l) {
    const hex = hslToHexColor(h, l);
    setCustomColor(hex); setThemeColor(hex); saveTheme(hex, themeBg);
  }

  const [editForm, setEditForm] = useState({ username: '', bio: '', tags: [] });
  const [saving, setSaving] = useState(false);
  const ALL_TAGS = ['#study', '#gym', '#coding', '#work', '#art', '#music', '#gaming', '#nocturnal', '#grind', '#reading', '#cooking', '#fitness', '#sleep', '#earlybird', '#introverted', '#extroverted', '#traveler', '#selfcare', '#sports', '#content', '#poetry', '#drawing', '#photography', '#writing', '#anime', '#foodie', '#linux', '#student', '#college', '#highschool', '#parenting', '#nightowl'];
  const fileInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const [cropImage, setCropImage] = useState(null);
  const [cropMode, setCropMode] = useState('avatar'); // 'avatar' or 'banner'
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState(null);

  function onFileSelect(file, mode) {
    setCropMode(mode);
    const reader = new FileReader();
    reader.onload = (e) => setCropImage(e.target.result);
    reader.readAsDataURL(file);
  }

  function onCropComplete(_, area) {
    setCroppedArea(area);
  }

  async function handleCropSave() {
    if (!cropImage || !croppedArea) return;
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      if (cropMode === 'avatar') {
        canvas.width = 200;
        canvas.height = 200;
      } else {
        canvas.width = 600;
        canvas.height = 200;
      }
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img,
        croppedArea.x, croppedArea.y, croppedArea.width, croppedArea.height,
        0, 0, canvas.width, canvas.height
      );
      const base64 = canvas.toDataURL('image/jpeg', 0.85);
      try {
        if (cropMode === 'avatar') {
          await api.put('/users/me/pic', { profile_pic: base64 });
          setProfile(prev => ({ ...prev, profile_pic: base64 }));
        } else {
          await api.put('/users/me/banner', { banner_pic: base64 });
          setProfile(prev => ({ ...prev, banner_pic: base64 }));
        }
      } catch {}
      setCropImage(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    img.src = cropImage;
  }

  useEffect(() => {
    setMe(getUser());
    const saved = getTheme();
    setThemeColor(saved.textColor);
    setThemeBg(saved.bgBase);
    setOverallTheme(saved.overallTheme || null);
    setCustomColor(saved.textColor);
    api.get(`/users/${id}`).then(r => { setProfile(r.data); setFollowing(r.data.is_following); });
    api.get(`/users/${id}/comments`).then(r => setComments(r.data)).catch(() => {});
    api.get(`/users/${id}/likes`).then(r => setLiked(r.data)).catch(() => {});
    api.get('/notifications/count').then(r => setNotifs(r.data)).catch(() => {});
  }, [id]);

  const isOwn = String(id) === String(me?.id);

  function openEdit() {
    setEditForm({ username: profile.username || '', bio: profile.bio || '', tags: profile.tags || [] });
    setEditing(true);
  }

  async function saveProfile() {
    setSaving(true);
    setProfile(prev => ({ ...prev, username: editForm.username, bio: editForm.bio, tags: editForm.tags }));
    setEditing(false);
    try {
      const res = await api.put('/users/me', { username: editForm.username, bio: editForm.bio, tags: editForm.tags });
      setProfile(prev => ({ ...prev, username: res.data.username, bio: res.data.bio, tags: res.data.tags }));
    } catch { setEditing(true); }
    finally { setSaving(false); }
  }

  function toggleEditTag(tag) {
    setEditForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
    }));
  }

  async function handleFollow() {
    const newFollowing = !following;
    setFollowing(newFollowing);
    setProfile(prev => ({ ...prev, followers: parseInt(prev.followers) + (newFollowing ? 1 : -1) }));
    try { await api.post(`/users/${id}/follow`); } catch {
      setFollowing(!newFollowing);
      setProfile(prev => ({ ...prev, followers: parseInt(prev.followers) + (!newFollowing ? 1 : -1) }));
    }
  }

  if (!profile) return (
    <AppShell>
      <p style={{ color: '#333', marginTop: 80, textAlign: 'center' }}>Loading...</p>
    </AppShell>
  );

  const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const tabs = ['Entries', 'Comments', 'Likes'];

  return (
    <AppShell>
      <div style={{ maxWidth: 620, margin: '0 auto', width: '100%' }}>

          {/* Sticky top bar */}
          <div style={{
            height: 53, display: 'flex', alignItems: 'center', gap: 20,
            padding: '0 16px', position: 'sticky', top: 0,
            background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(12px)',
            zIndex: 10,
          }}>
            <button onClick={() => router.back()} style={{
              background: 'none', border: 'none', color: '#fff',
              cursor: 'pointer', padding: 4, display: 'flex',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
            </button>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{profile.username}</p>
              <p style={{ color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 13, margin: 0 }}>{profile.entries_count} posts</p>
            </div>

            {/* 3-dot menu — own profile only */}
            {isOwn && (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setSettingsOpen(p => !p)} style={{
                  background: 'none', border: 'none', color: '#fff',
                  cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                  </svg>
                </button>

                {settingsOpen && (
                  <>
                    <div onClick={() => setSettingsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 50 }} />
                    <div style={{
                      position: 'absolute', right: 0, top: 34, zIndex: 51,
                      background: '#111', border: '1px solid #2a2a2a',
                      borderRadius: 14, overflow: 'hidden', minWidth: 180,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}>
                      <button onClick={() => { openEdit(); setSettingsOpen(false); }} style={{
                        width: '100%', padding: '14px 18px', background: 'none',
                        border: 'none', borderBottom: '1px solid #1e1e1e',
                        color: '#ccc', fontSize: 14, textAlign: 'left',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Edit profile
                      </button>
                      <button onClick={() => { setShowTheme(true); setSettingsOpen(false); }} style={{
                        width: '100%', padding: '14px 18px', background: 'none',
                        border: 'none', borderBottom: '1px solid #1e1e1e',
                        color: '#ccc', fontSize: 14, textAlign: 'left',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                        </svg>
                        Theme
                      </button>
                      <button onClick={() => { clearAuth(); router.push('/login'); }} style={{
                        width: '100%', padding: '14px 18px', background: 'none',
                        border: 'none', color: '#ff4d4d', fontSize: 14,
                        textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#1a0000'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Log out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Banner — customizable area */}
          <input type="file" accept="image/*" ref={bannerInputRef} style={{ display: 'none' }}
            onChange={e => { if (e.target.files[0]) { onFileSelect(e.target.files[0], 'banner'); e.target.value = ''; } }} />
          <div
            onClick={() => { if (isOwn) bannerInputRef.current?.click(); }}
            style={{
              height: 200, background: '#1a1a1a',
              position: 'relative', overflow: 'hidden',
              cursor: isOwn ? 'pointer' : 'default',
            }}
          >
            {profile.banner_pic ? (
              <img src={profile.banner_pic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, #111 0%, #222 50%, #1a1a1a 100%)',
              }} />
            )}
            {isOwn && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 0.2s',
                background: 'rgba(0,0,0,0.5)',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 13, fontWeight: 600 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  {profile.banner_pic ? 'Change banner' : 'Add banner'}
                </div>
              </div>
            )}
          </div>

          {/* Profile pic + button row */}
          <div style={{ padding: '0 16px' }}>
            {/* Three-column flex row: [left spacer] [avatar] [right buttons] */}
            {/* Left spacer mirrors the right column so the avatar stays centered */}
            <div style={{ marginTop: -48, marginBottom: 12, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }} />

              {/* Avatar */}
              <div style={{ position: 'relative' }}>
                <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }}
                  onChange={e => { if (e.target.files[0]) { onFileSelect(e.target.files[0], 'avatar'); e.target.value = ''; } }} />
                <div
                  onClick={() => { if (isOwn) fileInputRef.current?.click(); }}
                  style={{
                    width: 96, height: 96, borderRadius: '50%',
                    background: '#111', border: '4px solid #0a0a0a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 38, fontWeight: 900, color: '#fff',
                    position: 'relative', overflow: 'hidden',
                    cursor: isOwn ? 'pointer' : 'default',
                  }}
                >
                  {profile.profile_pic ? (
                    <img src={profile.profile_pic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    profile.username[0].toUpperCase()
                  )}
                  {isOwn && (
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: 0, transition: 'opacity 0.2s',
                      background: 'rgba(0,0,0,0.6)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Follow/Following + message buttons (or spacer for own profile) */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', paddingBottom: 4 }}>
                {!isOwn && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button onClick={handleFollow} style={{
                      background: following ? 'transparent' : '#fff',
                      color: following ? '#fff' : '#000',
                      border: following ? '1px solid #333' : 'none',
                      borderRadius: 20, padding: '8px 20px',
                      fontWeight: 700, fontSize: 14, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (following) { e.currentTarget.style.borderColor = '#ff4d4d'; e.currentTarget.style.color = '#ff4d4d'; }}}
                    onMouseLeave={e => { if (following) { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#fff'; }}}
                    >{following ? 'Following' : 'Follow'}</button>
                    <button onClick={() => router.push(`/chat/${id}`)} style={{
                      background: 'transparent', border: '1px solid #333',
                      color: '#fff', borderRadius: '50%', width: 36, height: 36,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Name */}
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '4px 0 0', textAlign: 'center' }}>{profile.username}</h2>

            {/* Bio */}
            {profile.bio && <p style={{ color: '#ccc', fontSize: 15, lineHeight: 1.5, margin: '12px 0 0', textAlign: 'center' }}>{profile.bio}</p>}

            {/* Tags */}
            {profile.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10, justifyContent: 'center' }}>
                {profile.tags.map(t => (
                  <span key={t} style={{ color: '#888', fontSize: 13 }}>{t}</span>
                ))}
              </div>
            )}

            {/* Joined */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span style={{ color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 14 }}>Joined {joinDate}</span>
              {profile.user_code && <span style={{ color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 12 }}>· {profile.user_code}</span>}
            </div>

            {/* Following / Followers */}
            <div style={{ display: 'flex', gap: 20, marginTop: 12, marginBottom: 16, justifyContent: 'center' }}>
              <button onClick={() => { api.get(`/users/${id}/following`).then(r => { setFollowList(r.data); setFollowModal('following'); }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 14 }}>
                <strong style={{ color: '#fff' }}>{profile.following}</strong>
                <span style={{ color: 'var(--secondary-text-color, #9CA3AF)' }}> Following</span>
              </button>
              <button onClick={() => { api.get(`/users/${id}/followers`).then(r => { setFollowList(r.data); setFollowModal('followers'); }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 14 }}>
                <strong style={{ color: '#fff' }}>{profile.followers}</strong>
                <span style={{ color: 'var(--secondary-text-color, #9CA3AF)' }}> Follower{profile.followers !== 1 ? 's' : ''}</span>
              </button>
            </div>
          </div>

          {/* Tabs — underline style */}
          <div style={{ display: 'flex', borderBottom: '1px solid #1a1a1a' }}>
            {tabs.map(t => {
              const key = t.toLowerCase();
              const active = tab === key;
              const hasNotif = isOwn && ((key === 'likes' && notifs.likes > 0) || (key === 'comments' && notifs.comments > 0));
              return (
                <button key={t} onClick={() => {
                  setTab(key);
                  if (isOwn && key === 'likes' && notifs.likes > 0) {
                    api.put('/notifications/seen/likes').then(() => {
                      setNotifs(p => ({ ...p, likes: 0, total: p.total - p.likes }));
                      window.dispatchEvent(new Event('notif-update'));
                    });
                  }
                  if (isOwn && key === 'comments' && notifs.comments > 0) {
                    api.put('/notifications/seen/comments').then(() => {
                      setNotifs(p => ({ ...p, comments: 0, total: p.total - p.comments }));
                      window.dispatchEvent(new Event('notif-update'));
                    });
                  }
                }} style={{
                  flex: 1, padding: '16px 0', background: 'none', border: 'none',
                  color: active ? '#fff' : '#555', fontSize: 15,
                  fontWeight: active ? 700 : 400, cursor: 'pointer',
                  position: 'relative', transition: 'color 0.15s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <span style={{ position: 'relative' }}>
                    {t}
                    {hasNotif && (
                      <span style={{
                        position: 'absolute', top: -2, right: -12,
                        width: 8, height: 8, borderRadius: '50%',
                        background: '#ff4d4d',
                      }} />
                    )}
                  </span>
                  {active && <div style={{
                    position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                    width: 48, height: 3, borderRadius: 2, background: '#fff',
                  }} />}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {tab === 'entries' && (
            <>
              {profile.entries?.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <p style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>
                    {isOwn ? 'No entries yet' : `@${profile.username} hasn't posted`}
                  </p>
                  <p style={{ color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 14 }}>
                    {isOwn ? 'Start journaling — your first day awaits.' : 'When they post, entries will show up here.'}
                  </p>
                </div>
              )}
              {profile.entries?.map(entry => (
                <Link key={entry.id} href={`/entry/${entry.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{
                    padding: '16px', borderBottom: '1px solid #141414',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <Avatar username={profile.username} profilePic={profile.profile_pic} size={34} />
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{profile.username}</span>
                      <span style={{ color: 'var(--secondary-text-color, #9CA3AF)' }}>·</span>
                      <span style={{ color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 13 }}>{timeAgo(entry.created_at)}</span>
                      {entry.mood && <span style={{ marginLeft: 'auto', color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 12 }}>{entry.mood}</span>}
                    </div>

                    {/* Content */}
                    <p style={{ color: '#ccc', fontSize: 15, lineHeight: 1.6, margin: '0 0 8px', paddingLeft: 44 }}>{entry.content}</p>

                    {/* Tags */}
                    {entry.tags?.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, paddingLeft: 44, marginBottom: 10 }}>
                        {entry.tags.map(t => <span key={t} style={{ color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 13 }}>{t}</span>)}
                      </div>
                    )}

                    {/* Actions row */}
                    <div style={{ display: 'flex', gap: 32, paddingLeft: 44 }}>
                      <span style={{ color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        {entry.comments_count}
                      </span>
                      <span style={{ color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        ♡ {entry.likes_count}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </>
          )}

          {tab === 'comments' && (
            <>
              {comments.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <p style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>No comments yet</p>
                  <p style={{ color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 14 }}>Comments on entries will show up here.</p>
                </div>
              )}
              {comments.map(c => (
                <Link key={c.id} href={`/entry/${c.entry_id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{
                    display: 'flex', gap: 14, padding: '16px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Left — avatar col */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <Avatar username={c.commenter} profilePic={c.commenter_pic} size={38} />
                      {c.type === 'received' && (
                        <div style={{ width: 1, flex: 1, background: 'rgba(34,197,94,0.12)', minHeight: 16 }} />
                      )}
                    </div>

                    {/* Right — content col */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Name + action + time */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ color: '#e0e0e0', fontWeight: 700, fontSize: 14 }}>{c.commenter}</span>
                        <span style={{ color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 13 }}>
                          {c.type === 'received' ? 'commented on your post' : `commented on ${c.entry_author}'s post`}
                        </span>
                        <span style={{ color: '#333', fontSize: 11, marginLeft: 'auto' }}>{timeAgo(c.created_at)}</span>
                      </div>

                      {/* Entry snippet pill */}
                      <div style={{
                        display: 'inline-block', marginBottom: 8, padding: '4px 10px',
                        background: 'rgba(255,255,255,0.04)', borderRadius: 20,
                        border: '1px solid rgba(255,255,255,0.06)',
                        maxWidth: '100%', overflow: 'hidden',
                      }}>
                        <span style={{ color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: 340 }}>
                          {c.entry_content?.slice(0, 60)}{c.entry_content?.length > 60 ? '...' : ''}
                        </span>
                      </div>

                      {/* Comment text */}
                      <p style={{ color: '#ccc', fontSize: 14, lineHeight: 1.55, margin: 0 }}>{c.content}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </>
          )}

          {tab === 'likes' && (
            <>
              {liked.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <p style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>No likes yet</p>
                  <p style={{ color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 14 }}>Likes on entries will show up here.</p>
                </div>
              )}
              {liked.map(l => (
                <Link key={l.id} href={`/entry/${l.entry_id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{
                    margin: '10px 12px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.02)',
                    overflow: 'hidden',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,77,77,0.2)'; e.currentTarget.style.background = 'rgba(255,77,77,0.03)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  >
                    {/* Entry author header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px 0' }}>
                      <Avatar username={l.entry_author} profilePic={l.entry_author_pic} size={22} />
                      <span style={{ color: '#777', fontSize: 12, fontWeight: 600 }}>{l.entry_author}</span>
                    </div>

                    {/* Entry content */}
                    <div style={{ padding: '8px 16px 10px' }}>
                      <p style={{ color: '#d0d0d0', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                        {l.entry_content?.slice(0, 100)}{l.entry_content?.length > 100 ? '...' : ''}
                      </p>
                    </div>

                    {/* Footer — liker info */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 16px 12px',
                      borderTop: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <span style={{ color: l.type === 'received' ? '#ff4d4d' : '#444', fontSize: 13 }}>♥</span>
                      <Avatar username={l.liker} profilePic={l.liker_pic} size={18} />
                      <span style={{ color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 12 }}>
                        <span style={{ color: '#999', fontWeight: 600 }}>
                          {l.type === 'received' ? l.liker : (isOwn ? 'you' : profile.username)}
                        </span> liked this
                      </span>
                      <span style={{ color: '#2e2e2e', fontSize: 11, marginLeft: 'auto' }}>{timeAgo(l.created_at)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </>
          )}

        </div>

      {/* Crop modal */}
      {/* Followers / Following modal */}
      {followModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setFollowModal(null)}>
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 16, width: '100%', maxWidth: 400, maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #1a1a1a' }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>{followModal === 'followers' ? 'Followers' : 'Following'}</span>
              <button onClick={() => setFollowModal(null)} style={{ background: 'none', border: 'none', color: 'var(--secondary-text-color, #9CA3AF)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
            </div>
            {/* List */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {followList.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--secondary-text-color, #9CA3AF)', padding: '40px 20px', margin: 0 }}>No {followModal} yet</p>
              )}
              {followList.map(u => (
                <Link key={u.id} href={`/profile/${u.id}`} onClick={() => setFollowModal(null)} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #141414', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Avatar username={u.username} profilePic={u.profile_pic} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#fff' }}>{u.username}</p>
                    {u.bio && <p style={{ margin: 0, fontSize: 12, color: 'var(--secondary-text-color, #9CA3AF)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.bio}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {cropImage && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px', borderBottom: '1px solid #1a1a1a',
          }}>
            <button onClick={() => { setCropImage(null); setCrop({ x: 0, y: 0 }); setZoom(1); }} style={{
              background: 'none', border: 'none', color: '#fff', cursor: 'pointer',
              fontSize: 15, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{cropMode === 'avatar' ? 'Crop photo' : 'Crop banner'}</span>
            <button onClick={handleCropSave} style={{
              background: '#fff', color: '#000', border: 'none',
              borderRadius: 20, padding: '8px 20px', fontWeight: 700,
              fontSize: 14, cursor: 'pointer',
            }}>Apply</button>
          </div>

          {/* Cropper */}
          <div style={{ flex: 1, position: 'relative' }}>
            <Cropper
              image={cropImage}
              crop={crop}
              zoom={zoom}
              aspect={cropMode === 'avatar' ? 1 : 3}
              cropShape={cropMode === 'avatar' ? 'round' : 'rect'}
              showGrid={cropMode === 'banner'}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          {/* Zoom slider */}
          <div style={{ padding: '16px 40px', display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid #1a1a1a' }}>
            <span style={{ fontSize: 12, color: 'var(--secondary-text-color, #9CA3AF)' }}>-</span>
            <input
              type="range" min={1} max={3} step={0.05} value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#fff' }}
            />
            <span style={{ fontSize: 12, color: 'var(--secondary-text-color, #9CA3AF)' }}>+</span>
          </div>
        </div>
      )}

      {/* Edit profile modal */}
      {editing && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setEditing(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--bg-base, #0a0a0a)', border: '1px solid var(--bg-border, #1a1a1a)',
            borderRadius: 20, width: '100%', maxWidth: 500,
            padding: 0, overflow: 'hidden',
          }}>
            {/* Modal header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '1px solid #1a1a1a',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button onClick={() => setEditing(false)} style={{
                  background: 'none', border: 'none', color: '#fff',
                  cursor: 'pointer', padding: 0, display: 'flex',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
                <span style={{ fontSize: 17, fontWeight: 700 }}>Edit profile</span>
              </div>
              <button onClick={saveProfile} disabled={saving} style={{
                background: '#fff', color: '#000', border: 'none',
                borderRadius: 20, padding: '8px 20px', fontWeight: 700,
                fontSize: 14, cursor: 'pointer',
              }}>{saving ? 'Saving...' : 'Save'}</button>
            </div>

            {/* Form */}
            <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Name */}
              <div style={{ position: 'relative' }}>
                <label style={{
                  position: 'absolute', top: 8, left: 14,
                  fontSize: 12, color: 'var(--secondary-text-color, #9CA3AF)',
                }}>Name</label>
                <span style={{
                  position: 'absolute', top: 8, right: 14,
                  fontSize: 12, color: 'var(--secondary-text-color, #9CA3AF)',
                }}>{editForm.username.length} / 30</span>
                <input
                  value={editForm.username}
                  onChange={e => { if (e.target.value.length <= 30) setEditForm({ ...editForm, username: e.target.value }); }}
                  style={{
                    width: '100%', background: 'transparent',
                    color: '#fff', border: '1px solid #2a2a2a', borderRadius: 12,
                    padding: '28px 14px 10px', fontSize: 16, fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Bio */}
              <div style={{ position: 'relative' }}>
                <label style={{
                  position: 'absolute', top: 8, left: 14,
                  fontSize: 12, color: 'var(--secondary-text-color, #9CA3AF)',
                }}>Bio</label>
                <span style={{
                  position: 'absolute', top: 8, right: 14,
                  fontSize: 12, color: 'var(--secondary-text-color, #9CA3AF)',
                }}>{editForm.bio.length} / 150</span>
                <textarea
                  value={editForm.bio}
                  onChange={e => { if (e.target.value.length <= 150) setEditForm({ ...editForm, bio: e.target.value }); }}
                  placeholder="Write something about yourself..."
                  style={{
                    width: '100%', minHeight: 100, background: 'transparent',
                    color: '#fff', border: '1px solid #2a2a2a', borderRadius: 12,
                    padding: '28px 14px 12px', fontSize: 15, resize: 'vertical',
                    fontFamily: 'inherit', lineHeight: 1.5,
                  }}
                />
              </div>

              {/* Tags */}
              <div>
                <label style={{ fontSize: 12, color: 'var(--secondary-text-color, #9CA3AF)', marginBottom: 10, display: 'block' }}>Your vibes</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {ALL_TAGS.map(tag => (
                    <button key={tag} type="button" onClick={() => toggleEditTag(tag)} style={{
                      border: `1px solid ${editForm.tags.includes(tag) ? '#fff' : '#2a2a2a'}`,
                      background: editForm.tags.includes(tag) ? '#fff' : 'transparent',
                      color: editForm.tags.includes(tag) ? '#000' : '#555',
                      borderRadius: 20, padding: '6px 14px', fontSize: 13,
                      cursor: 'pointer', fontWeight: editForm.tags.includes(tag) ? 600 : 400,
                      transition: 'all 0.15s',
                    }}>{tag}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Theme Modal */}
      {showTheme && (
        <>
          <div onClick={() => setShowTheme(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, backdropFilter: 'blur(4px)' }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            zIndex: 201, background: 'var(--bg-card, #0d0d0d)', border: '1px solid var(--bg-border, #2a2a2a)',
            borderRadius: 20, width: '90%', maxWidth: 420,
            boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
            maxHeight: '85vh', display: 'flex', flexDirection: 'column',
          }}>
            {/* Sticky header */}
            <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #1a1a1a', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Theme</h3>
                <button onClick={() => setShowTheme(false)} style={{ background: 'none', border: 'none', color: 'var(--secondary-text-color, #9CA3AF)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
              </div>
            </div>
            {/* Scrollable content */}
            <div style={{ overflowY: 'auto', padding: '20px 28px 28px', flex: 1 }}>


            {/* Overall Themes */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--secondary-text-color, #9CA3AF)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Overall Theme</p>
                {overallTheme && overallTheme !== 'default' && <button onClick={() => { setOverallTheme('default'); saveTheme('#e0e0e0', '#0a0a0a', 'default'); }} style={{ background: 'none', border: 'none', color: '#555', fontSize: 11, cursor: 'pointer', padding: 0 }}>Reset</button>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {OVERALL_THEMES.map(t => (
                  <button key={t.id} onClick={() => {
                    setOverallTheme(t.id);
                    saveTheme(themeColor, themeBg, t.id);
                  }} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                    borderRadius: 14, border: `1.5px solid ${overallTheme === t.id ? t.accent : '#222'}`,
                    background: overallTheme === t.id ? t.bgBase : 'transparent',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                  }}>
                    {/* Color swatches preview */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
                      {t.preview.map((c, i) => (
                        <div key={i} style={{ width: 24, height: i === 0 ? 28 : 12, borderRadius: 6, background: c }} />
                      ))}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: overallTheme === t.id ? t.textColor : '#ccc' }}>
                          {t.emoji} {t.label}
                        </p>
                        {t.gradient && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', color: '#888', letterSpacing: '0.08em' }}>GRADIENT</span>}
                      </div>
                      <p style={{ margin: '3px 0 0', fontSize: 11, color: overallTheme === t.id ? t.subtext : '#555' }}>{t.description}</p>
                    </div>
                    {overallTheme === t.id && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview strip */}
            <div style={{ padding: '12px 16px', background: overallTheme ? OVERALL_THEMES.find(t=>t.id===overallTheme)?.bgBase : themeBg, border: '1px solid #1a1a1a', borderRadius: 12, marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 13, color: overallTheme ? OVERALL_THEMES.find(t=>t.id===overallTheme)?.textColor : themeColor }}>Preview — this is how your text will look</p>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: overallTheme ? OVERALL_THEMES.find(t=>t.id===overallTheme)?.subtext : themeColor, opacity: 0.6 }}>Secondary text</p>
            </div>

            <button onClick={() => { saveTheme('#e0e0e0', '#0a0a0a', 'default'); setThemeColor('#e0e0e0'); setThemeBg('#0a0a0a'); setCustomColor('#e0e0e0'); setOverallTheme('default'); }} style={{
              width: '100%', padding: '10px', background: 'transparent', border: '1px solid #222',
              borderRadius: 12, color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 13, cursor: 'pointer', fontWeight: 600,
            }}>Reset to default</button>
            </div>{/* end scrollable */}
          </div>
        </>
      )}
    </AppShell>
  );
}
