'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { ideasApi, Idea } from '@/lib/ideas';
import { plannerApi, CalendarEvent } from '@/lib/planner';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function PlannerPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const loadData = async () => {
    try {
      const [eventsData, ideasData] = await Promise.all([
        plannerApi.getCalendar(),
        ideasApi.getAll('DRAFT'),
      ]);
      setEvents(eventsData);
      setIdeas(ideasData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (ideaId: string, date: string) => {
    try {
      await plannerApi.schedule(ideaId, date);
      await loadData();
      alert('Idea scheduled!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to schedule idea');
    }
  };

  const handleUnschedule = async (ideaId: string) => {
    try {
      await plannerApi.unschedule(ideaId);
      await loadData();
    } catch (err) {
      alert('Failed to unschedule idea');
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getEventsForDate = (date: Date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return events.filter((event) => event.scheduledAt.startsWith(dateStr));
  };

  const navigateMonth = (direction: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <ProtectedRoute>
      {loading ? (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600 dark:text-gray-400">Loading...</div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Content Planner</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => navigateMonth(-1)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                ← Prev
              </button>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h2>
              <button
                onClick={() => navigateMonth(1)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Next →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 py-2">
                  {day}
                </div>
              ))}
              {days.map((date, idx) => {
                const dayEvents = date ? getEventsForDate(date) : [];
                return (
                  <div
                    key={idx}
                    className={`min-h-24 p-2 border border-gray-200 dark:border-gray-700 rounded ${
                      date ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'
                    }`}
                  >
                    {date && (
                      <>
                        <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                          {date.getDate()}
                        </div>
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 p-1 rounded mb-1 truncate"
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Unscheduled Ideas */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Unscheduled Ideas
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {ideas.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No draft ideas</p>
              ) : (
                ideas.map((idea) => (
                  <div
                    key={idea.id}
                    className="border border-gray-200 dark:border-gray-700 p-3 rounded"
                  >
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {idea.title}
                    </h3>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-700 rounded mb-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={() => handleSchedule(idea.id, selectedDate)}
                      className="w-full text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                    >
                      Schedule
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Scheduled Events List */}
        {events.length > 0 && (
          <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Scheduled Events
            </h2>
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded"
                >
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{event.title}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(event.scheduledAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnschedule(event.id)}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-700"
                  >
                    Unschedule
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
      )}
    </ProtectedRoute>
  );
}

