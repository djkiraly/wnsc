import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { resourceSchema } from '@/middleware/validation';
import { getCurrentUser } from '@/lib/auth';

// GET single resource
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const resource = await prisma.resource.findUnique({
      where: { id },
    });

    if (!resource) {
      return NextResponse.json(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: resource });
  } catch (error) {
    console.error('Error fetching resource:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch resource' },
      { status: 500 }
    );
  }
}

// PUT update resource
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
    const validation = resourceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if resource exists
    const existingResource = await prisma.resource.findUnique({ where: { id } });
    if (!existingResource) {
      return NextResponse.json(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      );
    }

    const resource = await prisma.resource.update({
      where: { id },
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

    return NextResponse.json({ success: true, data: resource });
  } catch (error) {
    console.error('Error updating resource:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update resource' },
      { status: 500 }
    );
  }
}

// DELETE resource
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

    // Check if resource exists
    const existingResource = await prisma.resource.findUnique({ where: { id } });
    if (!existingResource) {
      return NextResponse.json(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      );
    }

    await prisma.resource.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Resource deleted' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete resource' },
      { status: 500 }
    );
  }
}

// Track download
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const resource = await prisma.resource.update({
      where: { id },
      data: {
        downloads: { increment: 1 },
      },
    });

    return NextResponse.json({ success: true, data: resource });
  } catch (error) {
    console.error('Error tracking download:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track download' },
      { status: 500 }
    );
  }
}
