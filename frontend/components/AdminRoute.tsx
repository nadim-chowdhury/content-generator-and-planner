"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { authApi } from "@/lib/auth";

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const router = useRouter();
  const { token, user, setAuth, clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!token) {
        router.push("/login");
        setLoading(false);
        return;
      }

      try {
        const { user: currentUser } = await authApi.getMe();
        setAuth(currentUser, token);

        if (currentUser.role === "ADMIN") {
          setIsAdmin(true);
        } else {
          router.push("/dashboard");
        }
      } catch (error) {
        clearAuth();
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [token, router, setAuth, clearAuth]);

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

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
