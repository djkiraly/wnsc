import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { newsSchema } from '@/middleware/validation';
import { getCurrentUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';

// GET single news article
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const news = await prisma.news.findUnique({
      where: { id },
    });

    if (!news) {
      return NextResponse.json(
        { success: false, error: 'News article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: news });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}

// PUT update news article
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
    const validation = newsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if news exists
    const existingNews = await prisma.news.findUnique({ where: { id } });
    if (!existingNews) {
      return NextResponse.json(
        { success: false, error: 'News article not found' },
        { status: 404 }
      );
    }

    // Generate new slug if title changed
    let slug = existingNews.slug;
    if (data.title !== existingNews.title) {
      slug = slugify(data.title);
      const slugExists = await prisma.news.findFirst({
        where: { slug, NOT: { id } },
      });
      if (slugExists) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    // Handle publishedAt logic
    let publishedAt = existingNews.publishedAt;
    if (data.isPublished && !existingNews.isPublished) {
      // Publishing for first time
      publishedAt = data.publishedAt ? new Date(data.publishedAt) : new Date();
    } else if (!data.isPublished) {
      publishedAt = null;
    } else if (data.publishedAt) {
      publishedAt = new Date(data.publishedAt);
    }

    const news = await prisma.news.update({
      where: { id },
      data: {
        title: data.title,
        slug,
        content: data.content,
        excerpt: data.excerpt || null,
        featuredImage: data.featuredImage || null,
        isPublished: data.isPublished ?? false,
        publishedAt,
        metaDescription: data.metaDescription || null,
      },
    });

    return NextResponse.json({ success: true, data: news });
  } catch (error) {
    console.error('Error updating news:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update news' },
      { status: 500 }
    );
  }
}

// DELETE news article
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

    // Check if news exists
    const existingNews = await prisma.news.findUnique({ where: { id } });
    if (!existingNews) {
      return NextResponse.json(
        { success: false, error: 'News article not found' },
        { status: 404 }
      );
    }

    await prisma.news.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'News article deleted' });
  } catch (error) {
    console.error('Error deleting news:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete news' },
      { status: 500 }
    );
  }
}
