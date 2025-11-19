"use client";

import { ReactNode } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: ("ADMIN" | "USER")[];
  allowedPlans?: ("FREE" | "PRO" | "AGENCY")[];
  requirePlan?: "FREE" | "PRO" | "AGENCY";
  fallback?: ReactNode;
  redirectTo?: string;
}

export default function RoleGuard({
  children,
  allowedRoles,
  allowedPlans,
  requirePlan,
  fallback,
  redirectTo = "/dashboard",
}: RoleGuardProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setHasAccess(false);
      return;
    }

    // Check role
    if (allowedRoles && !allowedRoles.includes(user.role || "USER")) {
      setHasAccess(false);
      return;
    }

    // Check plan
    if (allowedPlans && !allowedPlans.includes(user.plan)) {
      setHasAccess(false);
      return;
    }

    // Check required plan
    if (requirePlan) {
      const planHierarchy = { FREE: 0, PRO: 1, AGENCY: 2 };
      const userPlanLevel = planHierarchy[user.plan] || 0;
      const requiredPlanLevel = planHierarchy[requirePlan] || 0;

      if (userPlanLevel < requiredPlanLevel) {
        setHasAccess(false);
        return;
      }
    }

    setHasAccess(true);
  }, [user, allowedRoles, allowedPlans, requirePlan]);

  useEffect(() => {
    if (hasAccess === false && redirectTo) {
      router.push(redirectTo);
    }
  }, [hasAccess, redirectTo, router]);

  if (hasAccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Checking permissions...
          </p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You don't have permission to access this page.
            </p>
            <button
              onClick={() => router.push(redirectTo)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
