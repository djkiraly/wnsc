import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { mediaSchema } from '@/middleware/validation';
import { getCurrentUser } from '@/lib/auth';
import { uploadFile } from '@/lib/gcs';

// GET all media
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder');
    const mimeType = searchParams.get('mimeType');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const media = await prisma.media.findMany({
      where: {
        ...(folder ? { folder } : {}),
        ...(mimeType ? { mimeType: { startsWith: mimeType } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      ...(limit ? { take: parseInt(limit) } : {}),
      ...(offset ? { skip: parseInt(offset) } : {}),
    });

    const total = await prisma.media.count({
      where: {
        ...(folder ? { folder } : {}),
        ...(mimeType ? { mimeType: { startsWith: mimeType } } : {}),
      },
    });

    return NextResponse.json({ success: true, data: media, total });
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

// POST upload new media (authenticated)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'uploads';
    const altText = formData.get('altText') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Upload to GCS
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await uploadFile(buffer, file.name, file.type, folder);

    if (!uploadResult.success) {
      return NextResponse.json(
        { success: false, error: uploadResult.error },
        { status: 500 }
      );
    }

    // Create media record in database
    const media = await prisma.media.create({
      data: {
        fileName: uploadResult.fileName!,
        originalName: file.name,
        url: uploadResult.url!,
        mimeType: file.type,
        fileSize: file.size,
        folder,
        altText: altText || null,
      },
    });

    return NextResponse.json({ success: true, data: media }, { status: 201 });
  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload media' },
      { status: 500 }
    );
  }
}
