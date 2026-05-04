'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getUser, clearAuth } from '@/lib/auth';
import api from '@/lib/api';

export default function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    setUser(getUser());
    const fetchUnread = () => api.get('/chat/unread').then(r => setUnread(r.data.count)).catch(() => {});
    fetchUnread();
    const fetchNotifs = () => api.get('/notifications/count').then(r => setNotifCount(r.data.total)).catch(() => {});
    fetchUnread(); fetchNotifs();

    // Chat: 10s, Notifications: 30s — both pause when tab hidden
    const chatInterval = setInterval(() => { if (!document.hidden) fetchUnread(); }, 10000);
    const notifInterval = setInterval(() => { if (!document.hidden) fetchNotifs(); }, 30000);

    const handler = () => { fetchUnread(); fetchNotifs(); };
    const visibilityHandler = () => { if (!document.hidden) { fetchUnread(); fetchNotifs(); } };

    window.addEventListener('unread-update', handler);
    window.addEventListener('notif-update', handler);
    window.addEventListener('focus', handler);
    document.addEventListener('visibilitychange', visibilityHandler);

    return () => {
      clearInterval(chatInterval); clearInterval(notifInterval);
      window.removeEventListener('unread-update', handler);
      window.removeEventListener('notif-update', handler);
      window.removeEventListener('focus', handler);
      document.removeEventListener('visibilitychange', visibilityHandler);
    };
  }, []);

  const W = expanded ? 220 : 64;

  const links = useMemo(() => [
    { href: '/feed', label: 'Feed', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    )},
    { href: '/discover', label: 'Discover', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    )},
    { href: '/chat', label: 'Chat', badge: unread, icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    )},
    { href: '/new-entry', label: 'Post Day', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    )},
    { href: '/improve', label: 'Improve', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
      </svg>
    )},
    { href: user ? `/profile/${user.id}` : '/feed', label: 'Profile', badge: notifCount, icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    )},
  ], [unread, notifCount, user]);

  return (
    <>
      {/* Logo — fully independent, never animates */}
      <div style={{
        position: 'fixed', left: 0, top: 0, height: 57,
        paddingLeft: 18, display: 'flex', alignItems: 'center',
        background: 'var(--bg-base, #0a0a0a)', zIndex: 101, whiteSpace: 'nowrap',
        width: 160,
      }}>
        <Link href="/feed" style={{ textDecoration: 'none' }}>
          <span style={{
            fontSize: 18, fontWeight: 900, color: '#fff',
            letterSpacing: -0.5,
            textShadow: '0 0 20px rgba(255,255,255,0.3)',
          }}>Same Here</span>
        </Link>
      </div>

      <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        position: 'fixed', left: 0, top: 57, bottom: 0,
        width: W, borderRight: '1px solid #141414',
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg-base, #0a0a0a)', zIndex: 100,
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
      }}
    >

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '12px 10px' }}>
        {links.map(({ href, label, icon, badge }) => {
          const active = path === href || (href === '/feed' && path === '/') || (href === '/chat' && path.startsWith('/chat')) || (href === '/improve' && (path.startsWith('/reckoning') || path.startsWith('/diary')));
          return (
            <Link key={label} href={href} title={!expanded ? label : ''} style={{
              height: 44, borderRadius: 10,
              display: 'flex', alignItems: 'center',
              gap: 12, paddingLeft: 11,
              background: active ? '#1a1a1a' : 'transparent',
              color: active ? '#fff' : '#555',
              textDecoration: 'none', fontSize: 15,
              fontWeight: active ? 600 : 400,
              transition: 'all 0.15s',
              whiteSpace: 'nowrap', overflow: 'hidden',
              position: 'relative',
            }}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#111'; e.currentTarget.style.color = '#ccc'; }}}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555'; }}}
            >
              <span style={{ flexShrink: 0, position: 'relative' }}>
                {icon}
                {badge > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -6,
                    background: '#ff4d4d', color: '#fff', fontSize: 9,
                    fontWeight: 800, minWidth: 16, height: 16,
                    borderRadius: 8, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', padding: '0 4px',
                  }}>{badge > 9 ? '9+' : badge}</span>
                )}
              </span>
              <span style={{
                opacity: expanded ? 1 : 0,
                transition: 'opacity 0.2s',
              }}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '10px', borderTop: '1px solid #141414' }}>
        <button onClick={() => { clearAuth(); router.push('/login'); }} style={{
          width: '100%', height: 44, borderRadius: 10,
          display: 'flex', alignItems: 'center',
          gap: 12, paddingLeft: 11,
          background: 'transparent', border: 'none',
          cursor: 'pointer', color: 'var(--secondary-text-color, #9CA3AF)',
          fontSize: 15, transition: 'all 0.15s',
          whiteSpace: 'nowrap', overflow: 'hidden',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#1a0000'; e.currentTarget.style.color = '#ff4d4d'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#444'; }}
        >
          <span style={{ flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </span>
          <span style={{ opacity: expanded ? 1 : 0, transition: 'opacity 0.2s' }}>Log out</span>
        </button>
      </div>
    </aside>
    </>
  );
}
