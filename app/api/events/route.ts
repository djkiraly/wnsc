import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { eventSchema } from '@/middleware/validation';
import { getCurrentUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';

// GET all events (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get('published');
    const category = searchParams.get('category');
    const limit = searchParams.get('limit');

    const events = await prisma.event.findMany({
      where: {
        ...(published === 'true' ? { published: true } : {}),
        ...(category ? { category } : {}),
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { startDate: 'asc' },
      ...(limit ? { take: parseInt(limit) } : {}),
    });

    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST new event (authenticated)
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
    const validation = eventSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Generate unique slug
    let slug = slugify(data.title);
    const existingSlug = await prisma.event.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const event = await prisma.event.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        category: data.category,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        location: data.location,
        venueName: data.venueName || null,
        contactName: data.contactName || null,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        featuredImage: data.featuredImage || null,
        registrationUrl: data.registrationUrl || null,
        status: data.status,
        metaDescription: data.metaDescription || null,
        keywords: data.keywords || null,
        published: data.published,
        createdById: user.id,
      },
    });

    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
