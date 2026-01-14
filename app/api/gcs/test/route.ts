import { NextResponse } from 'next/server';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { testConnection, uploadFile, deleteFile } from '@/lib/gcs';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ['SUPER_ADMIN'])) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Test basic connection
    const connectionResult = await testConnection();
    if (!connectionResult.success) {
      return NextResponse.json({
        success: false,
        error: `Connection failed: ${connectionResult.error}`,
      });
    }

    // Test upload with a small test file
    const testContent = Buffer.from(`Test file created at ${new Date().toISOString()}`);
    const testFileName = 'test-connection.txt';

    const uploadResult = await uploadFile(
      testContent,
      testFileName,
      'text/plain',
      '_test'
    );

    if (!uploadResult.success) {
      return NextResponse.json({
        success: false,
        error: `Upload test failed: ${uploadResult.error}`,
      });
    }

    // Clean up test file
    if (uploadResult.fileName) {
      await deleteFile(uploadResult.fileName);
    }

    return NextResponse.json({
      success: true,
      message: 'Google Cloud Storage is working correctly',
      testUrl: uploadResult.url,
    });
  } catch (error) {
    console.error('GCS test error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Test failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
