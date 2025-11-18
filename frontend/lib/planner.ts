import api from './api';
import { Idea } from './ideas';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  platform: string;
  scheduledAt: string;
  status: string;
  niche: string;
  tone: string;
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
};

