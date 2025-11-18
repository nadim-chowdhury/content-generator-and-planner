import api from './api';

export interface ReferralStats {
  totalReferrals: number;
  convertedReferrals: number;
  pendingReferrals: number;
  totalCreditsEarned: number;
  referrals: Array<{
    id: string;
    referredUser: {
      id: string;
      email: string;
      name: string | null;
      signedUpAt: string;
    } | null;
    status: string;
    creditsEarned: number;
    createdAt: string;
    convertedAt: string | null;
  }>;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  email: string;
  name: string | null;
  profileImage: string | null;
  totalReferrals: number;
  totalCredits: number;
}

export const referralsApi = {
  getReferralCode: async (): Promise<{ code: string }> => {
    const { data } = await api.get<{ code: string }>('/api/referrals/code');
    return data;
  },

  getReferralLink: async (): Promise<{ link: string }> => {
    const { data } = await api.get<{ link: string }>('/api/referrals/link');
    return data;
  },

  getReferralStats: async (): Promise<ReferralStats> => {
    const { data } = await api.get<ReferralStats>('/api/referrals/stats');
    return data;
  },

  getLeaderboard: async (limit: number = 10): Promise<LeaderboardEntry[]> => {
    const { data } = await api.get<LeaderboardEntry[]>(`/api/referrals/leaderboard?limit=${limit}`);
    return data;
  },

  trackReferralClick: async (code: string, email?: string): Promise<void> => {
    await api.post('/api/referrals/track', null, {
      params: { code, email },
    });
  },
};

