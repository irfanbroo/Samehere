"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { NetworkBackground } from "@/components/NetworkBackground";

/* ─── Animated clock ─────────────────────────────────────── */
function ClockLogo() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const s = time.getSeconds(), m = time.getMinutes(), h = time.getHours() % 12;
  const sD = s * 6, mD = m * 6 + s * 0.1, hD = h * 30 + m * 0.5;
  const pt = (deg: number, r: number) => ({
    x: 56 + r * Math.sin((deg * Math.PI) / 180),
    y: 56 - r * Math.cos((deg * Math.PI) / 180),
  });
  const hPt = pt(hD, 20), mPt = pt(mD, 30), sPt = pt(sD, 36);
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const d = i * 30;
    const inner = pt(d, 46), outer = pt(d, 52);
    return { inner, outer, major: i % 3 === 0 };
  });

  return (
    <svg width="112" height="112" viewBox="0 0 112 112" fill="none">
      {/* outer ring */}
      <circle cx="56" cy="56" r="52" stroke="url(#ringGrad)" strokeWidth="1.5" />
      {/* subtle glow */}
      <circle cx="56" cy="56" r="48" stroke="#7c3aed" strokeWidth="0.5" opacity="0.15" />
      {/* tick marks */}
      {ticks.map((t, i) => (
        <line key={i}
          x1={t.outer.x} y1={t.outer.y} x2={t.inner.x} y2={t.inner.y}
          stroke={t.major ? "#6d28d9" : "#2d2d45"} strokeWidth={t.major ? 2 : 1}
          strokeLinecap="round"
        />
      ))}
      {/* hour hand */}
      <line x1="56" y1="56" x2={hPt.x} y2={hPt.y} stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" />
      {/* minute hand */}
      <line x1="56" y1="56" x2={mPt.x} y2={mPt.y} stroke="#c4b5fd" strokeWidth="1.8" strokeLinecap="round" />
      {/* second hand */}
      <line x1="56" y1="56" x2={sPt.x} y2={sPt.y} stroke="#7c3aed" strokeWidth="1" strokeLinecap="round" />
      {/* center dot */}
      <circle cx="56" cy="56" r="3.5" fill="#7c3aed" />
      <circle cx="56" cy="56" r="1.5" fill="#c4b5fd" />
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="112" y2="112" gradientUnits="userSpaceOnUse">
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

        .sh-fadeup-1{animation:fadeUp 0.6s ease both}
        .sh-fadeup-2{animation:fadeUp 0.6s 0.1s ease both}
        .sh-fadeup-3{animation:fadeUp 0.6s 0.2s ease both}
        .sh-fadeup-4{animation:fadeUp 0.6s 0.3s ease both}
        .sh-fadein{animation:fadeIn 0.4s ease both}

        .sh-form{display:flex;flex-direction:column;gap:16px}
        .sh-field{display:flex;flex-direction:column;gap:6px}
        .sh-label{font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#4b5563}
        .sh-input{
          width:100%;padding:12px 16px;
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(124,58,237,0.2);
          border-radius:12px;
          color:#f1f5f9;font-size:14px;
          outline:none;transition:all 0.2s;
          box-sizing:border-box;
        }
        .sh-input:focus{border-color:rgba(124,58,237,0.6);background:rgba(124,58,237,0.06);box-shadow:0 0 0 3px rgba(124,58,237,0.08)}
        .sh-input::placeholder{color:#374151}
        .sh-btn-primary{
          width:100%;padding:13px;margin-top:4px;
          background:linear-gradient(135deg,#7c3aed,#6d28d9);
          border:none;border-radius:12px;
          color:#fff;font-size:14px;font-weight:600;
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
          width:100%;max-width:400px;
          background:rgba(14,14,21,0.88);
          border:1px solid rgba(124,58,237,0.15);
          border-radius:24px;
          padding:36px 32px 32px;
          backdrop-filter:blur(28px);
          -webkit-backdrop-filter:blur(28px);
          box-shadow:0 24px 80px rgba(0,0,0,0.65),0 0 0 1px rgba(124,58,237,0.05) inset;
          position:relative;z-index:1;
        }
        .sh-divider{
          display:flex;align-items:center;gap:12px;margin:4px 0;
        }
        .sh-divider-line{flex:1;height:1px;background:rgba(124,58,237,0.12)}
        .sh-divider-text{font-size:11px;color:#374151;white-space:nowrap}
        .sh-toggle-text{font-size:13px;color:#4b5563;text-align:center}
        .sh-toggle-btn{background:none;border:none;color:#a78bfa;font-size:13px;cursor:pointer;padding:0;font-weight:600;text-decoration:none;transition:color 0.15s}
        .sh-toggle-btn:hover{color:#c4b5fd}
        .sh-back-btn{background:none;border:none;color:#374151;font-size:13px;cursor:pointer;padding:0;display:flex;align-items:center;gap:5px;transition:color 0.2s;margin-bottom:28px}
        .sh-back-btn:hover{color:#6d28d9}

        .sh-landing-btn-primary{
          padding:13px 32px;min-width:140px;
          background:linear-gradient(135deg,#7c3aed,#6d28d9);
          border:none;border-radius:14px;
          color:#fff;font-size:14px;font-weight:600;cursor:pointer;
          transition:all 0.2s;letter-spacing:0.02em;
          box-shadow:0 8px 32px rgba(109,40,217,0.4);
        }
        .sh-landing-btn-primary:hover{box-shadow:0 12px 40px rgba(109,40,217,0.5)}
        .sh-landing-btn-primary:active{transform:scale(0.97)}

        .sh-landing-btn-ghost{
          padding:13px 32px;min-width:140px;
          background:rgba(124,58,237,0.06);
          border:1px solid rgba(124,58,237,0.25);
          border-radius:14px;
          color:#a78bfa;font-size:14px;font-weight:500;cursor:pointer;
          transition:all 0.2s;letter-spacing:0.02em;
        }
        .sh-landing-btn-ghost:hover{background:rgba(124,58,237,0.12);border-color:rgba(124,58,237,0.45)}
        .sh-landing-btn-ghost:active{transform:scale(0.97)}
      `}</style>

      {/* ── LANDING ───────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
      {mode === 'landing' && (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.35 }}
          style={{ textAlign: 'center', padding: '0 24px', position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto' }}
        >
          {/* brand pill */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}
          >
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 14px', borderRadius: 999,
              background: 'rgba(124,58,237,0.08)',
              border: '1px solid rgba(124,58,237,0.2)',
              fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
              color: '#a78bfa', textTransform: 'uppercase',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#7c3aed', display: 'inline-block' }} />
              Daily accountability
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.7, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}
          >
            <ClockLogo />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontFamily: "'Crimson Pro', Georgia, serif",
              fontSize: 'clamp(40px, 10vw, 56px)', fontWeight: 300, color: '#f1f5f9',
              margin: '0 0 10px', letterSpacing: '-0.02em', lineHeight: 1.05,
            }}
          >
            Same Here
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            style={{
              fontFamily: "'Crimson Pro', Georgia, serif",
              fontSize: 19, fontWeight: 300, fontStyle: 'italic',
              color: '#8b5cf6', margin: '0 0 8px', lineHeight: 1.4,
            }}
          >
            We all share the same 24 hours.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            style={{ fontSize: 13, color: '#4b5563', margin: '0 0 36px', letterSpacing: '0.02em' }}
          >
            How do you choose to fill yours?
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <motion.button
              className="sh-landing-btn-primary"
              whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.96 }}
              onClick={() => setMode('signin')}
              style={{ minWidth: 140 }}
            >Sign in</motion.button>
            <motion.button
              className="sh-landing-btn-ghost"
              whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.96 }}
              onClick={() => setMode('signup')}
              style={{ minWidth: 140 }}
            >New here? Begin</motion.button>
          </motion.div>

          {/* feature chips */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65, duration: 0.6 }}
            style={{ marginTop: 48, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            {[
              { icon: '✦', label: 'Daily journal' },
              { icon: '◈', label: 'Social feed' },
              { icon: '▣', label: 'Task tracking' },
            ].map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 + i * 0.09, duration: 0.4 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 999,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <span style={{ color: '#6d28d9', fontSize: 10 }}>{f.icon}</span>
                <span style={{ fontSize: 11, color: '#374151', letterSpacing: '0.05em', fontWeight: 500 }}>{f.label}</span>
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
          style={{ width: '100%', maxWidth: 400, margin: '0 16px' }}
        >
          {/* top gradient accent */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.6), rgba(167,139,250,0.4), transparent)',
            borderRadius: '24px 24px 0 0',
          }} />

          <button className="sh-back-btn" onClick={() => setMode('landing')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back
          </button>

          <div style={{ marginBottom: 22 }}>
            <h2 style={{
              fontFamily: "'Crimson Pro', Georgia, serif",
              fontSize: 28, fontWeight: 400, color: '#f1f5f9',
              margin: '0 0 4px', letterSpacing: '-0.01em',
            }}>
              {mode === 'signin' ? 'Welcome back.' : 'Begin your journey.'}
            </h2>
            <p style={{ fontSize: 13, color: '#4b5563', margin: 0 }}>
              {mode === 'signin' ? 'Sign in to continue your streak.' : 'Create your account. It\'s free.'}
            </p>
          </div>

          {mode === 'signin'
            ? <SignInForm onSignIn={onSignIn} error={error} loading={loading} />
            : <SignUpForm onSignUp={onSignUp} error={error} loading={loading} />
          }

          <p className="sh-toggle-text" style={{ marginTop: 20 }}>
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

export default AuthUI;
