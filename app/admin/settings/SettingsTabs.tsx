'use client';

import Link from 'next/link';
import { Settings, Layout, Mail, Shield, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import SettingsForm from './SettingsForm';
import HomepageSettings from './HomepageSettings';
import EmailSettings from './EmailSettings';
import SecuritySettings from './SecuritySettings';
import StorageSettings from './StorageSettings';

interface SettingsTabsProps {
  settings: Record<string, string>;
  activeTab: string;
  userRole: string;
}

interface Tab {
  id: string;
  label: string;
  icon: typeof Settings;
  superAdminOnly?: boolean;
}

const tabs: Tab[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'homepage', label: 'Homepage', icon: Layout },
  { id: 'email', label: 'Email', icon: Mail, superAdminOnly: true },
  { id: 'storage', label: 'Storage', icon: HardDrive, superAdminOnly: true },
  { id: 'security', label: 'Security', icon: Shield, superAdminOnly: true },
];

export default function SettingsTabs({ settings, activeTab, userRole }: SettingsTabsProps) {
  // Filter tabs based on user role
  const visibleTabs = tabs.filter(
    (tab) => !tab.superAdminOnly || userRole === 'SUPER_ADMIN'
  );

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={`/admin/settings?tab=${tab.id}`}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && <SettingsForm settings={settings} />}
      {activeTab === 'homepage' && <HomepageSettings settings={settings} />}
      {activeTab === 'email' && userRole === 'SUPER_ADMIN' && <EmailSettings />}
      {activeTab === 'storage' && userRole === 'SUPER_ADMIN' && <StorageSettings />}
      {activeTab === 'security' && userRole === 'SUPER_ADMIN' && <SecuritySettings settings={settings} />}
    </div>
  );
}
