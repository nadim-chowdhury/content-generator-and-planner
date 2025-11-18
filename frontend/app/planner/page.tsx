'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { ideasApi, Idea } from '@/lib/ideas';
import { plannerApi, CalendarEvent } from '@/lib/planner';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import CalendarView from '@/components/CalendarView';
import PlatformBadge from '@/components/PlatformBadge';
import AutomatedScheduling from '@/components/AutomatedScheduling';
import CalendarAutofill from '@/components/CalendarAutofill';

type ViewType = 'month' | 'week' | 'day' | 'list';

export default function PlannerPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ date: string; reason: string; score: number }>>([]);
  const [suggestingFor, setSuggestingFor] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [currentDate, view]);

  const loadData = async () => {
    try {
      setLoading(true);
      const from = new Date(currentDate);
      const to = new Date(currentDate);

      if (view === 'month') {
        from.setDate(1);
        to.setMonth(to.getMonth() + 1);
        to.setDate(0);
      } else if (view === 'week') {
        const day = from.getDay();
        from.setDate(from.getDate() - day);
        to.setDate(from.getDate() + 6);
      } else if (view === 'day') {
        to.setDate(to.getDate() + 1);
      } else {
        // List view - get next 30 days
        to.setDate(to.getDate() + 30);
      }

      const [eventsData, ideasData] = await Promise.all([
        plannerApi.getCalendar(from.toISOString().split('T')[0], to.toISOString().split('T')[0]),
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
      setSelectedEvent(null);
    } catch (err) {
      alert('Failed to unschedule idea');
    }
  };

  const handleEventDrag = async (eventId: string, newDate: string) => {
    try {
      await plannerApi.reschedule(eventId, newDate);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reschedule idea');
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleGetSuggestions = async (ideaId: string, preferredDate: string) => {
    try {
      const data = await plannerApi.getAutoRescheduleSuggestions(ideaId, preferredDate, 7);
      setSuggestions(data.suggestions);
      setSuggestingFor(ideaId);
      setShowSuggestions(true);
    } catch (err) {
      alert('Failed to get suggestions');
    }
  };

  const handleUseSuggestion = async (date: string) => {
    if (!suggestingFor) return;
    try {
      await plannerApi.reschedule(suggestingFor, date);
      await loadData();
      setShowSuggestions(false);
      setSuggestingFor(null);
      alert('Idea rescheduled!');
    } catch (err) {
      alert('Failed to reschedule idea');
    }
  };

  const navigateDate = (direction: number) => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else if (view === 'day') {
      newDate.setDate(newDate.getDate() + direction);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateHeader = () => {
    if (view === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (view === 'week') {
      const startOfWeek = new Date(currentDate);
      const day = startOfWeek.getDay();
      startOfWeek.setDate(startOfWeek.getDate() - day);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (view === 'day') {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    return 'All Scheduled Ideas';
  };

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
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Content Planner</h1>
              
              {/* Navigation Controls */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigateDate(-1)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={goToToday}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => navigateDate(1)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Next →
                  </button>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatDateHeader()}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Calendar View */}
              <div className="lg:col-span-3">
                <CalendarView
                  events={events}
                  currentDate={currentDate}
                  onDateChange={setCurrentDate}
                  onEventClick={handleEventClick}
                  onEventDrag={handleEventDrag}
                  view={view}
                  onViewChange={setView}
                />
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Unscheduled Ideas */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
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
                          <div className="flex items-center gap-2 mb-2">
                            <PlatformBadge platform={idea.platform} size="sm" />
                            {idea.viralScore && (
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                Score: {idea.viralScore}
                              </span>
                            )}
                          </div>
                          <input
                            type="date"
                            defaultValue={new Date().toISOString().split('T')[0]}
                            className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-700 rounded mb-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            onChange={(e) => {
                              if (e.target.value) {
                                handleSchedule(idea.id, e.target.value);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleGetSuggestions(idea.id, new Date().toISOString().split('T')[0])}
                            className="w-full text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 mb-1"
                          >
                            Get Suggestions
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Selected Event Details */}
                {selectedEvent && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Event Details
                    </h2>
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{selectedEvent.title}</h3>
                        {selectedEvent.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {selectedEvent.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <PlatformBadge platform={selectedEvent.platform} size="sm" />
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(selectedEvent.status)}`}>
                          {selectedEvent.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div>Scheduled: {new Date(selectedEvent.scheduledAt).toLocaleString()}</div>
                        {selectedEvent.viralScore && (
                          <div>Viral Score: {selectedEvent.viralScore}/100</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleGetSuggestions(selectedEvent.id, selectedEvent.scheduledAt.split('T')[0])}
                          className="flex-1 text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                        >
                          Get Suggestions
                        </button>
                        <button
                          onClick={() => handleUnschedule(selectedEvent.id)}
                          className="flex-1 text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                        >
                          Unschedule
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Legend */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Status Legend
                  </h2>
                  <div className="space-y-2">
                    {['DRAFT', 'SCHEDULED', 'POSTED', 'ARCHIVED'].map((status) => (
                      <div key={status} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${getStatusColor(status)}`} />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Automated Scheduling */}
                {selectedEvent && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      AI Posting Time Suggestions
                    </h2>
                    <AutomatedScheduling
                      platform={selectedEvent.platform}
                      niche={selectedEvent.niche}
                      ideaId={selectedEvent.id}
                      onTimeSelected={async (suggestion) => {
                        const dateTime = `${suggestion.date}T${suggestion.time}:00`;
                        await handleEventDrag(selectedEvent.id, dateTime);
                        await loadData();
                      }}
                    />
                  </div>
                )}

                {/* Calendar Autofill */}
                <CalendarAutofill
                  currentMonth={currentDate.getMonth()}
                  currentYear={currentDate.getFullYear()}
                  onAutofillComplete={async () => {
                    await loadData();
                  }}
                />
              </div>
            </div>

            {/* Auto-Reschedule Suggestions Modal */}
            {showSuggestions && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Auto-Reschedule Suggestions
                  </h2>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {suggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        className="p-3 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {new Date(suggestion.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {suggestion.reason} (Score: {suggestion.score})
                            </div>
                          </div>
                          <button
                            onClick={() => handleUseSuggestion(suggestion.date)}
                            className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                          >
                            Use
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setShowSuggestions(false);
                      setSuggestingFor(null);
                    }}
                    className="mt-4 w-full px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

function getStatusColor(status: string) {
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
}
