import api from './api';

export interface User {
  id: string;
  email: string;
  plan: 'FREE' | 'PRO' | 'AGENCY';
  emailVerified: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authApi = {
  signup: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/api/auth/signup', {
      email,
      password,
    });
    return data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/api/auth/login', {
      email,
      password,
    });
    return data;
  },

  getMe: async (): Promise<{ user: User }> => {
    const { data } = await api.get<{ user: User }>('/api/auth/me');
    return data;
  },

  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout');
  },
};

