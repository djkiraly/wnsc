import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { newsSchema } from '@/middleware/validation';
import { getCurrentUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';

// GET all news
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isPublished = searchParams.get('isPublished');
    const limit = searchParams.get('limit');

    const news = await prisma.news.findMany({
      where: {
        ...(isPublished === 'true' ? { isPublished: true } : {}),
      },
      orderBy: { publishedAt: 'desc' },
      ...(limit ? { take: parseInt(limit) } : {}),
    });

    return NextResponse.json({ success: true, data: news });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}

// POST new news article (authenticated)
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
    const validation = newsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Generate unique slug
    let slug = data.slug || slugify(data.title);
    const existingSlug = await prisma.news.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const news = await prisma.news.create({
      data: {
        title: data.title,
        slug,
        content: data.content,
        excerpt: data.excerpt || null,
        featuredImage: data.featuredImage || null,
        isPublished: data.isPublished ?? false,
        publishedAt: data.isPublished ? (data.publishedAt ? new Date(data.publishedAt) : new Date()) : null,
        metaDescription: data.metaDescription || null,
      },
    });

    return NextResponse.json({ success: true, data: news }, { status: 201 });
  } catch (error) {
    console.error('Error creating news:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create news' },
      { status: 500 }
    );
  }
}
