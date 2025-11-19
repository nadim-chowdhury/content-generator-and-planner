import api from "./api";

export interface Notification {
  id: string;
  type: "EMAIL" | "PUSH" | "IN_APP";
  category:
    | "UPCOMING_CONTENT"
    | "TASK_REMINDER"
    | "DEADLINE_ALERT"
    | "SYSTEM"
    | "ACHIEVEMENT";
  title: string;
  message: string;
  read: boolean;
  readAt?: string;
  metadata?: any;
  createdAt: string;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  upcomingContentAlerts: boolean;
  taskReminders: boolean;
  deadlineAlerts: boolean;
  systemNotifications: boolean;
  achievementAlerts: boolean;
  emailReminderHours: number[];
}

export const notificationsApi = {
  getNotifications: async (
    limit?: number,
    read?: boolean
  ): Promise<Notification[]> => {
    const params: any = {};
    if (limit) params.limit = limit;
    if (read !== undefined) params.read = read;
    const { data } = await api.get<Notification[]>("/api/notifications", {
      params,
    });
    return data;
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    await api.post(`/api/notifications/${notificationId}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.post("/api/notifications/read-all");
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    await api.delete(`/api/notifications/${notificationId}`);
  },

  getAll: async (unreadOnly?: boolean): Promise<Notification[]> => {
    const params: any = {};
    if (unreadOnly) params.read = "false";
    const { data } = await api.get<Notification[]>("/api/notifications", {
      params,
    });
    return data;
  },

  getPreferences: async (): Promise<NotificationPreferences> => {
    const { data } = await api.get<NotificationPreferences>(
      "/api/notifications/preferences"
    );
    return data;
  },

  updatePreferences: async (
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> => {
    const { data } = await api.put<NotificationPreferences>(
      "/api/notifications/preferences",
      preferences
    );
    return data;
  },

  delete: async (notificationId: string): Promise<void> => {
    await api.delete(`/api/notifications/${notificationId}`);
  },
};
