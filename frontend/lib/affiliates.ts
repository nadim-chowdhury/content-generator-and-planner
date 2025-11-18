import api from './api';

export interface AffiliateDashboard {
  affiliateCode: string;
  approved: boolean;
  stats: {
    totalEarned: number;
    totalPaid: number;
    pendingAmount: number;
    approvedAmount: number;
    availableForPayout: number;
    totalCommissions: number;
    totalPayouts: number;
  };
  commissions: Array<{
    id: string;
    orderId: string | null;
    amount: number;
    percentage: number;
    status: string;
    description: string | null;
    createdAt: string;
    paidAt: string | null;
  }>;
  payouts: Array<{
    id: string;
    amount: number;
    status: string;
    paymentMethod: string | null;
    requestedAt: string;
    processedAt: string | null;
    completedAt: string | null;
  }>;
}

export const affiliatesApi = {
  applyForAffiliate: async (): Promise<{ affiliateCode: string }> => {
    const { data } = await api.post<{ affiliateCode: string }>('/api/affiliates/apply');
    return data;
  },

  getAffiliateLink: async (): Promise<{ code: string; link: string }> => {
    const { data } = await api.get<{ code: string; link: string }>('/api/affiliates/link');
    return data;
  },

  getDashboard: async (): Promise<AffiliateDashboard> => {
    const { data } = await api.get<AffiliateDashboard>('/api/affiliates/dashboard');
    return data;
  },

  requestPayout: async (paymentMethod: string, paymentDetails: string): Promise<{ payoutId: string; amount: number }> => {
    const { data } = await api.post<{ payoutId: string; amount: number }>('/api/affiliates/payout/request', {
      paymentMethod,
      paymentDetails,
    });
    return data;
  },
};

