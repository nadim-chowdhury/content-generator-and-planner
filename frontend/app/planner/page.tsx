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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Lightbulb,
  Sparkles,
  X,
  Clock,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Content Planner</h1>
                <p className="text-muted-foreground mt-1">
                  Schedule and manage your content calendar
                </p>
              </div>
            </div>
            
            {/* Navigation Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateDate(-1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="default" size="sm" onClick={goToToday}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateDate(1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <span className="text-lg font-semibold ml-4">
                  {formatDateHeader()}
                </span>
              </div>
              
              <Tabs value={view} onValueChange={(v) => setView(v as ViewType)}>
                <TabsList>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="list">List</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-96 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Calendar View */}
              <div className="lg:col-span-3">
                <Card>
                  <CardContent className="p-6">
                    <CalendarView
                      events={events}
                      currentDate={currentDate}
                      onDateChange={setCurrentDate}
                      onEventClick={handleEventClick}
                      onEventDrag={handleEventDrag}
                      view={view}
                      onViewChange={setView}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Unscheduled Ideas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-primary" />
                      Unscheduled Ideas
                    </CardTitle>
                    <CardDescription>
                      {ideas.length} draft {ideas.length === 1 ? 'idea' : 'ideas'} available
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {ideas.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No draft ideas</p>
                      ) : (
                        ideas.map((idea) => (
                          <Card key={idea.id} className="p-3">
                            <h3 className="text-sm font-medium mb-2 line-clamp-2">{idea.title}</h3>
                            <div className="flex items-center gap-2 mb-2">
                              <PlatformBadge platform={idea.platform} size="sm" />
                              {idea.viralScore && (
                                <Badge variant="secondary" className="text-xs">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  {idea.viralScore}
                                </Badge>
                              )}
                            </div>
                            <Input
                              type="date"
                              defaultValue={new Date().toISOString().split('T')[0]}
                              className="text-xs mb-2"
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleSchedule(idea.id, e.target.value);
                                }
                              }}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs"
                              onClick={() => handleGetSuggestions(idea.id, new Date().toISOString().split('T')[0])}
                            >
                              <Sparkles className="w-3 h-3 mr-1" />
                              Get Suggestions
                            </Button>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Selected Event Details */}
                {selectedEvent && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                        Event Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h3 className="font-medium">{selectedEvent.title}</h3>
                        {selectedEvent.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedEvent.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <PlatformBadge platform={selectedEvent.platform} size="sm" />
                        <Badge variant={getStatusVariant(selectedEvent.status)}>
                          {selectedEvent.status}
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {new Date(selectedEvent.scheduledAt).toLocaleString()}
                        </div>
                        {selectedEvent.viralScore && (
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            Viral Score: {selectedEvent.viralScore}/100
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleGetSuggestions(selectedEvent.id, selectedEvent.scheduledAt.split('T')[0])}
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Suggestions
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleUnschedule(selectedEvent.id)}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Unschedule
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Status Legend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Status Legend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {['DRAFT', 'SCHEDULED', 'POSTED', 'ARCHIVED'].map((status) => (
                        <div key={status} className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full", getStatusDotColor(status))} />
                          <span className="text-sm">{status}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Automated Scheduling */}
                {selectedEvent && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">AI Posting Time Suggestions</CardTitle>
                    </CardHeader>
                    <CardContent>
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
                    </CardContent>
                  </Card>
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
          )}

          {/* Auto-Reschedule Suggestions Dialog */}
          <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Auto-Reschedule Suggestions</DialogTitle>
                <DialogDescription>
                  AI-powered suggestions for optimal posting times
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {suggestions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No suggestions available</p>
                  </div>
                ) : (
                  suggestions.map((suggestion, idx) => (
                    <Card key={idx} className="p-3 hover:bg-accent transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">
                            {new Date(suggestion.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {suggestion.reason} (Score: {suggestion.score})
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleUseSuggestion(suggestion.date)}
                        >
                          Use
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowSuggestions(false);
                  setSuggestingFor(null);
                }}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'SCHEDULED':
      return 'default';
    case 'POSTED':
      return 'secondary';
    case 'ARCHIVED':
      return 'outline';
    default:
      return 'secondary';
  }
}

function getStatusDotColor(status: string): string {
  switch (status) {
    case 'DRAFT':
      return 'bg-muted';
    case 'SCHEDULED':
      return 'bg-primary';
    case 'POSTED':
      return 'bg-green-500';
    case 'ARCHIVED':
      return 'bg-yellow-500';
    default:
      return 'bg-muted';
  }
}
