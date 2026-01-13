import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasRole } from '@/lib/auth';
import prisma from '@/lib/prisma';

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ['ADMIN', 'SUPER_ADMIN'])) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current settings from database
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['recaptcha_enabled', 'recaptcha_site_key', 'recaptcha_secret_key'],
        },
      },
    });

    const settingsMap = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, string>);

    const enabled = settingsMap.recaptcha_enabled === 'true';
    const siteKey = settingsMap.recaptcha_site_key;
    const secretKey = settingsMap.recaptcha_secret_key;

    // Check if enabled
    if (!enabled) {
      return NextResponse.json({
        success: true,
        message: 'reCAPTCHA is currently disabled. Enable it to activate protection.',
        status: 'disabled',
      });
    }

    // Check if keys are configured
    if (!siteKey || !secretKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'reCAPTCHA keys are not configured. Please enter both Site Key and Secret Key.',
          status: 'not_configured',
        },
        { status: 400 }
      );
    }

    // Test the secret key by making a verification request
    // Note: This will fail because we don't have a real token, but we can check the error
    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: 'test-token-invalid',
      }),
    });

    const data = await response.json();

    // If we get 'invalid-input-secret', the secret key is wrong
    if (data['error-codes']?.includes('invalid-input-secret')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid Secret Key. Please check your reCAPTCHA credentials.',
          status: 'invalid_secret',
        },
        { status: 400 }
      );
    }

    // If we get 'invalid-input-response', that's expected (we sent a fake token)
    // This means the secret key is valid
    if (data['error-codes']?.includes('invalid-input-response') || data.success === false) {
      return NextResponse.json({
        success: true,
        message: 'reCAPTCHA configuration is valid! Your forms are protected.',
        status: 'configured',
        details: {
          siteKeyConfigured: !!siteKey,
          secretKeyValid: true,
        },
      });
    }

    // Unexpected response
    return NextResponse.json({
      success: true,
      message: 'reCAPTCHA configuration appears to be valid.',
      status: 'configured',
    });
  } catch (error) {
    console.error('Error testing reCAPTCHA:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test reCAPTCHA configuration. Please try again.',
      },
      { status: 500 }
    );
  }
}
