"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initPostHog, capture } from "@/lib/posthog";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Initialize PostHog
    initPostHog();
  }, []);

  useEffect(() => {
    // Track page views
    if (pathname) {
      capture("$pageview", {
        path: pathname,
        search: searchParams?.toString(),
      });
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}
