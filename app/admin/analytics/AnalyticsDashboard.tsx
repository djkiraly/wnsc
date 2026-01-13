'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Users,
  Calendar,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsSummary {
  todayViews: number;
  yesterdayViews: number;
  thisWeekViews: number;
  lastWeekViews: number;
  thisMonthViews: number;
  lastMonthViews: number;
  eventViewsThisMonth: number;
  todayChange: number;
  weekChange: number;
  monthChange: number;
}

interface AnalyticsData {
  totalPageViews: number;
  uniqueVisitors: number;
  pageViews: { page: string; _count: { id: number } }[];
  eventViews: {
    eventId: string;
    _count: { id: number };
    event?: { id: string; title: string; slug: string };
  }[];
  deviceStats: { deviceType: string | null; _count: { id: number } }[];
  browserStats: { browser: string | null; _count: { id: number } }[];
  dailyViews: { date: string; views: number }[];
  referrerStats: { referrer: string | null; _count: { id: number } }[];
}

interface AnalyticsDashboardProps {
  analyticsData: AnalyticsData;
  summary: AnalyticsSummary;
}

const COLORS = ['#1E40AF', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];
const DEVICE_COLORS = {
  desktop: '#1E40AF',
  mobile: '#10B981',
  tablet: '#F59E0B',
  unknown: '#6B7280',
};

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  subtitle,
}: {
  title: string;
  value: number;
  change?: number;
  icon: React.ElementType;
  subtitle?: string;
}) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {value.toLocaleString()}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="p-3 bg-primary-50 rounded-lg">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
      {change !== undefined && (
        <div className="mt-4 flex items-center gap-1">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span
            className={cn(
              'text-sm font-medium',
              isPositive ? 'text-green-600' : 'text-red-600'
            )}
          >
            {isPositive ? '+' : ''}
            {change.toFixed(1)}%
          </span>
          <span className="text-sm text-gray-500">vs previous period</span>
        </div>
      )}
    </div>
  );
}

function DeviceIcon({ type }: { type: string }) {
  switch (type.toLowerCase()) {
    case 'desktop':
      return <Monitor className="h-4 w-4" />;
    case 'mobile':
      return <Smartphone className="h-4 w-4" />;
    case 'tablet':
      return <Tablet className="h-4 w-4" />;
    default:
      return <Globe className="h-4 w-4" />;
  }
}

export default function AnalyticsDashboard({
  analyticsData,
  summary,
}: AnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState('30');

  // Prepare device data for pie chart
  const deviceData = analyticsData.deviceStats
    .filter((d) => d.deviceType)
    .map((d) => ({
      name: d.deviceType || 'Unknown',
      value: d._count.id,
      color: DEVICE_COLORS[d.deviceType as keyof typeof DEVICE_COLORS] || DEVICE_COLORS.unknown,
    }));

  // Prepare browser data for bar chart
  const browserData = analyticsData.browserStats
    .filter((b) => b.browser)
    .map((b) => ({
      name: b.browser || 'Unknown',
      visits: b._count.id,
    }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 5);

  // Prepare page views data
  const pageViewsData = analyticsData.pageViews.map((p) => ({
    name: p.page,
    views: p._count.id,
  }));

  // Total for device percentage calculation
  const totalDeviceViews = deviceData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Views"
          value={summary.todayViews}
          change={summary.todayChange}
          icon={Eye}
          subtitle="Page views today"
        />
        <StatCard
          title="This Week"
          value={summary.thisWeekViews}
          change={summary.weekChange}
          icon={Calendar}
          subtitle="Last 7 days"
        />
        <StatCard
          title="This Month"
          value={summary.thisMonthViews}
          change={summary.monthChange}
          icon={TrendingUp}
          subtitle="Last 30 days"
        />
        <StatCard
          title="Event Views"
          value={summary.eventViewsThisMonth}
          icon={Users}
          subtitle="Event page views this month"
        />
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">Total Page Views</h3>
            <span className="text-2xl font-bold text-primary">
              {analyticsData.totalPageViews.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-gray-500">Last 30 days</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">Unique Visitors</h3>
            <span className="text-2xl font-bold text-secondary">
              {analyticsData.uniqueVisitors.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-gray-500">Last 30 days</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Views Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Daily Page Views
          </h3>
          {analyticsData.dailyViews.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.dailyViews}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    });
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#1E40AF"
                  strokeWidth={2}
                  dot={{ fill: '#1E40AF', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No data available for this period
            </div>
          )}
        </div>

        {/* Device Distribution */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Device Distribution
          </h3>
          {deviceData.length > 0 ? (
            <div className="flex items-center">
              <ResponsiveContainer width="50%" height={250}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [
                      `${value.toLocaleString()} visits`,
                      'Visits',
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {deviceData.map((device) => (
                  <div
                    key={device.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: device.color }}
                      />
                      <DeviceIcon type={device.name} />
                      <span className="text-sm capitalize">{device.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium">
                        {device.value.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">
                        ({totalDeviceViews > 0
                          ? ((device.value / totalDeviceViews) * 100).toFixed(1)
                          : 0}
                        %)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Pages
          </h3>
          {pageViewsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pageViewsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="views" fill="#1E40AF" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No page view data available
            </div>
          )}
        </div>

        {/* Browser Distribution */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Browser Distribution
          </h3>
          {browserData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={browserData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="visits" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No browser data available
            </div>
          )}
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Events */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">
              Top Viewed Events
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Event
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Views
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analyticsData.eventViews.length > 0 ? (
                  analyticsData.eventViews.map((ev) => (
                    <tr key={ev.eventId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {ev.event ? (
                          <Link
                            href={`/admin/events/${ev.event.id}/edit`}
                            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                          >
                            {ev.event.title}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : (
                          <span className="text-sm text-gray-500">
                            Unknown Event
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium">
                          {ev._count.id.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No event views recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Referrers */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">
              Top Referrers
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Source
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Visits
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analyticsData.referrerStats.length > 0 ? (
                  analyticsData.referrerStats.map((ref, index) => {
                    let displayName = 'Direct';
                    if (ref.referrer) {
                      try {
                        const url = new URL(ref.referrer);
                        displayName = url.hostname;
                      } catch {
                        displayName = ref.referrer.slice(0, 30);
                      }
                    }
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="text-sm">{displayName}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-medium">
                            {ref._count.id.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No referrer data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
