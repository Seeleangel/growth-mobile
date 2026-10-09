import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL } from './endpoints';
import { tokenStore } from '../services/authService';
import { isDevelopment } from '../utils/dev';

// Create Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept-Encoding': 'gzip, deflate', // 明确告知后端支持压缩
  },
  timeout: 8000, // 常规接口 8s（AI 接口在调用处单独设更长超时）
});

// Request interceptor - Add auth token and logging
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Read token from fast in-memory store (no LockManager, no async timeout)
    const token = tokenStore.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development (URL only, avoid large payload dumps)
    if (isDevelopment()) {
      console.log(`[API] → ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('[API Request Error]:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and logging
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development (status only, avoid dumping large JSON)
    if (isDevelopment()) {
      console.log(`[API] ← ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error: AxiosError) => {
    // Log error in development
    if (isDevelopment()) {
      console.error(`[API Error] ${error.response?.status || 'Network Error'} ${error.config?.url || 'Unknown URL'}`);
      console.error('  Error details:', error.response?.data || error.message);
    }

    if (error.response?.status === 401 && error.config && !(error.config as any)._retried) {
      // Try refreshing session via backend
      try {
        const refreshToken = tokenStore.getRefreshToken();
        if (refreshToken) {
          const resp = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          }).catch(() => null);

          if (resp && resp.ok) {
            const { session } = await resp.json();
            if (session?.access_token) {
              await tokenStore.setTokens(session.access_token, session.refresh_token || refreshToken);
              const retryConfig = { ...error.config } as any;
              retryConfig._retried = true;
              retryConfig.headers = { ...retryConfig.headers };
              retryConfig.headers.Authorization = `Bearer ${session.access_token}`;
              return apiClient(retryConfig);
            }
          }
        }
        // Refresh failed - clear tokens
        await tokenStore.clear();
        return Promise.reject(new Error('Session expired. Please log in again.'));
      } catch (e) {
        await tokenStore.clear();
        return Promise.reject(new Error('Authentication failed. Please log in again.'));
      }
    }

    // Extract error message from response
    if (error.response?.data) {
      const errorData = error.response.data as { error?: string };
      return Promise.reject(new Error(errorData.error || 'Request failed'));
    }

    return Promise.reject(error);
  }
);

export default apiClient;
