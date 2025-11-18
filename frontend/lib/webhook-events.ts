export interface WebhookEvent {
  id: string;
  eventId: string;
  eventType: string;
  userId?: string;
  processed: boolean;
  processedAt?: string;
  createdAt: string;
  error?: string;
}

export const webhookEventsApi = {
  getEvents: async (limit?: number): Promise<WebhookEvent[]> => {
    const params: any = {};
    if (limit) params.limit = limit;
    // Note: This would typically be an admin-only endpoint
    // For now, we'll just define the interface
    return [];
  },
};


