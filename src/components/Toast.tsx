import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';

type Toast = { id: number; message: string };

let push: ((m: string) => void) | null = null;

export function showToast(message: string) {
  push?.(message);
}

export default function Toast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    push = (message: string) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, message }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2400);
    };
    return () => {
      push = null;
    };
  }, []);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            className="glass-card px-5 py-3 rounded-full border border-white/10 text-sm text-white font-semibold shadow-2xl pointer-events-auto"
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
