import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { resourceSchema } from '@/middleware/validation';
import { getCurrentUser } from '@/lib/auth';

// GET all resources
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('isPublic');
    const category = searchParams.get('category');

    const resources = await prisma.resource.findMany({
      where: {
        ...(isPublic === 'true' ? { isPublic: true } : {}),
        ...(category ? { category } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: resources });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

// POST new resource (authenticated)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = resourceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    const resource = await prisma.resource.create({
      data: {
        title: data.title,
        description: data.description || null,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize || null,
        category: data.category || 'General',
        isPublic: data.isPublic ?? true,
      },
    });

    return NextResponse.json({ success: true, data: resource }, { status: 201 });
  } catch (error) {
    console.error('Error creating resource:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create resource' },
      { status: 500 }
    );
  }
}
