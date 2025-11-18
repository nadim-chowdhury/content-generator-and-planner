import api from './api';

export interface User {
  id: string;
  email: string;
  name?: string;
  profileImage?: string;
  plan: 'FREE' | 'PRO' | 'AGENCY';
  role: 'USER' | 'ADMIN';
  emailVerified: boolean;
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
};

