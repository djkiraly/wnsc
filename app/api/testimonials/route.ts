import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { testimonialSchema } from '@/middleware/validation';
import { getCurrentUser } from '@/lib/auth';

// GET all testimonials
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const isFeatured = searchParams.get('isFeatured');

    const testimonials = await prisma.testimonial.findMany({
      where: {
        ...(isActive === 'true' ? { isActive: true } : {}),
        ...(isFeatured === 'true' ? { isFeatured: true } : {}),
      },
      orderBy: { sortOrder: 'asc' },
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

// POST new testimonial (authenticated)
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
    const validation = testimonialSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    const testimonial = await prisma.testimonial.create({
      data: {
        quote: data.quote,
        personName: data.personName,
        personTitle: data.personTitle || null,
        organization: data.organization || null,
        eventName: data.eventName || null,
        rating: data.rating ?? 5,
        photoUrl: data.photoUrl || null,
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    return NextResponse.json({ success: true, data: testimonial }, { status: 201 });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create testimonial' },
      { status: 500 }
    );
  }
}
