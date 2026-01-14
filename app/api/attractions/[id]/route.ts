import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { attractionSchema } from '@/middleware/validation';
import { getCurrentUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';

// GET single attraction
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const attraction = await prisma.attraction.findUnique({
      where: { id },
    });

    if (!attraction) {
      return NextResponse.json(
        { success: false, error: 'Attraction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: attraction });
  } catch (error) {
    console.error('Error fetching attraction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attraction' },
      { status: 500 }
    );
  }
}

// PUT update attraction
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
    const validation = attractionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if attraction exists
    const existingAttraction = await prisma.attraction.findUnique({ where: { id } });
    if (!existingAttraction) {
      return NextResponse.json(
        { success: false, error: 'Attraction not found' },
        { status: 404 }
      );
    }

    // Generate new slug if name changed
    let slug = existingAttraction.slug;
    if (data.name !== existingAttraction.name) {
      slug = slugify(data.name);
      const slugExists = await prisma.attraction.findFirst({
        where: { slug, NOT: { id } },
      });
      if (slugExists) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    const attraction = await prisma.attraction.update({
      where: { id },
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

    return NextResponse.json({ success: true, data: attraction });
  } catch (error) {
    console.error('Error updating attraction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update attraction' },
      { status: 500 }
    );
  }
}

// DELETE attraction
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

    // Check if attraction exists
    const existingAttraction = await prisma.attraction.findUnique({ where: { id } });
    if (!existingAttraction) {
      return NextResponse.json(
        { success: false, error: 'Attraction not found' },
        { status: 404 }
      );
    }

    await prisma.attraction.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Attraction deleted' });
  } catch (error) {
    console.error('Error deleting attraction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete attraction' },
      { status: 500 }
    );
  }
}
