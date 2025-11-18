'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/auth';
import { useAuthStore } from '@/store/auth-store';
import ProtectedRoute from '@/components/ProtectedRoute';
import SocialLoginButtons from '@/components/SocialLoginButtons';
import MagicLinkLogin from '@/components/MagicLinkLogin';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'magic'>('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (token) {
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
    }
  }, [token, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user, token, refreshToken } = await authApi.login(email, password, twoFactorToken || undefined);
      setAuth(user, token, refreshToken);
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      
      // Check if 2FA is required
      if (errorMessage.includes('2FA') || errorMessage.includes('two-factor')) {
        setShow2FA(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Don't render if already authenticated (will redirect)
  if (token) {
    return null;
  }

  return (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {loginMethod === 'password' ? (
            <>
              <div className="rounded-md shadow-sm -space-y-px">
                <div>
                  <label htmlFor="email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Email address"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required={!show2FA}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                  />
                </div>
              </div>

              {show2FA && (
                <div>
                  <label htmlFor="2fa-token" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Two-Factor Authentication Code
                  </label>
                  <input
                    id="2fa-token"
                    type="text"
                    maxLength={6}
                    required
                    value={twoFactorToken}
                    onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, ''))}
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm text-center text-xl tracking-widest"
                    placeholder="000000"
                  />
                </div>
              )}
            </>
          ) : (
            <MagicLinkLogin />
          )}

          {loginMethod === 'password' && (
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          )}

          <SocialLoginButtons />

          <div className="flex items-center justify-center space-x-4 text-sm">
            <button
              type="button"
              onClick={() => setLoginMethod(loginMethod === 'password' ? 'magic' : 'password')}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
            >
              {loginMethod === 'password' ? 'Use magic link instead' : 'Use password instead'}
            </button>
          </div>

          <div className="text-center space-y-2">
            <a
              href="/auth/forgot-password"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
            >
              Forgot password?
            </a>
            <div>
              <a
                href="/signup"
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
              >
                Don't have an account? Sign up
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
    </ProtectedRoute>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

