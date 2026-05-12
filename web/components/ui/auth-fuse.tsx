"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { NetworkBackground } from "@/components/NetworkBackground";

/* ─── Animated clock ─────────────────────────────────────── */
function ClockLogo({ size = 112 }: { size?: number }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const cx = size / 2, cy = size / 2, r = size / 2 - 4;
  const s = time.getSeconds(), m = time.getMinutes(), h = time.getHours() % 12;
  const sD = s * 6, mD = m * 6 + s * 0.1, hD = h * 30 + m * 0.5;
  const pt = (deg: number, radius: number) => ({
    x: cx + radius * Math.sin((deg * Math.PI) / 180),
    y: cy - radius * Math.cos((deg * Math.PI) / 180),
  });
  const hPt = pt(hD, r * 0.36), mPt = pt(mD, r * 0.54), sPt = pt(sD, r * 0.64);
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const d = i * 30;
    return { inner: pt(d, r * 0.82), outer: pt(d, r * 0.93), major: i % 3 === 0 };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <circle cx={cx} cy={cy} r={r} stroke="url(#ringGrad)" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r={r - 4} stroke="#7c3aed" strokeWidth="0.5" opacity="0.15" />
      {ticks.map((t, i) => (
        <line key={i}
          x1={t.outer.x} y1={t.outer.y} x2={t.inner.x} y2={t.inner.y}
          stroke={t.major ? "#6d28d9" : "#2d2d45"} strokeWidth={t.major ? 2 : 1}
          strokeLinecap="round"
        />
      ))}
      <line x1={cx} y1={cy} x2={hPt.x} y2={hPt.y} stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={mPt.x} y2={mPt.y} stroke="#c4b5fd" strokeWidth="1.8" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={sPt.x} y2={sPt.y} stroke="#7c3aed" strokeWidth="1" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="3.5" fill="#7c3aed" />
      <circle cx={cx} cy={cy} r="1.5" fill="#c4b5fd" />
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2={size} y2={size} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── Password field ───────────────────────────────────────── */
function PasswordField({ name, placeholder, autoComplete }: { name: string; placeholder?: string; autoComplete?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        className="sh-input"
        name={name}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        required
        autoComplete={autoComplete}
        style={{ paddingRight: 44 }}
      />
      <button
        type="button"
        onClick={() => setShow(p => !p)}
        style={{
          position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#4b5563', display: 'flex', alignItems: 'center',
          transition: 'color 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
        onMouseLeave={e => (e.currentTarget.style.color = '#4b5563')}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

/* ─── Sign In form ─────────────────────────────────────────── */
interface SignInFormProps { onSignIn: (email: string, password: string) => Promise<void>; error?: string; loading?: boolean; }
function SignInForm({ onSignIn, error, loading }: SignInFormProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    await onSignIn(d.get("email") as string, d.get("password") as string);
  };
  return (
    <form onSubmit={handleSubmit} autoComplete="on" className="sh-form">
      {error && <p className="sh-error">{error}</p>}
      <div className="sh-field">
        <label className="sh-label">Email</label>
        <input className="sh-input" name="email" type="email" placeholder="you@example.com" required autoComplete="email" />
      </div>
      <div className="sh-field">
        <label className="sh-label">Password</label>
        <PasswordField name="password" placeholder="Enter your password" autoComplete="current-password" />
      </div>
      <button type="submit" className="sh-btn-primary" disabled={loading}>
        {loading ? <span className="sh-spinner" /> : 'Sign In'}
      </button>
    </form>
  );
}

/* ─── Sign Up form ─────────────────────────────────────────── */
interface SignUpFormProps { onSignUp: (username: string, email: string, password: string) => Promise<void>; error?: string; loading?: boolean; }
function SignUpForm({ onSignUp, error, loading }: SignUpFormProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    await onSignUp(d.get("username") as string, d.get("email") as string, d.get("password") as string);
  };
  return (
    <form onSubmit={handleSubmit} autoComplete="on" className="sh-form">
      {error && <p className="sh-error">{error}</p>}
      <div className="sh-field">
        <label className="sh-label">Username</label>
        <input className="sh-input" name="username" type="text" placeholder="yourname" required autoComplete="username" />
      </div>
      <div className="sh-field">
        <label className="sh-label">Email</label>
        <input className="sh-input" name="email" type="email" placeholder="you@example.com" required autoComplete="email" />
      </div>
      <div className="sh-field">
        <label className="sh-label">Password</label>
        <PasswordField name="password" placeholder="Create a password" autoComplete="new-password" />
      </div>
      <button type="submit" className="sh-btn-primary" disabled={loading}>
        {loading ? <span className="sh-spinner" /> : 'Create Account'}
      </button>
    </form>
  );
}

/* ─── Main AuthUI export ──────────────────────────────────── */
export interface AuthUIProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (username: string, email: string, password: string) => Promise<void>;
  error?: string;
  loading?: boolean;
  defaultSignIn?: boolean;
}

export function AuthUI({ onSignIn, onSignUp, error, loading }: AuthUIProps) {
  const [mode, setMode] = useState<'landing' | 'signin' | 'signup'>('landing');

  return (
    <div style={{
      minHeight: '100vh', background: '#07070b',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      <NetworkBackground particleCount={55} connectionDistance={130} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Inter:wght@300;400;500;600;700&display=swap');

        @keyframes fadeUp {
          from{opacity:0;transform:translateY(20px)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes fadeIn {
          from{opacity:0}to{opacity:1}
        }
        @keyframes spin {
          to{transform:rotate(360deg)}
        }

        /* ── base (mobile-first: ≤480px) ── */
        .sh-form{display:flex;flex-direction:column;gap:14px}
        .sh-field{display:flex;flex-direction:column;gap:5px}
        .sh-label{font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#4b5563}
        .sh-input{
          width:100%;padding:11px 14px;
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(124,58,237,0.2);
          border-radius:12px;
          color:#f1f5f9;font-size:15px;
          outline:none;transition:all 0.2s;
          box-sizing:border-box;
        }
        .sh-input:focus{border-color:rgba(124,58,237,0.6);background:rgba(124,58,237,0.06);box-shadow:0 0 0 3px rgba(124,58,237,0.08)}
        .sh-input::placeholder{color:#374151}
        .sh-btn-primary{
          width:100%;padding:14px;margin-top:4px;
          background:linear-gradient(135deg,#7c3aed,#6d28d9);
          border:none;border-radius:12px;
          color:#fff;font-size:15px;font-weight:600;
          cursor:pointer;transition:all 0.2s;
          display:flex;align-items:center;justify-content:center;gap:8px;
          box-shadow:0 4px 24px rgba(109,40,217,0.3);
          letter-spacing:0.01em;
        }
        .sh-btn-primary:hover:not(:disabled){background:linear-gradient(135deg,#8b5cf6,#7c3aed);box-shadow:0 4px 32px rgba(109,40,217,0.45);transform:translateY(-1px)}
        .sh-btn-primary:active:not(:disabled){transform:scale(0.98)}
        .sh-btn-primary:disabled{opacity:0.5;cursor:not-allowed}
        .sh-error{color:#f43f5e;font-size:13px;text-align:center;padding:10px 14px;background:rgba(244,63,94,0.08);border:1px solid rgba(244,63,94,0.2);border-radius:10px;margin-bottom:4px}
        .sh-spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block}

        .sh-card{
          width:100%;
          background:rgba(14,14,21,0.92);
          border:1px solid rgba(124,58,237,0.15);
          border-radius:20px;
          padding:28px 20px 24px;
          backdrop-filter:blur(28px);
          -webkit-backdrop-filter:blur(28px);
          box-shadow:0 24px 80px rgba(0,0,0,0.65),0 0 0 1px rgba(124,58,237,0.05) inset;
          position:relative;z-index:1;
        }
        .sh-card-title{font-size:24px}
        .sh-card-sub{font-size:13px}

        .sh-divider{display:flex;align-items:center;gap:12px;margin:4px 0}
        .sh-divider-line{flex:1;height:1px;background:rgba(124,58,237,0.12)}
        .sh-divider-text{font-size:11px;color:#374151;white-space:nowrap}
        .sh-toggle-text{font-size:13px;color:#4b5563;text-align:center}
        .sh-toggle-btn{background:none;border:none;color:#a78bfa;font-size:13px;cursor:pointer;padding:0;font-weight:600;text-decoration:none;transition:color 0.15s}
        .sh-toggle-btn:hover{color:#c4b5fd}
        .sh-back-btn{background:none;border:none;color:#374151;font-size:13px;cursor:pointer;padding:0;display:flex;align-items:center;gap:5px;transition:color 0.2s;margin-bottom:22px}
        .sh-back-btn:hover{color:#6d28d9}

        /* landing layout — mobile */
        .sh-landing{
          text-align:center;
          padding:32px 20px 40px;
          position:relative;z-index:1;
          width:100%;max-width:360px;
          margin:0 auto;
        }
        .sh-pill{
          display:inline-flex;align-items:center;gap:6px;
          padding:4px 12px;border-radius:999px;
          background:rgba(124,58,237,0.08);
          border:1px solid rgba(124,58,237,0.2);
          font-size:10px;font-weight:600;letter-spacing:0.08em;
          color:#a78bfa;text-transform:uppercase;margin-bottom:18px;
        }
        .sh-pill-dot{width:5px;height:5px;border-radius:50%;background:#7c3aed;display:inline-block}
        .sh-hero-title{
          font-family:'Crimson Pro',Georgia,serif;
          font-size:clamp(36px,11vw,48px);
          font-weight:300;color:#f1f5f9;
          margin:0 0 8px;letter-spacing:-0.02em;line-height:1.05;
        }
        .sh-hero-tagline{
          font-family:'Crimson Pro',Georgia,serif;
          font-size:clamp(15px,4.5vw,18px);
          font-weight:300;font-style:italic;
          color:#8b5cf6;margin:0 0 6px;line-height:1.4;
        }
        .sh-hero-sub{
          font-size:clamp(11px,3vw,13px);
          color:#4b5563;margin:0 0 32px;letter-spacing:0.02em;
        }
        .sh-btn-row{
          display:flex;gap:10px;justify-content:center;flex-wrap:wrap;
        }
        .sh-landing-btn-primary{
          flex:1;min-width:120px;max-width:180px;
          padding:12px 20px;
          background:linear-gradient(135deg,#7c3aed,#6d28d9);
          border:none;border-radius:14px;
          color:#fff;font-size:14px;font-weight:600;cursor:pointer;
          transition:all 0.2s;letter-spacing:0.02em;
          box-shadow:0 8px 32px rgba(109,40,217,0.4);
        }
        .sh-landing-btn-primary:hover{box-shadow:0 12px 40px rgba(109,40,217,0.5)}
        .sh-landing-btn-primary:active{transform:scale(0.97)}
        .sh-landing-btn-ghost{
          flex:1;min-width:120px;max-width:180px;
          padding:12px 20px;
          background:rgba(124,58,237,0.06);
          border:1px solid rgba(124,58,237,0.25);
          border-radius:14px;
          color:#a78bfa;font-size:14px;font-weight:500;cursor:pointer;
          transition:all 0.2s;letter-spacing:0.02em;
        }
        .sh-landing-btn-ghost:hover{background:rgba(124,58,237,0.12);border-color:rgba(124,58,237,0.45)}
        .sh-landing-btn-ghost:active{transform:scale(0.97)}
        .sh-chips{
          margin-top:36px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;
        }
        .sh-chip{
          display:flex;align-items:center;gap:6px;
          padding:5px 11px;border-radius:999px;
          background:rgba(255,255,255,0.02);
          border:1px solid rgba(255,255,255,0.06);
        }
        .sh-chip-icon{color:#6d28d9;font-size:10px}
        .sh-chip-label{font-size:10px;color:#374151;letter-spacing:0.05em;font-weight:500}

        /* ── tablet: 481px – 768px ── */
        @media(min-width:481px){
          .sh-landing{max-width:460px;padding:40px 24px 48px}
          .sh-pill{font-size:11px;padding:5px 14px;margin-bottom:20px}
          .sh-hero-title{font-size:clamp(44px,9vw,56px);margin-bottom:10px}
          .sh-hero-tagline{font-size:clamp(17px,4vw,20px);margin-bottom:8px}
          .sh-hero-sub{font-size:13px;margin-bottom:36px}
          .sh-landing-btn-primary,.sh-landing-btn-ghost{font-size:15px;padding:13px 28px}
          .sh-chips{margin-top:44px;gap:10px}
          .sh-chip{padding:6px 13px}
          .sh-chip-label{font-size:11px}
          .sh-card{border-radius:22px;padding:32px 28px 28px}
          .sh-card-title{font-size:26px}
          .sh-input{font-size:15px}
          .sh-btn-primary{font-size:15px}
        }

        /* ── laptop: 769px – 1024px ── */
        @media(min-width:769px){
          .sh-landing{max-width:520px;padding:48px 32px 56px}
          .sh-hero-title{font-size:clamp(52px,6vw,64px);margin-bottom:12px}
          .sh-hero-tagline{font-size:clamp(18px,2.5vw,22px);margin-bottom:10px}
          .sh-hero-sub{font-size:14px;margin-bottom:40px}
          .sh-landing-btn-primary,.sh-landing-btn-ghost{
            font-size:15px;padding:14px 36px;
            flex:0 0 auto;min-width:148px;max-width:none;
          }
          .sh-chips{margin-top:48px}
          .sh-chip-label{font-size:12px}
          .sh-card{max-width:420px;border-radius:24px;padding:36px 36px 32px}
          .sh-card-title{font-size:28px}
          .sh-card-sub{font-size:13px}
          .sh-label{font-size:11px}
          .sh-input{padding:12px 16px;font-size:14px}
          .sh-btn-primary{font-size:15px;padding:14px}
          .sh-back-btn{font-size:13px;margin-bottom:26px}
          .sh-toggle-text,.sh-toggle-btn{font-size:13px}
        }

        /* ── desktop: 1025px+ ── */
        @media(min-width:1025px){
          .sh-landing{max-width:580px}
          .sh-hero-title{font-size:clamp(60px,5vw,72px)}
          .sh-hero-tagline{font-size:clamp(20px,2vw,24px)}
          .sh-hero-sub{font-size:15px}
          .sh-landing-btn-primary,.sh-landing-btn-ghost{
            font-size:16px;padding:15px 44px;min-width:160px;
          }
          .sh-chip-label{font-size:12px}
          .sh-chip{padding:7px 15px}
          .sh-card{max-width:440px;padding:40px 40px 36px}
          .sh-card-title{font-size:30px}
          .sh-card-sub{font-size:14px}
          .sh-input{font-size:15px;padding:13px 18px}
          .sh-btn-primary{font-size:16px;padding:15px}
          .sh-label{font-size:11px}
          .sh-toggle-text,.sh-toggle-btn{font-size:14px}
        }

        /* ── touch targets for mobile ── */
        @media(max-width:480px){
          .sh-back-btn{padding:8px 0;margin-bottom:16px}
          .sh-btn-row{flex-direction:column;align-items:stretch}
          .sh-landing-btn-primary,.sh-landing-btn-ghost{
            max-width:100%;flex:none;padding:15px 20px;font-size:16px;
          }
          .sh-chips{gap:6px}
        }
      `}</style>

      {/* ── LANDING ───────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
      {mode === 'landing' && (
        <motion.div
          key="landing"
          className="sh-landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.35 }}
        >
          {/* brand pill */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            <span className="sh-pill">
              <span className="sh-pill-dot" />
              Daily accountability
            </span>
          </motion.div>

          {/* clock — responsive size via CSS custom property trick */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}
          >
            <ClockClock />
          </motion.div>

          <motion.h1
            className="sh-hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            Same Here
          </motion.h1>

          <motion.p
            className="sh-hero-tagline"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            We all share the same 24 hours.
          </motion.p>

          <motion.p
            className="sh-hero-sub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.5 }}
          >
            How do you choose to fill yours?
          </motion.p>

          <motion.div
            className="sh-btn-row"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.button
              className="sh-landing-btn-primary"
              whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.96 }}
              onClick={() => setMode('signin')}
            >Sign in</motion.button>
            <motion.button
              className="sh-landing-btn-ghost"
              whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.96 }}
              onClick={() => setMode('signup')}
            >New here? Begin</motion.button>
          </motion.div>

          {/* feature chips */}
          <motion.div
            className="sh-chips"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.65, duration: 0.6 }}
          >
            {[
              { icon: '✦', label: 'Daily journal' },
              { icon: '◈', label: 'Social feed' },
              { icon: '▣', label: 'Task tracking' },
            ].map((f, i) => (
              <motion.div
                key={f.label}
                className="sh-chip"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 + i * 0.09, duration: 0.4 }}
              >
                <span className="sh-chip-icon">{f.icon}</span>
                <span className="sh-chip-label">{f.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* ── SIGN IN / SIGN UP ─────────────────────────────────── */}
      {(mode === 'signin' || mode === 'signup') && (
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.97 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="sh-card"
          style={{ margin: '0 16px' }}
        >
          {/* top gradient accent */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.6), rgba(167,139,250,0.4), transparent)',
            borderRadius: 'inherit',
          }} />

          <button className="sh-back-btn" onClick={() => setMode('landing')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back
          </button>

          <div style={{ marginBottom: 20 }}>
            <h2 className="sh-card-title" style={{
              fontFamily: "'Crimson Pro', Georgia, serif",
              fontWeight: 400, color: '#f1f5f9',
              margin: '0 0 4px', letterSpacing: '-0.01em',
            }}>
              {mode === 'signin' ? 'Welcome back.' : 'Begin your journey.'}
            </h2>
            <p className="sh-card-sub" style={{ color: '#4b5563', margin: 0 }}>
              {mode === 'signin' ? 'Sign in to continue your streak.' : "Create your account. It's free."}
            </p>
          </div>

          {mode === 'signin'
            ? <SignInForm onSignIn={onSignIn} error={error} loading={loading} />
            : <SignUpForm onSignUp={onSignUp} error={error} loading={loading} />
          }

          <p className="sh-toggle-text" style={{ marginTop: 18 }}>
            {mode === 'signin' ? "No account? " : "Already have one? "}
            <button className="sh-toggle-btn" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
              {mode === 'signin' ? 'Begin here' : 'Sign in'}
            </button>
          </p>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

/* responsive clock wrapper — reads its own rendered width */
function ClockClock() {
  const [size, setSize] = useState(96);
  const ref = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w <= 480) setSize(80);
      else if (w <= 768) setSize(96);
      else if (w <= 1024) setSize(108);
      else setSize(120);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return <div ref={ref}><ClockLogo size={size} /></div>;
}

export default AuthUI;
