import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET single facility by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const facility = await prisma.facility.findUnique({
      where: { slug, isPublic: true },
      include: {
        photos: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!facility) {
      return NextResponse.json(
        { success: false, error: 'Facility not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: facility });
  } catch (error) {
    console.error('Error fetching facility:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch facility' },
      { status: 500 }
    );
  }
}
