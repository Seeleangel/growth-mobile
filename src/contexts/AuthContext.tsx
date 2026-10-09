import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, authService, tokenStore } from '../services/authService';
import { storageService } from '../services/storageService';
import apiClient from '../api/client';
import { API_BASE_URL } from '../config/app.config';
import { User } from '../api/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: 'student' | 'teacher') => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    // Get token from token store (no LockManager involved)
    const token = tokenStore.getAccessToken();

    try {
      // Use apiClient (unified timeout/interceptors/compression support)
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const resp = await fetch(`${API_BASE_URL}/api/student/${userId}/summary`, {
        headers: { 'Content-Type': 'application/json', ...headers },
        signal: AbortSignal.timeout(6000), // 6s timeout to prevent startup blocking
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.id) return data as User;
      }
    } catch (backendErr) {
      console.warn('Backend profile fetch failed, trying direct Supabase:', backendErr);
    }

    // Fallback to direct Supabase query (with timeout)
    try {
      const result = await Promise.race([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Supabase query timeout')), 4000)),
      ]);
      const { data, error } = result as any;
      if (error || !data) return null;
      return data as User;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const loadUser = async () => {
    // 添加超时保护 - 5秒后无论如何都停止加载
    const timeoutId = setTimeout(() => {
      console.log('Auth check timeout - proceeding to app');
      setIsLoading(false);
    }, 5000);

    try {
      // Load tokens from storage first
      await tokenStore.loadFromStorage();
      const token = tokenStore.getAccessToken();

      if (token) {
        // Decode the JWT to get user ID (without verification — server verifies)
        let userId: string | null = null;
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.sub;
        } catch { /* invalid token */ }

        if (userId) {
          const profile = await fetchUserProfile(userId);
          if (profile) {
            setUser({ ...profile, id: userId });
          }
        }
      } else {
        // Also try Supabase session (for native platforms where Supabase works fine)
        try {
          const session = await authService.getSession();
          if (session?.access_token) {
            let userId: string | null = null;
            try {
              const payload = JSON.parse(atob(session.access_token.split('.')[1]));
              userId = payload.sub;
            } catch { /* ignore */ }
            if (userId) {
              const profile = await fetchUserProfile(userId);
              if (profile) {
                setUser({ ...profile, id: userId });
              }
            }
          }
        } catch { /* ignore */ }
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();

    // Listen for auth state changes — on web with VPN, Supabase events may not
    // fire reliably, but we still subscribe in case setSession triggers them.
    let subscription: any = null;
    try {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);
        if (event === 'SIGNED_IN' && session?.user) {
          // Also sync tokens to our store
          if (session.access_token && session.refresh_token) {
            await tokenStore.setTokens(session.access_token, session.refresh_token);
          }
          const profile = await fetchUserProfile(session.user.id);
          if (profile) {
            setUser({ ...profile, id: session.user.id, email: session.user.email });
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          await tokenStore.clear();
          await storageService.clearAll();
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // Sync refreshed tokens
          if (session.access_token && session.refresh_token) {
            await tokenStore.setTokens(session.access_token, session.refresh_token);
          }
        }
        setIsLoading(false);
      });
      subscription = data.subscription;
    } catch (e) {
      console.warn('onAuthStateChange setup failed (ignored):', e);
    }

    return () => subscription?.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await authService.signIn(email, password);
      if (data.user) {
        const profile = await fetchUserProfile(data.user.id);
        if (profile) {
          setUser({ ...profile, id: data.user.id, email: data.user.email });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'student' | 'teacher') => {
    setIsLoading(true);
    try {
      await authService.signUp(email, password, fullName, role);
      // After signup, user needs to verify email or will be auto-signed in
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      await storageService.clearAll();
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    if (user?.id) {
      const profile = await fetchUserProfile(user.id);
      if (profile) {
        setUser(prev => prev ? { ...prev, ...profile } : profile);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
