'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUI } from '@/components/ui/auth-fuse';
import api from '@/lib/api';
import { setAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn(email, password) {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      setAuth(res.data.token, res.data.user);
      router.push('/feed');
    } catch (e) {
      setError(e.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(username, email, password) {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', { username, email, password });
      setAuth(res.data.token, res.data.user);
      router.push('/feed');
    } catch (e) {
      setError(e.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthUI
      onSignIn={handleSignIn}
      onSignUp={handleSignUp}
      error={error}
      loading={loading}
    />
  );
}
