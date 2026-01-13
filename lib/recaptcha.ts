// reCAPTCHA v3 verification utility

import prisma from './prisma';

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

interface RecaptchaConfig {
  enabled: boolean;
  secretKey: string | null;
  siteKey: string | null;
  threshold: number;
}

// Cache for reCAPTCHA settings
let configCache: RecaptchaConfig | null = null;
let configCacheTime = 0;
const CACHE_TTL = 60000; // 1 minute

async function getRecaptchaConfig(): Promise<RecaptchaConfig> {
  // Check env vars first (takes precedence)
  const envSecretKey = process.env.RECAPTCHA_SECRET_KEY;
  const envSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const envThreshold = process.env.RECAPTCHA_THRESHOLD;
  const envEnabled = process.env.RECAPTCHA_ENABLED;

  // If env vars are set, use them (enabled by default if keys exist)
  if (envSecretKey && envSiteKey) {
    return {
      enabled: envEnabled !== 'false', // enabled unless explicitly disabled
      secretKey: envSecretKey,
      siteKey: envSiteKey,
      threshold: parseFloat(envThreshold || '0.5'),
    };
  }

  // Check cache
  if (configCache && Date.now() - configCacheTime < CACHE_TTL) {
    return configCache;
  }

  // Fetch from database
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['recaptcha_enabled', 'recaptcha_site_key', 'recaptcha_secret_key', 'recaptcha_threshold'],
        },
      },
    });

    const settingsMap = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, string>);

    configCache = {
      enabled: settingsMap.recaptcha_enabled === 'true',
      secretKey: settingsMap.recaptcha_secret_key || null,
      siteKey: settingsMap.recaptcha_site_key || null,
      threshold: parseFloat(settingsMap.recaptcha_threshold || '0.5'),
    };
    configCacheTime = Date.now();

    return configCache;
  } catch (error) {
    console.error('Error fetching reCAPTCHA config:', error);
    return {
      enabled: false,
      secretKey: null,
      siteKey: null,
      threshold: 0.5,
    };
  }
}

export async function verifyRecaptcha(token: string): Promise<{
  success: boolean;
  score: number;
  error?: string;
}> {
  const config = await getRecaptchaConfig();

  // If reCAPTCHA is disabled, skip verification
  if (!config.enabled) {
    console.log('reCAPTCHA is disabled, skipping verification');
    return { success: true, score: 1 };
  }

  if (!config.secretKey) {
    console.warn('reCAPTCHA secret key not configured, skipping verification');
    return { success: true, score: 1 };
  }

  if (!token) {
    return { success: false, score: 0, error: 'No reCAPTCHA token provided' };
  }

  try {
    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: config.secretKey,
        response: token,
      }),
    });

    const data: RecaptchaResponse = await response.json();

    if (!data.success) {
      return {
        success: false,
        score: 0,
        error: data['error-codes']?.join(', ') || 'Verification failed',
      };
    }

    // reCAPTCHA v3 returns a score from 0.0 to 1.0
    // 1.0 is very likely a good interaction, 0.0 is very likely a bot
    const score = data.score ?? 0;

    if (score < config.threshold) {
      return {
        success: false,
        score,
        error: 'reCAPTCHA score too low',
      };
    }

    return { success: true, score };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return { success: false, score: 0, error: 'Verification request failed' };
  }
}

// Get site key for client-side use (sync version for immediate use)
export function getRecaptchaSiteKey(): string | null {
  return process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || null;
}

// Get site key from database (async) - returns null if disabled
export async function getRecaptchaSiteKeyAsync(): Promise<string | null> {
  const config = await getRecaptchaConfig();
  // Return null if disabled or not configured
  if (!config.enabled || !config.siteKey) {
    return null;
  }
  return config.siteKey;
}

// Invalidate cache (call after updating settings)
export function invalidateRecaptchaCache() {
  configCache = null;
  configCacheTime = 0;
}
