import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { facilitySchema } from '@/middleware/validation';
import { getCurrentUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';

// GET all facilities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('isPublic');
    const isFeatured = searchParams.get('isFeatured');
    const city = searchParams.get('city');
    const sportType = searchParams.get('sportType');

    const facilities = await prisma.facility.findMany({
      where: {
        ...(isPublic === 'true' ? { isPublic: true } : {}),
        ...(isFeatured === 'true' ? { isFeatured: true } : {}),
        ...(city ? { city } : {}),
        ...(sportType ? { sportTypes: { has: sportType } } : {}),
      },
      include: {
        photos: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
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

// POST new facility (authenticated)
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
    const validation = facilitySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Generate unique slug
    let slug = data.slug || slugify(data.name);
    const existingSlug = await prisma.facility.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const facility = await prisma.facility.create({
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

    return NextResponse.json({ success: true, data: facility }, { status: 201 });
  } catch (error) {
    console.error('Error creating facility:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create facility' },
      { status: 500 }
    );
  }
}
