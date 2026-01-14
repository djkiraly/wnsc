import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET public facilities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    const city = searchParams.get('city');
    const sportType = searchParams.get('sportType');

    const facilities = await prisma.facility.findMany({
      where: {
        isPublic: true,
        ...(featured === 'true' ? { isFeatured: true } : {}),
        ...(city ? { city } : {}),
        ...(sportType ? { sportTypes: { has: sportType } } : {}),
      },
      include: {
        photos: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({ success: true, data: facilities });
  } catch (error) {
    console.error('Error fetching facilities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch facilities' },
      { status: 500 }
    );
  }
}
