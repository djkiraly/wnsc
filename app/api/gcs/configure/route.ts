import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';
import { invalidateGCSCache, testConnection } from '@/lib/gcs';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ['SUPER_ADMIN'])) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { projectId, clientEmail, privateKey, bucketName } = body;

    if (!projectId || !clientEmail || !privateKey || !bucketName) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Store credentials (encrypted private key)
    await Promise.all([
      prisma.setting.upsert({
        where: { key: 'gcs_project_id' },
        update: { value: projectId },
        create: { key: 'gcs_project_id', value: projectId },
      }),
      prisma.setting.upsert({
        where: { key: 'gcs_client_email' },
        update: { value: clientEmail },
        create: { key: 'gcs_client_email', value: clientEmail },
      }),
      prisma.setting.upsert({
        where: { key: 'gcs_private_key' },
        update: { value: encrypt(privateKey) },
        create: { key: 'gcs_private_key', value: encrypt(privateKey) },
      }),
      prisma.setting.upsert({
        where: { key: 'gcs_bucket_name' },
        update: { value: bucketName },
        create: { key: 'gcs_bucket_name', value: bucketName },
      }),
      prisma.setting.upsert({
        where: { key: 'gcs_connected_at' },
        update: { value: new Date().toISOString() },
        create: { key: 'gcs_connected_at', value: new Date().toISOString() },
      }),
    ]);

    // Invalidate cache to use new credentials
    invalidateGCSCache();

    // Test the connection
    const testResult = await testConnection();

    if (!testResult.success) {
      // Remove the credentials if connection fails
      await Promise.all([
        prisma.setting.deleteMany({ where: { key: { startsWith: 'gcs_' } } }),
      ]);
      invalidateGCSCache();

      return NextResponse.json(
        {
          success: false,
          error: `Failed to connect to GCS: ${testResult.error}`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Google Cloud Storage configured successfully',
    });
  } catch (error) {
    console.error('GCS configure error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to configure GCS: ${errorMessage}` },
      { status: 500 }
    );
  }
}
