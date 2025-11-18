import api from './api';

export interface SubscriptionStatus {
  plan: 'FREE' | 'PRO' | 'AGENCY';
  active: boolean;
  status?: string;
  currentPeriodEnd?: Date;
}

export const billingApi = {
  createCheckout: async (): Promise<{ sessionId: string; url: string }> => {
    const { data } = await api.post<{ sessionId: string; url: string }>(
      '/api/billing/create-checkout',
    );
    return data;
  },

  getStatus: async (): Promise<SubscriptionStatus> => {
    const { data } = await api.get<SubscriptionStatus>('/api/billing/status');
    return data;
  },

  createPortal: async (): Promise<{ url: string }> => {
    const { data } = await api.post<{ url: string }>('/api/billing/portal');
    return data;
  },
};

