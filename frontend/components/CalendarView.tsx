'use client';

import { useState } from 'react';
import { CalendarEvent } from '@/lib/planner';
import PlatformBadge from './PlatformBadge';

type ViewType = 'month' | 'week' | 'day' | 'list';

interface CalendarViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onEventDrag?: (eventId: string, newDate: string) => void;
  view: ViewType;
  onViewChange: (view: ViewType) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    case 'SCHEDULED':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'POSTED':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'ARCHIVED':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

const getFolderColor = (folder?: { color?: string; icon?: string; name: string }) => {
  if (folder?.color) {
    return folder.color;
  }
  return '#6366F1'; // Default indigo
};

export default function CalendarView({
  events,
  currentDate,
  onDateChange,
  onEventClick,
  onEventDrag,
  view,
  onViewChange,
}: CalendarViewProps) {
  const [draggedEvent, setDraggedEvent] = useState<string | null>(null);

  const handleDragStart = (eventId: string) => {
    setDraggedEvent(eventId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    if (draggedEvent && onEventDrag) {
      const dateStr = targetDate.toISOString().split('T')[0];
      onEventDrag(draggedEvent, dateStr);
    }
    setDraggedEvent(null);
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter((event) => event.scheduledAt.startsWith(dateStr));
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return (
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 py-2">
            {day}
          </div>
        ))}
        {days.map((date, idx) => {
          const dayEvents = date ? getEventsForDate(date) : [];
          const isToday = date && date.toDateString() === new Date().toDateString();
          
          return (
            <div
              key={idx}
              onDragOver={handleDragOver}
              onDrop={date ? (e) => handleDrop(e, date) : undefined}
              className={`min-h-32 p-2 border rounded ${
                date
                  ? isToday
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  : 'bg-gray-50 dark:bg-gray-900 border-transparent'
              }`}
            >
              {date && (
                <>
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        draggable
                        onDragStart={() => handleDragStart(event.id)}
                        onClick={() => onEventClick?.(event)}
                        className={`text-xs p-1 rounded truncate cursor-move hover:opacity-80 ${getStatusColor(event.status)}`}
                        style={{
                          backgroundColor: event.folder?.color ? `${event.folder.color}20` : undefined,
                          borderLeft: `3px solid ${getFolderColor(event.folder)}`,
                        }}
                        title={event.title}
                      >
                        <div className="flex items-center gap-1">
                          {event.folder?.icon && <span>{event.folder.icon}</span>}
                          <span className="truncate">{event.title}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <PlatformBadge platform={event.platform} size="sm" />
                          <span className={`text-xs px-1 rounded ${getStatusColor(event.status)}`}>
                            {event.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      weekDays.push(date);
    }

    return (
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((date) => {
          const dayEvents = getEventsForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          
          return (
            <div
              key={date.toISOString()}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, date)}
              className={`min-h-96 p-3 border rounded ${
                isToday
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className={`text-sm font-semibold mb-2 ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                {dayName}
              </div>
              <div className={`text-lg font-bold mb-3 ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                {date.getDate()}
              </div>
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    draggable
                    onDragStart={() => handleDragStart(event.id)}
                    onClick={() => onEventClick?.(event)}
                    className={`p-2 rounded cursor-move hover:opacity-80 ${getStatusColor(event.status)}`}
                    style={{
                      backgroundColor: event.folder?.color ? `${event.folder.color}20` : undefined,
                      borderLeft: `3px solid ${getFolderColor(event.folder)}`,
                    }}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      {event.folder?.icon && <span>{event.folder.icon}</span>}
                      <span className="font-medium text-sm truncate">{event.title}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <PlatformBadge platform={event.platform} size="sm" />
                      <span className={`text-xs px-1 rounded ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                      {event.viralScore && (
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Score: {event.viralScore}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {new Date(event.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const isToday = currentDate.toDateString() === new Date().toDateString();

    return (
      <div className="space-y-2">
        {hours.map((hour) => {
          const hourEvents = dayEvents.filter((event) => {
            const eventDate = new Date(event.scheduledAt);
            return eventDate.getHours() === hour;
          });

          return (
            <div
              key={hour}
              onDragOver={handleDragOver}
              onDrop={(e) => {
                const targetDate = new Date(currentDate);
                targetDate.setHours(hour, 0, 0, 0);
                handleDrop(e, targetDate);
              }}
              className="flex border-b border-gray-200 dark:border-gray-700 min-h-16"
            >
              <div className="w-20 text-sm text-gray-600 dark:text-gray-400 py-2">
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div className="flex-1 p-2">
                {hourEvents.map((event) => (
                  <div
                    key={event.id}
                    draggable
                    onDragStart={() => handleDragStart(event.id)}
                    onClick={() => onEventClick?.(event)}
                    className={`p-2 rounded mb-2 cursor-move hover:opacity-80 ${getStatusColor(event.status)}`}
                    style={{
                      backgroundColor: event.folder?.color ? `${event.folder.color}20` : undefined,
                      borderLeft: `3px solid ${getFolderColor(event.folder)}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {event.folder?.icon && <span>{event.folder.icon}</span>}
                      <span className="font-medium">{event.title}</span>
                      <PlatformBadge platform={event.platform} size="sm" />
                      <span className={`text-xs px-1 rounded ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </div>
                    {event.description && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {event.description.substring(0, 100)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderListView = () => {
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );

    return (
      <div className="space-y-2">
        {sortedEvents.map((event) => {
          const eventDate = new Date(event.scheduledAt);
          const isPast = eventDate < new Date();
          
          return (
            <div
              key={event.id}
              onClick={() => onEventClick?.(event)}
              className={`p-4 border rounded cursor-pointer hover:shadow-md transition-shadow ${
                isPast
                  ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {event.folder?.icon && <span>{event.folder.icon}</span>}
                    <h3 className="font-semibold text-gray-900 dark:text-white">{event.title}</h3>
                    <PlatformBadge platform={event.platform} size="sm" />
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(event.status)}`}>
                      {event.status}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {event.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>{eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <span>{eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    {event.viralScore && (
                      <span>Viral Score: {event.viralScore}/100</span>
                    )}
                  </div>
                </div>
                <div
                  className="w-1 h-full rounded"
                  style={{ backgroundColor: getFolderColor(event.folder) }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* View Selector */}
      <div className="flex gap-2">
        {(['month', 'week', 'day', 'list'] as ViewType[]).map((v) => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              view === v
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* Calendar Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
        {view === 'list' && renderListView()}
      </div>
    </div>
  );
}

