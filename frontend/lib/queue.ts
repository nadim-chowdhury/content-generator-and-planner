import api from './api';

export interface QueueStats {
  postingReminders: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  quotaReset: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  batchGenerations: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  analytics: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  email: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  trialExpiration: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
}

export const queueApi = {
  queueBatchGeneration: async (data: {
    count: number;
    niche: string;
    platform: string;
    tone?: string;
    language?: string;
  }): Promise<{ jobId: string; message: string }> => {
    const { data: result } = await api.post<{ jobId: string; message: string }>(
      '/api/queue/batch-generation',
      data,
    );
    return result;
  },

  getQueueStats: async (): Promise<QueueStats> => {
    const { data } = await api.get<QueueStats>('/api/queue/stats');
    return data;
  },
};

