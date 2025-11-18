import api from './api';

export enum PlanType {
  PRO_MONTHLY = 'PRO_MONTHLY',
  PRO_YEARLY = 'PRO_YEARLY',
  AGENCY = 'AGENCY',
}

export interface Plan {
  name: string;
  plan: 'FREE' | 'PRO' | 'AGENCY';
  planType?: PlanType;
  price: number;
  interval?: 'month' | 'year' | null;
  pricePerMonth?: number;
  savings?: string;
  oneTime?: boolean;
  features: string[];
  note?: string;
}

export interface PlansResponse {
  free: Plan;
  proMonthly: Plan;
  proYearly: Plan;
  agency: Plan;
  lifetime: Plan;
}

export interface CheckoutResponse {
  sessionId: string;
  url: string;
}

export interface SubscriptionStatus {
  plan: 'FREE' | 'PRO' | 'AGENCY';
  active: boolean;
  status?: string;
  currentPeriodEnd?: string;
  onTrial?: boolean;
  trialEndsAt?: string;
  cancelAtPeriodEnd?: boolean;
  usage?: {
    dailyGenerations: number;
    limit: number | null;
  };
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: string;
  periodStart: string | null;
  periodEnd: string | null;
  invoicePdf: string | null;
  hostedInvoiceUrl: string | null;
  description: string | null;
}

export interface UsageStats {
  dailyGenerations: number;
  dailyLimit: number | null;
  remaining: number | null;
  isUnlimited: boolean;
  plan: 'FREE' | 'PRO' | 'AGENCY';
}

export interface CouponValidation {
  valid: boolean;
  id: string;
  name: string | null;
  percentOff: number | null;
  amountOff: number | null;
  currency: string | null;
  duration: string;
  durationInMonths: number | null;
}

export const billingApi = {
  getPlans: async (): Promise<PlansResponse> => {
    const { data } = await api.get<PlansResponse>('/api/billing/plans');
    return data;
  },

  createCheckout: async (planType: PlanType, couponCode?: string): Promise<CheckoutResponse> => {
    const { data } = await api.post<CheckoutResponse>('/api/billing/create-checkout', {
      planType,
      couponCode,
    });
    return data;
  },

  getStatus: async (): Promise<SubscriptionStatus> => {
    const { data } = await api.get<SubscriptionStatus>('/api/billing/status');
    return data;
  },

  createPortalSession: async (): Promise<{ url: string }> => {
    const { data } = await api.post<{ url: string }>('/api/billing/portal');
    return data;
  },

  activateLifetime: async (licenseKey: string): Promise<{ message: string; plan: string }> => {
    const { data } = await api.post<{ message: string; plan: string }>('/api/billing/activate-lifetime', {
      licenseKey,
    });
    return data;
  },

  getInvoices: async (limit?: number): Promise<Invoice[]> => {
    const params: any = {};
    if (limit) params.limit = limit;
    const { data } = await api.get<Invoice[]>('/api/billing/invoices', { params });
    return data;
  },

  cancelSubscription: async (atPeriodEnd: boolean = true): Promise<{ message: string; cancelAtPeriodEnd: boolean }> => {
    const { data } = await api.delete<{ message: string; cancelAtPeriodEnd: boolean }>(
      `/api/billing/subscription?atPeriodEnd=${atPeriodEnd}`,
    );
    return data;
  },

  upgradeDowngrade: async (planType: PlanType): Promise<{ message: string; plan: string; subscriptionId: string }> => {
    const { data } = await api.post<{ message: string; plan: string; subscriptionId: string }>(
      '/api/billing/upgrade-downgrade',
      { planType },
    );
    return data;
  },

  validateCoupon: async (couponCode: string): Promise<CouponValidation> => {
    const { data } = await api.post<CouponValidation>('/api/billing/validate-coupon', {
      couponCode,
    });
    return data;
  },

  getUsageStats: async (): Promise<UsageStats> => {
    const { data } = await api.get<UsageStats>('/api/billing/usage');
    return data;
  },
};
