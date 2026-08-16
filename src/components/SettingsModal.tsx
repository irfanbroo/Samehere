import { X, Bell, Volume2, Globe, Eye, Trash2, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect } from 'react';
import { useApp } from '@/store/AppContext';
import { showToast } from './Toast';
import Dropdown from './Dropdown';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsModal({ open, onClose }: Props) {
  const { state, dispatch } = useApp();
  const s = state.settings;

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-card rounded-2xl border border-white/10 max-w-lg w-full max-h-[85vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5 sticky top-0 bg-[#15191C]/80 backdrop-blur-md">
              <div>
                <h2 className="text-xl font-black text-white">Settings</h2>
                <p className="text-xs text-slate-500">Tune the experience.</p>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <Section title="Notifications">
                <Toggle
                  icon={Bell}
                  label="Push notifications"
                  description="Likes, replies, and connections."
                  checked={s.notifications}
                  onChange={(v) => dispatch({ type: 'UPDATE_SETTINGS', patch: { notifications: v } })}
                />
                <Toggle
                  icon={Volume2}
                  label="Sound"
                  description="Subtle UI sounds."
                  checked={s.sound}
                  onChange={(v) => dispatch({ type: 'UPDATE_SETTINGS', patch: { sound: v } })}
                />
              </Section>

              <Section title="Privacy">
                <SelectRow
                  icon={Eye}
                  label="Default visibility"
                  value={s.visibility}
                  onChange={(v) => dispatch({ type: 'UPDATE_SETTINGS', patch: { visibility: v as any } })}
                  options={[
                    { value: 'everyone', label: 'Everyone' },
                    { value: 'connections', label: 'Connections only' },
                    { value: 'private', label: 'Private (just me)' },
                  ]}
                />
              </Section>

              <Section title="Appearance">
                <SelectRow
                  icon={Moon}
                  label="Theme"
                  value={s.theme}
                  onChange={(v) => dispatch({ type: 'UPDATE_SETTINGS', patch: { theme: v as any } })}
                  options={[
                    { value: 'dark', label: 'Dark' },
                    { value: 'darker', label: 'Darker' },
                  ]}
                />
                <SelectRow
                  icon={Globe}
                  label="Language"
                  value={s.language}
                  onChange={(v) => dispatch({ type: 'UPDATE_SETTINGS', patch: { language: v } })}
                  options={[
                    { value: 'English', label: 'English' },
                    { value: 'Urdu', label: 'Urdu' },
                    { value: 'Spanish', label: 'Spanish' },
                    { value: 'Japanese', label: 'Japanese' },
                  ]}
                />
              </Section>

              <Section title="Danger zone">
                <button
                  onClick={() => {
                    if (confirm('Delete all local data? This will clear posts, todos, and chat history.')) {
                      localStorage.removeItem('samehere_state_v2');
                      showToast('Resetting...');
                      setTimeout(() => location.reload(), 600);
                    }
                  }}
                  className="w-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl flex items-center gap-3 transition-all"
                >
                  <Trash2 size={16} />
                  <div className="text-left flex-1">
                    <p className="text-sm font-bold">Reset all data</p>
                    <p className="text-xs text-rose-400/70">Wipe local storage and start fresh.</p>
                  </div>
                </button>
              </Section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({ title, children }: { title: string; children: any }) {
  return (
    <div>
      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Toggle({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: any;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full bg-white/5 hover:bg-white/8 border border-white/5 px-4 py-3 rounded-xl flex items-center gap-3 transition-all text-left"
    >
      <Icon size={18} className="text-slate-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white">{label}</p>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
      <div
        className={cn(
          'w-10 h-6 rounded-full p-0.5 transition-all flex shrink-0',
          checked ? 'bg-primary' : 'bg-white/10'
        )}
      >
        <span
          className={cn(
            'block w-5 h-5 rounded-full bg-white shadow-md transition-transform',
            checked && 'translate-x-4'
          )}
        />
      </div>
    </button>
  );
}

function SelectRow({
  icon: Icon,
  label,
  value,
  onChange,
  options,
}: {
  icon: any;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="bg-white/5 border border-white/5 px-4 py-3 rounded-xl flex items-center gap-3">
      <Icon size={18} className="text-slate-400 shrink-0" />
      <p className="text-sm font-bold text-white flex-1">{label}</p>
      <Dropdown value={value} onChange={onChange} options={options} size="sm" align="right" />
    </div>
  );
}
