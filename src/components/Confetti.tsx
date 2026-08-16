import { useEffect, useRef, useState } from 'react';

let trigger: (() => void) | null = null;

export function fireConfetti() {
  trigger?.();
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vr: number;
  color: string;
  shape: 'rect' | 'circle';
  life: number;
}

const COLORS = ['#b2c5ff', '#ffb3b0', '#ffb68e', '#3E7BFF', '#ffffff'];

export default function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    trigger = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const cx = canvas.width / 2;
      const cy = canvas.height * 0.32;
      // Spawn particles
      const N = 90;
      for (let i = 0; i < N; i++) {
        const angle = (Math.PI * (Math.random() * 0.7 + 0.15)) * (Math.random() < 0.5 ? -1 : 1) - Math.PI / 2;
        const speed = 6 + Math.random() * 6;
        particlesRef.current.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 4 + Math.random() * 6,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.3,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          shape: Math.random() < 0.6 ? 'rect' : 'circle',
          life: 1,
        });
      }
      setActive(true);
    };
    return () => {
      trigger = null;
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const ps = particlesRef.current;
      for (const p of ps) {
        p.vy += 0.18; // gravity
        p.vx *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 0.012;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      particlesRef.current = ps.filter((p) => p.life > 0 && p.y < canvas.height + 20);
      if (particlesRef.current.length === 0) {
        setActive(false);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[200]"
      style={{ display: active ? 'block' : 'none' }}
    />
  );
}
