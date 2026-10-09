/**
 * Network and Supabase Connection Diagnostic Tool
 *
 * This utility helps diagnose common issues with:
 * - Supabase configuration and connectivity
 * - Backend API connectivity
 * - Authentication state
 *
 * Usage:
 * import { runDiagnostics, testSupabaseConnection, testBackendConnection } from '@/utils/diagnose';
 *
 * // Run all diagnostics
 * const results = await runDiagnostics();
 * console.log(results);
 *
 * // Test individual connections
 * await testSupabaseConnection();
 * await testBackendConnection();
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY, API_BASE_URL, validateConfig } from '@/config/app.config';
import { supabase } from '@/services/authService';
import axios from 'axios';
import { isDevelopment } from './dev';

// =============================================================================
// Type Definitions
// =============================================================================

export interface DiagnosticResult {
  category: string;
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: Record<string, unknown>;
}

export interface DiagnosticReport {
  timestamp: string;
  overall: 'pass' | 'fail' | 'warn';
  results: DiagnosticResult[];
  summary: {
    pass: number;
    fail: number;
    warn: number;
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a diagnostic result object
 */
function createResult(
  category: string,
  name: string,
  status: 'pass' | 'fail' | 'warn',
  message: string,
  details?: Record<string, unknown>
): DiagnosticResult {
  return { category, name, status, message, details };
}

/**
 * Mask sensitive information for logging
 */
function maskSensitive(value: string): string {
  if (!value) return 'empty';
  if (value.startsWith('sb_')) return value; // Don't mask placeholders
  if (value.length > 20) return value.substring(0, 20) + '...';
  return value;
}

// =============================================================================
// Supabase Diagnostics
// =============================================================================

/**
 * Test Supabase configuration
 */
export async function testSupabaseConfig(): Promise<DiagnosticResult> {
  try {
    const validation = validateConfig();

    if (!validation.valid) {
      return createResult(
        'Supabase',
        'Configuration',
        'fail',
        'Invalid Supabase configuration',
        { errors: validation.errors }
      );
    }

    // Check if key has valid JWT format
    if (!SUPABASE_ANON_KEY.startsWith('ey')) {
      return createResult(
        'Supabase',
        'Key Format',
        'fail',
        'Supabase key is not a valid JWT token',
        {
          keyFormat: SUPABASE_ANON_KEY.startsWith('sb_') ? 'Placeholder format' : 'Unknown format',
          expectedFormat: 'JWT token starting with "ey..."'
        }
      );
    }

    return createResult(
      'Supabase',
      'Configuration',
      'pass',
      'Supabase configuration is valid',
      {
        url: SUPABASE_URL,
        keyPrefix: SUPABASE_ANON_KEY.substring(0, 20) + '...'
      }
    );
  } catch (error) {
    return createResult(
      'Supabase',
      'Configuration',
      'fail',
      `Configuration check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Test Supabase connectivity
 */
export async function testSupabaseConnection(): Promise<DiagnosticResult> {
  try {
    // Try to fetch Supabase health/version
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return createResult(
        'Supabase',
        'Connectivity',
        'pass',
        'Successfully connected to Supabase',
        { url: SUPABASE_URL }
      );
    }

    return createResult(
      'Supabase',
      'Connectivity',
      'fail',
      `Supabase connection failed with status: ${response.status}`,
      { status: response.status, statusText: response.statusText }
    );
  } catch (error) {
    return createResult(
      'Supabase',
      'Connectivity',
      'fail',
      `Cannot reach Supabase: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { suggestion: 'Check your internet connection and Supabase URL' }
    );
  }
}

/**
 * Test Supabase authentication
 */
export async function testSupabaseAuth(): Promise<DiagnosticResult> {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return createResult(
        'Supabase',
        'Auth Session',
        'fail',
        `Auth session check failed: ${error.message}`,
        { error: error.message }
      );
    }

    if (data.session) {
      return createResult(
        'Supabase',
        'Auth Session',
        'pass',
        'Valid authentication session found',
        {
          userId: data.session.user.id,
          expiresIn: data.session.expires_in
        }
      );
    }

    return createResult(
      'Supabase',
      'Auth Session',
      'warn',
      'No active authentication session (user not logged in)',
      { suggestion: 'User needs to log in' }
    );
  } catch (error) {
    return createResult(
      'Supabase',
      'Auth Session',
      'fail',
      `Auth check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// =============================================================================
// Backend API Diagnostics
// =============================================================================

/**
 * Test backend API connectivity
 */
export async function testBackendConnection(): Promise<DiagnosticResult> {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/health`, {
      timeout: 10000,
    });

    return createResult(
      'Backend API',
      'Connectivity',
      'pass',
      'Successfully connected to backend API',
      {
        url: API_BASE_URL,
        status: response.status,
        data: response.data
      }
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return createResult(
          'Backend API',
          'Connectivity',
          'fail',
          'Backend API connection timed out',
          {
            url: API_BASE_URL,
            suggestion: 'Check if backend server is running on port 3003'
          }
        );
      }

      if (error.response) {
        return createResult(
          'Backend API',
          'Connectivity',
          'warn',
          `Backend API responded with error status: ${error.response.status}`,
          {
            url: API_BASE_URL,
            status: error.response.status,
            data: error.response.data
          }
        );
      }

      if (error.request) {
        return createResult(
          'Backend API',
          'Connectivity',
          'fail',
          'Cannot reach backend API - no response received',
          {
            url: API_BASE_URL,
            suggestion: 'Check if backend server is running and CORS is configured correctly'
          }
        );
      }
    }

    return createResult(
      'Backend API',
      'Connectivity',
      'fail',
      `Backend API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// =============================================================================
// Environment Diagnostics
// =============================================================================

/**
 * Test platform and environment
 */
export function testEnvironment(): DiagnosticResult {
  const isDev = isDevelopment();
  const isWeb = typeof window !== 'undefined';
  const isExpoGo = typeof expo !== 'undefined';

  return createResult(
    'Environment',
    'Platform',
    'pass',
    `Running in ${isDev ? 'development' : 'production'} mode on ${isWeb ? 'web' : 'native'} platform`,
    {
      isDev,
      platform: isWeb ? 'web' : 'native',
      isExpoGo: isExpoGo ?? false,
      apiBaseUrl: API_BASE_URL
    }
  );
}

// =============================================================================
// Full Diagnostic Suite
// =============================================================================

/**
 * Run all diagnostic tests
 */
export async function runDiagnostics(): Promise<DiagnosticReport> {
  console.log('🔍 Running diagnostics...');

  const results: DiagnosticResult[] = [];

  // Environment checks
  results.push(testEnvironment());

  // Configuration checks
  results.push(await testSupabaseConfig());

  // Supabase checks
  results.push(await testSupabaseConnection());
  results.push(await testSupabaseAuth());

  // Backend API checks
  results.push(await testBackendConnection());

  // Calculate summary
  const summary = {
    pass: results.filter(r => r.status === 'pass').length,
    fail: results.filter(r => r.status === 'fail').length,
    warn: results.filter(r => r.status === 'warn').length,
  };

  // Determine overall status
  let overall: 'pass' | 'fail' | 'warn';
  if (summary.fail > 0) {
    overall = 'fail';
  } else if (summary.warn > 0) {
    overall = 'warn';
  } else {
    overall = 'pass';
  }

  const report: DiagnosticReport = {
    timestamp: new Date().toISOString(),
    overall,
    results,
    summary,
  };

  // Log report
  console.log('\n📊 Diagnostic Report:');
  console.log(`   Overall: ${overall.toUpperCase()}`);
  console.log(`   Passed: ${summary.pass}, Failed: ${summary.fail}, Warnings: ${summary.warn}\n`);

  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} [${result.category}] ${result.name}: ${result.message}`);
    if (result.details) {
      console.log('   Details:', result.details);
    }
  });

  // Print recommendations if there are failures
  if (summary.fail > 0) {
    console.log('\n💡 Recommendations:');
    const failedResults = results.filter(r => r.status === 'fail');
    failedResults.forEach(result => {
      if (result.details?.suggestion) {
        console.log(`   - ${result.details.suggestion}`);
      }
    });

    // Common issues and solutions
    console.log('\n🔧 Common fixes:');
    console.log('   1. Ensure backend server is running: cd growth-dashboard/backend && npm start');
    console.log('   2. Check Supabase credentials in .env and app.json');
    console.log('   3. Verify CORS settings in backend/config/security.js');
    console.log('   4. Try clearing cache: expo start --clear');
  }

  return report;
}

/**
 * Print current configuration (for debugging)
 */
export function printConfig(): void {
  console.log('\n📋 Current Configuration:');
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  console.log(`   Supabase Key: ${maskSensitive(SUPABASE_ANON_KEY)}`);
  console.log(`   API Base URL: ${API_BASE_URL}`);
  console.log(`   Environment: ${isDevelopment() ? 'Development' : 'Production'}`);

  const validation = validateConfig();
  if (validation.valid) {
    console.log('   ✅ Configuration is valid');
  } else {
    console.log('   ❌ Configuration has errors:');
    validation.errors.forEach((err: string) => console.log(`      - ${err}`));
  }
}

/**
 * Quick health check - returns true if all critical systems are working
 */
export async function quickHealthCheck(): Promise<boolean> {
  try {
    const configResult = await testSupabaseConfig();
    if (configResult.status === 'fail') return false;

    const supabaseResult = await testSupabaseConnection();
    if (supabaseResult.status === 'fail') return false;

    const backendResult = await testBackendConnection();
    return backendResult.status !== 'fail';
  } catch {
    return false;
  }
}

// Export all functions for external use
export default {
  runDiagnostics,
  testSupabaseConfig,
  testSupabaseConnection,
  testSupabaseAuth,
  testBackendConnection,
  testEnvironment,
  printConfig,
  quickHealthCheck,
};
