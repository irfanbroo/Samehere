'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import AppShell from '@/components/AppShell';
import Avatar from '@/components/Avatar';
import { useIsMobile } from '@/lib/useIsMobile';

const WS_URL = 'wss://samehere-ws-ts2raneh.usw-1.sealos.app';

export default function ChatPage() {
  const { id: receiverId } = useParams();
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  const EMOJIS = [
    '😂','😭','🥹','😍','🤩','😎','🥳','😴','😤','🤔','😅','😬','🥺','😏','🤭',
    '😊','🙂','😁','😆','😋','😜','🤪','🤗','😇','🥰','😘','😚','🤤','😶','😐',
    '🔥','💀','✨','💯','🎉','👀','💪','🙏','👏','🤝','👍','👎','❤️','💔','💕',
    '💬','💭','🗣️','👋','🫡','🫠','🤡','👻','💩','🤖','👾','🎯','🎮','🚀','🌙',
    '☀️','⚡','🌊','🍕','🍔','🎵','🎶','📚','💻','📱','⌨️','🖥️','🏆','🎖️','🔑',
  ];
  const isMobile = useIsMobile();
  const wsRef = useRef(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const user = getUser();
    if (!user) return router.push('/login');
    setMe(user);

    // Fetch other user info + messages
    api.get(`/users/${receiverId}`).then(r => setOtherUser(r.data));
    api.get(`/chat/messages/${receiverId}`).then(r => {
      setMessages(r.data);
      setTimeout(scrollToBottom, 100);
      window.dispatchEvent(new Event('unread-update'));
    });


    // Connect WebSocket
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'message':
          if (String(data.message.sender_id) === String(receiverId)) {
            setMessages(prev => [...prev, data.message]);
            setTimeout(scrollToBottom, 50);
            api.get(`/chat/messages/${receiverId}`).catch(() => {});
            window.dispatchEvent(new Event('unread-update'));
            ws.send(JSON.stringify({ type: 'read', senderId: receiverId }));
          }
          break;

        case 'read':
          // Other person read our messages — update all sent ticks to ✓✓
          setMessages(prev => prev.map(m => String(m.sender_id) === String(user.id) ? { ...m, read: true } : m));
          break;
        case 'typing':
          if (String(data.userId) === String(receiverId)) setTyping(true);
          break;
        case 'stop_typing':
          if (String(data.userId) === String(receiverId)) setTyping(false);
          break;
      }
    };

    return () => { ws.close(); };
  }, [receiverId, router]);

  const handleTyping = useCallback(() => {
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: 'typing', receiverId: parseInt(receiverId) }));
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (wsRef.current?.readyState === 1) {
        wsRef.current.send(JSON.stringify({ type: 'stop_typing', receiverId: parseInt(receiverId) }));
      }
    }, 2000);
  }, [receiverId]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);

    const content = input.trim();
    setInput('');

    // Stop typing indicator
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: 'stop_typing', receiverId: parseInt(receiverId) }));
    }

    // Optimistic — show message instantly
    const tempId = `temp-${Date.now()}`;
    const optimistic = { id: tempId, sender_id: me?.id, receiver_id: parseInt(receiverId), content, created_at: new Date().toISOString(), read: false };
    setMessages(prev => [...prev, optimistic]);
    setTimeout(scrollToBottom, 50);

    try {
      const res = await api.post('/chat/send', { receiver_id: parseInt(receiverId), content });
      // Replace optimistic with real message
      setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));

      if (wsRef.current?.readyState === 1) {
        wsRef.current.send(JSON.stringify({ type: 'message', receiverId: parseInt(receiverId), content, tempId: res.data.id }));
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInput(content); // restore input on failure
    } finally {
      setSending(false);
    }
  }

  function formatTime(date) {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <AppShell>
      <div style={isMobile ? {
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 56,
        background: 'var(--bg-base, #0a0a0a)', zIndex: 20, overflow: 'hidden',
      } : {
        display: 'flex', flexDirection: 'column',
        height: '100vh', width: '100%', maxWidth: 600,
        margin: '0 auto', overflow: 'hidden',
      }}>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '16px 16px', borderBottom: '1px solid #111',
            flexShrink: 0, background: 'var(--bg-base, #0a0a0a)', zIndex: 10,
            position: 'sticky', top: 0,
          }}>
            <button onClick={() => router.push('/chat')} style={{
              background: 'none', border: 'none', color: '#888',
              cursor: 'pointer', padding: 4, display: 'flex',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
            </button>
            <Link href={`/profile/${receiverId}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              {otherUser ? (
                <>
                  <Avatar username={otherUser.username} profilePic={otherUser.profile_pic} size={36} />
                  <div>
                    <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, margin: 0 }}>{otherUser.username}</p>
                    {typing && <p style={{ color: '#22c55e', fontSize: 12, margin: 0 }}>typing...</p>}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1a1a1a' }} />
                  <div style={{ width: 80, height: 14, borderRadius: 6, background: '#1a1a1a' }} />
                </>
              )}
            </Link>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', marginTop: 60 }}>
                <p style={{ color: '#333', fontSize: 14 }}>No messages yet. Say hi!</p>
              </div>
            )}

            {messages.map((msg, i) => {
              const isMine = String(msg.sender_id) === String(me?.id);
              const showAvatar = !isMine && (i === 0 || String(messages[i - 1]?.sender_id) !== String(msg.sender_id));

              return (
                <div key={msg.id || i} style={{
                  display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start',
                  marginBottom: 4,
                  gap: 8,
                }}>
                  {!isMine && (
                    <div style={{ width: 28, flexShrink: 0 }}>
                      {showAvatar && (
                        <Avatar username={otherUser?.username} profilePic={otherUser?.profile_pic} size={28} fontSize={11} />
                      )}
                    </div>
                  )}
                  <div style={{
                    maxWidth: '70%',
                    background: isMine ? 'var(--bg-elevated, #222)' : 'var(--bg-card, #1a1a1a)',
                    color: isMine ? '#fff' : '#ccc',
                    borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    padding: '10px 14px',
                    fontSize: 14, lineHeight: 1.5,
                  }}>
                    <p style={{ margin: 0 }}>{msg.content}</p>
                    <p style={{
                      margin: '4px 0 0', fontSize: 10,
                      color: isMine ? '#888' : '#555',
                      textAlign: 'right',
                    }}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {typing && (
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <div style={{ width: 28 }} />
                <div style={{
                  background: '#1a1a1a', borderRadius: '18px 18px 18px 4px',
                  padding: '12px 18px', display: 'flex', gap: 4,
                }}>
                  <span className="typing-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#555', animationDelay: '0s' }} />
                  <span className="typing-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#555', animationDelay: '0.2s' }} />
                  <span className="typing-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#555', animationDelay: '0.4s' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ borderTop: '1px solid #1a1a1a', flexShrink: 0, position: 'relative' }}>
            {/* Emoji picker */}
            {showEmoji && (
              <div style={{
                position: 'absolute', bottom: '100%', left: 16,
                background: '#111', border: '1px solid #2a2a2a',
                borderRadius: 16, padding: 12, width: 300,
                display: 'flex', flexWrap: 'wrap', gap: 4,
                boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
                zIndex: 10,
              }}>
                {EMOJIS.map(emoji => (
                  <button key={emoji} type="button"
                    onClick={() => { setInput(prev => prev + emoji); setShowEmoji(false); }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 22, padding: 4, borderRadius: 8, lineHeight: 1,
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >{emoji}</button>
                ))}
              </div>
            )}

            <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8, padding: '12px 16px', alignItems: 'center' }}>
              {/* Emoji button */}
              <button type="button" onClick={() => setShowEmoji(p => !p)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 20, padding: 4, color: showEmoji ? '#fff' : '#555',
                flexShrink: 0, transition: 'color 0.15s',
              }}>😊</button>

              <input
                value={input}
                onChange={e => { setInput(e.target.value); handleTyping(); }}
                onKeyDown={e => { if (e.key === 'Escape') setShowEmoji(false); }}
                placeholder="Send a message..."
                style={{
                  flex: 1, background: '#111', color: '#fff',
                  border: '1px solid #2a2a2a', borderRadius: 24,
                  padding: '10px 18px', fontSize: 14, fontFamily: 'inherit',
                }}
                autoFocus
              />
              <button type="submit" disabled={!input.trim() || sending} style={{
                background: input.trim() ? '#fff' : '#222',
                color: input.trim() ? '#000' : '#444',
                border: 'none', borderRadius: 24,
                width: 40, height: 40, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() ? 'pointer' : 'default',
                transition: 'all 0.15s', flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </form>
          </div>
        </div>

      <style>{`
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
        .typing-dot {
          animation: typing-bounce 1.2s infinite;
        }
      `}</style>
    </AppShell>
  );
}
