'use client';

import { useCallback, useEffect, useState } from 'react';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export function useRecaptcha(siteKey: string | null) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!siteKey) {
      setIsReady(true); // Allow form submission without reCAPTCHA if not configured
      return;
    }

    // Check if script is already loaded
    if (window.grecaptcha) {
      window.grecaptcha.ready(() => setIsReady(true));
      return;
    }

    // Load reCAPTCHA script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      window.grecaptcha.ready(() => setIsReady(true));
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup is tricky with reCAPTCHA, leaving script in place
    };
  }, [siteKey]);

  const executeRecaptcha = useCallback(
    async (action: string): Promise<string | null> => {
      if (!siteKey) return null;

      if (!isReady || !window.grecaptcha) {
        console.warn('reCAPTCHA not ready');
        return null;
      }

      try {
        const token = await window.grecaptcha.execute(siteKey, { action });
        return token;
      } catch (error) {
        console.error('reCAPTCHA execution error:', error);
        return null;
      }
    },
    [siteKey, isReady]
  );

  return { isReady, executeRecaptcha };
}
