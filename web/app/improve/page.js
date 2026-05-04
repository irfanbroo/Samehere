'use client';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';

export default function ImprovePage() {
  const router = useRouter();

  return (
    <AppShell>
      <style>{`
        @keyframes fade-up { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow-pulse { 0%,100%{opacity:0.4} 50%{opacity:0.7} }
        .imp-hero { animation: fade-up 0.35s ease-out 0.05s both; }
        .imp-card-1 { animation: fade-up 0.35s ease-out 0.12s both; }
        .imp-card-2 { animation: fade-up 0.35s ease-out 0.18s both; }
        .imp-card-3 { animation: fade-up 0.35s ease-out 0.24s both; }
        .imp-card-4 { animation: fade-up 0.35s ease-out 0.3s both; }
        .reck-card:hover .reck-arrow { transform: translateX(3px); }
        .reck-arrow { transition: transform 0.2s ease; }
        .soon-card { cursor: default; }
      `}</style>

      <div style={{ width: '100%', maxWidth: 560, margin: '0 auto', padding: '0 0 100px', position: 'relative' }}>

        {/* Ambient glow behind header */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 320, height: 200, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255,255,255,0.03) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Header */}
        <div className="imp-hero" style={{ padding: '36px 22px 28px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            {/* Private pill */}
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
              padding: '4px 10px', borderRadius: 20,
              background: 'rgba(255,255,255,0.04)', border: '1px solid #1e1e1e',
              color: '#444', display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#333', display: 'inline-block' }} />
              Private
            </span>
          </div>

          <h1 style={{
            fontSize: 42, fontWeight: 900, margin: '0 0 8px',
            letterSpacing: '-0.04em', lineHeight: 1,
            background: 'linear-gradient(135deg, #ffffff 40%, #555 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Improve</h1>

          <p style={{
            color: '#3a3a3a', fontSize: 13, margin: 0,
            fontStyle: 'italic', letterSpacing: '0.01em',
          }}>
            No audience. No likes. Just you.
          </p>
        </div>

        {/* === FEATURED CARD — Diary === */}
        <div style={{ padding: '0 16px 12px' }}>
          <div
            className="imp-card-1"
            onClick={() => router.push('/diary')}
            style={{
              borderRadius: 22, position: 'relative', overflow: 'hidden',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #080c18 0%, #0a0d14 60%, #080a0f 100%)',
              border: '1px solid rgba(79,110,245,0.25)',
              boxShadow: '0 0 40px rgba(79,110,245,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
              transition: 'all 0.25s ease',
              minHeight: 140,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.border = '1px solid rgba(79,110,245,0.45)';
              e.currentTarget.style.boxShadow = '0 8px 40px rgba(79,110,245,0.14), inset 0 1px 0 rgba(255,255,255,0.04)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.border = '1px solid rgba(79,110,245,0.25)';
              e.currentTarget.style.boxShadow = '0 0 40px rgba(79,110,245,0.06), inset 0 1px 0 rgba(255,255,255,0.03)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 10% 50%, rgba(79,110,245,0.1) 0%, transparent 60%)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', right:-10, top:'50%', transform:'translateY(-50%)', opacity:0.04, pointerEvents:'none' }}>
              <svg width="140" height="140" viewBox="0 0 24 24" fill="#4f6ef5" stroke="none">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </div>
            <div style={{ padding: '24px 26px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:'rgba(79,110,245,0.12)', border:'1px solid rgba(79,110,245,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c9cf8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#4f6ef5', marginBottom:2 }}>Live now</div>
                  <div style={{ fontSize:19, fontWeight:800, color:'#fff', letterSpacing:'-0.02em' }}>Diary</div>
                </div>
              </div>
              <p style={{ margin:'0 0 20px', fontSize:14, color:'#555', lineHeight:1.6, maxWidth:300 }}>Your daily thoughts, private and unfiltered.</p>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:13, fontWeight:700, color:'#4f6ef5' }}>Open</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f6ef5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition:'transform 0.2s' }}>
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* === TODOS CARD === */}
        <div style={{ padding: '0 16px 12px' }}>
          <div
            className="imp-card-2"
            onClick={() => router.push('/todos')}
            style={{
              borderRadius: 22, position: 'relative', overflow: 'hidden',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #110e04 0%, #0e0c04 60%, #0a0a08 100%)',
              border: '1px solid rgba(250,204,21,0.2)',
              boxShadow: '0 0 40px rgba(250,204,21,0.04), inset 0 1px 0 rgba(255,255,255,0.02)',
              transition: 'all 0.25s ease',
              minHeight: 100,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.border = '1px solid rgba(250,204,21,0.38)';
              e.currentTarget.style.boxShadow = '0 8px 40px rgba(250,204,21,0.08), inset 0 1px 0 rgba(255,255,255,0.03)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.border = '1px solid rgba(250,204,21,0.2)';
              e.currentTarget.style.boxShadow = '0 0 40px rgba(250,204,21,0.04), inset 0 1px 0 rgba(255,255,255,0.02)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 10% 50%, rgba(250,204,21,0.06) 0%, transparent 60%)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', right:-10, top:'50%', transform:'translateY(-50%)', opacity:0.04, pointerEvents:'none' }}>
              <svg width="130" height="130" viewBox="0 0 24 24" fill="#facc15" stroke="none">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <div style={{ padding: '20px 26px', position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:'rgba(250,204,21,0.1)', border:'1px solid rgba(250,204,21,0.18)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#a08010', marginBottom:2 }}>Live now</div>
                <div style={{ fontSize:19, fontWeight:800, color:'var(--main-text-color,#e0e0e0)', letterSpacing:'-0.02em' }}>Todos</div>
                <p style={{ margin:'4px 0 0', fontSize:13, color:'var(--secondary-text-color,#555)', lineHeight:1.4 }}>Tasks, priorities, time blocks.</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, opacity:0.6 }}>
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </div>
          </div>
        </div>

        {/* === GRID — Reckoning + Gratitude === */}
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

          {/* Reckoning */}
          <div
            className="imp-card-3"
            onClick={() => router.push('/reckoning')}
            style={{
              borderRadius: 20, overflow: 'hidden', position: 'relative',
              background: '#0f0909', border: '1px solid rgba(139,30,30,0.2)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
              minHeight: 140, cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.border='1px solid rgba(139,30,30,0.4)'; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.border='1px solid rgba(139,30,30,0.2)'; e.currentTarget.style.transform='none'; }}
          >
            <div style={{ padding: '22px 20px', position: 'relative' }}>
              <div style={{ width:40, height:40, borderRadius:12, marginBottom:14, background:'rgba(139,30,30,0.1)', border:'1px solid rgba(139,30,30,0.18)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c45a5a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#8B1E1E', marginBottom:4 }}>Live now</div>
              <div style={{ fontSize:15, fontWeight:700, color:'#e0e0e0', marginBottom:6 }}>The Reckoning</div>
              <p style={{ margin:0, fontSize:12, color:'#555', lineHeight:1.5 }}>Face what went wrong. Seal it.</p>
            </div>
          </div>

          {/* Gratitude */}
          <div
            className="imp-card-4 soon-card"
            style={{
              borderRadius: 20, overflow: 'hidden', position: 'relative',
              background: '#0a0f0b',
              border: '1px solid #141a15',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
              minHeight: 140,
            }}
          >
            {/* Frosted overlay */}
            <div style={{
              position: 'absolute', inset: 0, zIndex: 2,
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(2px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
                padding: '5px 12px', borderRadius: 20,
                background: 'rgba(255,255,255,0.03)', border: '1px solid #1e1e1e',
                color: '#444',
              }}>Coming Soon</span>
            </div>

            <div style={{ padding: '22px 20px', position: 'relative' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, marginBottom: 14,
                background: 'rgba(90,156,106,0.08)', border: '1px solid rgba(90,156,106,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5a9c6a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#ccc', marginBottom: 6 }}>Gratitude</div>
              <p style={{ margin: 0, fontSize: 12, color: '#333', lineHeight: 1.5 }}>What went right today.</p>
            </div>
          </div>
        </div>

        {/* Bottom quote */}
        <div style={{ padding: '40px 22px 0', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#222', margin: 0, fontStyle: 'italic', letterSpacing: '0.04em' }}>
            "The unexamined life is not worth living."
          </p>
        </div>

      </div>
    </AppShell>
  );
}
