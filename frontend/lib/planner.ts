import api from './api';
import { Idea } from './ideas';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  platform: string;
  scheduledAt: string;
  status: 'DRAFT' | 'SCHEDULED' | 'POSTED' | 'ARCHIVED';
  niche: string;
  tone: string;
  viralScore?: number;
  folderId?: string;
  folder?: {
    id: string;
    name: string;
    color?: string;
    icon?: string;
  };
}

export interface PostingTimeSuggestion {
  date: string;
  time: string;
  dayOfWeek: string;
  score: number;
  reason: string;
  expectedEngagement: string;
}

export interface CalendarAutofillResult {
  scheduled: number;
  skipped: number;
  suggestions: Array<{
    ideaId: string;
    title: string;
    scheduledAt: string;
    reason: string;
  }>;
}

export const plannerApi = {
  schedule: async (ideaId: string, scheduledAt: string): Promise<Idea> => {
    const { data } = await api.post<Idea>(`/api/planner/ideas/${ideaId}/schedule`, {
      scheduledAt,
    });
    return data;
  },

  unschedule: async (ideaId: string): Promise<Idea> => {
    const { data } = await api.delete<Idea>(`/api/planner/ideas/${ideaId}/schedule`);
    return data;
  },

  getCalendar: async (from?: string, to?: string): Promise<CalendarEvent[]> => {
    const params: any = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const { data } = await api.get<CalendarEvent[]>('/api/planner/calendar', { params });
    return data;
  },

  getUpcoming: async (limit: number = 10): Promise<CalendarEvent[]> => {
    const { data } = await api.get<CalendarEvent[]>('/api/planner/upcoming', {
      params: { limit },
    });
    return data;
  },

  reschedule: async (ideaId: string, scheduledAt: string): Promise<Idea> => {
    const { data } = await api.post<Idea>(`/api/planner/ideas/${ideaId}/reschedule`, {
      scheduledAt,
    });
    return data;
  },

  getAutoRescheduleSuggestions: async (
    ideaId: string,
    preferredDate: string,
    lookAheadDays?: number,
  ): Promise<{
    suggestions: Array<{ date: string; reason: string; score: number }>;
    preferredDate: string;
    conflicts: number;
  }> => {
    const params: any = { preferredDate };
    if (lookAheadDays) params.lookAheadDays = lookAheadDays;
    const { data } = await api.get(`/api/planner/ideas/${ideaId}/suggestions`, { params });
    return data;
  },

  bulkReschedule: async (ideaIds: string[], scheduledAt: string): Promise<{ message: string }> => {
    const { data } = await api.post('/api/planner/bulk-reschedule', {
      ideaIds,
      scheduledAt,
    });
    return data;
  },

  getOptimalPostingTimes: async (
    platform: string,
    niche: string,
    timezone?: string,
    daysAhead?: number,
  ): Promise<PostingTimeSuggestion[]> => {
    const params: any = { platform, niche };
    if (timezone) params.timezone = timezone;
    if (daysAhead) params.daysAhead = daysAhead;
    const { data } = await api.get<PostingTimeSuggestion[]>('/api/planner/posting-times', { params });
    return data;
  },

  getBestTimeForIdea: async (
    ideaId: string,
    timezone?: string,
  ): Promise<PostingTimeSuggestion | null> => {
    const params: any = {};
    if (timezone) params.timezone = timezone;
    const { data } = await api.get<PostingTimeSuggestion>(`/api/planner/posting-times/${ideaId}`, { params });
    return data;
  },

  autofillCalendar: async (
    month: number,
    year: number,
    options?: {
      minViralScore?: number;
      platforms?: string[];
      maxPostsPerDay?: number;
      timezone?: string;
    },
  ): Promise<CalendarAutofillResult> => {
    const { data } = await api.post<CalendarAutofillResult>('/api/planner/autofill', {
      month,
      year,
      ...options,
    });
    return data;
  },

  previewAutofill: async (
    month: number,
    year: number,
    options?: {
      minViralScore?: number;
      platforms?: string[];
      maxPostsPerDay?: number;
      timezone?: string;
    },
  ): Promise<CalendarAutofillResult['suggestions']> => {
    const { data } = await api.post('/api/planner/autofill/preview', {
      month,
      year,
      ...options,
    });
    return data;
  },
};
