import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { attractionSchema } from '@/middleware/validation';
import { getCurrentUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';

// GET all attractions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const isFeatured = searchParams.get('isFeatured');
    const category = searchParams.get('category');
    const city = searchParams.get('city');

    const attractions = await prisma.attraction.findMany({
      where: {
        ...(isActive === 'true' ? { isActive: true } : {}),
        ...(isFeatured === 'true' ? { isFeatured: true } : {}),
        ...(category ? { category } : {}),
        ...(city ? { city } : {}),
      },
      orderBy: { sortOrder: 'asc' },
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

// POST new attraction (authenticated)
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
    const validation = attractionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Generate unique slug
    let slug = data.slug || slugify(data.name);
    const existingSlug = await prisma.attraction.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const attraction = await prisma.attraction.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        category: data.category,
        address: data.address || null,
        city: data.city,
        phone: data.phone || null,
        website: data.website || null,
        imageUrl: data.imageUrl || null,
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    return NextResponse.json({ success: true, data: attraction }, { status: 201 });
  } catch (error) {
    console.error('Error creating attraction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create attraction' },
      { status: 500 }
    );
  }
}
