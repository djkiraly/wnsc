import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { accommodationSchema } from '@/middleware/validation';
import { getCurrentUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';

// GET all accommodations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const isFeatured = searchParams.get('isFeatured');
    const type = searchParams.get('type');
    const city = searchParams.get('city');
    const isPartner = searchParams.get('isPartner');

    const accommodations = await prisma.accommodation.findMany({
      where: {
        ...(isActive === 'true' ? { isActive: true } : {}),
        ...(isFeatured === 'true' ? { isFeatured: true } : {}),
        ...(type ? { type } : {}),
        ...(city ? { city } : {}),
        ...(isPartner === 'true' ? { isPartner: true } : {}),
      },
      orderBy: { sortOrder: 'asc' },
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

// POST new accommodation (authenticated)
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
    const validation = accommodationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Generate unique slug
    let slug = data.slug || slugify(data.name);
    const existingSlug = await prisma.accommodation.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const accommodation = await prisma.accommodation.create({
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

    return NextResponse.json({ success: true, data: accommodation }, { status: 201 });
  } catch (error) {
    console.error('Error creating accommodation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create accommodation' },
      { status: 500 }
    );
  }
}
