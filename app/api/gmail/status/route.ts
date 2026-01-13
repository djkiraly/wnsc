import { NextResponse } from 'next/server';
import { getCurrentUser, hasRole } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ['SUPER_ADMIN'])) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'gmail_connected_email',
            'gmail_connected_at',
            'gmail_client_id',
            'gmail_client_secret',
            'gmail_refresh_token',
          ],
        },
      },
    });

    const settingsMap = settings.reduce(
      (acc, s) => {
        acc[s.key] = s.value;
        return acc;
      },
      {} as Record<string, string>
    );

    // Must have all required credentials to be considered connected
    const isConnected = !!(
      settingsMap.gmail_client_id &&
      settingsMap.gmail_client_secret &&
      settingsMap.gmail_refresh_token &&
      settingsMap.gmail_connected_email
    );

    // Check if env vars are configured (as fallback)
    const hasEnvConfig = !!(
      process.env.GMAIL_CLIENT_ID &&
      process.env.GMAIL_CLIENT_SECRET &&
      process.env.GMAIL_REFRESH_TOKEN
    );

    return NextResponse.json({
      success: true,
      data: {
        isConnected,
        connectedEmail: settingsMap.gmail_connected_email || null,
        connectedAt: settingsMap.gmail_connected_at || null,
        hasEnvConfig,
        usingEnvConfig: !isConnected && hasEnvConfig,
      },
    });
  } catch (error) {
    console.error('Gmail status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get Gmail status' },
      { status: 500 }
    );
  }
}
