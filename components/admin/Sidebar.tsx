'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  CheckSquare,
  MessageSquare,
  StickyNote,
  BarChart3,
  Settings,
  CalendarDays,
  FileInput,
  Globe,
  ChevronDown,
  ChevronRight,
  Building2,
  Quote,
  MapPin,
  Hotel,
  Handshake,
  HelpCircle,
  FileText,
  Image,
  Newspaper,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  user: {
    role: string;
  };
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  name: string;
  icon: React.ElementType;
  children: NavItem[];
}

export default function AdminSidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Website']);

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Events', href: '/admin/events', icon: Calendar },
    { name: 'Submissions', href: '/admin/submissions', icon: FileInput },
    { name: 'Calendar', href: '/admin/calendar', icon: CalendarDays },
    { name: 'Tasks', href: '/admin/tasks', icon: CheckSquare },
    { name: 'Contacts', href: '/admin/contacts', icon: MessageSquare },
    { name: 'Notes', href: '/admin/notes', icon: StickyNote },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  ];

  // Website content management group
  const websiteGroup: NavGroup = {
    name: 'Website',
    icon: Globe,
    children: [
      { name: 'Facilities', href: '/admin/website/facilities', icon: Building2 },
      { name: 'Testimonials', href: '/admin/website/testimonials', icon: Quote },
      { name: 'Attractions', href: '/admin/website/attractions', icon: MapPin },
      { name: 'Accommodations', href: '/admin/website/accommodations', icon: Hotel },
      { name: 'Partners', href: '/admin/website/partners', icon: Handshake },
      { name: 'FAQs', href: '/admin/website/faqs', icon: HelpCircle },
      { name: 'Resources', href: '/admin/website/resources', icon: FileText },
      { name: 'Media Library', href: '/admin/website/media', icon: Image },
      { name: 'News', href: '/admin/website/news', icon: Newspaper },
    ],
  };

  // Admin-only items
  const adminNavigation: NavItem[] = [];
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
    adminNavigation.push(
      { name: 'Users', href: '/admin/users', icon: Users },
      { name: 'Settings', href: '/admin/settings', icon: Settings }
    );
  }

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupName)
        ? prev.filter((g) => g !== groupName)
        : [...prev, groupName]
    );
  };

  const isGroupActive = (group: NavGroup) => {
    return group.children.some(
      (item) => pathname === item.href || pathname?.startsWith(item.href + '/')
    );
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
    const Icon = item.icon;

    return (
      <Link
        key={item.name}
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors',
          isActive
            ? 'bg-primary text-white'
            : 'text-gray-700 hover:bg-gray-100'
        )}
      >
        <Icon className="h-5 w-5" />
        {item.name}
      </Link>
    );
  };

  const renderNavGroup = (group: NavGroup) => {
    const isExpanded = expandedGroups.includes(group.name);
    const isActive = isGroupActive(group);
    const Icon = group.icon;

    return (
      <div key={group.name} className="space-y-1">
        <button
          onClick={() => toggleGroup(group.name)}
          className={cn(
            'flex items-center justify-between w-full px-4 py-3 rounded-lg font-medium transition-colors',
            isActive && !isExpanded
              ? 'bg-primary/10 text-primary'
              : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          <span className="flex items-center gap-3">
            <Icon className="h-5 w-5" />
            {group.name}
          </span>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        {isExpanded && (
          <div className="ml-4 space-y-1 border-l-2 border-gray-200 pl-2">
            {group.children.map((item) => {
              const isChildActive =
                pathname === item.href || pathname?.startsWith(item.href + '/');
              const ChildIcon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isChildActive
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <ChildIcon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <nav className="p-4 space-y-1">
        {navigation.map(renderNavItem)}

        {/* Website Content Group */}
        <div className="pt-4 mt-4 border-t border-gray-200">
          <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Content
          </p>
          {renderNavGroup(websiteGroup)}
        </div>

        {/* Admin-only section */}
        {adminNavigation.length > 0 && (
          <div className="pt-4 mt-4 border-t border-gray-200">
            <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Administration
            </p>
            {adminNavigation.map(renderNavItem)}
          </div>
        )}
      </nav>
    </aside>
  );
}
