import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { facilitySchema } from '@/middleware/validation';
import { getCurrentUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';

// GET single facility
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const facility = await prisma.facility.findUnique({
      where: { id },
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

// PUT update facility
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
    const validation = facilitySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if facility exists
    const existingFacility = await prisma.facility.findUnique({ where: { id } });
    if (!existingFacility) {
      return NextResponse.json(
        { success: false, error: 'Facility not found' },
        { status: 404 }
      );
    }

    // Generate new slug if name changed
    let slug = existingFacility.slug;
    if (data.name !== existingFacility.name) {
      slug = slugify(data.name);
      const slugExists = await prisma.facility.findFirst({
        where: { slug, NOT: { id } },
      });
      if (slugExists) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    const facility = await prisma.facility.update({
      where: { id },
      data: {
        name: data.name,
        slug,
        description: data.description,
        shortDescription: data.shortDescription || null,
        address: data.address,
        city: data.city,
        state: data.state,
        zip: data.zip || null,
        phone: data.phone || null,
        email: data.email || null,
        website: data.website || null,
        capacity: data.capacity || null,
        amenities: data.amenities || [],
        sportTypes: data.sportTypes || [],
        featuredImage: data.featuredImage || null,
        isPublic: data.isPublic ?? true,
        isFeatured: data.isFeatured ?? false,
        mapEmbedUrl: data.mapEmbedUrl || null,
      },
    });

    return NextResponse.json({ success: true, data: facility });
  } catch (error) {
    console.error('Error updating facility:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update facility' },
      { status: 500 }
    );
  }
}

// DELETE facility
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

    // Check if facility exists
    const existingFacility = await prisma.facility.findUnique({ where: { id } });
    if (!existingFacility) {
      return NextResponse.json(
        { success: false, error: 'Facility not found' },
        { status: 404 }
      );
    }

    await prisma.facility.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Facility deleted' });
  } catch (error) {
    console.error('Error deleting facility:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete facility' },
      { status: 500 }
    );
  }
}
