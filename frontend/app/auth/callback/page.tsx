"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { authApi } from "@/lib/auth";

function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Social login callbacks return token and user in query params or redirect
    // The backend should handle the OAuth flow and redirect here with a token
    // For now, we'll check if there's a token in the URL or try to get user info

    const token = searchParams.get("token");
    const refreshToken = searchParams.get("refreshToken");
    const error = searchParams.get("error");

    if (error) {
      setError(decodeURIComponent(error));
      setLoading(false);
      return;
    }

    if (token) {
      // If token is in URL, store it and fetch user
      handleTokenAuth(token, refreshToken);
    } else {
      // Try to get current user (backend should have set session)
      handleSessionAuth();
    }
  }, [searchParams]);

  const handleTokenAuth = async (
    token: string,
    refreshToken?: string | null
  ) => {
    try {
      // Store token temporarily
      if (typeof window !== "undefined") {
        localStorage.setItem("token", token);
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }
        document.cookie = `token=${token}; path=/; max-age=${
          7 * 24 * 60 * 60
        }; SameSite=Lax`;
      }

      // Get user info
      const { user } = await authApi.getMe();
      setAuth(user, token, refreshToken || undefined);
      router.push("/dashboard");
    } catch (err: any) {
      setError("Failed to authenticate. Please try logging in again.");
      setLoading(false);
    }
  };

  const handleSessionAuth = async () => {
    try {
      const { user } = await authApi.getMe();
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token && user) {
        setAuth(user, token);
        router.push("/dashboard");
      } else {
        setError("No authentication token found. Please try logging in again.");
        setLoading(false);
      }
    } catch (err: any) {
      setError("Failed to authenticate. Please try logging in again.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Completing authentication...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full">
        {error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded">
            <p className="font-medium">Authentication Failed</p>
            <p className="text-sm mt-1">{error}</p>
            {error.includes("credentials") || error.includes("configured") ? (
              <div className="mt-3 text-xs bg-red-100 dark:bg-red-900/40 p-2 rounded">
                <p className="font-medium mb-1">Setup Required:</p>
                <p>
                  Social login requires OAuth credentials to be configured in
                  the backend.
                </p>
                <p className="mt-1">
                  Please contact your administrator or check the backend
                  configuration.
                </p>
              </div>
            ) : null}
            <a href="/login" className="text-sm underline mt-2 inline-block">
              Back to login
            </a>
          </div>
        ) : (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded">
            <p className="font-medium">Successfully authenticated!</p>
            <p className="text-sm mt-1">Redirecting to dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      }
    >
      <AuthCallback />
    </Suspense>
  );
}
