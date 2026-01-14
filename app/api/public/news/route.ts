import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET published news articles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const news = await prisma.news.findMany({
      where: {
        isPublished: true,
        publishedAt: { lte: new Date() },
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
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
