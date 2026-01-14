import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET active accommodations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const featured = searchParams.get('featured');
    const partner = searchParams.get('partner');

    const accommodations = await prisma.accommodation.findMany({
      where: {
        isActive: true,
        ...(type ? { type } : {}),
        ...(featured === 'true' ? { isFeatured: true } : {}),
        ...(partner === 'true' ? { isPartner: true } : {}),
      },
      orderBy: [
        { isFeatured: 'desc' },
        { isPartner: 'desc' },
        { sortOrder: 'asc' },
      ],
    });

    return NextResponse.json({ success: true, data: accommodations });
  } catch (error) {
    console.error('Error fetching accommodations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch accommodations' },
      { status: 500 }
    );
  }
}
