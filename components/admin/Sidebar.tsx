'use client';

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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  user: {
    role: string;
  };
}

export default function AdminSidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Events', href: '/admin/events', icon: Calendar },
    { name: 'Submissions', href: '/admin/submissions', icon: FileInput },
    { name: 'Calendar', href: '/admin/calendar', icon: CalendarDays },
    { name: 'Tasks', href: '/admin/tasks', icon: CheckSquare },
    { name: 'Contacts', href: '/admin/contacts', icon: MessageSquare },
    { name: 'Notes', href: '/admin/notes', icon: StickyNote },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  ];

  // Only show Users and Settings to admins
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
    navigation.push(
      { name: 'Users', href: '/admin/users', icon: Users },
      { name: 'Settings', href: '/admin/settings', icon: Settings }
    );
  }

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <nav className="p-4 space-y-1">
        {navigation.map((item) => {
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
        })}
      </nav>
    </aside>
  );
}
