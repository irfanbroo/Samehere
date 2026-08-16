import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  hint?: string;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  options: DropdownOption[];
  className?: string;
  buttonClassName?: string;
  placeholder?: string;
  align?: 'left' | 'right';
  size?: 'sm' | 'md';
}

export default function Dropdown({
  value,
  onChange,
  options,
  className,
  buttonClassName,
  placeholder = 'Select…',
  align = 'left',
  size = 'md',
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const Icon = current?.icon;

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-full transition-all outline-none focus:border-primary/40',
          size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
          open && 'border-primary/40 bg-white/10',
          buttonClassName
        )}
      >
        {Icon && <Icon size={size === 'sm' ? 12 : 14} className="text-slate-400" />}
        <span className="font-bold tracking-wide">{current?.label ?? placeholder}</span>
        <ChevronDown
          size={size === 'sm' ? 12 : 14}
          className={cn('text-slate-400 transition-transform', open && 'rotate-180')}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 mt-2 min-w-[14rem] glass-card rounded-xl border border-white/10 shadow-2xl overflow-hidden p-1',
              align === 'right' ? 'right-0' : 'left-0'
            )}
          >
            {options.map((opt) => {
              const OptIcon = opt.icon;
              const active = opt.value === value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                    active ? 'bg-primary/15 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  )}
                >
                  {OptIcon && <OptIcon size={14} className={active ? 'text-primary' : 'text-slate-400'} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{opt.label}</p>
                    {opt.hint && <p className="text-[11px] text-slate-500 truncate">{opt.hint}</p>}
                  </div>
                  {active && <Check size={14} className="text-primary shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
