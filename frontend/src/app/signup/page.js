'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { readSession, saveSession } from '../../lib/session';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (readSession()) router.replace('/');
  }, [router]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
      saveSession(data);
      router.replace('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="loginPage">
      <form className="auth" onSubmit={onSubmit}>
        <h1>Sign up</h1>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="error">{error}</p>}
        <button type="submit">Create account</button>
      </form>
    </main>
  );
}
