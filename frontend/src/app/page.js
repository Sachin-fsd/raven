'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { readSession, saveSession } from '../lib/session';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ mode: 'login', name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const session = readSession();
    if (session) router.replace('/chat');
  }, [router]);

  const doAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const path = form.mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const data = await api(path, { method: 'POST', body: JSON.stringify(form) });
      saveSession(data);
      router.replace('/chat');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="loginPage">
      <form className="auth" onSubmit={doAuth}>
        <h1>Raven Chat</h1>
        <h2>{form.mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        {form.mode === 'register' && (
          <input placeholder="Name" onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        )}
        <input placeholder="Email" type="email" onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input placeholder="Password" type="password" onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Please wait...' : 'Continue'}</button>
        <p className="switch" onClick={() => setForm({ ...form, mode: form.mode === 'login' ? 'register' : 'login' })}>
          Switch to {form.mode === 'login' ? 'Register' : 'Login'}
        </p>
      </form>
    </main>
  );
}
