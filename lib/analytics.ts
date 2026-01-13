import prisma from './prisma';

interface TrackingData {
  page: string;
  path: string;
  referrer?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function trackPageView(data: TrackingData) {
  try {
    const userAgent = data.userAgent || 'unknown';

    await prisma.pageView.create({
      data: {
        page: data.page,
        path: data.path,
        referrer: data.referrer,
        ipAddress: data.ipAddress || 'unknown',
        userAgent,
        sessionId: data.sessionId,
        deviceType: getDeviceType(userAgent),
        browser: getBrowser(userAgent),
      },
    });
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
}

interface EventTrackingData {
  eventId: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
}

export async function trackEventView(data: EventTrackingData) {
  try {
    await prisma.eventView.create({
      data: {
        eventId: data.eventId,
        ipAddress: data.ipAddress || 'unknown',
        userAgent: data.userAgent || 'unknown',
        referrer: data.referrer,
        sessionId: data.sessionId,
      },
    });

    // Increment event views counter
    await prisma.event.update({
      where: { id: data.eventId },
      data: { views: { increment: 1 } },
    });
  } catch (error) {
    console.error('Failed to track event view:', error);
  }
}

function getDeviceType(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

function getBrowser(userAgent: string): string {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Other';
}

export async function getAnalyticsData(startDate: Date, endDate: Date) {
  // Total page views in period
  const totalPageViews = await prisma.pageView.count({
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Unique visitors (by sessionId)
  const uniqueVisitors = await prisma.pageView.groupBy({
    by: ['sessionId'],
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
      sessionId: { not: null },
    },
  });

  // Page views by page
  const pageViews = await prisma.pageView.groupBy({
    by: ['page'],
    _count: { id: true },
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      _count: { id: 'desc' },
    },
    take: 10,
  });

  // Event views with event details
  const eventViewsRaw = await prisma.eventView.groupBy({
    by: ['eventId'],
    _count: { id: true },
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      _count: { id: 'desc' },
    },
    take: 10,
  });

  // Get event details for the top viewed events
  const eventIds = eventViewsRaw.map((e) => e.eventId);
  const events = await prisma.event.findMany({
    where: { id: { in: eventIds } },
    select: { id: true, title: true, slug: true },
  });

  const eventViews = eventViewsRaw.map((ev) => ({
    ...ev,
    event: events.find((e) => e.id === ev.eventId),
  }));

  // Device stats
  const deviceStats = await prisma.pageView.groupBy({
    by: ['deviceType'],
    _count: { id: true },
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
      deviceType: { not: null },
    },
  });

  // Browser stats
  const browserStats = await prisma.pageView.groupBy({
    by: ['browser'],
    _count: { id: true },
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
      browser: { not: null },
    },
  });

  // Daily page views for chart
  const dailyViews = await prisma.$queryRaw<{ date: Date; count: bigint }[]>`
    SELECT DATE_TRUNC('day', "timestamp") as date, COUNT(*) as count
    FROM "PageView"
    WHERE "timestamp" >= ${startDate} AND "timestamp" <= ${endDate}
    GROUP BY DATE_TRUNC('day', "timestamp")
    ORDER BY date ASC
  `;

  // Referrer stats
  const referrerStats = await prisma.pageView.groupBy({
    by: ['referrer'],
    _count: { id: true },
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
      referrer: { not: null },
    },
    orderBy: {
      _count: { id: 'desc' },
    },
    take: 10,
  });

  return {
    totalPageViews,
    uniqueVisitors: uniqueVisitors.length,
    pageViews,
    eventViews,
    deviceStats,
    browserStats,
    dailyViews: dailyViews.map((d) => ({
      date: d.date?.toISOString().split('T')[0] || '',
      views: Number(d.count),
    })).filter((d) => d.date !== ''),
    referrerStats,
  };
}

// Get analytics summary for dashboard widgets
export async function getAnalyticsSummary() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(thisWeekStart.getDate() - 7);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // Today's views
  const todayViews = await prisma.pageView.count({
    where: { timestamp: { gte: today } },
  });

  // Yesterday's views
  const yesterdayViews = await prisma.pageView.count({
    where: {
      timestamp: { gte: yesterday, lt: today },
    },
  });

  // This week's views
  const thisWeekViews = await prisma.pageView.count({
    where: { timestamp: { gte: thisWeekStart } },
  });

  // Last week's views
  const lastWeekViews = await prisma.pageView.count({
    where: {
      timestamp: { gte: lastWeekStart, lt: thisWeekStart },
    },
  });

  // This month's views
  const thisMonthViews = await prisma.pageView.count({
    where: { timestamp: { gte: thisMonthStart } },
  });

  // Last month's views
  const lastMonthViews = await prisma.pageView.count({
    where: {
      timestamp: { gte: lastMonthStart, lte: lastMonthEnd },
    },
  });

  // Total event views this month
  const eventViewsThisMonth = await prisma.eventView.count({
    where: { timestamp: { gte: thisMonthStart } },
  });

  return {
    todayViews,
    yesterdayViews,
    thisWeekViews,
    lastWeekViews,
    thisMonthViews,
    lastMonthViews,
    eventViewsThisMonth,
    todayChange: yesterdayViews > 0 ? ((todayViews - yesterdayViews) / yesterdayViews) * 100 : 0,
    weekChange: lastWeekViews > 0 ? ((thisWeekViews - lastWeekViews) / lastWeekViews) * 100 : 0,
    monthChange: lastMonthViews > 0 ? ((thisMonthViews - lastMonthViews) / lastMonthViews) * 100 : 0,
  };
}
