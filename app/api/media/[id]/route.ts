import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { deleteFile } from '@/lib/gcs';

// GET single media
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      return NextResponse.json(
        { success: false, error: 'Media not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: media });
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

// PUT update media (alt text only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Check if media exists
    const existingMedia = await prisma.media.findUnique({ where: { id } });
    if (!existingMedia) {
      return NextResponse.json(
        { success: false, error: 'Media not found' },
        { status: 404 }
      );
    }

    const media = await prisma.media.update({
      where: { id },
      data: {
        altText: body.altText || null,
        folder: body.folder || existingMedia.folder,
      },
    });

    return NextResponse.json({ success: true, data: media });
  } catch (error) {
    console.error('Error updating media:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update media' },
      { status: 500 }
    );
  }
}

// DELETE media
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if media exists
    const existingMedia = await prisma.media.findUnique({ where: { id } });
    if (!existingMedia) {
      return NextResponse.json(
        { success: false, error: 'Media not found' },
        { status: 404 }
      );
    }

    // Delete from GCS
    const deleteResult = await deleteFile(existingMedia.fileName);
    if (!deleteResult.success) {
      console.warn('Failed to delete file from GCS:', deleteResult.error);
      // Continue to delete database record even if GCS deletion fails
    }

    // Delete database record
    await prisma.media.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Media deleted' });
  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete media' },
      { status: 500 }
    );
  }
}
