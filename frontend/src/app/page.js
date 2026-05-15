'use client';

import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { api } from '../lib/api';

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, { autoConnect: false });

export default function Home() {
  const [auth, setAuth] = useState(null);
  const [form, setForm] = useState({ mode: 'login', name: '', email: '', password: '' });
  const [users, setUsers] = useState([]);
  const [recent, setRecent] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [socketReady, setSocketReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('session');
    if (saved) setAuth(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (!auth) return;
    socket.connect();
    socket.on('connect', () => {
      socket.emit('register', auth.user.id);
      setSocketReady(true);
    });
    socket.on('message:new', (msg) => {
      if (selected && [msg.sender, msg.receiver].includes(selected._id)) setMessages((m) => [...m, msg]);
    });
    socket.on('message:status', ({ tempId, messageId, status }) => {
      setMessages((m) => m.map((x) => (x.tempId === tempId ? { ...x, _id: messageId, status } : x)));
    });
    socket.on('message:delivered', ({ messageId, status }) => {
      setMessages((m) => m.map((x) => (x._id === messageId ? { ...x, status } : x)));
    });
    socket.on('message:read:update', ({ messageId, status }) => {
      setMessages((m) => m.map((x) => (x._id === messageId ? { ...x, status } : x)));
    });

    return () => socket.disconnect();
  }, [auth, selected]);

  const loadRecent = async () => setRecent(await api('/api/users/recent'));
  useEffect(() => {
    if (auth) loadRecent();
  }, [auth]);

  const doAuth = async (e) => {
    e.preventDefault();
    const path = form.mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const data = await api(path, { method: 'POST', body: JSON.stringify(form) });
    const session = { token: data.token, user: data.user, expires: Date.now() + 7 * 24 * 60 * 60 * 1000 };
    localStorage.setItem('token', data.token);
    localStorage.setItem('session', JSON.stringify(session));
    setAuth(session);
  };

  const searchUsers = async (q) => setUsers(await api(`/api/users/search?q=${encodeURIComponent(q)}`));

  const openChat = async (u) => {
    setSelected(u);
    setMessages(await api(`/api/chats/${u._id}`));
  };

  const send = () => {
    if (!text.trim() || !selected) return;
    const tempId = crypto.randomUUID();
    const optimistic = { tempId, sender: auth.user.id, receiver: selected._id, text, status: 'pending' };
    setMessages((m) => [...m, optimistic]);
    socket.emit('message:send', { ...optimistic, text: text.trim() });
    setText('');
    loadRecent();
  };

  const statusMark = useMemo(() => ({ pending: '⏳', sent: '✓', delivered: '✓✓', read: '✅✅' }), []);

  if (!auth) {
    return <form className="auth" onSubmit={doAuth}><h2>{form.mode === 'login' ? 'Login' : 'Register'}</h2>
      {form.mode === 'register' && <input placeholder="Name" onChange={(e) => setForm({ ...form, name: e.target.value })} required />}
      <input placeholder="Email" type="email" onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <input placeholder="Password" type="password" onChange={(e) => setForm({ ...form, password: e.target.value })} required />
      <button type="submit">Continue</button>
      <p onClick={() => setForm({ ...form, mode: form.mode === 'login' ? 'register' : 'login' })}>Switch to {form.mode === 'login' ? 'Register' : 'Login'}</p>
    </form>;
  }

  return (
    <main className="wa">
      {!socketReady && <div className="loading">Connecting chat socket...</div>}
      <aside>
        <input placeholder="Search users" onChange={(e) => searchUsers(e.target.value)} />
        <h4>Recent</h4>
        {[...recent, ...users].map((u) => <div key={u._id} onClick={() => openChat(u)} className="person">{u.name}</div>)}
      </aside>
      <section>
        <header>{selected?.name || 'Select chat'}</header>
        <div className="msgs">
          {messages.map((m, idx) => {
            const mine = m.sender === auth.user.id;
            return <div key={m._id || m.tempId || idx} className={mine ? 'mine' : 'other'}>
              <span>{m.text}</span><small>{mine ? statusMark[m.status] : ''}</small>
            </div>;
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
