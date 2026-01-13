import { NextRequest, NextResponse } from 'next/server';
import { trackPageView, trackEventView } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, page, path, referrer, sessionId, eventId } = body;

    // Get IP address and user agent from headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? (forwardedFor.split(',')[0] ?? 'unknown').trim() : 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (type === 'pageview') {
      await trackPageView({
        page: page || 'Unknown',
        path: path || '/',
        referrer,
        sessionId,
        ipAddress,
        userAgent,
      });
    } else if (type === 'eventview' && eventId) {
      await trackEventView({
        eventId,
        sessionId,
        ipAddress,
        userAgent,
        referrer,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
