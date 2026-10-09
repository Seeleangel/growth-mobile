/**
 * Development mode utilities
 * Provides consistent development mode detection across the app
 */

/**
 * Check if the app is running in development mode
 * Works in both React Native and web environments
 */
export const isDevelopment = (): boolean => {
  // Check environment variable first (works in web and Metro bundler)
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // Check if we're in a test environment
  if (process.env.NODE_ENV === 'test') {
    return true;
  }

  return false;
};

/**
 * Alias for convenience
 */
export const __DEV__ = isDevelopment();

/**
 * Conditional logging that only outputs in development
 */
export const devLog = {
  log: (...args: unknown[]) => {
    if (isDevelopment()) {
      console.log('[DEV]', ...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (isDevelopment()) {
      console.warn('[DEV WARN]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    if (isDevelopment()) {
      console.error('[DEV ERROR]', ...args);
    }
  },
  info: (...args: unknown[]) => {
    if (isDevelopment()) {
      console.info('[DEV INFO]', ...args);
    }
  },
};

export default isDevelopment;
