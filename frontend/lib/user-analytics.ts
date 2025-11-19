import api from "./api";

export interface DailyGenerationCount {
  date: string;
  count: number;
}

export interface ViralScoreProgression {
  date: string;
  avgScore: number;
  maxScore: number;
  minScore: number;
  count: number;
}

export interface UserAnalyticsSummary {
  totalIdeas: number;
  savedIdeas: number;
  scheduledPosts: number;
  postedContent: number;
  archivedIdeas: number;
  avgViralScore: number;
  maxViralScore: number;
  minViralScore: number;
  totalGenerations: number;
  dailyGenerations: DailyGenerationCount[];
  viralScoreProgression: ViralScoreProgression[];
}

export interface IdeasByStatus {
  draft: number;
  scheduled: number;
  posted: number;
  archived: number;
  total: number;
}

export interface IdeasByPlatform {
  platform: string;
  count: number;
}

export const userAnalyticsApi = {
  getSummary: async (days?: number): Promise<UserAnalyticsSummary> => {
    const params: any = {};
    if (days) params.days = days;
    const { data } = await api.get<UserAnalyticsSummary>(
      "/api/analytics/user/summary",
      { params }
    );
    return data;
  },

  getDailyGenerations: async (
    days?: number
  ): Promise<DailyGenerationCount[]> => {
    const params: any = {};
    if (days) params.days = days;
    const { data } = await api.get<DailyGenerationCount[]>(
      "/api/analytics/user/daily-generations",
      { params }
    );
    return data;
  },

  getSavedIdeasCount: async (): Promise<number> => {
    const { data } = await api.get<number>("/api/analytics/user/saved-ideas");
    return data;
  },

  getScheduledPostsCount: async (): Promise<number> => {
    const { data } = await api.get<number>(
      "/api/analytics/user/scheduled-posts"
    );
    return data;
  },

  getViralScoreProgression: async (
    days?: number
  ): Promise<ViralScoreProgression[]> => {
    const params: any = {};
    if (days) params.days = days;
    const { data } = await api.get<ViralScoreProgression[]>(
      "/api/analytics/user/viral-score-progression",
      { params }
    );
    return data;
  },

  getIdeasByStatus: async (): Promise<IdeasByStatus> => {
    const { data } = await api.get<IdeasByStatus>(
      "/api/analytics/user/ideas-by-status"
    );
    return data;
  },

  getIdeasByPlatform: async (): Promise<IdeasByPlatform[]> => {
    const { data } = await api.get<IdeasByPlatform[]>(
      "/api/analytics/user/ideas-by-platform"
    );
    return data;
  },
};


