import api from './api';

export interface ContentAnalytics {
  id: string;
  userId: string;
  ideaId?: string;
  platform: string;
  category?: string;
  niche?: string;
  reach?: number;
  impressions?: number;
  engagement?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
  clicks?: number;
  saves?: number;
  predictedReach?: number;
  predictedEngagement?: number;
  reachPotential?: number;
  engagementScore?: number;
  platformScore?: number;
  categoryScore?: number;
  postedAt?: string;
  recordedAt: string;
  source: 'MANUAL' | 'API' | 'PREDICTED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  idea?: {
    id: string;
    title: string;
    platform: string;
  };
}

export interface PlatformPerformance {
  platform: string;
  totalPosts: number;
  avgReach: number;
  avgEngagement: number;
  totalEngagement: number;
  avgEngagementRate: number;
  score: number;
}

export interface CategoryPerformance {
  category: string;
  totalPosts: number;
  avgReach: number;
  avgEngagement: number;
  totalEngagement: number;
  avgEngagementRate: number;
  score: number;
}

export interface AnalyticsSummary {
  totalPosts: number;
  totalReach: number;
  totalEngagement: number;
  avgReach: number;
  avgEngagement: number;
  platforms: PlatformPerformance[];
  categories: CategoryPerformance[];
}

export interface PredictionResult {
  reach?: number;
  engagement?: number;
  score: number;
  reasoning: string;
}

export interface CreateAnalyticsDto {
  ideaId?: string;
  platform: string;
  category?: string;
  niche?: string;
  reach?: number;
  impressions?: number;
  engagement?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
  clicks?: number;
  saves?: number;
  postedAt?: string;
  source?: 'MANUAL' | 'API' | 'PREDICTED';
  notes?: string;
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

  predictReach: async (ideaId: string): Promise<PredictionResult> => {
    const { data } = await api.get<PredictionResult>(`/api/analytics/predictions/reach/${ideaId}`);
    return data;
  },

  predictEngagement: async (ideaId: string): Promise<PredictionResult> => {
    const { data } = await api.get<PredictionResult>(`/api/analytics/predictions/engagement/${ideaId}`);
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


