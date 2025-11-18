'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { authApi } from '@/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const router = useRouter();
  const { token, user, setAuth, clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // If no token, redirect immediately
      if (!token) {
        if (requireAuth) {
          router.push(redirectTo);
        }
        setLoading(false);
        return;
      }

      // Verify token is still valid by calling /api/auth/me
      try {
        const { user: currentUser } = await authApi.getMe();
        setAuth(currentUser, token);
        setIsAuthenticated(true);
      } catch (error) {
        // Token is invalid, clear auth and redirect
        clearAuth();
        if (requireAuth) {
          router.push(redirectTo);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [token, requireAuth, redirectTo, router, setAuth, clearAuth]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If auth is required but user is not authenticated, don't render children
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // Render children if authenticated or if auth is not required
  return <>{children}</>;
}

