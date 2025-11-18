import api from './api';

export interface Idea {
  id: string;
  title: string;
  description?: string;
  script?: string;
  caption?: string;
  hashtags: string[];
  platform: string;
  niche: string;
  tone: string;
  duration?: number;
  scheduledAt?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'POSTED';
  viralScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateIdeasDto {
  niche: string;
  platform: string;
  tone: string;
  contentLength?: string;
  contentFrequency?: string;
}

export interface IdeaStats {
  total: number;
  saved: number;
  scheduled: number;
  todayGenerated: number;
}

export const ideasApi = {
  generate: async (dto: GenerateIdeasDto): Promise<Idea[]> => {
    const { data } = await api.post<Idea[]>('/api/ideas/generate', dto);
    return data;
  },

  getAll: async (status?: string): Promise<Idea[]> => {
    const params = status ? { status } : {};
    const { data } = await api.get<Idea[]>('/api/ideas', { params });
    return data;
  },

  getOne: async (id: string): Promise<Idea> => {
    const { data } = await api.get<Idea>(`/api/ideas/${id}`);
    return data;
  },

  create: async (idea: Partial<Idea>): Promise<Idea> => {
    const { data } = await api.post<Idea>('/api/ideas', idea);
    return data;
  },

  update: async (id: string, updates: Partial<Idea>): Promise<Idea> => {
    const { data } = await api.patch<Idea>(`/api/ideas/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/ideas/${id}`);
  },

  getStats: async (): Promise<IdeaStats> => {
    const { data } = await api.get<IdeaStats>('/api/ideas/stats');
    return data;
  },
};

