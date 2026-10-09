import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { SUPABASE_URL, SUPABASE_ANON_KEY, API_BASE_URL } from '../config/app.config';

// 检查配置是否正确加载
console.log('=== Supabase Config ===');
console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'Loaded' : 'MISSING');
console.log('API_BASE_URL:', API_BASE_URL);

// ============================================
// Independent token store (avoids LockManager)
// ============================================
const TOKEN_STORAGE_KEY = 'growth_auth_token';
const REFRESH_STORAGE_KEY = 'growth_refresh_token';

let _cachedAccessToken: string | null = null;
let _cachedRefreshToken: string | null = null;

export const tokenStore = {
  getAccessToken: () => _cachedAccessToken,
  getRefreshToken: () => _cachedRefreshToken,

  setTokens: async (accessToken: string, refreshToken: string) => {
    _cachedAccessToken = accessToken;
    _cachedRefreshToken = refreshToken;
    try {
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
      await AsyncStorage.setItem(REFRESH_STORAGE_KEY, refreshToken);
    } catch { /* ignore storage errors */ }
  },

  loadFromStorage: async () => {
    try {
      _cachedAccessToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      _cachedRefreshToken = await AsyncStorage.getItem(REFRESH_STORAGE_KEY);
    } catch { /* ignore */ }
    return _cachedAccessToken;
  },

  clear: async () => {
    _cachedAccessToken = null;
    _cachedRefreshToken = null;
    try {
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      await AsyncStorage.removeItem(REFRESH_STORAGE_KEY);
    } catch { /* ignore */ }
  },
};

// AsyncStorage adapter for Supabase
const AsyncStorageAdapter = {
  getItem: async (key: string) => {
    return await AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    await AsyncStorage.removeItem(key);
  },
};

// Create Supabase client — disable Navigator LockManager on web to avoid
// 10-second timeout when Supabase is unreachable (VPN/proxy environments)
const isWeb = Platform.OS === 'web';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorageAdapter,
    autoRefreshToken: !isWeb, // Disable on web — we manage tokens ourselves
    persistSession: true,
    detectSessionInUrl: false,
    ...(isWeb ? { lock: 'no-op' as any, flowType: 'implicit' as any } : {}),
  },
});

console.log('Supabase client created successfully');

/**
 * Try to sign in via the backend proxy first (avoids direct Supabase connection
 * issues caused by VPN/proxy/firewall). Falls back to direct Supabase auth.
 */
const signInViaBackend = async (email: string, password: string) => {
  const resp = await fetch(`${API_BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body.error || `Login failed (${resp.status})`);
  }

  const { session, user } = await resp.json();
  if (!session?.access_token || !session?.refresh_token) {
    throw new Error('Backend returned invalid session');
  }

  // Store tokens independently (avoids LockManager timeout)
  await tokenStore.setTokens(session.access_token, session.refresh_token);

  // Also try to inject into Supabase client (best-effort, may timeout on web)
  try {
    await Promise.race([
      supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('setSession timeout')), 3000)),
    ]);
  } catch (e) {
    console.warn('supabase.auth.setSession skipped (timeout/error):', e);
  }

  return { session, user };
};

/**
 * Try to sign up via the backend proxy first.
 */
const signUpViaBackend = async (email: string, password: string, fullName: string, role: string) => {
  const resp = await fetch(`${API_BASE_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role, name: fullName }),
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body.error || `Registration failed (${resp.status})`);
  }

  const result = await resp.json();

  // After registration the backend doesn't return a session, so sign in
  return signInViaBackend(email, password);
};

// Auth Service
export const authService = {
  // Sign up
  signUp: async (email: string, password: string, fullName: string, role: 'student' | 'teacher') => {
    console.log('Signing up:', email);
    try {
      // Try backend proxy first
      const data = await signUpViaBackend(email, password, fullName, role);
      console.log('Sign up (backend) success');
      return data;
    } catch (backendErr: any) {
      console.warn('Backend signup failed, trying direct Supabase:', backendErr.message);
    }

    // Fallback to direct Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });

    if (error) {
      console.error('Sign up error:', error);
      throw error;
    }
    console.log('Sign up success');
    return data;
  },

  // Sign in
  signIn: async (email: string, password: string) => {
    console.log('Signing in:', email);
    try {
      // Try backend proxy first (works even if Supabase is unreachable from browser)
      const data = await signInViaBackend(email, password);
      console.log('Sign in (backend) success');
      return data;
    } catch (backendErr: any) {
      console.warn('Backend login failed, trying direct Supabase:', backendErr.message);
    }

    // Fallback to direct Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }
    console.log('Sign in success');
    return data;
  },

  // Sign out
  signOut: async () => {
    console.log('Signing out');
    await tokenStore.clear();
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise<void>((resolve) => setTimeout(resolve, 2000)),
      ]);
    } catch (e) {
      console.warn('Supabase signOut error (ignored):', e);
    }
    console.log('Sign out success');
  },

  // Get current session
  getSession: async () => {
    console.log('Getting session...');
    // Try fast token store first
    const storedToken = tokenStore.getAccessToken();
    if (storedToken) {
      console.log('Session: Found (token store)');
      return { access_token: storedToken, refresh_token: tokenStore.getRefreshToken() } as any;
    }

    // Load from AsyncStorage
    const loaded = await tokenStore.loadFromStorage();
    if (loaded) {
      console.log('Session: Found (async storage)');
      return { access_token: loaded, refresh_token: tokenStore.getRefreshToken() } as any;
    }

    // Fallback to Supabase with timeout
    try {
      const result = await Promise.race([
        supabase.auth.getSession(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('getSession timeout')), 3000)),
      ]);
      const { data, error } = result as any;
      if (error) throw error;
      if (data?.session?.access_token) {
        await tokenStore.setTokens(data.session.access_token, data.session.refresh_token);
      }
      console.log('Session:', data?.session ? 'Found (supabase)' : 'None');
      return data?.session;
    } catch (e) {
      console.warn('getSession error/timeout:', e);
      return null;
    }
  },

  // Get current user
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },

  // Update user
  updateUser: async (updates: { password?: string; data?: object }) => {
    const { data, error } = await supabase.auth.updateUser(updates);
    if (error) throw error;
    return data;
  },

  // Reset password
  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },
};
