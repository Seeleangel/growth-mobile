import Constants from 'expo-constants';
import { Platform, NativeModules } from 'react-native';

/**
 * Unified Application Configuration
 * Single source of truth for all app configuration values
 */

// Get config from app.json extra or use fallbacks for development
const getAppConfig = () => {
  const extra = Constants.expoConfig?.extra;

  // Fallback values for development - use env vars when app.json is not available
  const fallbackConfig = {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3003',
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  };

  return {
    apiUrl: extra?.apiUrl || fallbackConfig.apiUrl,
    supabaseUrl: extra?.supabaseUrl || fallbackConfig.supabaseUrl,
    supabaseAnonKey: extra?.supabaseAnonKey || fallbackConfig.supabaseAnonKey,
  };
};

const config = getAppConfig();

// =============================================================================
// Supabase Configuration
// =============================================================================

export const SUPABASE_URL = config.supabaseUrl;
export const SUPABASE_ANON_KEY = config.supabaseAnonKey;

// =============================================================================
// API Configuration
// =============================================================================

/**
 * Get the appropriate API URL based on platform
 * - Web: Uses configured URL or detects same-origin
 * - Native: Uses configured URL with Android emulator fallback
 */
const getApiUrl = (): string => {
  const configuredApiUrl = config.apiUrl;

  const tryResolveExpoHostIp = (): string | null => {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ||
      (Constants as any)?.manifest?.debuggerHost;

    if (!hostUri || typeof hostUri !== 'string') {
      return null;
    }

    const host = hostUri.split(':')[0];
    if (!host || host === 'localhost' || host === '127.0.0.1') {
      return null;
    }

    return host;
  };

  const tryResolveBundleHostIp = (): string | null => {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (!scriptURL || typeof scriptURL !== 'string') {
      return null;
    }

    try {
      const parsed = new URL(scriptURL);
      const host = parsed.hostname;
      if (!host || host === 'localhost' || host === '127.0.0.1') {
        return null;
      }
      return host;
    } catch {
      return null;
    }
  };

  // Web: Try to detect if we're on the same origin as the backend
  if (Platform.OS === 'web') {
    try {
      const parsed = new URL(configuredApiUrl);
      const hostNeedsRewrite = parsed.hostname === '10.0.2.2' || parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost';

      if (hostNeedsRewrite && typeof window !== 'undefined') {
        const browserHost = window.location.hostname || 'localhost';
        return `${parsed.protocol}//${browserHost}:${parsed.port || '3003'}`;
      }
    } catch {
      // ignore parse errors and continue with fallback logic
    }

    // Check if we're already on the API server
    if (typeof window !== 'undefined' && window.location.port !== '') {
      const port = window.location.port;
      // If running from backend server (port 3003), use same origin
      if (port === '3003') {
        return window.location.origin;
      }
    }
    // Otherwise use configured URL for web
    return configuredApiUrl;
  }

  // Native: if configured url points to localhost/emulator host, auto-resolve to LAN host from Expo
  try {
    const parsed = new URL(configuredApiUrl);
    const hostNeedsRewrite = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '10.0.2.2';

    if (hostNeedsRewrite) {
      const resolvedHostIp = tryResolveExpoHostIp() || tryResolveBundleHostIp();
      if (resolvedHostIp) {
        return `${parsed.protocol}//${resolvedHostIp}:${parsed.port || '3003'}`;
      }
    }
  } catch {
    // ignore parsing errors and fall back to configured value
  }

  return configuredApiUrl || 'http://10.0.2.2:3003';
};

export const API_BASE_URL = getApiUrl();

// =============================================================================
// Configuration Validation
// =============================================================================

/**
 * Validate that required configuration values are present and properly formatted
 * Call this at app startup to catch configuration errors early
 */
export const validateConfig = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check Supabase URL
  if (!SUPABASE_URL) {
    errors.push('SUPABASE_URL is missing');
  } else if (!SUPABASE_URL.startsWith('https://')) {
    errors.push('SUPABASE_URL must start with https://');
  }

  // Check Supabase Anon Key
  if (!SUPABASE_ANON_KEY) {
    errors.push('SUPABASE_ANON_KEY is missing');
  } else if (SUPABASE_ANON_KEY.startsWith('sb_publishable_') || SUPABASE_ANON_KEY.startsWith('sb_secret_')) {
    errors.push('SUPABASE_ANON_KEY has invalid format (placeholder detected). It should be a JWT token starting with "ey"');
  } else if (!SUPABASE_ANON_KEY.startsWith('ey')) {
    errors.push('SUPABASE_ANON_KEY must be a valid JWT token starting with "ey"');
  }

  // Check API URL
  if (!API_BASE_URL) {
    errors.push('API_BASE_URL is missing');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Log configuration on load (in development)
const isDevelopment = process.env.NODE_ENV !== 'production';
if (isDevelopment) {
  const validation = validateConfig();
  if (!validation.valid) {
    console.error('❌ Configuration errors detected:', validation.errors);
  } else {
    console.log('✅ Configuration loaded successfully');
    console.log('   Supabase URL:', SUPABASE_URL);
    console.log('   API Base URL:', API_BASE_URL);
    console.log('   Supabase Key format:', SUPABASE_ANON_KEY.startsWith('ey') ? 'Valid JWT' : 'INVALID');
  }
}

// =============================================================================
// App Metadata
// =============================================================================

export const APP_NAME = 'Growth';
export const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

// =============================================================================
// Feature Flags
// =============================================================================

export const FEATURES = {
  ENABLE_CHALLENGES: true,
  ENABLE_GOALS: true,
  ENABLE_MOOD_TRACKING: true,
  ENABLE_CLASS_MOMENTS: true,
} as const;

// =============================================================================
// Platform Information
// =============================================================================

export const isWeb = Platform.OS === 'web';
export const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

// =============================================================================
// Export full config object for debugging
// =============================================================================

export const appConfig = {
  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
  },
  api: {
    baseUrl: API_BASE_URL,
  },
  platform: {
    os: Platform.OS,
    isWeb,
    isNative,
    isIOS,
    isAndroid,
  },
};
