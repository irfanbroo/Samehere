'use client';
import { useState, useEffect, useMemo } from 'react';

const NAV_LINKS = [
  { href: '/feed', label: 'Feed' },
  { href: '/discover', label: 'Discover' },
];
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { clearAuth, getUser } from '@/lib/auth';

export default function Navbar() {
  const router = useRouter();
  const path = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  function logout() {
    clearAuth();
    router.push('/login');
  }

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(10px)',
      borderBottom: '1px solid #1e1e1e',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: 56,
    }}>
      <Link href="/feed" style={{ fontWeight: 800, fontSize: 18, color: '#fff', textDecoration: 'none' }}>
        Same Here
      </Link>

      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {[...NAV_LINKS, { href: `/profile/${user?.id}`, label: 'Profile' }].map(({ href, label }) => (
          <Link key={href} href={href} style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 14, textDecoration: 'none',
            color: path.startsWith(href.split('/')[1] === '' ? '/feed' : '/' + href.split('/')[1]) ? '#fff' : '#555',
            background: 'transparent',
            fontWeight: 500,
          }}>{label}</Link>
        ))}

        <Link href="/new-entry" style={{
          marginLeft: 8, background: '#fff', color: '#000', padding: '6px 16px',
          borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none',
        }}>
          + Post Day
        </Link>

        <button onClick={logout} style={{
          marginLeft: 8, background: 'transparent', border: '1px solid #333',
          color: '#666', padding: '6px 14px', borderRadius: 8, fontSize: 13,
          cursor: 'pointer',
        }}>
          Out
        </button>
      </div>
    </nav>
  );
}
