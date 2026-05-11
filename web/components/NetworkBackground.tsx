'use client';
import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  pulsePhase: number;
  pulseSpeed: number;
}

interface Props {
  particleCount?: number;
  connectionDistance?: number;
  className?: string;
}

export function NetworkBackground({
  particleCount = 50,
  connectionDistance = 120,
  className = '',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const particles = useRef<Particle[]>([]);
  const mouse     = useRef({ x: -9999, y: -9999 });

  // ── palette ────────────────────────────────────────────────
  const PARTICLE_COLOR = '124,58,237';   // violet
  const LINE_COLOR     = '124,58,237';
  const PULSE_COLOR    = '167,139,250';  // soft violet

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // resize
    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // init particles
    const spawn = () => {
      particles.current = Array.from({ length: particleCount }, () => ({
        x:          Math.random() * canvas.width,
        y:          Math.random() * canvas.height,
        vx:         (Math.random() - 0.5) * 0.35,
        vy:         (Math.random() - 0.5) * 0.35,
        radius:     Math.random() * 1.5 + 0.8,
        opacity:    Math.random() * 0.5 + 0.2,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.015 + 0.008,
      }));
    };
    spawn();

    // mouse
    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onLeave = () => { mouse.current = { x: -9999, y: -9999 }; };
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);

    let frame = 0;

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const pts = particles.current;

      // update + draw particles
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];

        // drift
        p.x += p.vx;
        p.y += p.vy;

        // bounce
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // clamp
        p.x = Math.max(0, Math.min(canvas.width,  p.x));
        p.y = Math.max(0, Math.min(canvas.height, p.y));

        // mouse repulsion (gentle)
        const dx = p.x - mouse.current.x;
        const dy = p.y - mouse.current.y;
        const md = Math.sqrt(dx * dx + dy * dy);
        if (md < 100) {
          const force = (100 - md) / 100;
          p.vx += (dx / md) * force * 0.06;
          p.vy += (dy / md) * force * 0.06;
        }

        // speed cap
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > 0.8) { p.vx = (p.vx / spd) * 0.8; p.vy = (p.vy / spd) * 0.8; }

        // pulse
        p.pulsePhase += p.pulseSpeed;
        const pulse = 0.5 + 0.5 * Math.sin(p.pulsePhase);
        const finalOpacity = p.opacity * (0.6 + 0.4 * pulse);
        const finalRadius  = p.radius  * (0.85 + 0.15 * pulse);

        // glow
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, finalRadius * 3);
        grd.addColorStop(0,   `rgba(${PULSE_COLOR},${finalOpacity * 0.9})`);
        grd.addColorStop(0.4, `rgba(${PARTICLE_COLOR},${finalOpacity * 0.5})`);
        grd.addColorStop(1,   `rgba(${PARTICLE_COLOR},0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, finalRadius * 3, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, finalRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${PULSE_COLOR},${finalOpacity})`;
        ctx.fill();
      }

      // connections
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx   = pts[i].x - pts[j].x;
          const dy   = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > connectionDistance) continue;

          const strength = 1 - dist / connectionDistance;
          const alpha    = strength * 0.22;

          // mouse proximity boosts line brightness
          const midX  = (pts[i].x + pts[j].x) / 2;
          const midY  = (pts[i].y + pts[j].y) / 2;
          const mDist = Math.sqrt((midX - mouse.current.x) ** 2 + (midY - mouse.current.y) ** 2);
          const boost = mDist < 160 ? (1 - mDist / 160) * 0.4 : 0;

          const lineGrd = ctx.createLinearGradient(pts[i].x, pts[i].y, pts[j].x, pts[j].y);
          lineGrd.addColorStop(0,   `rgba(${LINE_COLOR},${(alpha + boost) * pts[i].opacity})`);
          lineGrd.addColorStop(0.5, `rgba(167,139,250,${(alpha + boost) * 1.4})`);
          lineGrd.addColorStop(1,   `rgba(${LINE_COLOR},${(alpha + boost) * pts[j].opacity})`);

          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = lineGrd;
          ctx.lineWidth   = strength * 0.8;
          ctx.stroke();
        }
      }

      // mouse proximity lines (extra)
      for (let i = 0; i < pts.length; i++) {
        const dx   = pts[i].x - mouse.current.x;
        const dy   = pts[i].y - mouse.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > connectionDistance * 1.4) continue;

        const strength = 1 - dist / (connectionDistance * 1.4);
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(mouse.current.x, mouse.current.y);
        ctx.strokeStyle = `rgba(167,139,250,${strength * 0.35})`;
        ctx.lineWidth   = strength * 1.2;
        ctx.stroke();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
    };
  }, [particleCount, connectionDistance]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        zIndex: 0,
      }}
    />
  );
}
