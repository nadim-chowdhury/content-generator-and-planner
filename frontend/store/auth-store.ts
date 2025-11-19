"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/lib/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
  setTokens: (token: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      setAuth: (user, token, refreshToken) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(user));
          if (refreshToken) {
            localStorage.setItem("refreshToken", refreshToken);
          }
          // Also set cookie for middleware access
          document.cookie = `token=${token}; path=/; max-age=${
            7 * 24 * 60 * 60
          }; SameSite=Lax`;
        }
        set({ user, token, refreshToken: refreshToken || null });
      },
      setTokens: (token, refreshToken) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("token", token);
          localStorage.setItem("refreshToken", refreshToken);
          document.cookie = `token=${token}; path=/; max-age=${
            7 * 24 * 60 * 60
          }; SameSite=Lax`;
        }
        set({ token, refreshToken });
      },
      clearAuth: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          // Clear cookie
          document.cookie = "token=; path=/; max-age=0";
        }
        set({ user: null, token: null, refreshToken: null });
      },
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: "auth-storage",
    }
  )
);
