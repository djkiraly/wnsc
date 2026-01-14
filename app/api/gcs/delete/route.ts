import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { deleteFile } from '@/lib/gcs';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ['ADMIN', 'SUPER_ADMIN'])) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { fileName } = await request.json();

    if (!fileName) {
      return NextResponse.json(
        { success: false, error: 'File name is required' },
        { status: 400 }
      );
    }

    const result = await deleteFile(fileName);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Delete error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Delete failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
