import api from './api';

export interface AnalyticsSummary {
  totalPosts: number;
  totalReach: number;
  totalEngagement: number;
  avgReach: number;
  avgEngagement: number;
  platforms: PlatformPerformance[];
  categories: CategoryPerformance[];
}

export interface PlatformPerformance {
  platform: string;
  totalPosts: number;
  totalReach: number;
  totalEngagement: number;
  avgReach: number;
  avgEngagement: number;
  engagementRate: number;
}

export interface CategoryPerformance {
  category: string;
  totalPosts: number;
  totalReach: number;
  totalEngagement: number;
  avgReach: number;
  avgEngagement: number;
  engagementRate: number;
}

export interface ContentAnalytics {
  id: string;
  ideaId: string;
  platform: string;
  category?: string | null;
  reach?: number | null;
  engagement?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  views?: number | null;
  clicks?: number | null;
  recordedAt: string;
  idea?: {
    id: string;
    title: string;
    platform: string;
  };
}

export interface CreateAnalyticsDto {
  ideaId: string;
  platform: string;
  category?: string;
  reach?: number;
  engagement?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
  clicks?: number;
}

export const analyticsApi = {
  getSummary: async (from?: string, to?: string): Promise<AnalyticsSummary> => {
    const params: any = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const { data } = await api.get<AnalyticsSummary>('/api/analytics/summary', { params });
    return data;
  },

  getAll: async (
    platform?: string,
    category?: string,
    from?: string,
    to?: string,
  ): Promise<ContentAnalytics[]> => {
    const params: any = {};
    if (platform) params.platform = platform;
    if (category) params.category = category;
    if (from) params.from = from;
    if (to) params.to = to;
    const { data } = await api.get<ContentAnalytics[]>('/api/analytics', { params });
    return data;
  },

  getIdeaAnalytics: async (ideaId: string): Promise<ContentAnalytics[]> => {
    const { data } = await api.get<ContentAnalytics[]>(`/api/analytics/ideas/${ideaId}`);
    return data;
  },

  getAllPlatformsPerformance: async (): Promise<PlatformPerformance[]> => {
    const { data } = await api.get<PlatformPerformance[]>('/api/analytics/platforms');
    return data;
  },

  getPlatformPerformance: async (platform: string): Promise<PlatformPerformance> => {
    const { data } = await api.get<PlatformPerformance>(`/api/analytics/platforms/${platform}`);
    return data;
  },

  getAllCategoriesPerformance: async (): Promise<CategoryPerformance[]> => {
    const { data } = await api.get<CategoryPerformance[]>('/api/analytics/categories');
    return data;
  },

  getCategoryPerformance: async (category: string): Promise<CategoryPerformance> => {
    const { data } = await api.get<CategoryPerformance>(`/api/analytics/categories/${category}`);
    return data;
  },

  predictReach: async (ideaId: string): Promise<{ reach: number; score: number; reasoning: string }> => {
    const { data } = await api.get(`/api/analytics/predictions/reach/${ideaId}`);
    return data;
  },

  predictEngagement: async (ideaId: string): Promise<{ engagement: number; score: number; reasoning: string }> => {
    const { data } = await api.get(`/api/analytics/predictions/engagement/${ideaId}`);
    return data;
  },

  create: async (dto: CreateAnalyticsDto): Promise<ContentAnalytics> => {
    const { data } = await api.post<ContentAnalytics>('/api/analytics', dto);
    return data;
  },

  update: async (id: string, dto: Partial<CreateAnalyticsDto>): Promise<ContentAnalytics> => {
    const { data } = await api.put<ContentAnalytics>(`/api/analytics/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/analytics/${id}`);
  },
};
