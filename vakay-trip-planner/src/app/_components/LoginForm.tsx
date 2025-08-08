// src/app/_components/LoginForm.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState('sign-in'); // 'sign-in' or 'magic-link'
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
    setLoading(false);
  };
  
  const handleMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    if (error) {
      setError(error.message);
    } else {
      setMessage('Check your email for the magic link!');
      setView('message-sent');
    }
    setLoading(false);
  };
  
  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address to reset your password.');
      return;
    }
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
        setError(error.message);
    } else {
        setMessage('Check your email for a password reset link.');
    }
    setLoading(false);
  }

  if (view === 'message-sent') {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8">
            <div className="w-full max-w-md text-center">
            <h1 className="text-2xl font-bold text-gray-800">Check your inbox!</h1>
            <p className="mt-2 text-gray-600">{message}</p>
            </div>
        </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-800">VAKAY</h1>
        <p className="mt-2 text-center text-gray-500">
          {view === 'sign-in' ? 'Welcome back! Sign in to your account.' : 'Sign up or sign in with a magic link.'}
        </p>

        {view === 'sign-in' ? (
          <form onSubmit={handleSignIn} className="mt-8 space-y-4">
            <input type="email" name="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm" />
            <input type="password" name="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm" />
            <button type="submit" disabled={loading} className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50">
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
            <div className="text-center text-sm">
                <a href="#" onClick={(e) => { e.preventDefault(); handleForgotPassword(); }} className="font-medium text-indigo-600 hover:text-indigo-500">Forgot your password?</a>
            </div>
            <p className="text-center text-sm">
              Don't have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setView('magic-link'); setError(null); }} className="font-medium text-indigo-600 hover:text-indigo-500">Sign up with a magic link</a>
            </p>
          </form>
        ) : (
          <form onSubmit={handleMagicLink} className="mt-8 space-y-4">
            <input type="email" name="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm" />
            <button type="submit" disabled={loading} className="group relative flex w-full justify-center rounded-md border border-transparent bg-gray-600 py-2 px-4 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50">
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
            <p className="text-center text-sm">
              Already have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setView('sign-in'); setError(null); }} className="font-medium text-indigo-600 hover:text-indigo-500">Sign in with password</a>
            </p>
          </form>
        )}
        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
      </div>
    </main>
  );
}