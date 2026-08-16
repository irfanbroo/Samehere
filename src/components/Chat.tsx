import { Search, Edit3, Info, Smile, Send, Check, ArrowLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useApp, shortTime, type Message } from '@/store/AppContext';
import { showToast } from './Toast';

const QUICK_EMOJI = ['😊', '🔥', '💯', '🙌', '✨', '🎯', '☕', '🌙'];

export default function Chat() {
  const { state, dispatch, user } = useApp();
  const [selectedId, setSelectedId] = useState(state.conversations[0]?.id ?? '');
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const conversations = useMemo(() => {
    const list = state.conversations.map((c) => {
      const msgs = state.messages.filter((m) => m.conversationId === c.id);
      const last = msgs[msgs.length - 1];
      const unread = msgs.filter((m) => m.senderId !== state.currentUserId && m.status !== 'read').length;
      return { conv: c, last, unread };
    });
    if (search.trim()) {
      const q = search.toLowerCase();
      return list.filter(({ conv }) => user(conv.participantId).name.toLowerCase().includes(q));
    }
    return list;
  }, [state.conversations, state.messages, state.currentUserId, search, user]);

  const selectedConv = state.conversations.find((c) => c.id === selectedId);
  const partner = selectedConv ? user(selectedConv.participantId) : null;
  const messages = useMemo(
    () => state.messages.filter((m) => m.conversationId === selectedId).sort((a, b) => a.time - b.time),
    [state.messages, selectedId]
  );

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages.length, selectedId]);

  // Auto-mark read when opened
  useEffect(() => {
    if (selectedId) {
      const t = setTimeout(() => dispatch({ type: 'MARK_READ', conversationId: selectedId }), 600);
      return () => clearTimeout(t);
    }
  }, [selectedId, dispatch]);

  // Auto-resize textarea
  useEffect(() => {
    if (taRef.current) {
      taRef.current.style.height = 'auto';
      taRef.current.style.height = Math.min(taRef.current.scrollHeight, 128) + 'px';
    }
  }, [text]);

  const send = () => {
    if (!text.trim() || !selectedConv) return;
    dispatch({ type: 'SEND_MESSAGE', conversationId: selectedConv.id, text: text.trim() });
    setText('');
    setEmojiOpen(false);
    // Simulate read receipt
    setTimeout(() => dispatch({ type: 'MARK_READ', conversationId: selectedConv.id }), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-[calc(100vh-8rem)] glass-card rounded-2xl overflow-hidden border border-white/5"
    >
      {/* Conversation list */}
      <div
        className={cn(
          'w-full md:w-80 lg:w-96 border-r border-white/10 flex flex-col bg-[#15191C]/30 h-full',
          mobileShowChat && 'hidden md:flex'
        )}
      >
        <div className="p-4 border-b border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Messages</h2>
            <button
              onClick={() => showToast('New message — pick from Discover')}
              className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all"
              title="New message"
            >
              <Edit3 size={16} />
            </button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-[#0b0e11] border-none rounded-full py-1.5 pl-9 pr-3 text-xs text-white focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">No conversations.</div>
          ) : (
            conversations.map(({ conv, last, unread }) => {
              const partner = user(conv.participantId);
              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelectedId(conv.id);
                    setMobileShowChat(true);
                  }}
                  className={cn(
                    'w-full px-3 py-2.5 flex gap-3 items-center transition-all relative group',
                    selectedId === conv.id ? 'bg-primary/10' : 'hover:bg-white/5'
                  )}
                >
                  {selectedId === conv.id && (
                    <motion.div layoutId="active-indicator" className="absolute right-0 top-0 bottom-0 w-1 bg-primary" />
                  )}
                  <div className="relative">
                    <img src={partner.avatar} alt={partner.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                    {conv.online && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#10B981] border-2 border-[#15191C] rounded-full status-pulse" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-center mb-0.5">
                      <h3 className={cn('text-sm truncate', selectedId === conv.id ? 'text-white font-bold' : 'text-slate-200 font-semibold')}>
                        {partner.name}
                      </h3>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">
                        {last ? shortTime(last.time) : ''}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-slate-400 truncate max-w-[80%]">
                        {last?.image ? '📎 Photo' : last?.text || 'No messages yet'}
                      </p>
                      {unread > 0 && (
                        <span className="bg-primary text-[#002b73] text-[9px] font-black px-1.5 py-0.5 rounded-full">{unread}</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat window */}
      <div
        className={cn(
          'flex-1 flex flex-col bg-[#0B0E11]/40 relative h-full',
          !mobileShowChat && 'hidden md:flex'
        )}
      >
        {!partner ? (
          <div className="flex-1 flex items-center justify-center text-slate-500">Pick a conversation</div>
        ) : (
          <>
            <header className="h-14 shrink-0 flex items-center justify-between px-4 md:px-6 bg-[#15191C]/40 backdrop-blur-md border-b border-white/5 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileShowChat(false)} className="md:hidden text-slate-400 p-1 hover:text-white">
                  <ArrowLeft size={18} />
                </button>
                <div className="relative">
                  <img src={partner.avatar} className="w-9 h-9 rounded-full object-cover border border-white/10" alt={partner.name} />
                  {selectedConv?.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#10B981] border-2 border-[#15191C] rounded-full" />
                  )}
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm tracking-tight leading-tight">{partner.name}</h3>
                  <p className={cn('text-[10px] font-bold uppercase tracking-wider', selectedConv?.online ? 'text-[#10B981]' : 'text-slate-500')}>
                    {selectedConv?.online ? 'Active now' : 'Offline'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInfo((v) => !v)}
                className={cn(
                  'p-2 rounded-lg transition-all',
                  showInfo ? 'bg-primary/15 text-primary' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                )}
                title="Conversation details"
              >
                <Info size={18} />
              </button>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-3 custom-scrollbar">
              <DateDivider time={messages[0]?.time ?? Date.now()} />

              <AnimatePresence mode="popLayout" initial={false}>
                {messages.map((msg) => (
                  <Bubble key={msg.id} msg={msg} partnerAvatar={partner.avatar} />
                ))}
              </AnimatePresence>

              {messages.length === 0 && (
                <div className="text-center text-slate-500 text-sm">Say hello to {partner.name}.</div>
              )}
            </div>

            <div className="px-4 md:px-6 py-3 bg-[#111417] border-t border-white/5">
              <AnimatePresence>
                {emojiOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: 6, height: 0 }}
                    className="flex gap-1.5 mb-2 overflow-hidden"
                  >
                    {QUICK_EMOJI.map((e) => (
                      <button
                        key={e}
                        onClick={() => setText((t) => t + e)}
                        className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-base transition-all hover:scale-110"
                      >
                        {e}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-end gap-2 glass-card px-2 py-1.5 rounded-2xl border border-white/5">
                <button
                  onClick={() => setEmojiOpen((v) => !v)}
                  className={cn(
                    'p-2 transition-colors rounded-lg shrink-0',
                    emojiOpen ? 'text-accent-blue' : 'text-slate-400 hover:text-accent-blue'
                  )}
                  title="Emoji"
                >
                  <Smile size={18} />
                </button>

                <textarea
                  ref={taRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent border-none py-1.5 text-sm text-white placeholder-slate-600 focus:ring-0 resize-none max-h-28 min-h-[32px] outline-none"
                  rows={1}
                />

                <motion.button
                  onClick={send}
                  disabled={!text.trim()}
                  whileHover={text.trim() ? { scale: 1.05 } : {}}
                  whileTap={text.trim() ? { scale: 0.95 } : {}}
                  className={cn(
                    'p-2 rounded-lg transition-all shrink-0',
                    text.trim() ? 'bg-accent-blue text-white shadow-lg shadow-accent-blue/30' : 'bg-white/5 text-slate-600 cursor-not-allowed'
                  )}
                  title="Send"
                >
                  <Send size={16} fill="currentColor" />
                </motion.button>
              </div>
              <p className="mt-1.5 text-center text-[9px] text-slate-700 font-bold uppercase tracking-widest">
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          </>
        )}

        <AnimatePresence>
          {showInfo && partner && (
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute right-0 top-0 bottom-0 w-80 bg-[#15191C]/95 backdrop-blur-xl border-l border-white/10 z-20 p-6 overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Details</h3>
                <button onClick={() => setShowInfo(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <div className="text-center mb-6">
                <img src={partner.avatar} className="w-20 h-20 rounded-full mx-auto border border-white/10 mb-3" alt="" />
                <h4 className="text-lg font-bold text-white">{partner.name}</h4>
                <p className="text-xs text-slate-500">{partner.handle}</p>
              </div>
              <div className="space-y-3 text-sm">
                {partner.role && (
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Role</span>
                    <span>{partner.role}</span>
                  </div>
                )}
                {partner.location && (
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Location</span>
                    <span>{partner.location}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Messages</span>
                  <span>{messages.length}</span>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function Bubble({ msg, partnerAvatar }: { msg: Message; partnerAvatar: string }) {
  const { state } = useApp();
  const isMine = msg.senderId === state.currentUserId;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn('flex gap-3 max-w-[85%] md:max-w-[80%]', isMine ? 'flex-row-reverse ml-auto items-end' : 'items-end')}
    >
      {!isMine && <img src={partnerAvatar} className="w-8 h-8 rounded-full object-cover shrink-0" alt="" />}
      <div className="space-y-1 group">
        {msg.image ? (
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl max-w-sm">
            <img src={msg.image} className="w-full object-cover" alt="Attached" />
          </div>
        ) : (
          <div
            className={cn(
              'px-5 py-3 rounded-2xl text-[14.5px] leading-relaxed shadow-lg whitespace-pre-wrap break-words',
              isMine
                ? 'bg-accent-blue text-white rounded-br-none pulse-glow'
                : 'bg-white/5 border border-white/10 text-slate-200 rounded-bl-none'
            )}
          >
            {msg.text}
          </div>
        )}
        <div className={cn('flex items-center gap-1.5 mt-1', isMine ? 'justify-end' : 'justify-start')}>
          <span className="text-[10px] text-slate-600 font-bold uppercase">{shortTime(msg.time)}</span>
          {isMine && msg.status === 'read' && (
            <span className="text-accent-blue flex">
              <Check size={10} className="-mr-1" strokeWidth={3} />
              <Check size={10} strokeWidth={3} />
            </span>
          )}
          {isMine && msg.status === 'sent' && (
            <Check size={10} className="text-slate-500" strokeWidth={3} />
          )}
        </div>
      </div>
    </motion.div>
  );
}

function DateDivider({ time }: { time: number }) {
  const label = new Date(time).toDateString() === new Date().toDateString() ? 'Today' : new Date(time).toLocaleDateString();
  return (
    <div className="flex justify-center">
      <span className="bg-white/5 text-slate-500 text-[10px] font-black tracking-widest px-4 py-1.5 rounded-full uppercase border border-white/5">
        {label} · {shortTime(time)}
      </span>
    </div>
  );
}
