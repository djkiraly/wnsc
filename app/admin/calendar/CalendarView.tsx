'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Clock,
  Plus,
  List,
  Grid3X3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  slug: string;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
  published: boolean;
  category: string;
}

interface CalendarViewProps {
  events: Event[];
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 border-gray-300',
  PUBLISHED: 'bg-green-100 text-green-800 border-green-300',
  CANCELLED: 'bg-red-100 text-red-800 border-red-300',
  COMPLETED: 'bg-blue-100 text-blue-800 border-blue-300',
};

const statusDotColors: Record<string, string> = {
  DRAFT: 'bg-gray-400',
  PUBLISHED: 'bg-green-500',
  CANCELLED: 'bg-red-500',
  COMPLETED: 'bg-blue-500',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CalendarView({ events }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (statusFilter !== 'all' && event.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [events, statusFilter]);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      eventStart.setHours(0, 0, 0, 0);
      eventEnd.setHours(23, 59, 59, 999);
      return checkDate >= eventStart && checkDate <= eventEnd;
    });
  };

  // Get events for current month (list view)
  const monthEvents = useMemo(() => {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

    return filteredEvents.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return eventStart <= endOfMonth && eventEnd >= startOfMonth;
    }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [filteredEvents, year, month]);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const days = [];

    // Previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(year, month - 1, day);
      days.push({ date, isCurrentMonth: false, day });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ date, isCurrentMonth: true, day });
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({ date, isCurrentMonth: false, day });
    }

    return days;
  }, [year, month, firstDayOfMonth, daysInMonth, daysInPrevMonth]);

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const sameDay = startDate.toDateString() === endDate.toDateString();

    if (sameDay) {
      return `${startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} ${formatTime(start)} - ${formatTime(end)}`;
    }
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  // Count events by status
  const statusCounts = useMemo(() => {
    return events.reduce(
      (acc, event) => {
        acc[event.status] = (acc[event.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [events]);

  return (
    <div className="space-y-6">
      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={cn(
            'card p-4 text-center transition-all',
            statusFilter === 'all' ? 'ring-2 ring-primary' : ''
          )}
        >
          <div className="text-2xl font-bold text-gray-900">{events.length}</div>
          <div className="text-sm text-gray-500">All Events</div>
        </button>
        {(['PUBLISHED', 'DRAFT', 'CANCELLED', 'COMPLETED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              'card p-4 text-center transition-all',
              statusFilter === status ? 'ring-2 ring-primary' : ''
            )}
          >
            <div className="text-2xl font-bold text-gray-900">
              {statusCounts[status] || 0}
            </div>
            <div className="text-sm text-gray-500 capitalize">
              {status.toLowerCase().replace('_', ' ')}
            </div>
          </button>
        ))}
      </div>

      {/* Calendar Controls */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-semibold min-w-[200px] text-center">
                {MONTHS[month]} {year}
              </h2>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={goToToday}
              className="btn btn-secondary text-sm"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('calendar')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'calendar'
                    ? 'bg-primary text-white'
                    : 'bg-white hover:bg-gray-50'
                )}
              >
                <Grid3X3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'list'
                    ? 'bg-primary text-white'
                    : 'bg-white hover:bg-gray-50'
                )}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
            <Link href="/admin/events/new" className="btn btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Link>
          </div>
        </div>

        {viewMode === 'calendar' ? (
          <div className="p-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-t-lg overflow-hidden">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="bg-gray-50 py-2 text-center text-sm font-medium text-gray-700"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {calendarDays.map(({ date, isCurrentMonth, day }, index) => {
                const dayEvents = getEventsForDate(date);
                const today = isToday(date);

                return (
                  <div
                    key={index}
                    className={cn(
                      'min-h-[120px] bg-white p-2',
                      !isCurrentMonth && 'bg-gray-50'
                    )}
                  >
                    <div
                      className={cn(
                        'text-sm font-medium mb-1',
                        !isCurrentMonth && 'text-gray-400',
                        today &&
                          'bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center'
                      )}
                    >
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <Link
                          key={event.id}
                          href={`/admin/events/${event.id}/edit`}
                          className={cn(
                            'block text-xs p-1 rounded truncate border-l-2',
                            statusColors[event.status]
                          )}
                          title={event.title}
                        >
                          {event.title}
                        </Link>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 pl-1">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {monthEvents.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No events this month</p>
              </div>
            ) : (
              monthEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/admin/events/${event.id}/edit`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            'w-2 h-2 rounded-full',
                            statusDotColors[event.status]
                          )}
                        />
                        <h3 className="font-medium text-gray-900 truncate">
                          {event.title}
                        </h3>
                        <span
                          className={cn(
                            'badge text-xs',
                            statusColors[event.status]
                          )}
                        >
                          {event.status.toLowerCase().replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDateRange(event.startDate, event.endDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </span>
                      </div>
                    </div>
                    <span className="badge badge-gray text-xs">
                      {event.category}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <span className="text-gray-500">Status:</span>
        {Object.entries(statusDotColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2">
            <span className={cn('w-3 h-3 rounded-full', color)} />
            <span className="text-gray-600 capitalize">
              {status.toLowerCase().replace('_', ' ')}
            </span>
          </div>
        ))}
      </div>

      {/* All Events List */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">All Events</h2>
          <p className="text-sm text-gray-500 mt-1">
            {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
            {statusFilter !== 'all' && ` with status "${statusFilter.toLowerCase().replace('_', ' ')}"`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    No events found
                  </td>
                </tr>
              ) : (
                filteredEvents
                  .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                  .map((event) => {
                    const startDate = new Date(event.startDate);
                    const endDate = new Date(event.endDate);
                    const isPast = endDate < new Date();

                    return (
                      <tr
                        key={event.id}
                        className={cn(
                          'hover:bg-gray-50 transition-colors',
                          isPast && 'opacity-60'
                        )}
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/events/${event.id}/edit`}
                            className="font-medium text-gray-900 hover:text-primary"
                          >
                            {event.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div>{startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                          <div className="text-xs text-gray-400">{formatTime(event.startDate)}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div>{endDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                          <div className="text-xs text-gray-400">{formatTime(event.endDate)}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            {event.location}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="badge badge-gray text-xs">
                            {event.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium',
                              statusColors[event.status]
                            )}
                          >
                            <span className={cn('w-1.5 h-1.5 rounded-full', statusDotColors[event.status])} />
                            {event.status.toLowerCase().replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
