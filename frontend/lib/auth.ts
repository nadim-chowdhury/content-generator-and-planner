import api from "./api";

export interface User {
  id: string;
  email: string;
  name?: string;
  profileImage?: string;
  plan: "FREE" | "PRO" | "AGENCY";
  role?: "USER" | "ADMIN";
  emailVerified: boolean;
  twoFactorEnabled?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

export interface Session {
  id: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
  isCurrent?: boolean;
}

export interface LoginActivity {
  id: string;
  loginType: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  failureReason?: string;
  createdAt: string;
}

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
}

export const authApi = {
  signup: async (
    email: string,
    password: string,
    referralCode?: string,
    affiliateCode?: string
  ): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/api/auth/signup", {
      email,
      password,
      referralCode,
      affiliateCode,
    });
    return data;
  },

  login: async (
    email: string,
    password: string,
    twoFactorToken?: string
  ): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/api/auth/login", {
      email,
      password,
      twoFactorToken,
    });
    return data;
  },

  // Social Login
  socialLogin: {
    google: () => {
      window.location.href = `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
      }/api/auth/google`;
    },
    facebook: () => {
      window.location.href = `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
      }/api/auth/facebook`;
    },
    github: () => {
      window.location.href = `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
      }/api/auth/github`;
    },
  },

  // Magic Link
  requestMagicLink: async (email: string): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>(
      "/api/auth/magic-link/request",
      {
        email,
      }
    );
    return data;
  },

  verifyMagicLink: async (token: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>(
      "/api/auth/magic-link/verify",
      {
        token,
      }
    );
    return data;
  },

  // 2FA
  setup2FA: async (): Promise<TwoFactorSetup> => {
    const { data } = await api.post<TwoFactorSetup>("/api/auth/2fa/setup");
    return data;
  },

  enable2FA: async (token: string): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>(
      "/api/auth/2fa/enable",
      {
        token,
      }
    );
    return data;
  },

  disable2FA: async (): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>(
      "/api/auth/2fa/disable"
    );
    return data;
  },

  // Sessions
  getSessions: async (): Promise<Session[]> => {
    const { data } = await api.get<Session[]>("/api/auth/sessions");
    return data;
  },

  revokeSession: async (sessionId: string): Promise<{ message: string }> => {
    const { data } = await api.delete<{ message: string }>(
      `/api/auth/sessions/${sessionId}`
    );
    return data;
  },

  revokeAllSessions: async (): Promise<{ message: string }> => {
    const { data } = await api.delete<{ message: string }>(
      "/api/auth/sessions"
    );
    return data;
  },

  // Login Activities
  getLoginActivities: async (limit?: number): Promise<LoginActivity[]> => {
    const { data } = await api.get<LoginActivity[]>(
      `/api/auth/activities${limit ? `?limit=${limit}` : ""}`
    );
    return data;
  },

  // Profile
  getProfile: async (): Promise<{ user: User }> => {
    const { data } = await api.get<{ user: User }>("/api/auth/profile");
    return data;
  },

  updateProfile: async (updates: {
    name?: string;
    email?: string;
    profileImage?: string;
  }): Promise<{ message: string; user: User }> => {
    const { data } = await api.put<{ message: string; user: User }>(
      "/api/auth/profile",
      updates
    );
    return data;
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>(
      "/api/auth/change-password",
      {
        currentPassword,
        newPassword,
      }
    );
    return data;
  },

  resendVerification: async (): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>(
      "/api/auth/resend-verification"
    );
    return data;
  },

  // Email Verification
  verifyEmail: async (token: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/api/auth/verify-email", {
      token,
    });
    return data;
  },

  // Password Reset
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>(
      "/api/auth/forgot-password",
      { email }
    );
    return data;
  },

  resetPassword: async (
    token: string,
    password: string
  ): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>(
      "/api/auth/reset-password",
      { token, password }
    );
    return data;
  },

  // Delete Account (GDPR-compliant)
  deleteAccount: async (
    password?: string,
    hardDelete: boolean = false
  ): Promise<{ message: string }> => {
    const { data } = await api.delete<{ message: string }>(
      "/api/auth/account",
      {
        data: { password, hardDelete },
      }
    );
    return data;
  },

  // GDPR Data Export
  exportData: async (): Promise<any> => {
    const { data } = await api.get<any>("/api/auth/export-data");
    return data;
  },

  getMe: async (): Promise<{ user: User }> => {
    const { data } = await api.get<{ user: User }>("/api/auth/me");
    return data;
  },

  logout: async (): Promise<void> => {
    await api.post("/api/auth/logout");
  },

  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const { data } = await api.post<RefreshTokenResponse>("/api/auth/refresh", {
      refreshToken,
    });
    return data;
  },
};
