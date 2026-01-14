import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET active attractions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');

    const attractions = await prisma.attraction.findMany({
      where: {
        isActive: true,
        ...(category ? { category } : {}),
        ...(featured === 'true' ? { isFeatured: true } : {}),
      },
      orderBy: [
        { isFeatured: 'desc' },
        { sortOrder: 'asc' },
      ],
    });

    return NextResponse.json({ success: true, data: attractions });
  } catch (error) {
    console.error('Error fetching attractions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attractions' },
      { status: 500 }
    );
  }
}
