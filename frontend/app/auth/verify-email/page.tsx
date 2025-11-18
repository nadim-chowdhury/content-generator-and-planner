'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/auth';
import { useAuthStore } from '@/store/auth-store';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Invalid verification link. No token provided.');
      setLoading(false);
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const { user, token: authToken } = await authApi.verifyEmail(token);
      setAuth(user, authToken);
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired verification link');
      setLoading(false);
    }
  };

  if (loading && !error && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Verifying email...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full">
        {success ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded">
            <p className="font-medium">Email Verified Successfully!</p>
            <p className="text-sm mt-1">Your email has been verified. Redirecting to dashboard...</p>
          </div>
        ) : (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded">
            <p className="font-medium">Verification Failed</p>
            <p className="text-sm mt-1">{error}</p>
            <div className="mt-4 space-x-4">
              <a
                href="/login"
                className="text-sm underline"
              >
                Back to login
              </a>
              <button
                onClick={async () => {
                  try {
                    await authApi.resendVerification();
                    alert('Verification email sent! Please check your inbox.');
                  } catch (err: any) {
                    alert(err.response?.data?.message || 'Failed to send verification email');
                  }
                }}
                className="text-sm underline"
              >
                Resend verification email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}

