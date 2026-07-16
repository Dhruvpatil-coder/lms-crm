import React, { useEffect, useState, useRef } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { safeDateStr } from '../../utils/safeDate';

const ROLE_STYLE = { admin: 'bg-violet-100 text-violet-700', hr: 'bg-blue-100 text-blue-700' };

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [lastMsgCount, setLastMsgCount] = useState(0);
  const [popup, setPopup] = useState(null);
  const bottomRef = useRef(null);

  const fetch = async () => {
    try { const r = await api.get('/api/chat/messages'); setMessages(r.data); } catch {}
  };

  useEffect(() => { fetch(); const t = setInterval(fetch, 5000); return () => clearInterval(t); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Chat popup notification
  useEffect(() => {
    const checkChat = async () => {
      try {
        const r = await api.get('/api/chat/messages');
        const msgs = r.data || [];
        if (lastMsgCount > 0 && msgs.length > lastMsgCount) {
          const newMsgs = msgs.slice(lastMsgCount);
          newMsgs.forEach(m => {
            if (m.senderId !== user?.id) {
              setPopup({
                senderName: m.senderName,
                senderRole: m.senderRole,
                content: m.content,
                time: (() => { try { const d = new Date(m.createdAt); if (isNaN(d.getTime())) return ''; const h = String(d.getHours()).padStart(2,'0'); const min = String(d.getMinutes()).padStart(2,'0'); return `${h}:${min}`; } catch { return ''; } })()
              });
              setTimeout(() => setPopup(null), 5000);
              toast(`💬 ${m.senderName}: ${m.content.substring(0, 40)}${m.content.length > 40 ? '...' : ''}`, { icon: '💬', duration: 4000 });
            }
          });
        }
        setLastMsgCount(msgs.length);
      } catch {}
    };
    checkChat();
    const t = setInterval(checkChat, 5000);
    return () => clearInterval(t);
  }, [lastMsgCount]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const r = await api.post('/api/chat/messages', { content: input.trim() });
      setMessages(m => [...m, r.data]); setInput('');
    } finally { setSending(false); }
  };

  const fmt = (ts) => safeDateStr(ts, 'time');
  const fmtDate = (ts) => safeDateStr(ts, 'short');
  const isToday = (ts) => new Date(ts).toDateString() === new Date().toDateString();

  return (
    <div className="flex flex-col h-screen bg-gray-50 relative">
      {/* Popup notification */}
      {popup && (
        <div className="absolute top-4 right-4 z-50 bg-white rounded-2xl border border-gray-200 shadow-lg p-4 max-w-xs animate-bounce-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl flex-shrink-0">💬</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-gray-900">{popup.senderName}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ROLE_STYLE[popup.senderRole] || 'bg-gray-100 text-gray-500'}`}>{popup.senderRole}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1 truncate">{popup.content}</p>
              <span className="text-xs text-gray-400">{popup.time}</span>
            </div>
            <button onClick={() => setPopup(null)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl">💬</div>
          <div>
            <h1 className="font-bold text-gray-900">Team Chat</h1>
            <p className="text-xs text-gray-400">Placement & Admin — real-time updates</p>
          </div>
          <div className="ml-auto flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-green-700">Live</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-300">
            <div className="text-6xl mb-3">💬</div>
            <p className="font-medium">No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === user?.id;
          const showDate = idx === 0 || fmtDate(messages[idx-1]?.createdAt) !== fmtDate(msg.createdAt);
          return (
            <React.Fragment key={msg.id}>
              {showDate && (
                <div className="text-center my-3">
                  <span className="text-xs bg-white border border-gray-200 text-gray-400 px-4 py-1 rounded-full shadow-sm">
                    {isToday(msg.createdAt) ? 'Today' : fmtDate(msg.createdAt)}
                  </span>
                </div>
              )}
              <div className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 flex-shrink-0 self-end">
                    {msg.senderName?.charAt(0)}
                  </div>
                )}
                <div className={`max-w-xs lg:max-w-md flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <div className="flex items-center gap-1.5 mb-1 ml-1">
                      <span className="text-xs font-semibold text-gray-600">{msg.senderName}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ROLE_STYLE[msg.senderRole] || 'bg-gray-100 text-gray-500'}`}>{msg.senderRole}</span>
                    </div>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-green-600 text-white rounded-br-md' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'}`}>
                    {msg.content}
                  </div>
                  <span className="text-xs text-gray-400 mt-1 mx-1">{fmt(msg.createdAt)}</span>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-4 flex-shrink-0">
        <form onSubmit={send} className="flex gap-3 items-end">
          <input value={input} onChange={e => setInput(e.target.value)} className="flex-1 input" placeholder="Type your message... (e.g. TechCorp needs IT candidates urgently)" disabled={sending} />
          <button type="submit" disabled={!input.trim() || sending}
            className="btn-primary px-5 py-2.5 flex items-center gap-2 disabled:opacity-40">
            {sending ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"/> : <span>➤</span>}
            Send
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-2 ml-1">🔄 Auto-refreshes every 5 seconds</p>
      </div>
    </div>
  );
}
