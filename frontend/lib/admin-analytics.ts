import api from './api';

export interface DailySignups {
  date: string;
  count: number;
}

export interface TopNiche {
  niche: string;
  count: number;
  percentage: number;
}

export interface BusinessAnalyticsSummary {
  activeUsers: number;
  totalUsers: number;
  mrr: number;
  arr: number;
  dailySignups: DailySignups[];
  churnRate: number;
  conversionRate: number;
  topNiches: TopNiche[];
  planDistribution: {
    free: number;
    pro: number;
    agency: number;
  };
  recentChurns: number;
  recentConversions: number;
}

export const adminAnalyticsApi = {
  getBusinessAnalytics: async (days?: number): Promise<BusinessAnalyticsSummary> => {
    const params: any = {};
    if (days) params.days = days;
    const { data } = await api.get<BusinessAnalyticsSummary>('/api/admin/analytics/business', { params });
    return data;
  },

  getActiveUsers: async (days?: number): Promise<number> => {
    const params: any = {};
    if (days) params.days = days;
    const { data } = await api.get<number>('/api/admin/analytics/active-users', { params });
    return data;
  },

  getMRR: async (): Promise<number> => {
    const { data } = await api.get<number>('/api/admin/analytics/mrr');
    return data;
  },

  getARR: async (): Promise<number> => {
    const { data } = await api.get<number>('/api/admin/analytics/arr');
    return data;
  },

  getDailySignups: async (days?: number): Promise<DailySignups[]> => {
    const params: any = {};
    if (days) params.days = days;
    const { data } = await api.get<DailySignups[]>('/api/admin/analytics/daily-signups', { params });
    return data;
  },

  getChurnRate: async (days?: number): Promise<number> => {
    const params: any = {};
    if (days) params.days = days;
    const { data } = await api.get<number>('/api/admin/analytics/churn-rate', { params });
    return data;
  },

  getConversionRate: async (days?: number): Promise<number> => {
    const params: any = {};
    if (days) params.days = days;
    const { data } = await api.get<number>('/api/admin/analytics/conversion-rate', { params });
    return data;
  },

  getTopNiches: async (limit?: number): Promise<TopNiche[]> => {
    const params: any = {};
    if (limit) params.limit = limit;
    const { data } = await api.get<TopNiche[]>('/api/admin/analytics/top-niches', { params });
    return data;
  },
};

