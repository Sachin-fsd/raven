'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { api } from '../lib/api';
import { clearSession, readSession } from '../lib/session';

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, { autoConnect: false });

export default function ChatPage() {
  const router = useRouter();
  const [auth, setAuth] = useState(null);
  const [users, setUsers] = useState([]);
  const [recent, setRecent] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [socketReady, setSocketReady] = useState(false);

  const loadRecent = async () => setRecent(await api('/api/users/recent'));

  useEffect(() => {
    const session = readSession();
    if (!session) {
      router.replace('/welcome');
      return;
    }
    setAuth(session);
  }, [router]);

  useEffect(() => {
    if (!auth) return;
    loadRecent();
    socket.auth = { token: auth.token };
    socket.connect();

    socket.on('connect', () => {
      socket.emit('register');
      setSocketReady(true);
    });

    socket.on('message:new', (msg) => {
      loadRecent();
      if (selected && [msg.sender, msg.receiver].includes(selected._id)) {
        setMessages((m) => [...m, msg]);
        if (msg.sender === selected._id && msg._id) socket.emit('message:read', { messageId: msg._id });
      }
    });

    socket.on('message:status', ({ tempId, messageId, status }) => {
      setMessages((m) => m.map((x) => (x.tempId === tempId ? { ...x, _id: messageId, status } : x)));
      loadRecent();
    });

    socket.on('message:delivered', ({ messageId, status }) => {
      setMessages((m) => m.map((x) => (x._id === messageId ? { ...x, status } : x)));
    });

    socket.on('message:read:update', ({ messageId, status }) => {
      setMessages((m) => m.map((x) => (x._id === messageId ? { ...x, status } : x)));
    });

    return () => {
      socket.emit('chat:inactive');
      socket.off('connect');
      socket.off('message:new');
      socket.off('message:status');
      socket.off('message:delivered');
      socket.off('message:read:update');
      socket.disconnect();
    };
  }, [auth, selected]);

  const searchUsers = async (q) => setUsers(await api(`/api/users/search?q=${encodeURIComponent(q)}`));

  const openChat = async (u) => {
    setSelected(u);
    socket.emit('chat:active', { otherUserId: u._id });
    const chatMessages = await api(`/api/chats/${u._id}`);
    setMessages(chatMessages);
    chatMessages
      .filter((m) => m.sender === u._id && m.status !== 'read' && m._id)
      .forEach((m) => socket.emit('message:read', { messageId: m._id }));
  };

  const send = () => {
    if (!text.trim() || !selected) return;
    const tempId = crypto.randomUUID();
    const optimistic = { tempId, sender: auth.user.id, receiver: selected._id, text: text.trim(), status: 'pending' };
    setMessages((m) => [...m, optimistic]);
    socket.emit('message:send', { ...optimistic, receiver: selected._id });
    setText('');
  };

  const logout = () => {
    clearSession();
    router.replace('/welcome');
  };

  const statusMark = useMemo(() => ({ pending: '⏳', sent: '✓', delivered: '✓✓', read: '✅✅' }), []);

  if (!auth) return null;

  const combined = [...recent, ...users.filter((u) => !recent.some((r) => r._id === u._id))];

  return (
    <main className="wa">
      {!socketReady && <div className="loading">Connecting chat socket...</div>}
      <nav className="topbar">
        <h2>Raven Chat</h2>
        <div className="topRight">
          <div className="dp">{auth.user.name?.slice(0, 1)?.toUpperCase()}</div>
          <button onClick={logout}>Logout</button>
        </div>
      </nav>
      <aside>
        <input placeholder="Search users" onChange={(e) => searchUsers(e.target.value)} />
        <h4>Recent chats</h4>
        {combined.map((u) => (
          <div key={u._id} onClick={() => openChat(u)} className={`person ${selected?._id === u._id ? 'active' : ''}`}>
            <strong>{u.name}</strong>
            <small>{u.email}</small>
          </div>
        ))}
      </aside>
      <section>
        <header>{selected?.name || 'Select a chat to start messaging'}</header>
        <div className="msgs">
          {messages.map((m, idx) => {
            const mine = m.sender === auth.user.id;
            return (
              <div key={m._id || m.tempId || idx} className={mine ? 'mine' : 'other'}>
                <span>{m.text}</span>
                <small>{mine ? statusMark[m.status] : ''}</small>
              </div>
            );
          })}
        </div>
        <footer>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message" />
          <button onClick={send}>Send</button>
        </footer>
      </section>
    </main>
  );
}
