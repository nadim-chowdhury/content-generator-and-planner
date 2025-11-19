'use client';

import posthog from 'posthog-js';

let posthogInitialized = false;

export const initPostHog = () => {
  if (typeof window === 'undefined') return;
  
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_API_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

  if (!apiKey || posthogInitialized) return;

  posthog.init(apiKey, {
    api_host: host,
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        posthog.debug();
      }
    },
    capture_pageview: true,
    capture_pageleave: true,
  });

  posthogInitialized = true;
};

export const identify = (userId: string, properties?: Record<string, any>) => {
  if (typeof window === 'undefined' || !posthogInitialized) return;
  posthog.identify(userId, properties);
};

export const capture = (event: string, properties?: Record<string, any>) => {
  if (typeof window === 'undefined' || !posthogInitialized) return;
  posthog.capture(event, properties);
};

export const reset = () => {
  if (typeof window === 'undefined' || !posthogInitialized) return;
  posthog.reset();
};

export const setUserProperties = (properties: Record<string, any>) => {
  if (typeof window === 'undefined' || !posthogInitialized) return;
  posthog.setPersonProperties(properties);
};

