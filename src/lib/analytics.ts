import posthog, { PostHog } from 'posthog-js';

let analyticsClient: PostHog | null = null;

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || '';
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

export const initAnalytics = (): void => {
  if (analyticsClient || typeof window === 'undefined') {
    return;
  }

  if (!POSTHOG_KEY) {
    console.warn('PostHog key missing. Analytics disabled.');
    return;
  }

  analyticsClient = posthog;
  analyticsClient.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,
    capture_pageleave: true,
  });
};

export const trackEvent = (eventName: string, properties: Record<string, unknown> = {}): void => {
  if (!analyticsClient) {
    initAnalytics();
  }

  if (!analyticsClient) {
    return;
  }

  analyticsClient.capture(eventName, properties);
};


