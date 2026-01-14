import { NextResponse } from 'next/server';
import { getCurrentUser, hasRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { invalidateGCSCache } from '@/lib/gcs';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ['SUPER_ADMIN'])) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete all GCS-related settings
    await prisma.setting.deleteMany({
      where: {
        key: {
          startsWith: 'gcs_',
        },
      },
    });

    // Invalidate cache
    invalidateGCSCache();

    return NextResponse.json({
      success: true,
      message: 'Google Cloud Storage disconnected',
    });
  } catch (error) {
    console.error('GCS disconnect error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect GCS' },
      { status: 500 }
    );
  }
}
