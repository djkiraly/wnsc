'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface AnalyticsProps {
  pageName?: string;
  eventId?: string;
}

// Generate or retrieve session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

// Get page name from path
function getPageName(path: string): string {
  if (path === '/') return 'Home';
  if (path.startsWith('/events/')) return 'Event Detail';
  if (path === '/events') return 'Events';
  if (path === '/about') return 'About';
  if (path === '/contact') return 'Contact';
  if (path === '/calendar') return 'Calendar';

  // Clean up path for display
  const cleanPath = path.replace(/^\//, '').replace(/-/g, ' ');
  return cleanPath.charAt(0).toUpperCase() + cleanPath.slice(1);
}

export default function Analytics({ pageName, eventId }: AnalyticsProps) {
  const pathname = usePathname();
  const tracked = useRef(false);

  useEffect(() => {
    // Prevent double tracking in development (React strict mode)
    if (tracked.current) return;
    tracked.current = true;

    const trackVisit = async () => {
      try {
        const sessionId = getSessionId();
        const page = pageName || getPageName(pathname);

        // Track page view
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'pageview',
            page,
            path: pathname,
            referrer: document.referrer || null,
            sessionId,
          }),
        });

        // Track event view if eventId is provided
        if (eventId) {
          await fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'eventview',
              eventId,
              referrer: document.referrer || null,
              sessionId,
            }),
          });
        }
      } catch (error) {
        // Silently fail - don't impact user experience
        console.debug('Analytics tracking failed:', error);
      }
    };

    trackVisit();
  }, [pathname, pageName, eventId]);

  // This component doesn't render anything
  return null;
}
