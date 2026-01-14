import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET active testimonials
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    const limit = searchParams.get('limit');

    const testimonials = await prisma.testimonial.findMany({
      where: {
        isActive: true,
        ...(featured === 'true' ? { isFeatured: true } : {}),
      },
      orderBy: [
        { isFeatured: 'desc' },
        { sortOrder: 'asc' },
      ],
      ...(limit ? { take: parseInt(limit) } : {}),
    });

    return NextResponse.json({ success: true, data: testimonials });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch testimonials' },
      { status: 500 }
    );
  }
}
