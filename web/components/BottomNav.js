'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getUser } from '@/lib/auth';
import api from '@/lib/api';

export default function BottomNav() {
  const path = usePathname();
  const [user, setUser] = useState(null);
  const [unread, setUnread] = useState(0);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    setUser(getUser());
    const fetchUnread = () => api.get('/chat/unread').then(r => setUnread(r.data.count)).catch(() => {});
    const fetchNotifs = () => api.get('/notifications/count').then(r => setNotifCount(r.data.total)).catch(() => {});
    fetchUnread(); fetchNotifs();

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

  const links = useMemo(() => [
    { href: '/feed', label: 'Feed', icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>) },
    { href: '/chat', label: 'Chat', badge: unread, icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>) },
    { href: '/new-entry', label: 'Post', icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>) },
    { href: '/improve', label: 'Improve', icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>) },
    { href: user ? `/profile/${user.id}` : '/feed', label: 'Me', badge: notifCount, icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>) },
  ], [unread, notifCount, user]);

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 56, background: 'var(--bg-base, #0a0a0a)',
      borderTop: '1px solid var(--bg-border, #1a1a1a)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {links.map(({ href, label, icon, badge }) => {
        const active = path === href || (href === '/feed' && path === '/') || (href === '/chat' && path.startsWith('/chat')) || (href === '/improve' && (path.startsWith('/reckoning') || path.startsWith('/diary')));
        return (
          <Link key={label} href={href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 2, textDecoration: 'none', position: 'relative',
            color: active ? '#fff' : '#555',
            transition: 'color 0.15s',
          }}>
            <span style={{ position: 'relative' }}>
              {icon}
              {badge > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -8,
                  background: '#ff4d4d', color: '#fff', fontSize: 9,
                  fontWeight: 800, minWidth: 16, height: 16,
                  borderRadius: 8, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', padding: '0 4px',
                }}>{badge > 9 ? '9+' : badge}</span>
              )}
            </span>
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
