import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getAnalyticsData, getAnalyticsSummary } from '@/lib/analytics';
import AnalyticsDashboard from './AnalyticsDashboard';

export default async function AnalyticsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Get date range for last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const [analyticsData, summary] = await Promise.all([
    getAnalyticsData(startDate, endDate),
    getAnalyticsSummary(),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Track website traffic and visitor engagement</p>
      </div>

      <AnalyticsDashboard
        analyticsData={analyticsData}
        summary={summary}
      />
    </div>
  );
}
