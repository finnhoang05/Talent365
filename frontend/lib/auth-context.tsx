"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Profile, profilesApi, setAuthToken, clearAuthToken, getAuthToken, UserRole } from "./api";

interface AuthContextType {
  user: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface SignupData {
  email: string;
  full_name: string;
  role: UserRole;
  company_name?: string;
  github_url?: string;
  education?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const profile = await profilesApi.getMe();
      setUser(profile);
    } catch {
      setUser(null);
      clearAuthToken();
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(error.detail || "Login failed");
    }

    const data = await response.json();
    setAuthToken(data.user_id);
    await refreshUser();
  };

  const signup = async (signupData: SignupData) => {
    const userId = generateUUID();
    setAuthToken(userId);

    try {
      await profilesApi.create({
        role: signupData.role,
        full_name: signupData.full_name,
        email: signupData.email,
        company_name: signupData.company_name,
        github_url: signupData.github_url,
        education: signupData.education,
      });
      await refreshUser();
    } catch (error) {
      clearAuthToken();
      throw error;
    }
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
