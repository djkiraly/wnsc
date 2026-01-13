import { NextResponse } from 'next/server';
import { getCurrentUser, hasRole } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ['SUPER_ADMIN'])) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Super Admin required' },
        { status: 403 }
      );
    }

    // Remove all Gmail-related settings
    await prisma.setting.deleteMany({
      where: {
        key: {
          in: [
            'gmail_client_id',
            'gmail_client_secret',
            'gmail_refresh_token',
            'gmail_connected_email',
            'gmail_connected_at',
          ],
        },
      },
    });

    return NextResponse.json({ success: true, message: 'Gmail disconnected' });
  } catch (error) {
    console.error('Gmail disconnect error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect Gmail' },
      { status: 500 }
    );
  }
}
