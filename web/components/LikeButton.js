'use client';
import { useState, useCallback, useRef } from 'react';

function playLikeSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(523, ctx.currentTime);
    o.frequency.setValueAtTime(659, ctx.currentTime + 0.06);
    g.gain.setValueAtTime(0.12, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    o.start(); o.stop(ctx.currentTime + 0.2);
    setTimeout(() => ctx.close(), 300);
  } catch {}
}

function playUnlikeSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(400, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.1);
    g.gain.setValueAtTime(0.07, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    o.start(); o.stop(ctx.currentTime + 0.1);
    setTimeout(() => ctx.close(), 200);
  } catch {}
}

export default function LikeButton({ liked, count, onLike }) {
  const heartRef = useRef(null);

  const handleClick = useCallback(() => {
    if (!liked) {
      playLikeSound();
      if (heartRef.current) {
        heartRef.current.animate([
          { transform: 'scale(1)',    filter: 'drop-shadow(0 0 0px #ff4d4d)   brightness(1)',    offset: 0 },
          { transform: 'scale(0.5)', filter: 'drop-shadow(0 0 0px #ff4d4d)   brightness(1)',    offset: 0.08 },
          { transform: 'scale(2.2)', filter: 'drop-shadow(0 0 24px #ff4d4d)  brightness(1.8)',  offset: 0.4 },
          { transform: 'scale(0.85)',filter: 'drop-shadow(0 0 12px #ff4d4d)  brightness(1.3)',  offset: 0.58 },
          { transform: 'scale(1.25)',filter: 'drop-shadow(0 0 8px #ff4d4d)   brightness(1.2)',  offset: 0.72 },
          { transform: 'scale(0.95)',filter: 'drop-shadow(0 0 4px #ff4d4d)   brightness(1.1)',  offset: 0.85 },
          { transform: 'scale(1)',   filter: 'drop-shadow(0 0 3px #ff4d4d)   brightness(1)',    offset: 1 },
        ], {
          duration: 700,
          easing: 'ease-out',
        });
      }
    } else {
      playUnlikeSound();
    }
    onLike();
  }, [liked, onLike]);

  return (
    <button onClick={handleClick} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      padding: 0, display: 'flex', alignItems: 'center', gap: 5,
      userSelect: 'none', color: liked ? '#ff4d4d' : '#555',
    }}>
      <span ref={heartRef} style={{ fontSize: 16, display: 'inline-block' }}>
        {liked ? '♥' : '♡'}
      </span>
      <span style={{ fontWeight: liked ? 600 : 400, transition: 'color 0.1s' }}>{count}</span>
    </button>
  );
}
