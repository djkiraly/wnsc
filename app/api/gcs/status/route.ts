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
            'gcs_project_id',
            'gcs_client_email',
            'gcs_private_key',
            'gcs_bucket_name',
            'gcs_connected_at',
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
      settingsMap.gcs_project_id &&
      settingsMap.gcs_client_email &&
      settingsMap.gcs_private_key &&
      settingsMap.gcs_bucket_name
    );

    // Check if env vars are configured (as fallback)
    const hasEnvConfig = !!(
      process.env.GCS_PROJECT_ID &&
      process.env.GCS_CLIENT_EMAIL &&
      process.env.GCS_PRIVATE_KEY &&
      process.env.GCS_BUCKET_NAME
    );

    return NextResponse.json({
      success: true,
      data: {
        isConnected,
        projectId: settingsMap.gcs_project_id || null,
        bucketName: settingsMap.gcs_bucket_name || null,
        connectedAt: settingsMap.gcs_connected_at || null,
        hasEnvConfig,
        usingEnvConfig: !isConnected && hasEnvConfig,
      },
    });
  } catch (error) {
    console.error('GCS status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get GCS status' },
      { status: 500 }
    );
  }
}
