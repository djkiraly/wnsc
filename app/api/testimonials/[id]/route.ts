import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { testimonialSchema } from '@/middleware/validation';
import { getCurrentUser } from '@/lib/auth';

// GET single testimonial
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const testimonial = await prisma.testimonial.findUnique({
      where: { id },
    });

    if (!testimonial) {
      return NextResponse.json(
        { success: false, error: 'Testimonial not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: testimonial });
  } catch (error) {
    console.error('Error fetching testimonial:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch testimonial' },
      { status: 500 }
    );
  }
}

// PUT update testimonial
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
    const validation = testimonialSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if testimonial exists
    const existingTestimonial = await prisma.testimonial.findUnique({ where: { id } });
    if (!existingTestimonial) {
      return NextResponse.json(
        { success: false, error: 'Testimonial not found' },
        { status: 404 }
      );
    }

    const testimonial = await prisma.testimonial.update({
      where: { id },
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

    return NextResponse.json({ success: true, data: testimonial });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update testimonial' },
      { status: 500 }
    );
  }
}

// DELETE testimonial
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

    // Check if testimonial exists
    const existingTestimonial = await prisma.testimonial.findUnique({ where: { id } });
    if (!existingTestimonial) {
      return NextResponse.json(
        { success: false, error: 'Testimonial not found' },
        { status: 404 }
      );
    }

    await prisma.testimonial.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Testimonial deleted' });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete testimonial' },
      { status: 500 }
    );
  }
}
