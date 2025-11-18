import api from './api';

export interface User {
  id: string;
  email: string;
  name?: string;
  profileImage?: string;
  plan: 'FREE' | 'PRO' | 'AGENCY';
  role: 'USER' | 'ADMIN';
  emailVerified: boolean;
  banned?: boolean;
  bannedAt?: string;
  bonusCredits?: number;
  dailyAiGenerations?: number;
  createdAt: string;
}

export interface Subscription {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string | null;
  plan: 'FREE' | 'PRO' | 'AGENCY';
  amount: number;
  currency: string;
}

export interface SubscriptionWithUser {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  subscription: Subscription | null;
}

export interface Invoice {
  id: string;
  number: string | null;
  amount: number;
  currency: string;
  status: string;
  paid: boolean;
  created: string;
  dueDate?: string | null;
  user?: {
    id: string;
    email: string;
    name?: string;
  } | null;
  subscriptionId?: string | null;
  invoicePdf?: string | null;
  hostedInvoiceUrl?: string | null;
}

export interface UserQuota {
  id: string;
  email: string;
  name?: string;
  plan: 'FREE' | 'PRO' | 'AGENCY';
  banned: boolean;
  bannedAt?: string | null;
  bannedReason?: string | null;
  dailyAiGenerations: number;
  lastGenerationReset?: string | null;
  bonusCredits: number;
  createdAt: string;
}

export interface AdminStats {
  users: {
    total: number;
    free: number;
    pro: number;
    agency: number;
    admin: number;
    verified: number;
  };
  ideas: {
    total: number;
  };
}

export const adminApi = {
  // Stats
  getStats: async (): Promise<AdminStats> => {
    const { data } = await api.get<AdminStats>('/api/admin/stats');
    return data;
  },

  // Users
  getAllUsers: async (page: number = 1, limit: number = 20): Promise<{ users: User[]; pagination: { total: number; page: number; limit: number; pages: number } }> => {
    const { data } = await api.get<{ users: User[]; pagination: { total: number; page: number; limit: number; pages: number } }>(`/api/admin/users?page=${page}&limit=${limit}`);
    return data;
  },

  getUser: async (userId: string): Promise<{ user: User }> => {
    const { data } = await api.get<{ user: User }>(`/api/admin/users/${userId}`);
    return data;
  },

  updateUserRole: async (userId: string, role: 'USER' | 'ADMIN'): Promise<User> => {
    const { data } = await api.put<User>(`/api/admin/users/${userId}/role`, { role });
    return data;
  },

  updateUserPlan: async (userId: string, plan: 'FREE' | 'PRO' | 'AGENCY'): Promise<User> => {
    const { data } = await api.put<User>(`/api/admin/users/${userId}/plan`, { plan });
    return data;
  },

  deleteUser: async (userId: string): Promise<{ message: string }> => {
    // Note: Delete endpoint may not exist in backend, using account deletion endpoint instead
    // If backend has DELETE /api/admin/users/:id, use that instead
    const { data } = await api.delete<{ message: string }>(`/api/admin/users/${userId}`);
    return data;
  },

  // User Management
  banUser: async (userId: string, reason?: string): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>(`/api/admin/users/${userId}/ban`, { reason });
    return data;
  },

  unbanUser: async (userId: string): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>(`/api/admin/users/${userId}/unban`);
    return data;
  },

  resetUserQuota: async (userId: string): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>(`/api/admin/users/${userId}/reset-quota`);
    return data;
  },

  addBonusCredits: async (userId: string, credits: number): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>(`/api/admin/users/${userId}/bonus-credits`, { credits });
    return data;
  },

  getUserQuota: async (userId: string): Promise<UserQuota> => {
    const { data } = await api.get<UserQuota>(`/api/admin/users/${userId}/quota`);
    return data;
  },

  // Billing Management
  getAllSubscriptions: async (page: number = 1, limit: number = 20): Promise<{ subscriptions: SubscriptionWithUser[]; pagination: { total: number; page: number; limit: number; pages: number } }> => {
    const { data } = await api.get<{ subscriptions: SubscriptionWithUser[]; pagination: { total: number; page: number; limit: number; pages: number } }>(`/api/admin/billing/subscriptions?page=${page}&limit=${limit}`);
    return data;
  },

  getAllInvoices: async (page: number = 1, limit: number = 20): Promise<{ invoices: Invoice[]; hasMore: boolean; pagination: { page: number; limit: number } }> => {
    const { data } = await api.get<{ invoices: Invoice[]; hasMore: boolean; pagination: { page: number; limit: number } }>(`/api/admin/billing/invoices?page=${page}&limit=${limit}`);
    return data;
  },

  getUserSubscription: async (userId: string): Promise<SubscriptionWithUser> => {
    const { data } = await api.get<SubscriptionWithUser>(`/api/admin/billing/users/${userId}/subscription`);
    return data;
  },

  getUserInvoices: async (userId: string, limit: number = 10): Promise<{ user: { id: string; email: string }; invoices: Invoice[] }> => {
    const { data } = await api.get<{ user: { id: string; email: string }; invoices: Invoice[] }>(`/api/admin/billing/users/${userId}/invoices?limit=${limit}`);
    return data;
  },

  processRefund: async (paymentIntentId: string, amount?: number, reason?: string): Promise<any> => {
    const { data } = await api.post<any>(`/api/admin/billing/refund`, { paymentIntentId, amount, reason });
    return data;
  },

  cancelUserSubscription: async (userId: string, immediately: boolean = false): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>(`/api/admin/billing/users/${userId}/cancel-subscription`, { immediately });
    return data;
  },

  // Platform Settings
  getPlatformSettings: async (): Promise<any> => {
    const { data } = await api.get('/api/admin/settings/platform');
    return data;
  },

  getAiTokenUsage: async (): Promise<any> => {
    const { data } = await api.get('/api/admin/settings/ai-tokens');
    return data;
  },

  getQuotaSettings: async (): Promise<any> => {
    const { data } = await api.get('/api/admin/settings/quotas');
    return data;
  },

  updateQuotaSettings: async (plan: 'free' | 'pro' | 'agency', settings: { dailyGenerations?: number; monthlyGenerations?: number }): Promise<any> => {
    const { data } = await api.put(`/api/admin/settings/quotas/${plan}`, settings);
    return data;
  },

  getStripeProductIds: async (): Promise<any> => {
    const { data } = await api.get('/api/admin/settings/stripe');
    return data;
  },

  updateStripeProductIds: async (settings: { proMonthlyPriceId?: string; proYearlyPriceId?: string; agencyPriceId?: string }): Promise<any> => {
    const { data } = await api.put('/api/admin/settings/stripe', settings);
    return data;
  },

  getApiKeysStatus: async (): Promise<any> => {
    const { data } = await api.get('/api/admin/settings/api-keys');
    return data;
  },

  // Content Moderation
  getFlaggedIdeas: async (page: number = 1, limit: number = 20): Promise<any> => {
    const { data } = await api.get(`/api/admin/moderation/flagged?page=${page}&limit=${limit}`);
    return data;
  },

  flagIdea: async (ideaId: string, reason: string, category: string = 'OTHER'): Promise<any> => {
    const { data } = await api.post(`/api/admin/moderation/flag/${ideaId}`, { reason, category });
    return data;
  },

  reviewFlag: async (flagId: string, action: 'BLOCKED' | 'IGNORED' | 'DELETED'): Promise<any> => {
    const { data } = await api.post(`/api/admin/moderation/review/${flagId}`, { action });
    return data;
  },

  blockIdea: async (ideaId: string, reason: string): Promise<any> => {
    const { data } = await api.post(`/api/admin/moderation/block/${ideaId}`, { reason });
    return data;
  },

  unblockIdea: async (ideaId: string): Promise<any> => {
    const { data } = await api.post(`/api/admin/moderation/unblock/${ideaId}`);
    return data;
  },

  getBlacklistKeywords: async (page: number = 1, limit: number = 50): Promise<any> => {
    const { data } = await api.get(`/api/admin/moderation/blacklist?page=${page}&limit=${limit}`);
    return data;
  },

  addBlacklistKeyword: async (keyword: string, category: string = 'GENERAL', severity: string = 'MEDIUM', action: string = 'FLAG'): Promise<any> => {
    const { data } = await api.post('/api/admin/moderation/blacklist', { keyword, category, severity, action });
    return data;
  },

  deleteBlacklistKeyword: async (keywordId: string): Promise<any> => {
    const { data } = await api.delete(`/api/admin/moderation/blacklist/${keywordId}`);
    return data;
  },

  updateBlacklistKeyword: async (keywordId: string, updates: { category?: string; severity?: string; action?: string; enabled?: boolean }): Promise<any> => {
    const { data } = await api.put(`/api/admin/moderation/blacklist/${keywordId}`, updates);
    return data;
  },

  // Enhanced Analytics
  getDailyActiveUsers: async (date?: string): Promise<{ count: number }> => {
    const { data } = await api.get(`/api/admin/analytics/dau${date ? `?date=${date}` : ''}`);
    return data;
  },

  getDailyActiveUsersTrend: async (days: number = 30): Promise<Array<{ date: string; count: number }>> => {
    const { data } = await api.get(`/api/admin/analytics/dau/trend?days=${days}`);
    return data;
  },

  getMonthlyActiveUsers: async (year?: number, month?: number): Promise<{ count: number }> => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    const { data } = await api.get(`/api/admin/analytics/mau${params.toString() ? `?${params.toString()}` : ''}`);
    return data;
  },

  getMonthlyActiveUsersTrend: async (months: number = 12): Promise<Array<{ month: string; count: number }>> => {
    const { data } = await api.get(`/api/admin/analytics/mau/trend?months=${months}`);
    return data;
  },

  getLTV: async (): Promise<any> => {
    const { data } = await api.get('/api/admin/analytics/ltv');
    return data;
  },

  getSocialSharingMetrics: async (days: number = 30): Promise<any> => {
    const { data } = await api.get(`/api/admin/analytics/social-sharing?days=${days}`);
    return data;
  },

  getComprehensiveReport: async (): Promise<any> => {
    const { data } = await api.get('/api/admin/analytics/comprehensive');
    return data;
  },
};

