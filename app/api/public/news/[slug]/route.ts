import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET single published news article by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const article = await prisma.news.findFirst({
      where: {
        slug,
        isPublished: true,
        publishedAt: { lte: new Date() },
      },
    });

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: article });
  } catch (error) {
    console.error('Error fetching news article:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}
