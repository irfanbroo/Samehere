'use client';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import AppShell from '@/components/AppShell';
import { useIsMobile } from '@/lib/useIsMobile';

const PRIORITY = {
  high:   { label: 'High',   color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   xp: 20 },
  medium: { label: 'Med',    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  xp: 10 },
  low:    { label: 'Low',    color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   xp: 5  },
};

const TIME_SLOTS = {
  morning:   { label: 'Morning',   emoji: '🌅', gradient: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)' },
  afternoon: { label: 'Afternoon', emoji: '☀️',  gradient: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.15)' },
  evening:   { label: 'Evening',   emoji: '🌙', gradient: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.15)' },
};

const PLACEHOLDERS = [
  "What needs to get done today?",
  "What's on your plate?",
  "Drop a task, let's crush it.",
  "What are you tackling next?",
  "Something you can't forget...",
];

function toLocalDateStr(d) { return d.toLocaleDateString('en-CA'); }

function playPlop() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(600, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    o.start(); o.stop(ctx.currentTime + 0.15);
    setTimeout(() => ctx.close(), 300);
  } catch {}
}

function getMonthMotivation() {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = lastDay - now.getDate();
  const monthName = now.toLocaleString('default', { month: 'long' });

  const pools = {
    0:  [`End it right.`, `One last shot. Take it.`, `Today is the final chapter.`, `Close the month like you mean it.`, `This is it. Everything you've got.`],
    3:  [`Don't slow down now.`, `The finish line is right there.`, `These last days define the month.`, `Burn it down to zero.`, `You didn't come this far to stop.`, `Almost. Don't blink.`, `The clock is loud now. Move.`, `This close. Keep going.`],
    9:  [`Finish what you started.`, `The month remembers how you close.`, `Less time, more focus.`, `Single digits. Let's go.`, `Make every day count now.`, `No more warm-up. This is it.`, `The best is in these last days.`, `Locked in. No distractions.`, `Days are short. Goals aren't.`],
    15: [`Keep the momentum.`, `Halfway through. Don't let up.`, `The second half is where it's decided.`, `You set the pace now.`, `Still time to make this month great.`, `The middle is where most people quit.`, `Don't let the middle be your ending.`, `Consistency here is everything.`, `You're deep in it. Stay sharp.`],
    99: [`Make them yours.`, `Plenty of runway. Use it.`, `The month is still wide open.`, `Set the tone early.`, `You've got time. Don't waste it.`, `Start strong, close stronger.`, `Fresh days. Fresh chances.`, `The month is yours to shape.`, `No excuses this early.`, `Build habits now. Thank yourself later.`, `The version of you at month-end is being built today.`, `Early effort compounds. Start now.`],
  };

  const pool = daysLeft === 0 ? pools[0] : daysLeft <= 3 ? pools[3] : daysLeft <= 9 ? pools[9] : daysLeft <= 15 ? pools[15] : pools[99];
  const message = pool[Math.floor(Math.random() * pool.length)];
  return { daysLeft, monthName, message };
}

function formatDisplay(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return new Date(+y, +m - 1, +d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtDateLabel(ds) {
  const today = toLocalDateStr(new Date());
  const tomorrow = toLocalDateStr(new Date(Date.now() + 86400000));
  if (ds === today) return 'Today';
  if (ds === tomorrow) return 'Tomorrow';
  return formatDisplay(ds);
}

// ── ADD TASK WIZARD ──────────────────────────────────────────────────────────
const WIZARD_PLACEHOLDERS = [
  'Hit the gym...', 'Read for 30 mins...', 'Call mom...', 'Deep work session...',
  'Review notes...', 'Go for a walk...', 'Drink more water...', 'Clean your desk...',
  'Reply to emails...', 'Cook a real meal...', 'No phone before 10am...',
  'Meditate for 10 mins...', 'Finish that thing you keep avoiding...',
  'One hard task before noon...', 'Ship something today...', 'Journal entry...',
  'Plan tomorrow...', 'Cold shower...', 'Skip the takeout...', 'Get 8 hours...',
  'Fix that bug...', 'Study for 2 hours...', 'Stretch for 15 mins...',
  'Write 500 words...', 'Delete 50 emails...', 'Unsubscribe from trash...',
  'Budget review...', 'Fill up the water bottle...', 'No social media till noon...',
  'Prep meals for the week...', 'Call the dentist...', 'Back up your files...',
  'Update your resume...', 'Text that person back...', 'Learn something new...',
  'Take a real lunch break...', 'Log off by 7pm...', 'Block distracting sites...',
  'Do the thing you said yesterday...', 'Finish what you started...',
  'One thing. Just one.', 'Make the bed...', 'Put your phone in another room...',
  'Move your body for 20 mins...', 'Drink water before coffee...',
  'No excuses today...', 'Start before you feel ready...',
];

function AddTaskWizard({ open, onClose, onAdd, todos, defaultDate, allowPast = false }) {
  const isMobile = useIsMobile(640);
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState('fwd');
  const [text, setText] = useState('');
  const [date, setDate] = useState(defaultDate || toLocalDateStr(new Date()));
  const [timeSlot, setTimeSlot] = useState('morning');
  const [priority, setPriority] = useState('medium');
  const [calMonth, setCalMonth] = useState(new Date());
  const inputRef = useRef(null);
  const todayStr = toLocalDateStr(new Date());
  const [wizPlaceholder, setWizPlaceholder] = useState('');

  useEffect(() => {
    if (open) {
      setStep(1); setText(''); setDir('fwd');
      setWizPlaceholder(WIZARD_PLACEHOLDERS[Math.floor(Math.random() * WIZARD_PLACEHOLDERS.length)]);
      setDate(defaultDate || todayStr);
      setTimeSlot('morning'); setPriority('medium');
      setCalMonth(new Date());
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]); // eslint-disable-line

  function goNext() { setDir('fwd'); setStep(s => s + 1); }
  function goBack() { setDir('bwd'); setStep(s => s - 1); }

  function handleDateSelect(ds) {
    setDate(ds);
    setDir('fwd');
    setTimeout(() => setStep(3), 60);
  }

  function submit() {
    if (!text.trim()) return;
    onAdd(text.trim(), date, priority, timeSlot);
    onClose();
  }

  if (!open) return null;

  const wizYear = calMonth.getFullYear();
  const wizMonth = calMonth.getMonth();
  const wizFirstDay = new Date(wizYear, wizMonth, 1).getDay();
  const wizDaysInMonth = new Date(wizYear, wizMonth + 1, 0).getDate();
  const wizMonthName = calMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  function getDotColor(ds) {
    const dayTasks = todos.filter(t => t.due_date?.slice(0, 10) === ds);
    if (!dayTasks.length) return null;
    return dayTasks.every(t => t.completed) ? '#22c55e' : ds < todayStr ? '#ef4444' : '#555';
  }

  const pad = isMobile ? '20px 20px 40px' : '20px 28px 28px';
  const headerPad = isMobile ? '14px 20px 0' : '20px 28px 0';

  return (
    <>
      <style>{`
        @keyframes ws-up  { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes ws-in  { from{opacity:0;transform:translate(-50%,-48%) scale(0.94)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        @keyframes wsfwd  { from{opacity:0;transform:translateX(22px)} to{opacity:1;transform:translateX(0)} }
        @keyframes wsbwd  { from{opacity:0;transform:translateX(-22px)} to{opacity:1;transform:translateX(0)} }
        .ws-fwd { animation: wsfwd 0.22s ease-out both; }
        .ws-bwd { animation: wsbwd 0.22s ease-out both; }
        .ws-day:hover { background: rgba(255,255,255,0.07) !important; }
        .ws-time:hover { border-color: rgba(255,255,255,0.18) !important; background: rgba(255,255,255,0.04) !important; }
        .ws-pri:hover  { opacity: 1 !important; }
      `}</style>

      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)', zIndex: 200 }} />

      <div style={{
        position: 'fixed', zIndex: 201,
        background: 'var(--bg-card, #0e0e0e)',
        border: '1px solid #1e1e1e',
        overflow: 'hidden',
        ...(isMobile ? {
          bottom: 0, left: 0, right: 0,
          borderRadius: '24px 24px 0 0',
          animation: 'ws-up 0.38s cubic-bezier(0.34,1.1,0.64,1)',
        } : {
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%', maxWidth: 480,
          borderRadius: 24,
          animation: 'ws-in 0.3s cubic-bezier(0.34,1.1,0.64,1)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }),
      }}>
        {isMobile && <div style={{ width: 36, height: 4, borderRadius: 2, background: '#222', margin: '12px auto 0' }} />}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: headerPad }}>
          {step > 1 ? (
            <button onClick={goBack} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 4, display: 'flex', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ccc'} onMouseLeave={e => e.currentTarget.style.color = '#555'}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </button>
          ) : <div style={{ width: 26 }} />}

          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{ height: 6, borderRadius: 3, width: s === step ? 22 : 6, background: s === step ? '#fff' : s < step ? '#3a3a3a' : '#1e1e1e', transition: 'all 0.3s ease' }} />
            ))}
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#2a2a2a', cursor: 'pointer', padding: 4, fontSize: 22, lineHeight: 1, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#777'} onMouseLeave={e => e.currentTarget.style.color = '#2a2a2a'}>×</button>
        </div>

        <div className={`ws-${dir}`} key={step} style={{ padding: pad }}>

          {step === 1 && (
            <div>
              <p style={{ fontSize: 11, color: '#2a2a2a', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 16px' }}>What's the task?</p>
              <input
                ref={inputRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && text.trim()) goNext(); }}
                placeholder={wizPlaceholder}
                style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #1e1e1e', outline: 'none', color: '#fff', fontSize: 24, fontWeight: 700, fontFamily: 'inherit', padding: '0 0 16px', marginBottom: 32, caretColor: '#fff', letterSpacing: '-0.02em', boxSizing: 'border-box' }}
              />
              <button onClick={goNext} disabled={!text.trim()} style={{ width: '100%', padding: '15px', borderRadius: 16, background: text.trim() ? '#fff' : '#111', color: text.trim() ? '#000' : '#333', border: `1px solid ${text.trim() ? 'transparent' : '#1a1a1a'}`, fontSize: 14, fontWeight: 800, cursor: text.trim() ? 'pointer' : 'default', transition: 'all 0.2s', letterSpacing: '0.02em' }}>Next →</button>
            </div>
          )}

          {step === 2 && (
            <div>
              <p style={{ fontSize: 11, color: '#2a2a2a', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 14px' }}>When?</p>
              <div style={{ display: 'flex', gap: 7, marginBottom: 16 }}>
                {[['Today', toLocalDateStr(new Date())], ['Tomorrow', toLocalDateStr(new Date(Date.now() + 86400000))], ['+7 days', toLocalDateStr(new Date(Date.now() + 7 * 86400000))]].map(([label, ds]) => (
                  <button key={label} onClick={() => handleDateSelect(ds)} style={{ padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: `1px solid ${date === ds ? '#fff' : '#1e1e1e'}`, background: date === ds ? '#fff' : 'transparent', color: date === ds ? '#000' : '#555', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}>{label}</button>
                ))}
              </div>
              <div style={{ background: 'var(--bg-base, #0a0a0a)', border: '1px solid #1a1a1a', borderRadius: 16, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <button onClick={() => setCalMonth(new Date(wizYear, wizMonth - 1, 1))} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>‹</button>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#bbb' }}>{wizMonthName}</span>
                  <button onClick={() => setCalMonth(new Date(wizYear, wizMonth + 1, 1))} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>›</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, color: '#2a2a2a', fontWeight: 600, paddingBottom: 5 }}>{d}</div>)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                  {Array.from({ length: wizFirstDay }).map((_, i) => <div key={`e${i}`} />)}
                  {Array.from({ length: wizDaysInMonth }, (_, i) => {
                    const dayNum = i + 1;
                    const ds = `${wizYear}-${String(wizMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const isSelected = ds === date;
                    const isToday = ds === todayStr;
                    const isPastDay = ds < todayStr;
                    const blocked = isPastDay && !allowPast;
                    const dot = getDotColor(ds);
                    return (
                      <div key={dayNum} className={blocked ? '' : 'ws-day'} onClick={() => { if (!blocked) handleDateSelect(ds); }} style={{ textAlign: 'center', padding: '6px 0', borderRadius: 8, cursor: blocked ? 'default' : 'pointer', background: isSelected ? '#fff' : isToday ? 'rgba(255,255,255,0.07)' : 'transparent', color: isSelected ? '#000' : blocked ? '#333' : isPastDay ? '#f59e0b' : '#ccc', fontWeight: isSelected || isToday ? 700 : 400, fontSize: 13, position: 'relative', transition: 'background 0.1s' }}>
                        {dayNum}
                        {dot && <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: isSelected ? '#000' : dot }} />}
                      </div>
                    );
                  })}
                </div>
              </div>
              <button onClick={goNext} style={{ width: '100%', marginTop: 12, padding: '12px', borderRadius: 14, background: 'transparent', border: '1px solid #1a1a1a', color: '#444', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#aaa'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a1a1a'; e.currentTarget.style.color = '#444'; }}>
                Keep {fmtDateLabel(date)} →
              </button>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22, padding: '8px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid #1a1a1a', borderRadius: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#e0e0e0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span>
                <span style={{ fontSize: 11, color: '#333', fontWeight: 600, flexShrink: 0 }}>· {fmtDateLabel(date)}</span>
              </div>
              <p style={{ fontSize: 11, color: '#2a2a2a', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 10px' }}>Time of day</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 22 }}>
                {[
                  { key: 'morning',   emoji: '🌅', label: 'Morning', sub: 'Early', color: '#f59e0b' },
                  { key: 'afternoon', emoji: '☀️',  label: 'Noon',    sub: 'Mid',   color: '#3b82f6' },
                  { key: 'evening',   emoji: '🌙', label: 'Night',   sub: 'Late',  color: '#8b5cf6' },
                ].map(({ key, emoji, label, sub, color }) => (
                  <button key={key} className="ws-time" onClick={() => setTimeSlot(key)} style={{ padding: '14px 8px', borderRadius: 16, cursor: 'pointer', background: timeSlot === key ? `${color}14` : 'rgba(255,255,255,0.02)', border: `1.5px solid ${timeSlot === key ? color : 'rgba(255,255,255,0.05)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, transition: 'all 0.15s', outline: 'none', boxShadow: timeSlot === key ? `0 0 16px ${color}22` : 'none' }}>
                    <span style={{ fontSize: 26 }}>{emoji}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: timeSlot === key ? color : '#555', letterSpacing: '-0.01em' }}>{label}</span>
                    <span style={{ fontSize: 9, color: timeSlot === key ? color + '99' : '#2a2a2a', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{sub}</span>
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 11, color: '#2a2a2a', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 10px' }}>Priority</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 26 }}>
                {Object.entries(PRIORITY).map(([key, val]) => (
                  <button key={key} onClick={() => setPriority(key)} style={{ flex: 1, padding: '11px 6px', borderRadius: 14, cursor: 'pointer', border: `1.5px solid ${priority === key ? val.color : '#2a2a2a'}`, background: priority === key ? val.bg : 'rgba(255,255,255,0.03)', color: priority === key ? val.color : '#888', fontSize: 12, fontWeight: 700, transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: priority === key ? val.color : '#555', transition: 'background 0.15s' }} />
                    {val.label}
                  </button>
                ))}
              </div>
              <button onClick={submit} style={{ width: '100%', padding: '16px', borderRadius: 16, background: '#fff', color: '#000', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.02em' }}
                onMouseEnter={e => e.currentTarget.style.background = '#e4e4e4'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                Add Task
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── TODOS PAGE ───────────────────────────────────────────────────────────────
export default function TodosPage() {
  const router = useRouter();
  const isMobile = useIsMobile(640);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(toLocalDateStr(new Date()));
  const [calMonth, setCalMonth] = useState(new Date());
  const [view, setView] = useState('month');
  const [motivation, setMotivation] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const [focusSkipped, setFocusSkipped] = useState(null);
  const [blockStyle, setBlockStyle] = useState('default');
  const [originalDates, setOriginalDates] = useState({});
  const [wizardOpen, setWizardOpen] = useState(false);
  const [clockTime, setClockTime] = useState({ h: '00', m: '00', ampm: 'AM', hoursLeft: 0, pct: 0 });
  const [ignoredIds, setIgnoredIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('ignored_todos') || '[]')); } catch { return new Set(); }
  });
  const [placeholder] = useState(() => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]);

  function ignoreTask(id) {
    setIgnoredIds(prev => {
      const next = new Set(prev); next.add(id);
      localStorage.setItem('ignored_todos', JSON.stringify([...next]));
      return next;
    });
  }

  useEffect(() => {
    setMotivation(getMonthMotivation());
  }, []);

  useEffect(() => {
    function tick() {
      const now = new Date();
      const h = now.getHours(), m = now.getMinutes();
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      const pct = Math.round(((h * 60 + m) / 1440) * 100);
      setClockTime({ h: String(h12).padStart(2, '0'), m: String(m).padStart(2, '0'), ampm, hoursLeft: 23 - h, pct });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const todayStr = toLocalDateStr(new Date());

  useEffect(() => {
    const user = getUser();
    if (!user) return router.push('/login');
    api.get('/todos').then(r => setTodos(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  async function addTodo(content, dueDate, priority, timeSlot) {
    if (!content?.trim()) return;
    const tempId = `temp-${Date.now()}`;
    const optimistic = { id: tempId, content: content.trim(), due_date: dueDate, priority, time_slot: timeSlot, completed: false, created_at: new Date().toISOString() };
    setTodos(prev => [optimistic, ...prev]);
    playPlop();
    try {
      const res = await api.post('/todos', { content: optimistic.content, due_date: dueDate, priority, time_slot: timeSlot });
      setTodos(prev => prev.map(t => t.id === tempId ? res.data : t));
    } catch {
      setTodos(prev => prev.filter(t => t.id !== tempId));
    }
  }

  function handleWizardAdd(content, date, priority, timeSlot) {
    addTodo(content, date, priority, timeSlot);
    setSelectedDate(date);
    setFocusSkipped(null);
  }

  async function toggleTodo(id, completed) {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed } : t));
    try {
      const res = await api.put(`/todos/${id}`, { completed });
      setTodos(prev => prev.map(t => t.id === id ? res.data : t));
    } catch {
      setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !completed } : t));
    }
  }

  async function deleteTodo(id) {
    await api.delete(`/todos/${id}`);
    setTodos(prev => prev.filter(t => t.id !== id));
  }

  // Calendar
  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = calMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Week view
  const getWeekDays = () => {
    const base = new Date(selectedDate);
    const day = base.getDay();
    const sunday = new Date(base); sunday.setDate(base.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday); d.setDate(sunday.getDate() + i);
      return toLocalDateStr(d);
    });
  };
  const weekDays = getWeekDays();

  const todayTodos = useMemo(() => todos.filter(t => t.due_date?.slice(0, 10) === todayStr), [todos, todayStr]);
  const todayDone = useMemo(() => todayTodos.filter(t => t.completed).length, [todayTodos]);
  const todayTotal = todayTodos.length;

  const streak = useMemo(() => {
    let s = 0;
    const grouped = {};
    todos.forEach(t => {
      const d = t.due_date?.slice(0, 10);
      if (d) { if (!grouped[d]) grouped[d] = []; grouped[d].push(t); }
    });
    const today = new Date();
    const todayKey = toLocalDateStr(today);
    const todayTasks = grouped[todayKey];
    const todayDone = todayTasks?.length > 0 && todayTasks.every(t => t.completed);
    // Start from today if all done, otherwise start from yesterday
    const startOffset = todayDone ? 0 : 1;
    for (let i = startOffset; i < 365; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const key = toLocalDateStr(d);
      const dayTasks = grouped[key];
      if (!dayTasks || dayTasks.length === 0) break; // no tasks = streak broken
      if (!dayTasks.every(t => t.completed)) break;  // incomplete = streak broken
      s++;
    }
    return s;
  }, [todos]);

  const overdue = useMemo(() => todos.filter(t => {
    const d = t.due_date?.slice(0, 10);
    return d && d < todayStr && !t.completed && !ignoredIds.has(t.id);
  }), [todos, todayStr, ignoredIds]);

  const dayTodos = useMemo(() => todos.filter(t => t.due_date?.slice(0, 10) === selectedDate), [todos, selectedDate]);
  const dayPending = useMemo(() => dayTodos.filter(t => !t.completed).sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.priority] ?? 1) - (order[b.priority] ?? 1);
  }), [dayTodos]);
  const dayCompleted = useMemo(() => dayTodos.filter(t => t.completed), [dayTodos]);

  const progressTotal = dayTodos.length;
  const progressDone = useMemo(() => dayTodos.filter(t => t.completed).length, [dayTodos]);
  const progress = progressTotal > 0 ? Math.round((progressDone / progressTotal) * 100) : 0;

  const isPast = selectedDate < todayStr;
  const isFuture = selectedDate > todayStr;
  const isToday = selectedDate === todayStr;

  const upNext = isToday ? dayPending.find(t => t.id !== focusSkipped) : null;

  const ringRadius = 34;
  const ringCirc = 2 * Math.PI * ringRadius;
  const ringOffset = ringCirc - (progress / 100) * ringCirc;

  function groupBySlot(tasks) {
    const groups = { morning: [], afternoon: [], evening: [] };
    tasks.forEach(t => {
      const slot = t.time_slot || 'morning';
      if (slot === 'overdue') return;
      if (groups[slot]) groups[slot].push(t); else groups.morning.push(t);
    });
    return groups;
  }

  function TaskRow({ t, done }) {
    const completing = completingId === t.id;
    const priorityColor = PRIORITY[t.priority]?.color || '#f59e0b';
    return (
      <div className={completing ? 'todo-completing' : ''} style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0',
        opacity: done ? 0.55 : 1, transition: 'opacity 0.2s',
      }}>
        {done ? (
          <button onClick={() => toggleTodo(t.id, false)} style={{
            width: 22, height: 22, borderRadius: '50%',
            background: priorityColor + '22', border: `1.5px solid ${priorityColor}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, color: priorityColor, flexShrink: 0, cursor: 'pointer', padding: 0,
          }}>✓</button>
        ) : (
          <button onClick={() => { if (isFuture) return; playPlop(); setCompletingId(t.id); toggleTodo(t.id, true); setTimeout(() => setCompletingId(null), 300); }} style={{
            width: 22, height: 22, borderRadius: '50%',
            border: `1.5px solid #252525`, background: 'none',
            cursor: isFuture ? 'not-allowed' : 'pointer', flexShrink: 0, padding: 0, transition: 'all 0.2s', opacity: isFuture ? 0.2 : 1,
          }}
          onMouseEnter={e => { if (!isFuture) { e.currentTarget.style.borderColor = priorityColor; e.currentTarget.style.background = priorityColor + '15'; }}}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#252525'; e.currentTarget.style.background = 'none'; }} />
        )}
        <span style={{ flex: 1, fontSize: 14, color: done ? '#555' : '#d0d0d0', lineHeight: 1.5, textDecoration: done ? 'line-through' : 'none', textDecorationColor: '#444', letterSpacing: '-0.01em' }}>{t.content}</span>
        <button onClick={() => deleteTodo(t.id)} style={{
          background: 'none', border: 'none', color: '#2a2a2a', cursor: 'pointer', fontSize: 16, padding: '0 2px', flexShrink: 0, transition: 'color 0.15s', lineHeight: 1,
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#666'}
        onMouseLeave={e => e.currentTarget.style.color = '#2a2a2a'}>×</button>
      </div>
    );
  }

  function TimeBlock({ slot }) {
    const info = TIME_SLOTS[slot];
    const pendingSlot = groupBySlot(dayPending);
    const completedSlot = groupBySlot(dayCompleted);
    const pending = pendingSlot[slot] || [];
    const completed = completedSlot[slot] || [];
    const total = pending.length + completed.length;
    const allDone = total > 0 && pending.length === 0;
    if (total === 0) return null;
    return (
      <div className={allDone ? 'block-done-glow' : ''} style={{
        marginBottom: 12, borderRadius: 16, overflow: 'visible', position: 'relative',
        background: allDone ? 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(34,197,94,0.02))' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${allDone ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)'}`,
        borderTop: `2px solid ${allDone ? '#22c55e' : info.gradient}`,
        transition: 'all 0.5s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 14 }}>{info.emoji}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: allDone ? '#4ade80' : '#888' }}>{info.label}</span>
          </div>
          {allDone
            ? <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '3px 10px' }}>
                <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 700 }}>✦ All done</span>
              </div>
            : <span style={{ fontSize: 10, color: '#333' }}>{pending.length} left</span>
          }
        </div>
        <div style={{ padding: '0 16px 12px' }}>
          {pending.map(t => <TaskRow key={t.id} t={t} done={false} />)}
          {completed.map(t => <TaskRow key={t.id} t={t} done={true} />)}
        </div>
      </div>
    );
  }

  function TimeBlockNew({ slot }) {
    const info = TIME_SLOTS[slot];
    const pendingSlot = groupBySlot(dayPending);
    const completedSlot = groupBySlot(dayCompleted);
    const pending = pendingSlot[slot] || [];
    const completed = completedSlot[slot] || [];
    const total = pending.length + completed.length;
    if (total === 0) return null;
    const allDone = pending.length === 0;
    const pct = Math.round((completed.length / total) * 100);
    return (
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <span style={{ fontSize: 26 }}>{info.emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: allDone ? '#22c55e' : '#fff', letterSpacing: '-0.02em' }}>{info.label}</span>
              <span style={{ fontSize: 11, color: allDone ? '#22c55e' : '#333', fontWeight: 500 }}>{allDone ? '✓ all done' : `${completed.length}/${total}`}</span>
            </div>
            <div style={{ height: 2, background: '#111', borderRadius: 2, marginTop: 6, overflow: 'hidden', width: '100%' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: allDone ? '#22c55e' : info.gradient, borderRadius: 2, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        </div>
        {[...pending, ...completed].map((t, i) => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 0',
            borderBottom: i < pending.length + completed.length - 1 ? '1px solid #0e0e0e' : 'none',
            opacity: t.completed ? 0.4 : 1, transition: 'opacity 0.2s',
          }}>
            <button onClick={() => { if (t.completed) { toggleTodo(t.id, false); } else if (!isFuture) { playPlop(); setCompletingId(t.id); toggleTodo(t.id, true); setTimeout(() => setCompletingId(null), 300); } }} style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              border: `1.5px solid ${t.completed ? info.gradient : '#252525'}`,
              background: t.completed ? info.gradient + '22' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, color: info.gradient, cursor: 'pointer', padding: 0, transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!t.completed && !isFuture) { e.currentTarget.style.borderColor = info.gradient; e.currentTarget.style.background = info.gradient + '22'; }}}
            onMouseLeave={e => { if (!t.completed) { e.currentTarget.style.borderColor = '#252525'; e.currentTarget.style.background = 'none'; }}}>
              {t.completed ? '✓' : ''}
            </button>
            <span style={{ flex: 1, fontSize: 14, color: t.completed ? '#333' : '#d0d0d0', textDecoration: t.completed ? 'line-through' : 'none', textDecorationColor: '#2a2a2a', letterSpacing: '-0.01em' }}>{t.content}</span>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: PRIORITY[t.priority]?.color || '#444', flexShrink: 0, opacity: 0.5 }} />
            <button onClick={() => deleteTodo(t.id)} style={{ background: 'none', border: 'none', color: '#2a2a2a', cursor: 'pointer', fontSize: 15, padding: '0 2px', flexShrink: 0, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#555'}
            onMouseLeave={e => e.currentTarget.style.color = '#2a2a2a'}>×</button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <AppShell>
      <div style={{ width: '100%', maxWidth: 560, margin: '0 auto', padding: '24px 16px' }}>
      <style>{`
        @keyframes todoComplete {
          0%   { transform: scale(1); opacity: 1; }
          40%  { transform: scale(1.03); opacity: 0.8; }
          100% { transform: scale(0.97); opacity: 0; }
        }
        .todo-completing { animation: todoComplete 0.3s ease-out forwards; }
        @keyframes block-glow {
          0%,100% { box-shadow: 0 0 12px rgba(34,197,94,0.08); }
          50%      { box-shadow: 0 0 28px rgba(34,197,94,0.2); }
        }
        .block-done-glow { animation: block-glow 2s ease-in-out infinite; }
        @keyframes overdue-ping { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(2.2);opacity:0} }
      `}</style>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => router.push('/feed')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>To-do list</h2>
            <p style={{ color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 12, margin: '2px 0 0' }}>
              {todayTodos.filter(t => !t.completed).length} pending · {todayDone} done today
            </p>
          </div>
          <div style={{ display: 'flex', background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, overflow: 'hidden' }}>
            {['month', 'week'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '6px 14px', background: view === v ? '#fff' : 'transparent',
                color: view === v ? '#000' : '#555', border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
              }}>{v.charAt(0).toUpperCase() + v.slice(1)}</button>
            ))}
          </div>
        </div>

        {/* Ring progress + streak */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20, background: 'var(--bg-card, #0c0c0c)', border: '1px solid #1a1a1a', borderRadius: 20, padding: '20px 24px' }}>
            <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
              <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="40" cy="40" r={ringRadius} fill="none" stroke="#111" strokeWidth="6" />
                <circle cx="40" cy="40" r={ringRadius} fill="none"
                  stroke={progress === 100 ? '#22c55e' : '#fff'}
                  strokeWidth="6" strokeDasharray={ringCirc} strokeDashoffset={ringOffset}
                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: progress === 100 ? '#22c55e' : '#fff' }}>{progress}%</span>
                <span style={{ fontSize: 9, color: 'var(--secondary-text-color, #9CA3AF)', fontWeight: 600, letterSpacing: '0.08em' }}>DONE</span>
              </div>
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
                {progressDone} <span style={{ color: '#333', fontWeight: 400 }}>/ {progressTotal} tasks</span>
              </h2>
              <p style={{ color: 'var(--secondary-text-color, #9CA3AF)', fontSize: 12, margin: '4px 0 0' }}>
                {isToday ? `${progressTotal - progressDone} remaining today` : formatDisplay(selectedDate)}
              </p>
              {streak > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <span style={{ fontSize: 16 }}>🔥</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#f59e0b' }}>{streak}</span>
                  <span style={{ fontSize: 11, color: 'var(--secondary-text-color, #9CA3AF)' }}>day streak</span>
                </div>
              )}
            </div>
          </div>

        {/* Day Meter card */}
        <div style={{ marginBottom: 20, background: 'var(--bg-card, #0c0c0c)', border: '1px solid #141414', borderRadius: 20, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.2s' }}
          onClick={() => setWizardOpen(true)}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#222'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#141414'}>
          {/* Progress bar */}
          <div style={{ height: 3, background: '#0f0f0f' }}>
            <div style={{ height: 3, width: `${clockTime.pct}%`, background: 'linear-gradient(90deg, #fff, rgba(255,255,255,0.2))', transition: 'width 1s ease' }} />
          </div>
          {/* Body */}
          <div style={{ padding: '18px 22px 14px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 10, color: '#555', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 6 }}>{clockTime.pct}% OF THE DAY GONE</div>
              <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{clockTime.h}:{clockTime.m}</div>
              <div style={{ fontSize: 11, color: '#555', letterSpacing: '0.08em', fontWeight: 600, marginTop: 5 }}>{clockTime.ampm}</div>
            </div>
            <div style={{ textAlign: 'right', paddingBottom: 2 }}>
              <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: clockTime.hoursLeft <= 4 ? '#ef4444' : clockTime.hoursLeft <= 8 ? '#f59e0b' : '#666' }}>{clockTime.hoursLeft}</div>
              <div style={{ fontSize: 9, color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginTop: 3 }}>hrs left</div>
            </div>
          </div>
          {/* Footer */}
          <div style={{ borderTop: '1px solid #0f0f0f', padding: '12px 16px' }}>
            <button onClick={e => { e.stopPropagation(); setWizardOpen(true); }} style={{
              width: '100%', height: 40, borderRadius: 12, border: 'none',
              background: '#fff', color: '#000', fontSize: 13, fontWeight: 800,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 7, transition: 'background 0.15s', letterSpacing: '0.01em',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#e0e0e0'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add task
            </button>
          </div>
        </div>

        {/* Up Next focus card — today only */}
        {upNext && (
          <div style={{
            marginBottom: 20, background: 'linear-gradient(135deg, #0f0f0f, #111)',
            border: '1px solid #1e1e1e', borderRadius: 20, padding: 20, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 12, right: 16, fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: '#1e1e1e' }}>NOW</div>
            <div style={{ fontSize: 10, color: '#333', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Up next</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 16 }}>{upNext.content}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { playPlop(); setCompletingId(upNext.id); setTimeout(() => { toggleTodo(upNext.id, true); setCompletingId(null); }, 300); }} style={{
                flex: 1, padding: 10, background: '#fff', color: '#000', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>✓ Mark done</button>
              <button onClick={() => setFocusSkipped(upNext.id)} style={{
                padding: '10px 16px', background: 'transparent', color: '#333', border: '1px solid #1e1e1e', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>Skip →</button>
            </div>
          </div>
        )}

        {/* Overdue section */}
        {overdue.length > 0 && (
          <div style={{ marginBottom: 20, borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(239,68,68,0.12)', background: 'var(--bg-card, #0c0c0c)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 12px', borderBottom: '1px solid #111' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ position: 'relative', width: 8, height: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                  <div style={{ position: 'absolute', inset: -2, borderRadius: '50%', border: '1.5px solid rgba(239,68,68,0.3)', animation: 'overdue-ping 1.5s ease-out infinite' }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#ef4444', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Overdue</span>
              </div>
              <span style={{ fontSize: 11, color: '#555', fontWeight: 500 }}>{overdue.length} task{overdue.length > 1 ? 's' : ''}</span>
            </div>
            {/* Tasks */}
            <div>
              {overdue.map((t, i) => (
                <div key={t.id} style={{ padding: '12px 18px', borderBottom: i < overdue.length - 1 ? '1px solid #0f0f0f' : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 3, height: 36, borderRadius: 2, background: PRIORITY[t.priority]?.color || '#ef4444', flexShrink: 0, opacity: 0.8 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#d0d0d0', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.content}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#333', fontWeight: 500 }}>due {formatDisplay(t.due_date?.slice(0, 10))}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => { playPlop(); toggleTodo(t.id, true); }} style={{
                      padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(34,197,94,0.2)',
                      background: 'rgba(34,197,94,0.08)', color: '#22c55e',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.18)'; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.08)'; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.2)'; }}>✓ Done</button>
                    <button onClick={() => {
                      setOriginalDates(prev => ({ ...prev, [t.id]: t.due_date?.slice(0, 10) }));
                      api.put(`/todos/${t.id}`, { due_date: todayStr, time_slot: 'overdue' }).then(r => setTodos(prev => prev.map(x => x.id === t.id ? r.data : x)));
                    }} style={{
                      padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(59,130,246,0.2)',
                      background: 'rgba(59,130,246,0.08)', color: '#3b82f6',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.18)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)'; }}>→ Today</button>
                    <button onClick={() => {
                      const tomorrow = toLocalDateStr(new Date(Date.now() + 86400000));
                      setOriginalDates(prev => ({ ...prev, [t.id]: t.due_date?.slice(0, 10) }));
                      api.put(`/todos/${t.id}`, { due_date: tomorrow, time_slot: 'morning' }).then(r => setTodos(prev => prev.map(x => x.id === t.id ? r.data : x)));
                    }} style={{
                      padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(139,92,246,0.2)',
                      background: 'rgba(139,92,246,0.08)', color: '#8b5cf6',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.18)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.08)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)'; }}>→ Tmrw</button>
                    <button onClick={() => ignoreTask(t.id)} style={{
                      width: 30, height: 30, borderRadius: 10, border: '1px solid #1e1e1e',
                      background: '#111', color: '#3a3a3a',
                      cursor: 'pointer', transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = '#888'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.background = '#111'; e.currentTarget.style.color = '#3a3a3a'; }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Month motivation banner */}
        {motivation && (() => {
          const { daysLeft, monthName: mName, message } = motivation;
          const urgency = daysLeft <= 3 ? '#ef4444' : daysLeft <= 9 ? '#f59e0b' : daysLeft <= 15 ? '#3b82f6' : '#a0a0a0';
          return (
            <div style={{
              marginBottom: 20, padding: '14px 18px', background: 'var(--bg-card, #0c0c0c)',
              border: '1px solid #1a1a1a', borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--secondary-text-color, #9CA3AF)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{mName}</p>
                <p style={{ margin: 0, fontSize: 14, color: '#ccc', fontWeight: 500 }}>{message}</p>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <p style={{ margin: 0, fontSize: 30, fontWeight: 900, color: urgency, letterSpacing: -2, lineHeight: 1 }}>{daysLeft}</p>
                <p style={{ margin: '2px 0 0', fontSize: 10, color: '#333', fontWeight: 600, letterSpacing: '0.06em' }}>DAYS LEFT</p>
              </div>
            </div>
          );
        })()}

        {/* Date header — only shown for non-today dates */}
        {!isToday && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>{formatDisplay(selectedDate)}</span>
              {isPast && <span style={{ fontSize: 11, color: '#333', background: '#1a1a1a', borderRadius: 20, padding: '2px 10px' }}>past</span>}
            </div>
            {dayPending.length > 0 && (
              <span style={{ fontSize: 12, color: 'var(--secondary-text-color, #9CA3AF)', background: '#111', border: '1px solid #1e1e1e', borderRadius: 20, padding: '3px 12px' }}>{dayPending.length} left</span>
            )}
          </div>
        )}

        {loading ? (
          <p style={{ color: '#333', textAlign: 'center', marginTop: 40 }}>Loading...</p>
        ) : (
          <>
            {dayTodos.length === 0 && (
              isPast ? (
                <p style={{ color: '#2e2e2e', fontSize: 13, textAlign: 'center', marginTop: 40 }}>Nothing was logged for this day.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 32, paddingLeft: 4 }}>
                  {['Wake up early', 'Hit the gym', 'Deep work session'].map((task, i) => (
                    <span key={i} style={{
                      fontSize: 14, color: '#2e2e2e',
                      textDecoration: 'line-through', textDecorationColor: '#fff', textDecorationThickness: 1,
                      opacity: 1 - i * 0.25,
                    }}>{task}</span>
                  ))}
                </div>
              )
            )}

            {/* Style toggle */}
            {!isPast && dayTodos.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                {['default', 'new'].map(s => (
                  <button key={s} onClick={() => setBlockStyle(s)} style={{
                    padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    border: `1px solid ${blockStyle === s ? '#fff' : '#1e1e1e'}`,
                    background: blockStyle === s ? '#fff' : 'transparent',
                    color: blockStyle === s ? '#000' : '#444',
                    transition: 'all 0.15s',
                  }}>{s === 'default' ? 'Default' : 'New'}</button>
                ))}
              </div>
            )}

            {/* Today + future: time blocks */}
            {!isPast && dayTodos.length > 0 && (
              <>
                {(() => {
                  const carried = dayTodos.filter(t => t.time_slot === 'overdue');
                  const pendingCarried = carried.filter(t => !t.completed);
                  const doneCarried = carried.filter(t => t.completed);
                  if (carried.length === 0) return null;
                  return (
                    <div style={{ marginBottom: 8, background: 'var(--bg-card, #0c0c0c)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 18, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px 10px' }}>
                        <div style={{ width: 34, height: 34, borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📋</div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#e0e0e0' }}>Carried Over</span>
                          <span style={{ fontSize: 11, color: 'var(--secondary-text-color, #9CA3AF)', marginLeft: 8 }}>
                          {(() => {
                            const dates = [...new Set(carried.map(t => originalDates[t.id]).filter(Boolean))];
                            return dates.length > 0 ? `from ${dates.map(d => formatDisplay(d)).join(', ')}` : 'rescheduled';
                          })()}
                        </span>
                        </div>
                        {pendingCarried.length === 0 ? (
                          <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 20, padding: '2px 10px' }}>{doneCarried.length} done ✓</span>
                        ) : (
                          <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 20, padding: '2px 10px' }}>{pendingCarried.length} left</span>
                        )}
                      </div>
                      <div style={{ padding: '0 12px 12px' }}>
                        {[...pendingCarried, ...doneCarried].map(t => (
                          <div key={t.id} style={{ position: 'relative' }}>
                            <TaskRow t={t} done={t.completed} />
                            {originalDates[t.id] && (
                              <span style={{ position: 'absolute', right: 36, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: '#333', pointerEvents: 'none' }}>
                                from {formatDisplay(originalDates[t.id])}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                {blockStyle === 'default'
                  ? Object.keys(TIME_SLOTS).map(slot => <TimeBlock key={slot} slot={slot} />)
                  : Object.keys(TIME_SLOTS).map(slot => <TimeBlockNew key={slot} slot={slot} />)
                }
              </>
            )}

            {/* Past dates only — day recap */}
            {isPast && dayTodos.length > 0 && (() => {
              const total = dayTodos.length;
              const done = dayCompleted.length;
              const pct = Math.round((done / total) * 100);
              return (
                <div style={{ background: 'var(--bg-card, #0c0c0c)', border: '1px solid #1a1a1a', borderRadius: 18, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid #111' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: pct === 100 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444' }}>
                        {pct === 100 ? '🎉 Perfect day' : pct >= 50 ? `${pct}% done` : `${pct}% done`}
                      </span>
                      <span style={{ fontSize: 11, color: '#333' }}>{done}/{total} tasks</span>
                    </div>
                    <div style={{ height: 3, background: '#111', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 10, width: `${pct}%`, background: pct === 100 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                  <div style={{ padding: '10px 14px 14px' }}>
                    {[...dayPending, ...dayCompleted].map(t => {
                      const isDone = t.completed;
                      return (
                        <div key={t.id} className={completingId === t.id ? 'todo-completing' : ''} style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, marginBottom: 4,
                          background: isDone ? 'transparent' : 'rgba(239,68,68,0.03)',
                        }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: isDone ? '#2a2a2a' : PRIORITY[t.priority]?.color || '#ef4444' }} />
                          {isDone ? (
                            <div style={{ width: 16, height: 16, borderRadius: 5, background: '#1a1a1a', border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#333', flexShrink: 0 }}>✓</div>
                          ) : (
                            <button onClick={() => { playPlop(); setCompletingId(t.id); toggleTodo(t.id, true); setTimeout(() => setCompletingId(null), 300); }} style={{
                              width: 16, height: 16, borderRadius: 5, border: '1px solid #333', background: 'none', cursor: 'pointer', flexShrink: 0, padding: 0, transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#22c55e'; e.currentTarget.style.background = 'rgba(34,197,94,0.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.background = 'none'; }} />
                          )}
                          <span style={{ flex: 1, fontSize: 13, color: isDone ? '#333' : '#888', textDecoration: isDone ? 'line-through' : 'none', textDecorationColor: '#2a2a2a' }}>{t.content}</span>
                          <button onClick={() => deleteTodo(t.id)} style={{ background: 'none', border: 'none', color: '#1e1e1e', cursor: 'pointer', fontSize: 14, padding: '0 2px', flexShrink: 0, transition: 'color 0.15s', lineHeight: 1 }}
                          onMouseEnter={e => e.currentTarget.style.color = '#555'}
                          onMouseLeave={e => e.currentTarget.style.color = '#1e1e1e'}>×</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {/* Month view */}
        {view === 'month' && (
          <div style={{ background: 'var(--bg-card, #0f0f0f)', border: '1px solid #1a1a1a', borderRadius: 16, padding: 16, marginBottom: 20, marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <button onClick={() => setCalMonth(new Date(year, month - 1, 1))} style={{ background: 'none', border: 'none', color: 'var(--secondary-text-color, #9CA3AF)', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>‹</button>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#ccc' }}>{monthName}</span>
              <button onClick={() => setCalMonth(new Date(year, month + 1, 1))} style={{ background: 'none', border: 'none', color: 'var(--secondary-text-color, #9CA3AF)', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>›</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--secondary-text-color, #9CA3AF)', fontWeight: 600, paddingBottom: 6 }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const dayNum = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isSelected = dateStr === selectedDate;
                const isDayToday = dateStr === todayStr;
                const dayTodoList = todos.filter(t => t.due_date?.slice(0, 10) === dateStr);
                const hasTodos = dayTodoList.length > 0;
                const allDone = hasTodos && dayTodoList.every(t => t.completed);
                const hasMissed = hasTodos && !allDone && dateStr < todayStr;
                const dotColor = isSelected ? '#000' : allDone ? '#22c55e' : hasMissed ? '#ef4444' : '#555';
                return (
                  <div key={dayNum} onClick={() => { setSelectedDate(dateStr); setFocusSkipped(null); }} style={{
                    textAlign: 'center', padding: '6px 0', borderRadius: 8, cursor: 'pointer',
                    background: isSelected ? '#fff' : isDayToday ? 'rgba(255,255,255,0.06)' : 'transparent',
                    color: isSelected ? '#000' : '#ccc',
                    fontWeight: isSelected || isDayToday ? 700 : 400,
                    fontSize: 13, position: 'relative', transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isDayToday ? 'rgba(255,255,255,0.06)' : 'transparent'; }}>
                    {dayNum}
                    {hasTodos && <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: dotColor }} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Week view */}
        {view === 'week' && (
          <div style={{ background: 'var(--bg-card, #0f0f0f)', border: '1px solid #1a1a1a', borderRadius: 16, padding: 16, marginBottom: 20, marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 7); setSelectedDate(toLocalDateStr(d)); }} style={{ background: 'none', border: 'none', color: 'var(--secondary-text-color, #9CA3AF)', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>‹</button>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#ccc' }}>{formatDisplay(weekDays[0])} – {formatDisplay(weekDays[6])}</span>
              <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 7); setSelectedDate(toLocalDateStr(d)); }} style={{ background: 'none', border: 'none', color: 'var(--secondary-text-color, #9CA3AF)', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>›</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--secondary-text-color, #9CA3AF)', fontWeight: 600, paddingBottom: 4 }}>{d}</div>
              ))}
              {weekDays.map(dateStr => {
                const isSelected = dateStr === selectedDate;
                const isDayToday = dateStr === todayStr;
                const dayNum = parseInt(dateStr.split('-')[2]);
                const dayTodoList = todos.filter(t => t.due_date?.slice(0, 10) === dateStr);
                const hasTodos = dayTodoList.length > 0;
                const allDone = hasTodos && dayTodoList.every(t => t.completed);
                const hasMissed = hasTodos && !allDone && dateStr < todayStr;
                const dotColor = isSelected ? '#000' : allDone ? '#22c55e' : hasMissed ? '#ef4444' : '#555';
                const pendingCount = dayTodoList.filter(t => !t.completed).length;
                return (
                  <div key={dateStr} onClick={() => { setSelectedDate(dateStr); setFocusSkipped(null); }} style={{
                    textAlign: 'center', padding: '8px 4px', borderRadius: 10, cursor: 'pointer',
                    background: isSelected ? '#fff' : isDayToday ? 'rgba(255,255,255,0.06)' : 'transparent',
                    color: isSelected ? '#000' : '#ccc',
                    fontWeight: isSelected || isDayToday ? 700 : 400,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isDayToday ? 'rgba(255,255,255,0.06)' : 'transparent'; }}>
                    <div style={{ fontSize: 14 }}>{dayNum}</div>
                    {hasTodos && <div style={{ marginTop: 4, fontSize: 10, fontWeight: 700, color: dotColor }}>{allDone ? '✓' : pendingCount}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <AddTaskWizard
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onAdd={handleWizardAdd}
          todos={todos}
          defaultDate={selectedDate > todayStr ? selectedDate : todayStr}
        allowPast={false}
        />
      </div>
    </AppShell>
  );
}
