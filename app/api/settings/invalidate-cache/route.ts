import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { invalidateRecaptchaCache } from '@/lib/recaptcha';
import { invalidateCredentialsCache } from '@/lib/gmail';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ['ADMIN', 'SUPER_ADMIN'])) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Invalidate all setting caches
    invalidateRecaptchaCache();
    invalidateCredentialsCache();

    return NextResponse.json({
      success: true,
      message: 'Caches invalidated successfully',
    });
  } catch (error) {
    console.error('Error invalidating caches:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to invalidate caches' },
      { status: 500 }
    );
  }
}
