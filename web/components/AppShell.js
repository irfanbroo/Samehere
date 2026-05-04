'use client';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useIsMobile } from '@/lib/useIsMobile';

export default function AppShell({ children, rightPanel }) {
  const isMobile = useIsMobile();

  return (
    <div style={{ minHeight: '100vh' }}>
      {!isMobile && <Sidebar />}

      <div style={{
        marginLeft: isMobile ? 0 : 64,
        paddingBottom: isMobile ? 64 : 0,
        display: 'flex',
        justifyContent: 'center',
      }}>
        {rightPanel ? (
          <div style={{ display: 'flex', maxWidth: 860, width: '100%' }}>
            <main style={{ flex: 1, minWidth: 0, borderRight: isMobile ? 'none' : '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {children}
            </main>
            {!isMobile && (
              <div className="right-panel" style={{ display: 'none' }}>
                {rightPanel}
              </div>
            )}
          </div>
        ) : (
          <div style={{ width: '100%' }}>
            {children}
          </div>
        )}
      </div>

      {isMobile && <BottomNav />}

      {!isMobile && (
        <style>{`
          @media (min-width: 1100px) {
            .right-panel { display: block !important; }
          }
        `}</style>
      )}
    </div>
  );
}
