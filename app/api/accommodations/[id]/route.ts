import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { accommodationSchema } from '@/middleware/validation';
import { getCurrentUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';

// GET single accommodation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const accommodation = await prisma.accommodation.findUnique({
      where: { id },
    });

    if (!accommodation) {
      return NextResponse.json(
        { success: false, error: 'Accommodation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: accommodation });
  } catch (error) {
    console.error('Error fetching accommodation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch accommodation' },
      { status: 500 }
    );
  }
}

// PUT update accommodation
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
    const validation = accommodationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if accommodation exists
    const existingAccommodation = await prisma.accommodation.findUnique({ where: { id } });
    if (!existingAccommodation) {
      return NextResponse.json(
        { success: false, error: 'Accommodation not found' },
        { status: 404 }
      );
    }

    // Generate new slug if name changed
    let slug = existingAccommodation.slug;
    if (data.name !== existingAccommodation.name) {
      slug = slugify(data.name);
      const slugExists = await prisma.accommodation.findFirst({
        where: { slug, NOT: { id } },
      });
      if (slugExists) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    const accommodation = await prisma.accommodation.update({
      where: { id },
      data: {
        name: data.name,
        slug,
        description: data.description || null,
        type: data.type,
        address: data.address,
        city: data.city,
        phone: data.phone || null,
        email: data.email || null,
        website: data.website || null,
        bookingUrl: data.bookingUrl || null,
        priceRange: data.priceRange || null,
        roomCount: data.roomCount || null,
        amenities: data.amenities || [],
        imageUrl: data.imageUrl || null,
        isPartner: data.isPartner ?? false,
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    return NextResponse.json({ success: true, data: accommodation });
  } catch (error) {
    console.error('Error updating accommodation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update accommodation' },
      { status: 500 }
    );
  }
}

// DELETE accommodation
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

    // Check if accommodation exists
    const existingAccommodation = await prisma.accommodation.findUnique({ where: { id } });
    if (!existingAccommodation) {
      return NextResponse.json(
        { success: false, error: 'Accommodation not found' },
        { status: 404 }
      );
    }

    await prisma.accommodation.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Accommodation deleted' });
  } catch (error) {
    console.error('Error deleting accommodation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete accommodation' },
      { status: 500 }
    );
  }
}
