import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import SettingsTabs from './SettingsTabs';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    redirect('/admin/dashboard');
  }

  const params = await searchParams;
  const activeTab = params.tab || 'general';

  // Redirect non-Super Admins away from email tab
  if (activeTab === 'email' && user.role !== 'SUPER_ADMIN') {
    redirect('/admin/settings?tab=general');
  }

  const settings = await prisma.setting.findMany();
  const settingsMap = settings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage site configuration</p>
      </div>

      <SettingsTabs settings={settingsMap} activeTab={activeTab} userRole={user.role} />
    </div>
  );
}
